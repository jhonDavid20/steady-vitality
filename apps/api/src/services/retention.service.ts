import { Between } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { ClientPackage, ClientPackageStatus } from '../database/entities/ClientPackage';
import { RetentionNotice } from '../database/entities/RetentionNotice';
import { Review } from '../database/entities/Review';

export class RetentionService {
  private purchases = AppDataSource.getRepository(ClientPackage);
  private reviews = AppDataSource.getRepository(Review);
  private notices = AppDataSource.getRepository(RetentionNotice);

  async createReview(clientId: string, input: { clientPackageId: string; rating: number; text?: string | null; anonymous?: boolean }) {
    const purchase = await this.purchases.findOne({ where: { id: input.clientPackageId, clientId } });
    if (!purchase || purchase.status !== ClientPackageStatus.COMPLETED) throw new Error('Only a completed coaching cycle can be reviewed');
    if (await this.reviews.findOne({ where: { clientPackageId: purchase.id } })) throw new Error('A review already exists for this coaching cycle');
    return this.reviews.save(this.reviews.create({ clientPackageId: purchase.id, clientId, coachId: purchase.coachId, rating: input.rating, text: input.text?.trim() || null, anonymous: input.anonymous ?? false, visible: true }));
  }

  async listCoachReviews(coachId: string) {
    const reviews = await this.reviews.find({ where: { coachId, visible: true }, order: { createdAt: 'DESC' }, take: 50 });
    return reviews.map((review) => ({ id: review.id, rating: review.rating, text: review.text, anonymous: review.anonymous, clientId: review.anonymous ? null : review.clientId, createdAt: review.createdAt }));
  }

  async getNudges(clientId: string) {
    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 86400000);
    const purchases = await this.purchases.find({ where: [
      { clientId, status: ClientPackageStatus.ACTIVE, endDate: Between(now, inSevenDays) },
      { clientId, status: ClientPackageStatus.COMPLETED },
    ], order: { endDate: 'ASC' } });
    const nudges = [] as Array<{ kind: string; clientPackageId: string; coachId: string; packageId: string }>;
    for (const purchase of purchases) {
      const kind = purchase.status === ClientPackageStatus.ACTIVE ? 'renewal' : 'review';
      const review = kind === 'review' ? await this.reviews.findOne({ where: { clientPackageId: purchase.id } }) : null;
      if (review) continue;
      await this.notices.upsert({ clientPackageId: purchase.id, clientId, kind }, { conflictPaths: ['clientPackageId', 'kind'], skipUpdateIfNoValuesChanged: true });
      nudges.push({ kind, clientPackageId: purchase.id, coachId: purchase.coachId, packageId: purchase.packageId });
    }
    return nudges;
  }
}

export async function audit(manager: EntityManager, actorId: string | null, action: string, targetType: string, targetId: string | null, details: Record<string, unknown> = {}) {
  const { AuditLog } = await import('../database/entities/AuditLog');
  await manager.getRepository(AuditLog).save(manager.getRepository(AuditLog).create({ actorId, action, targetType, targetId, details }));
}
