import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDailyPilot1744000000000 implements MigrationInterface {
  name = 'CreateDailyPilot1744000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."coaching_messages_kind_enum" AS ENUM('message', 'check_in')`);
    await queryRunner.query(`
      CREATE TABLE "nutrition_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "coachId" uuid NOT NULL,
        "name" varchar(160) NOT NULL, "items" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "waterTargetMl" integer NOT NULL DEFAULT 2000, "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_nutrition_plans" PRIMARY KEY ("id"),
        CONSTRAINT "FK_nutrition_plans_coach" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_nutrition_plans_coachId" ON "nutrition_plans" ("coachId")`);
    await queryRunner.query(`
      CREATE TABLE "nutrition_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "planId" uuid NOT NULL, "clientId" uuid NOT NULL,
        "coachId" uuid NOT NULL, "planName" varchar(160) NOT NULL, "items" jsonb NOT NULL,
        "waterTargetMl" integer NOT NULL, "timezone" varchar(100) NOT NULL, "startsOn" date NOT NULL,
        "endsOn" date, "isActive" boolean NOT NULL DEFAULT true, "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_nutrition_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_nutrition_assignments_plan" FOREIGN KEY ("planId") REFERENCES "nutrition_plans"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_nutrition_assignments_client" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_nutrition_assignments_coach" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_nutrition_assignments_clientId" ON "nutrition_assignments" ("clientId")`);
    await queryRunner.query(`CREATE INDEX "IDX_nutrition_assignments_coachId" ON "nutrition_assignments" ("coachId")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_nutrition_assignments_active_client" ON "nutrition_assignments" ("clientId") WHERE "isActive" = true`);
    await queryRunner.query(`
      CREATE TABLE "meal_completions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assignmentId" uuid NOT NULL, "mealId" uuid NOT NULL,
        "clientId" uuid NOT NULL, "localDate" date NOT NULL, "completed" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_meal_completions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_meal_completion_day" UNIQUE ("assignmentId", "mealId", "localDate"),
        CONSTRAINT "FK_meal_completions_assignment" FOREIGN KEY ("assignmentId") REFERENCES "nutrition_assignments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_meal_completions_client" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_meal_completions_client_day" ON "meal_completions" ("clientId", "localDate")`);
    await queryRunner.query(`
      CREATE TABLE "water_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clientId" uuid NOT NULL, "localDate" date NOT NULL,
        "amountMl" integer NOT NULL DEFAULT 0, "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_water_logs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_water_log_client_day" UNIQUE ("clientId", "localDate"),
        CONSTRAINT "FK_water_logs_client" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_water_logs_client_day" ON "water_logs" ("clientId", "localDate")`);
    await queryRunner.query(`
      CREATE TABLE "coaching_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "relationshipId" uuid NOT NULL,
        "senderId" uuid NOT NULL, "recipientId" uuid NOT NULL,
        "kind" "public"."coaching_messages_kind_enum" NOT NULL DEFAULT 'message', "body" text NOT NULL,
        "clientRequestId" uuid NOT NULL, "readAt" timestamptz, "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_coaching_messages" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_coaching_message_retry" UNIQUE ("senderId", "clientRequestId"),
        CONSTRAINT "FK_coaching_messages_relationship" FOREIGN KEY ("relationshipId") REFERENCES "client_coach_relationships"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_coaching_messages_sender" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_coaching_messages_recipient" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_coaching_messages_relationship_created" ON "coaching_messages" ("relationshipId", "createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "coaching_messages"`);
    await queryRunner.query(`DROP TABLE "water_logs"`);
    await queryRunner.query(`DROP TABLE "meal_completions"`);
    await queryRunner.query(`DROP TABLE "nutrition_assignments"`);
    await queryRunner.query(`DROP TABLE "nutrition_plans"`);
    await queryRunner.query(`DROP TYPE "public"."coaching_messages_kind_enum"`);
  }
}
