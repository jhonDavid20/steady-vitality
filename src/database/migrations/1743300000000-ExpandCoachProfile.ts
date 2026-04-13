import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandCoachProfile1743300000000 implements MigrationInterface {
  name = 'ExpandCoachProfile1743300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── New enum ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "coaching_type_enum" AS ENUM ('online', 'in_person', 'hybrid')
    `);

    // ── New columns ───────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "coach_profiles"
        -- Professional identity
        ADD COLUMN "profileHeadline"        varchar(160),
        ADD COLUMN "yearsOfExperience"      smallint,
        ADD COLUMN "coachingType"           "coaching_type_enum",
        ADD COLUMN "trainingModalities"     text[]  NOT NULL DEFAULT '{}',
        ADD COLUMN "targetClientTypes"      text[]  NOT NULL DEFAULT '{}',
        ADD COLUMN "languagesSpoken"        text[]  NOT NULL DEFAULT '{}',
        -- Scheduling & availability
        ADD COLUMN "timezone"               varchar(64),
        ADD COLUMN "sessionDurationMinutes" smallint,
        ADD COLUMN "maxClientCapacity"      smallint,
        ADD COLUMN "trialSessionAvailable"  boolean NOT NULL DEFAULT false,
        ADD COLUMN "trialSessionRateUSD"    numeric(10,2),
        -- Media & social proof
        ADD COLUMN "videoIntroUrl"          varchar(500),
        ADD COLUMN "websiteUrl"             varchar(500),
        ADD COLUMN "instagramHandle"        varchar(100),
        -- Business
        ADD COLUMN "totalClientsTrained"    integer NOT NULL DEFAULT 0
    `);

    // ── Useful index for filtering by delivery type ───────────────────────
    await queryRunner.query(`
      CREATE INDEX "IDX_coach_profiles_coachingType" ON "coach_profiles" ("coachingType")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_coach_profiles_coachingType"`);

    await queryRunner.query(`
      ALTER TABLE "coach_profiles"
        DROP COLUMN IF EXISTS "profileHeadline",
        DROP COLUMN IF EXISTS "yearsOfExperience",
        DROP COLUMN IF EXISTS "coachingType",
        DROP COLUMN IF EXISTS "trainingModalities",
        DROP COLUMN IF EXISTS "targetClientTypes",
        DROP COLUMN IF EXISTS "languagesSpoken",
        DROP COLUMN IF EXISTS "timezone",
        DROP COLUMN IF EXISTS "sessionDurationMinutes",
        DROP COLUMN IF EXISTS "maxClientCapacity",
        DROP COLUMN IF EXISTS "trialSessionAvailable",
        DROP COLUMN IF EXISTS "trialSessionRateUSD",
        DROP COLUMN IF EXISTS "videoIntroUrl",
        DROP COLUMN IF EXISTS "websiteUrl",
        DROP COLUMN IF EXISTS "instagramHandle",
        DROP COLUMN IF EXISTS "totalClientsTrained"
    `);

    await queryRunner.query(`DROP TYPE IF EXISTS "coaching_type_enum"`);
  }
}
