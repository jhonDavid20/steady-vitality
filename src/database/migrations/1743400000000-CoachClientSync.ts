import { MigrationInterface, QueryRunner } from 'typeorm';

export class CoachClientSync1743400000000 implements MigrationInterface {
  name = 'CoachClientSync1743400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Add coachId to users ───────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "coachId" uuid
          REFERENCES "users"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_coachId" ON "users" ("coachId")
    `);

    // ── 2. Extend invites table ───────────────────────────────────────────────
    // Drop the old single-column unique constraint so we can replace it with
    // a composite (email, type) unique constraint.
    await queryRunner.query(`
      ALTER TABLE "invites"
        DROP CONSTRAINT IF EXISTS "UQ_invites_email"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_invites_email"
    `);

    await queryRunner.query(`
      ALTER TABLE "invites"
        ADD COLUMN IF NOT EXISTS "type"    varchar(20) NOT NULL DEFAULT 'coach',
        ADD COLUMN IF NOT EXISTS "coachId" uuid REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // Composite unique: one active invite per (email, type) pair
    await queryRunner.query(`
      ALTER TABLE "invites"
        ADD CONSTRAINT "UQ_invites_email_type" UNIQUE ("email", "type")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invites_email"   ON "invites" ("email")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_invites_coachId" ON "invites" ("coachId")
    `);

    // ── 3. Create connection_requests table ───────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "connection_requests" (
        "id"          uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "clientId"    uuid         NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "coachId"     uuid         NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "status"      varchar(20)  NOT NULL DEFAULT 'pending',
        "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_connection_requests"              PRIMARY KEY ("id"),
        CONSTRAINT "UQ_connection_requests_client_coach" UNIQUE ("clientId", "coachId")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_connection_requests_coachId"  ON "connection_requests" ("coachId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_connection_requests_clientId" ON "connection_requests" ("clientId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_connection_requests_status"   ON "connection_requests" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "connection_requests"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invites_coachId"`);
    await queryRunner.query(`ALTER TABLE "invites" DROP CONSTRAINT IF EXISTS "UQ_invites_email_type"`);
    await queryRunner.query(`ALTER TABLE "invites" DROP COLUMN IF EXISTS "coachId"`);
    await queryRunner.query(`ALTER TABLE "invites" DROP COLUMN IF EXISTS "type"`);
    await queryRunner.query(`ALTER TABLE "invites" ADD CONSTRAINT "UQ_invites_email" UNIQUE ("email")`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_coachId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "coachId"`);
  }
}
