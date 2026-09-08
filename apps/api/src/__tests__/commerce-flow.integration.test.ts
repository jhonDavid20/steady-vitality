import { randomUUID } from 'crypto';
import { AppDataSource } from '../database/data-source';
import { ClientCoachRelationship, RelationshipStatus } from '../database/entities/ClientCoachRelationship';
import { ClientPackage, ClientPackageStatus } from '../database/entities/ClientPackage';
import { CoachProfile } from '../database/entities/CoachProfile';
import { Package } from '../database/entities/Package';
import { PaymentAttempt, PaymentStatus } from '../database/entities/PaymentAttempt';
import { PaymentEvent } from '../database/entities/PaymentEvent';
import { User, UserRole } from '../database/entities/User';
import { CommerceService } from '../services/commerce.service';

const describeDatabase = process.env.RUN_DB_TESTS === 'true' ? describe : describe.skip;

describeDatabase('marketplace payment flow', () => {
  const coachId = randomUUID();
  const clientId = randomUUID();
  let offerId = '';

  beforeAll(async () => {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    await AppDataSource.getRepository(User).insert([user(coachId, UserRole.COACH), user(clientId, UserRole.CLIENT)]);
    const coachRepository = AppDataSource.getRepository(CoachProfile);
    const coach = await coachRepository.save(coachRepository.create({ userId: coachId, acceptingClients: true }));
    const offerRepository = AppDataSource.getRepository(Package);
    const offer = await offerRepository.save(offerRepository.create({ coachId: coach.id, name: 'Eight week reset', durationWeeks: 8, sessionsIncluded: 8, priceUSD: 200, isActive: true, features: ['Weekly call'] }));
    offerId = offer.id;
  });

  afterAll(async () => {
    if (!AppDataSource.isInitialized) return;
    await AppDataSource.getRepository(User).delete([coachId, clientId]);
    await AppDataSource.destroy();
  });

  it('activates a snapshotted purchase only after one verified webhook', async () => {
    const service = new CommerceService();
    const checkout = await service.createCheckout(clientId, offerId, 'en');
    const pending = await AppDataSource.getRepository(ClientPackage).findOneByOrFail({ id: checkout.purchaseId });
    expect(pending.status).toBe(ClientPackageStatus.PENDING);
    expect(pending.offerSnapshot).toMatchObject({ name: 'Eight week reset', durationWeeks: 8, amountCents: 20000, currency: 'USD' });

    await AppDataSource.getRepository(Package).update(offerId, { name: 'Changed later', priceUSD: 999 });
    const event = Buffer.from(JSON.stringify({ id: 'evt_checkout_paid', type: 'checkout.session.completed', attemptId: checkout.attemptId, paymentId: 'pi_paid' }));
    await service.handleWebhook(event, 'local-sandbox-secret');
    await service.handleWebhook(event, 'local-sandbox-secret');

    const purchase = await AppDataSource.getRepository(ClientPackage).findOneByOrFail({ id: checkout.purchaseId });
    const attempt = await AppDataSource.getRepository(PaymentAttempt).findOneByOrFail({ id: checkout.attemptId });
    expect(purchase.status).toBe(ClientPackageStatus.ACTIVE);
    expect(purchase.offerSnapshot?.name).toBe('Eight week reset');
    expect(attempt.status).toBe(PaymentStatus.PAID);
    expect(await AppDataSource.getRepository(PaymentEvent).countBy({ providerEventId: 'evt_checkout_paid' })).toBe(1);
    expect(await AppDataSource.getRepository(ClientCoachRelationship).countBy({ clientId, coachId, status: RelationshipStatus.ACTIVE })).toBe(1);
  });
});

function user(id: string, role: UserRole): Partial<User> {
  return { id, email: `${id}@commerce.example`, username: `u_${id.replace(/-/g, '')}`, password: '$2a$12$abcdefghijklmnopqrstuuuuuuuuuuuuuuuuuuuuuuuuuuuuu', firstName: 'Test', lastName: 'User', role, isActive: true, isEmailVerified: true, hasCompletedOnboarding: true };
}
