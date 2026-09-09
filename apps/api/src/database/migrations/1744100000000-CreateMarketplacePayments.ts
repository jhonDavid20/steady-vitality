import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMarketplacePayments1744100000000 implements MigrationInterface {
  name = 'CreateMarketplacePayments1744100000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."payment_attempts_status_enum" AS ENUM('pending','paid','failed','refunded')`);
    await queryRunner.query(`ALTER TABLE "client_packages" ALTER COLUMN "status" SET DEFAULT 'pending'`);
    await queryRunner.query(`ALTER TABLE "client_packages" ADD COLUMN "offerSnapshot" jsonb, ADD COLUMN "cancelledAt" timestamptz`);
    await queryRunner.query(`ALTER TABLE "coach_profiles" ADD COLUMN "stripeAccountId" varchar(255)`);
    await queryRunner.query(`ALTER TABLE "user_profiles" ADD COLUMN "communicationPreference" varchar(30), ADD COLUMN "trainingExperience" varchar(30)`);
    await queryRunner.query(`
      CREATE TABLE "payment_attempts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clientPackageId" uuid NOT NULL,
        "provider" varchar(30) NOT NULL, "providerCheckoutId" varchar(255), "providerPaymentId" varchar(255),
        "amountCents" integer NOT NULL, "currency" char(3) NOT NULL, "platformFeeCents" integer NOT NULL,
        "status" "public"."payment_attempts_status_enum" NOT NULL DEFAULT 'pending', "failureReason" text,
        "paidAt" timestamptz, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_attempts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payment_attempts_checkout" UNIQUE ("providerCheckoutId"),
        CONSTRAINT "FK_payment_attempts_purchase" FOREIGN KEY ("clientPackageId") REFERENCES "client_packages"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_payment_attempts_purchase" ON "payment_attempts" ("clientPackageId")`);
    await queryRunner.query(`
      CREATE TABLE "payment_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "providerEventId" varchar(255) NOT NULL,
        "type" varchar(120) NOT NULL, "payloadHash" varchar(64) NOT NULL, "outcome" varchar(30) NOT NULL,
        "processedAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_payment_events" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payment_events_provider" UNIQUE ("providerEventId")
      )`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_client_packages_committed_client" ON "client_packages" ("clientId") WHERE "status" IN ('pending','active')`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_client_packages_committed_client"`);
    await queryRunner.query(`DROP TABLE "payment_events"`);
    await queryRunner.query(`DROP TABLE "payment_attempts"`);
    await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "trainingExperience", DROP COLUMN "communicationPreference"`);
    await queryRunner.query(`ALTER TABLE "coach_profiles" DROP COLUMN "stripeAccountId"`);
    await queryRunner.query(`ALTER TABLE "client_packages" DROP COLUMN "cancelledAt", DROP COLUMN "offerSnapshot"`);
    await queryRunner.query(`DROP TYPE "public"."payment_attempts_status_enum"`);
    await queryRunner.query(`ALTER TABLE "client_packages" ALTER COLUMN "status" SET DEFAULT 'active'`);
  }
}
