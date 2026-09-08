import { createHash, randomUUID } from 'crypto';
import Stripe from 'stripe';
import { AppDataSource } from '../database/data-source';
import { config } from '../config/env';
import { ClientCoachRelationship, RelationshipStatus } from '../database/entities/ClientCoachRelationship';
import { ClientPackage, ClientPackageStatus } from '../database/entities/ClientPackage';
import { CoachProfile } from '../database/entities/CoachProfile';
import { Package } from '../database/entities/Package';
import { PaymentAttempt, PaymentStatus } from '../database/entities/PaymentAttempt';
import { PaymentEvent } from '../database/entities/PaymentEvent';
import { User } from '../database/entities/User';

interface NormalizedEvent { id: string; type: string; attemptId: string | null; paymentId: string | null }

export class CommerceService {
  async createCheckout(clientId: string, packageId: string, locale: 'en' | 'es') {
    const packageRepository = AppDataSource.getRepository(Package);
    const profileRepository = AppDataSource.getRepository(CoachProfile);
    const [offer, existing] = await Promise.all([
      packageRepository.findOne({ where: { id: packageId, isActive: true } }),
      AppDataSource.getRepository(ClientPackage).findOne({ where: [
        { clientId, status: ClientPackageStatus.PENDING },
        { clientId, status: ClientPackageStatus.ACTIVE },
      ] }),
    ]);
    if (!offer) throw new Error('Package not found');
    if (existing) throw new Error('Client already has a pending or active purchase');
    if (![4, 8, 12].includes(offer.durationWeeks)) throw new Error('Package duration must be 4, 8, or 12 weeks');
    const coach = await profileRepository.findOne({ where: { id: offer.coachId, acceptingClients: true } });
    if (!coach) throw new Error('Coach is not accepting clients');
    const relationship = await AppDataSource.getRepository(ClientCoachRelationship).findOne({ where: { clientId, status: RelationshipStatus.ACTIVE } });
    if (relationship && relationship.coachId !== coach.userId) throw new Error('Client already has an active coach');

    const amountCents = Math.round(Number(offer.priceUSD) * 100);
    if (amountCents < 50) throw new Error('Package price is too low for checkout');
    const currency = config.payments.currency.toUpperCase();
    const platformFeeCents = Math.round(amountCents * config.payments.platformFeeBps / 10000);
    const created = await AppDataSource.transaction(async (manager) => {
      const purchase = await manager.save(ClientPackage, manager.create(ClientPackage, {
        clientId,
        packageId: offer.id,
        coachId: coach.userId,
        status: ClientPackageStatus.PENDING,
        offerSnapshot: {
          name: offer.name,
          description: offer.description ?? null,
          durationWeeks: offer.durationWeeks,
          sessionsIncluded: offer.sessionsIncluded,
          features: offer.features ?? [],
          amountCents,
          currency,
        },
        sessionsCompleted: 0,
      }));
      const attempt = await manager.save(PaymentAttempt, manager.create(PaymentAttempt, {
        clientPackageId: purchase.id,
        provider: config.payments.provider,
        providerCheckoutId: null,
        providerPaymentId: null,
        amountCents,
        currency,
        platformFeeCents,
        status: PaymentStatus.PENDING,
        failureReason: null,
        paidAt: null,
      }));
      return { purchase, attempt };
    });

    try {
      const checkout = await this.providerCheckout(created.attempt, created.purchase, coach, locale);
      created.attempt.providerCheckoutId = checkout.id;
      await AppDataSource.getRepository(PaymentAttempt).save(created.attempt);
      return { purchaseId: created.purchase.id, attemptId: created.attempt.id, checkoutUrl: checkout.url, status: created.attempt.status };
    } catch (error) {
      created.attempt.status = PaymentStatus.FAILED;
      created.attempt.failureReason = error instanceof Error ? error.message : 'Checkout creation failed';
      created.purchase.status = ClientPackageStatus.CANCELLED;
      created.purchase.cancelledAt = new Date();
      await AppDataSource.transaction(async (manager) => { await manager.save(created.attempt); await manager.save(created.purchase); });
      throw error;
    }
  }

  async getCheckoutStatus(clientId: string, attemptId: string) {
    const attempt = await AppDataSource.getRepository(PaymentAttempt).createQueryBuilder('attempt')
      .innerJoinAndSelect(ClientPackage, 'purchase', 'purchase.id = attempt.clientPackageId')
      .where('attempt.id = :attemptId AND purchase.clientId = :clientId', { attemptId, clientId }).getOne();
    if (!attempt) throw new Error('Checkout not found');
    return { attemptId: attempt.id, purchaseId: attempt.clientPackageId, status: attempt.status, failureReason: attempt.failureReason };
  }

  async cancelPending(clientId: string, purchaseId: string) {
    const purchase = await AppDataSource.getRepository(ClientPackage).findOne({ where: { id: purchaseId, clientId, status: ClientPackageStatus.PENDING } });
    if (!purchase) throw new Error('Pending purchase not found');
    purchase.status = ClientPackageStatus.CANCELLED;
    purchase.cancelledAt = new Date();
    await AppDataSource.getRepository(ClientPackage).save(purchase);
    return purchase;
  }

