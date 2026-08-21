import { schedule, ScheduledTask } from 'node-cron';
import { LessThan } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Session } from '../database/entities/Session';

export class CleanupService {
  private task: ScheduledTask | null = null;

  // Run every day at 2:00 AM
  private readonly CRON_SCHEDULE = '0 2 * * *';

  // Revoked/inactive sessions older than this are deleted
  private readonly INACTIVE_RETENTION_DAYS = 30;

  start(): void {
    this.task = schedule(this.CRON_SCHEDULE, async () => {
      console.log('🧹 [CleanupService] Running session cleanup...');
      await this.cleanSessions();
    });

    console.log('✅ [CleanupService] Scheduled daily at 02:00 AM');
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('🛑 [CleanupService] Stopped');
    }
  }

  async runNow(): Promise<{ expired: number; old: number }> {
    console.log('🧹 [CleanupService] Running manual cleanup...');
    return this.cleanSessions();
  }

  private async cleanSessions(): Promise<{ expired: number; old: number }> {
    const sessionRepo = AppDataSource.getRepository(Session);
    const now = new Date();

    // 1. Delete expired sessions (regardless of isActive)
    const expiredResult = await sessionRepo.delete({
      expiresAt: LessThan(now),
    });

    // 2. Delete old inactive/revoked sessions past the retention window
    const retentionCutoff = new Date(
      now.getTime() - this.INACTIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000
    );
    const oldResult = await sessionRepo.delete({
      isActive: false,
      revokedAt: LessThan(retentionCutoff),
    });

    const expired = expiredResult.affected ?? 0;
    const old = oldResult.affected ?? 0;

    console.log(`   Expired sessions deleted: ${expired}`);
    console.log(`   Old inactive sessions deleted: ${old}`);
    console.log(`   Total deleted: ${expired + old}`);

    return { expired, old };
  }
}

export const cleanupService = new CleanupService();
