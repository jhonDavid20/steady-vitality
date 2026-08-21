import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHasCompletedOnboardingToUsers1711411200000 implements MigrationInterface {
  name = 'AddHasCompletedOnboardingToUsers1711411200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Column is already created in InitialSchema migration — this is a no-op kept for history.
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "hasCompletedOnboarding" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op: column is managed by InitialSchema migration.
  }
}