  async handleWebhook(rawBody: Buffer, signature?: string) {
    const event = this.parseEvent(rawBody, signature);
    const hash = createHash('sha256').update(rawBody).digest('hex');
    if (!event.attemptId) return this.recordIgnored(event, hash);
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      return this.activate(event, hash);
    }
    if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
      return this.fail(event, hash);
    }
    return this.recordIgnored(event, hash);
  }

  private async providerCheckout(attempt: PaymentAttempt, purchase: ClientPackage, coach: CoachProfile, locale: 'en' | 'es') {
    if (config.payments.provider === 'sandbox') {
      if (config.nodeEnv === 'production') throw new Error('Sandbox payments are disabled in production');
      return { id: `sandbox_${randomUUID()}`, url: `${config.payments.appUrl}/${locale}/checkout/return?attempt=${attempt.id}` };
    }
    if (config.payments.provider !== 'stripe' || !config.payments.stripeSecretKey) throw new Error('Payment provider is not configured');
    if (!coach.stripeAccountId) throw new Error('Coach payout account is not configured');
    const stripe = new Stripe(config.payments.stripeSecretKey);
    const snapshot = purchase.offerSnapshot!;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: purchase.id,
      metadata: { attemptId: attempt.id, purchaseId: purchase.id },
      line_items: [{ quantity: 1, price_data: { currency: snapshot.currency.toLowerCase(), unit_amount: snapshot.amountCents, product_data: { name: snapshot.name, description: snapshot.description ?? undefined } } }],
      payment_intent_data: { application_fee_amount: attempt.platformFeeCents, transfer_data: { destination: coach.stripeAccountId } },
      success_url: `${config.payments.appUrl}/${locale}/checkout/return?attempt=${attempt.id}`,
      cancel_url: `${config.payments.appUrl}/${locale}/coach?checkout=cancelled`,
    }, { idempotencyKey: attempt.id });
    if (!session.url) throw new Error('Checkout provider did not return a URL');
    return { id: session.id, url: session.url };
  }

  private parseEvent(rawBody: Buffer, signature?: string): NormalizedEvent {
    if (config.payments.provider === 'stripe') {
      if (!config.payments.stripeSecretKey || !config.payments.stripeWebhookSecret || !signature) throw new Error('Stripe webhook is not configured');
      const stripe = new Stripe(config.payments.stripeSecretKey);
      const event = stripe.webhooks.constructEvent(rawBody, signature, config.payments.stripeWebhookSecret);
      const session = event.data.object as Stripe.Checkout.Session;
      return { id: event.id, type: event.type, attemptId: session.metadata?.attemptId ?? null, paymentId: typeof session.payment_intent === 'string' ? session.payment_intent : null };
    }
    if (signature !== config.payments.sandboxWebhookSecret) throw new Error('Invalid sandbox webhook signature');
    const parsed = JSON.parse(rawBody.toString()) as NormalizedEvent;
    return { id: parsed.id, type: parsed.type, attemptId: parsed.attemptId, paymentId: parsed.paymentId };
  }

  private async activate(event: NormalizedEvent, payloadHash: string) {
    return AppDataSource.transaction('SERIALIZABLE', async (manager) => {
      if (await manager.findOne(PaymentEvent, { where: { providerEventId: event.id } })) return { duplicate: true };
      const attempt = await manager.findOne(PaymentAttempt, { where: { id: event.attemptId! } });
      if (!attempt) return this.saveEvent(manager, event, payloadHash, 'attempt_missing');
      if (attempt.status === PaymentStatus.PAID) return this.saveEvent(manager, event, payloadHash, 'already_paid');
      const purchase = await manager.findOneByOrFail(ClientPackage, { id: attempt.clientPackageId });
      if (purchase.status !== ClientPackageStatus.PENDING) return this.saveEvent(manager, event, payloadHash, 'purchase_not_pending');
      const existingRelationship = await manager.findOne(ClientCoachRelationship, { where: { clientId: purchase.clientId, status: RelationshipStatus.ACTIVE } });
      if (existingRelationship && existingRelationship.coachId !== purchase.coachId) throw new Error('Client already has another active coach');
      attempt.status = PaymentStatus.PAID;
      attempt.providerPaymentId = event.paymentId;
      attempt.paidAt = new Date();
      purchase.status = ClientPackageStatus.ACTIVE;
      purchase.startDate = new Date();
      purchase.endDate = new Date(purchase.startDate.getTime() + purchase.offerSnapshot!.durationWeeks * 7 * 86400000);
      await manager.save([attempt, purchase]);
      if (!existingRelationship) await manager.save(ClientCoachRelationship, manager.create(ClientCoachRelationship, { clientId: purchase.clientId, coachId: purchase.coachId, status: RelationshipStatus.ACTIVE, startedAt: new Date() }));
      await manager.update(User, { id: purchase.clientId }, { coachId: purchase.coachId });
      await this.saveEvent(manager, event, payloadHash, 'activated');
      return { activated: true };
    });
  }

  private async fail(event: NormalizedEvent, payloadHash: string) {
    return AppDataSource.transaction(async (manager) => {
      if (await manager.findOne(PaymentEvent, { where: { providerEventId: event.id } })) return { duplicate: true };
      const attempt = await manager.findOne(PaymentAttempt, { where: { id: event.attemptId! } });
      if (attempt?.status === PaymentStatus.PENDING) { attempt.status = PaymentStatus.FAILED; attempt.failureReason = event.type; await manager.save(attempt); }
      await this.saveEvent(manager, event, payloadHash, attempt ? 'failed' : 'attempt_missing');
      return { failed: Boolean(attempt) };
    });
  }

  private async recordIgnored(event: NormalizedEvent, payloadHash: string) {
    return AppDataSource.transaction((manager) => this.saveEvent(manager, event, payloadHash, 'ignored'));
  }

  private async saveEvent(manager: import('typeorm').EntityManager, event: NormalizedEvent, payloadHash: string, outcome: string) {
    await manager.save(PaymentEvent, manager.create(PaymentEvent, { providerEventId: event.id, type: event.type, payloadHash, outcome }));
    return { outcome };
  }
}
