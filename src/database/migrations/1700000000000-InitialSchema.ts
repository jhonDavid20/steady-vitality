import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Enums ─────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_role_enum" AS ENUM ('admin', 'coach', 'client');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "gender_enum" AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "activity_level_enum" AS ENUM (
          'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "fitness_goal_enum" AS ENUM (
          'weight_loss', 'muscle_gain', 'maintenance', 'strength',
          'endurance', 'flexibility', 'general_fitness'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    // ── users ─────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"                       uuid          NOT NULL DEFAULT uuid_generate_v4(),
        "email"                    varchar(255)  NOT NULL,
        "username"                 varchar(100)  NOT NULL,
        "password"                 varchar(255)  NOT NULL,
        "firstName"                varchar(100)  NOT NULL,
        "lastName"                 varchar(100)  NOT NULL,
        "avatar"                   varchar(500),
        "role"                     "user_role_enum" NOT NULL DEFAULT 'client',
        "isActive"                 boolean       NOT NULL DEFAULT true,
        "isEmailVerified"          boolean       NOT NULL DEFAULT false,
        "hasCompletedOnboarding"   boolean       NOT NULL DEFAULT false,
        "emailVerificationToken"   varchar(255),
        "emailVerificationExpires" timestamptz,
        "passwordResetToken"       varchar(255),
        "passwordResetExpires"     timestamptz,
        "lastLoginAt"              timestamptz,
        "coachId"                  uuid,
        "createdAt"                timestamptz   NOT NULL DEFAULT now(),
        "updatedAt"                timestamptz   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email"    UNIQUE ("email"),
        CONSTRAINT "UQ_users_username" UNIQUE ("username")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_email"     ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_username"  ON "users" ("username")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_role"      ON "users" ("role")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_isActive"  ON "users" ("isActive")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_createdAt" ON "users" ("createdAt")`);

    // Self-referencing FK for coachId (added after table exists)
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "FK_users_coachId"
        FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // ── sessions ──────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id"                    uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "userId"                uuid         NOT NULL,
        "token"                 text         UNIQUE,
        "refreshToken"          text,
        "expiresAt"             timestamptz  NOT NULL,
        "refreshTokenExpiresAt" timestamptz,
        "ipAddress"             varchar(45),
        "userAgent"             text,
        "deviceType"            varchar(100),
        "browser"               varchar(100),
        "os"                    varchar(100),
        "country"               varchar(100),
        "city"                  varchar(100),
        "isActive"              boolean      NOT NULL DEFAULT true,
        "lastAccessedAt"        timestamptz,
        "revokedAt"             timestamptz,
        "revokedBy"             varchar(100),
        "revokedReason"         text,
        "createdAt"             timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sessions_userId" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sessions_token"     ON "sessions" ("token")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sessions_userId"    ON "sessions" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sessions_expiresAt" ON "sessions" ("expiresAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sessions_isActive"  ON "sessions" ("isActive")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sessions_createdAt" ON "sessions" ("createdAt")`);

    // ── user_profiles ─────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_profiles" (
        "id"                   uuid           NOT NULL DEFAULT uuid_generate_v4(),
        "userId"               uuid           NOT NULL,
        "age"                  integer,
        "gender"               "gender_enum",
        "height"               decimal(5,2),
        "weight"               decimal(5,2),
        "phone"                varchar(20),
        "emergencyContact"     varchar(255),
        "activityLevel"        "activity_level_enum" NOT NULL DEFAULT 'sedentary',
        "fitnessGoal"          "fitness_goal_enum"   NOT NULL DEFAULT 'general_fitness',
        "targetWeight"         decimal(5,2),
        "medicalConditions"    text[]         NOT NULL DEFAULT '{}',
        "medications"          text[]         NOT NULL DEFAULT '{}',
        "injuries"             text[]         NOT NULL DEFAULT '{}',
        "dietaryRestrictions"  text[]         NOT NULL DEFAULT '{}',
        "allergies"            text[]         NOT NULL DEFAULT '{}',
        "preferredWorkoutTime" varchar(100),
        "gymLocation"          varchar(255),
        "notes"                text,
        "dateOfBirth"          date,
        "address"              varchar(255),
        "city"                 varchar(100),
        "state"                varchar(100),
        "zipCode"              varchar(20),
        "country"              varchar(100),
        "timezone"             varchar(100),
        "createdAt"            timestamptz    NOT NULL DEFAULT now(),
        "updatedAt"            timestamptz    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_profiles_userId" UNIQUE ("userId"),
        CONSTRAINT "FK_user_profiles_userId" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_profiles_userId"        ON "user_profiles" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_profiles_gender"        ON "user_profiles" ("gender")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_profiles_activityLevel" ON "user_profiles" ("activityLevel")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_profiles_fitnessGoal"   ON "user_profiles" ("fitnessGoal")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_coachId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "fitness_goal_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "activity_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "gender_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
