// Programmatic migration runner.
//
// The typeorm CLI's data-source loader (`typeorm migration:run -d ...`) throws
// "Cannot read properties of undefined (reading 'constructor')" under ts-node in
// this monorepo. Importing the DataSource directly and calling its migration API
// is robust, so the migration:* scripts use this instead of the CLI.
//
// Usage: ts-node src/database/migrate.ts <run|revert|show>

import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'run';
  await AppDataSource.initialize();

  try {
    if (command === 'revert') {
      await AppDataSource.undoLastMigration();
      console.log('↩️  Reverted the last migration.');
    } else if (command === 'show') {
      const hasPending = await AppDataSource.showMigrations();
      console.log(hasPending ? '⏳ There are pending migrations.' : '✅ No pending migrations.');
    } else if (command === 'run') {
      const ran = await AppDataSource.runMigrations({ transaction: 'all' });
      console.log(
        ran.length
          ? `✅ Ran ${ran.length} migration(s): ${ran.map((m) => m.name).join(', ')}`
          : '✅ No pending migrations.',
      );
    } else {
      throw new Error(`Unknown command "${command}". Use: run | revert | show`);
    }
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error('❌ Migration command failed:', err);
  process.exit(1);
});
