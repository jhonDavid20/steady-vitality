import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkoutFlow1743900000000 implements MigrationInterface {
  name = 'CreateWorkoutFlow1743900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "exercises" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coachId" uuid,
        "name" varchar(160) NOT NULL,
        "muscleGroup" varchar(100) NOT NULL,
        "description" text,
        "videoUrl" varchar(500),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exercises" PRIMARY KEY ("id"),
        CONSTRAINT "FK_exercises_coach" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_exercises_coachId" ON "exercises" ("coachId")`);

    await queryRunner.query(`
      CREATE TABLE "workout_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coachId" uuid NOT NULL,
        "name" varchar(160) NOT NULL,
        "description" text,
        "items" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workout_plans" PRIMARY KEY ("id"),
        CONSTRAINT "FK_workout_plans_coach" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_workout_plans_coachId" ON "workout_plans" ("coachId")`);

    await queryRunner.query(`
      CREATE TABLE "workout_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "planId" uuid NOT NULL,
        "clientId" uuid NOT NULL,
        "coachId" uuid NOT NULL,
        "planName" varchar(160) NOT NULL,
        "actions" jsonb NOT NULL,
        "timezone" varchar(100) NOT NULL,
        "startsOn" date NOT NULL,
        "endsOn" date,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workout_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_workout_assignments_plan" FOREIGN KEY ("planId") REFERENCES "workout_plans"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_workout_assignments_client" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_workout_assignments_coach" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_workout_assignments_clientId" ON "workout_assignments" ("clientId")`);
    await queryRunner.query(`CREATE INDEX "IDX_workout_assignments_coachId" ON "workout_assignments" ("coachId")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_workout_assignments_active_client" ON "workout_assignments" ("clientId") WHERE "isActive" = true`);

    await queryRunner.query(`
      CREATE TABLE "workout_completions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "assignmentId" uuid NOT NULL,
        "actionId" uuid NOT NULL,
        "clientId" uuid NOT NULL,
        "localDate" date NOT NULL,
        "completed" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workout_completions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_workout_completion_action_day" UNIQUE ("assignmentId", "actionId", "localDate"),
        CONSTRAINT "FK_workout_completions_assignment" FOREIGN KEY ("assignmentId") REFERENCES "workout_assignments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_workout_completions_client" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_workout_completions_client_day" ON "workout_completions" ("clientId", "localDate")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "workout_completions"`);
    await queryRunner.query(`DROP TABLE "workout_assignments"`);
    await queryRunner.query(`DROP TABLE "workout_plans"`);
    await queryRunner.query(`DROP TABLE "exercises"`);
  }
}
