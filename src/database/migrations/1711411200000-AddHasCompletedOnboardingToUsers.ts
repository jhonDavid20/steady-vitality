import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHasCompletedOnboardingToUsers1711411200000 implements MigrationInterface {
  name = 'AddHasCompletedOnboardingToUsers1711411200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "hasCompletedOnboarding" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "hasCompletedOnboarding"`
    );
  }
}
