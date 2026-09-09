import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRetentionOperations1744200000000 implements MigrationInterface {
  name = 'CreateRetentionOperations1744200000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clientPackageId" uuid NOT NULL, "clientId" uuid NOT NULL, "coachId" uuid NOT NULL, "rating" smallint NOT NULL, "text" text, "anonymous" boolean NOT NULL DEFAULT false, "visible" boolean NOT NULL DEFAULT true, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_reviews" PRIMARY KEY ("id"), CONSTRAINT "UQ_review_purchase" UNIQUE ("clientPackageId"), CONSTRAINT "FK_reviews_purchase" FOREIGN KEY ("clientPackageId") REFERENCES "client_packages"("id") ON DELETE CASCADE, CONSTRAINT "FK_reviews_client" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE, CONSTRAINT "FK_reviews_coach" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE, CONSTRAINT "CHK_reviews_rating" CHECK ("rating" BETWEEN 1 AND 5))`);
    await queryRunner.query(`CREATE INDEX "IDX_reviews_coach_visible" ON "reviews" ("coachId", "visible")`);
    await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actorId" uuid, "action" varchar(100) NOT NULL, "targetType" varchar(80) NOT NULL, "targetId" uuid, "details" jsonb NOT NULL DEFAULT '{}'::jsonb, "createdAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_actor_created" ON "audit_logs" ("actorId", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_target" ON "audit_logs" ("targetType", "targetId")`);
    await queryRunner.query(`CREATE TABLE "retention_notices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clientPackageId" uuid NOT NULL, "clientId" uuid NOT NULL, "kind" varchar(40) NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_retention_notices" PRIMARY KEY ("id"), CONSTRAINT "UQ_retention_notice" UNIQUE ("clientPackageId", "kind"), CONSTRAINT "FK_retention_notice_package" FOREIGN KEY ("clientPackageId") REFERENCES "client_packages"("id") ON DELETE CASCADE, CONSTRAINT "FK_retention_notice_client" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE)`);
  }
  async down(queryRunner: QueryRunner): Promise<void> { await queryRunner.query(`DROP TABLE "retention_notices"`); await queryRunner.query(`DROP TABLE "audit_logs"`); await queryRunner.query(`DROP TABLE "reviews"`); }
}
