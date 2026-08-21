import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `leads` table used to store assessment submissions coming from
 * the public landing page. Leads are anonymous prospects (no user account) and
 * are managed by admins until contacted / converted.
 */
export class CreateLeadsTable1743700000000 implements MigrationInterface {
  name = 'CreateLeadsTable1743700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leads" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name"          varchar(255) NOT NULL,
        "email"         varchar(255) NOT NULL,
        "age"           varchar(20),
        "gender"        varchar(20),
        "height"        numeric(5,2),
        "weight"        numeric(5,2),
        "activityLevel" varchar(30),
        "goal"          varchar(40),
        "experience"    text,
        "bmi"           numeric(5,2),
        "locale"        varchar(10),
        "status"        varchar(20) NOT NULL DEFAULT 'new',
        "createdAt"     timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leads_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_leads_email" ON "leads" ("email")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_leads_status" ON "leads" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_leads_createdAt" ON "leads" ("createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leads_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leads_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leads_email"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leads"`);
  }
}
