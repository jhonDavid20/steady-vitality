import { MigrationInterface, QueryRunner } from 'typeorm';

export class CoachingRelationshipAuthority1743800000000 implements MigrationInterface {
  name = 'CoachingRelationshipAuthority1743800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Stop on ambiguous historic data instead of silently choosing a coach.
    const conflicts = await queryRunner.query(`
      SELECT "clientId"
      FROM "client_coach_relationships"
      WHERE "status" = 'active'
      GROUP BY "clientId"
      HAVING COUNT(*) > 1

      UNION ALL

      SELECT u."id" AS "clientId"
      FROM "users" u
      JOIN "client_coach_relationships" r
        ON r."clientId" = u."id" AND r."status" = 'active'
      WHERE u."coachId" IS NOT NULL AND u."coachId" <> r."coachId"
      LIMIT 1
    `);

    if (conflicts.length > 0) {
      throw new Error(
        'Cannot establish coaching relationship authority: conflicting active coach assignments exist. Resolve them before retrying this migration.',
      );
    }

    // Preserve prior direct links as active relationship history.
    await queryRunner.query(`
      INSERT INTO "client_coach_relationships" (
        "clientId", "coachId", "status", "startedAt", "createdAt", "updatedAt"
      )
      SELECT u."id", u."coachId", 'active', NOW(), NOW(), NOW()
      FROM "users" u
      WHERE u."coachId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM "client_coach_relationships" r
          WHERE r."clientId" = u."id" AND r."status" = 'active'
        )
    `);

    // Keep the existing lookup pointer aligned with historic active relationships.
    await queryRunner.query(`
      UPDATE "users" u
      SET "coachId" = r."coachId"
      FROM "client_coach_relationships" r
      WHERE r."clientId" = u."id"
        AND r."status" = 'active'
        AND u."coachId" IS NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_client_coach_relationships_active_client"
      ON "client_coach_relationships" ("clientId")
      WHERE "status" = 'active'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_client_coach_relationships_active_client"`);
  }
}
