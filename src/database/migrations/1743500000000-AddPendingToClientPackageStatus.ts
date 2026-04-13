import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendingToClientPackageStatus1743500000000 implements MigrationInterface {
  name = 'AddPendingToClientPackageStatus1743500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL enums cannot have values removed, but can have them added.
    // IF NOT EXISTS guard prevents failure on re-runs.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum
          WHERE enumlabel = 'pending'
            AND enumtypid = (
              SELECT oid FROM pg_type WHERE typname = 'client_packages_status_enum'
            )
        ) THEN
          ALTER TYPE "client_packages_status_enum" ADD VALUE 'pending';
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support DROP VALUE on an enum type.
    // To roll back: migrate any 'pending' rows to 'cancelled', recreate the
    // enum without 'pending', and re-cast the column. That destructive path
    // is intentionally left as a manual operation.
    console.warn(
      'AddPendingToClientPackageStatus down(): ' +
      'PostgreSQL cannot remove enum values. ' +
      'Manually convert pending rows and recreate the enum if a rollback is required.',
    );
  }
}
