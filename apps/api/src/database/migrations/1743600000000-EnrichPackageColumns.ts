import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the following columns:
 *
 * client_packages
 *   sessions_completed  INTEGER  NOT NULL DEFAULT 0
 *   notes               TEXT     NULL
 *   goals               TEXT[]   NULL
 *
 * packages
 *   features            TEXT[]   NULL
 */
export class EnrichPackageColumns1743600000000 implements MigrationInterface {
  name = 'EnrichPackageColumns1743600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── client_packages ──────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "client_packages"
        ADD COLUMN IF NOT EXISTS "sessionsCompleted" INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "notes"             TEXT    NULL,
        ADD COLUMN IF NOT EXISTS "goals"             TEXT[]  NULL
    `);

    // ── packages ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "packages"
        ADD COLUMN IF NOT EXISTS "features" TEXT[] NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "client_packages"
        DROP COLUMN IF EXISTS "sessionsCompleted",
        DROP COLUMN IF EXISTS "notes",
        DROP COLUMN IF EXISTS "goals"
    `);

    await queryRunner.query(`
      ALTER TABLE "packages"
        DROP COLUMN IF EXISTS "features"
    `);
  }
}
