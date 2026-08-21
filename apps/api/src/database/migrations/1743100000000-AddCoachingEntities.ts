import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoachingEntities1743100000000 implements MigrationInterface {
  name = 'AddCoachingEntities1743100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create coach_profiles table
    await queryRunner.query(`
      CREATE TABLE "coach_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "bio" text,
        "specialties" text[] NOT NULL DEFAULT '{}',
        "sessionRateUSD" numeric(10,2),
        "certifications" text[] NOT NULL DEFAULT '{}',
        "acceptingClients" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_coach_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_coach_profiles_userId" UNIQUE ("userId"),
        CONSTRAINT "FK_coach_profiles_userId" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_coach_profiles_userId" ON "coach_profiles" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_coach_profiles_acceptingClients" ON "coach_profiles" ("acceptingClients")`);

    // Create relationship_status enum and client_coach_relationships table
    await queryRunner.query(`CREATE TYPE "relationship_status_enum" AS ENUM ('pending', 'active', 'inactive')`);
    await queryRunner.query(`
      CREATE TABLE "client_coach_relationships" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clientId" uuid NOT NULL,
        "coachId" uuid NOT NULL,
        "status" "relationship_status_enum" NOT NULL DEFAULT 'pending',
        "startedAt" TIMESTAMPTZ,
        "endedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_client_coach_relationships" PRIMARY KEY ("id"),
        CONSTRAINT "FK_client_coach_relationships_clientId" FOREIGN KEY ("clientId")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_client_coach_relationships_coachId" FOREIGN KEY ("coachId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_client_coach_relationships_clientId" ON "client_coach_relationships" ("clientId")`);
    await queryRunner.query(`CREATE INDEX "IDX_client_coach_relationships_coachId" ON "client_coach_relationships" ("coachId")`);
    await queryRunner.query(`CREATE INDEX "IDX_client_coach_relationships_status" ON "client_coach_relationships" ("status")`);

    // Create packages table
    await queryRunner.query(`
      CREATE TABLE "packages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coachId" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "durationWeeks" integer NOT NULL,
        "sessionsIncluded" integer NOT NULL,
        "priceUSD" numeric(10,2) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_packages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_packages_coachId" FOREIGN KEY ("coachId")
          REFERENCES "coach_profiles"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_packages_coachId" ON "packages" ("coachId")`);
    await queryRunner.query(`CREATE INDEX "IDX_packages_isActive" ON "packages" ("isActive")`);

    // Create client_package_status enum and client_packages table
    await queryRunner.query(`CREATE TYPE "client_package_status_enum" AS ENUM ('active', 'completed', 'cancelled')`);
    await queryRunner.query(`
      CREATE TABLE "client_packages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clientId" uuid NOT NULL,
        "packageId" uuid NOT NULL,
        "coachId" uuid NOT NULL,
        "status" "client_package_status_enum" NOT NULL DEFAULT 'active',
        "startDate" TIMESTAMPTZ,
        "endDate" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_client_packages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_client_packages_clientId" FOREIGN KEY ("clientId")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_client_packages_packageId" FOREIGN KEY ("packageId")
          REFERENCES "packages"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_client_packages_coachId" FOREIGN KEY ("coachId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_client_packages_clientId" ON "client_packages" ("clientId")`);
    await queryRunner.query(`CREATE INDEX "IDX_client_packages_packageId" ON "client_packages" ("packageId")`);
    await queryRunner.query(`CREATE INDEX "IDX_client_packages_coachId" ON "client_packages" ("coachId")`);
    await queryRunner.query(`CREATE INDEX "IDX_client_packages_status" ON "client_packages" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "client_packages"`);
    await queryRunner.query(`DROP TYPE "client_package_status_enum"`);
    await queryRunner.query(`DROP TABLE "packages"`);
    await queryRunner.query(`DROP TABLE "client_coach_relationships"`);
    await queryRunner.query(`DROP TYPE "relationship_status_enum"`);
    await queryRunner.query(`DROP TABLE "coach_profiles"`);
  }
}
