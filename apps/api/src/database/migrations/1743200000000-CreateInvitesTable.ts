import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvitesTable1743200000000 implements MigrationInterface {
  name = 'CreateInvitesTable1743200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "invites" (
        "id"          uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "email"       varchar(255) NOT NULL,
        "token"       varchar(128) NOT NULL,
        "used"        boolean      NOT NULL DEFAULT false,
        "expiresAt"   TIMESTAMPTZ  NOT NULL,
        "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "invitedById" uuid,
        CONSTRAINT "PK_invites"            PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invites_email"      UNIQUE ("email"),
        CONSTRAINT "UQ_invites_token"      UNIQUE ("token"),
        CONSTRAINT "FK_invites_invitedById" FOREIGN KEY ("invitedById")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_invites_token" ON "invites" ("token")`);
    await queryRunner.query(`CREATE INDEX "IDX_invites_email" ON "invites" ("email")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "invites"`);
  }
}
