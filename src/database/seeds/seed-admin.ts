/**
 * Seed script: creates the initial admin user.
 *
 * Run with:
 *   pnpm seed:admin
 *
 * Reads credentials from .env:
 *   DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_USERNAME
 *
 * Safe to run multiple times — skips if an admin already exists.
 */

// Must be first: loads .env and exports `config`
import { config } from '../../config/env';

import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entities/User';

async function seedAdmin(): Promise<void> {
  await AppDataSource.initialize();
  console.log('✅ Database connection established');

  try {
    const userRepository = AppDataSource.getRepository(User);

    // ── Validate env vars ─────────────────────────────────────────────────────
    const email    = config.admin.email;
    const password = config.admin.password;
    const username = config.admin.username;

    if (!email || !password || !username) {
      console.error('❌ Missing required env vars: DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_USERNAME');
      process.exit(1);
    }

    // ── Idempotency check ─────────────────────────────────────────────────────
    const existing = await userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      if (existing.role === UserRole.ADMIN) {
        console.log(`ℹ️  Admin already exists: ${existing.email} — skipping.`);
      } else {
        console.warn(`⚠️  A non-admin user already exists with email ${existing.email} — skipping.`);
      }
      return;
    }

    // ── Create admin ──────────────────────────────────────────────────────────
    // Password is plain text here.
    // The @BeforeInsert hook on User hashes it with BCRYPT_ROUNDS (default: 12).
    const admin = userRepository.create({
      email: email.toLowerCase().trim(),
      username,
      password,                 // hashed by @BeforeInsert
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
      isEmailVerified: true,
      hasCompletedOnboarding: true,
    });

    const saved = await userRepository.save(admin);

    console.log('✅ Admin user created:');
    console.log(`   ID:    ${saved.id}`);
    console.log(`   Email: ${saved.email}`);
    console.log(`   Role:  ${saved.role}`);
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

seedAdmin().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
