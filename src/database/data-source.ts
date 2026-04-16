// src/database/data-source.ts

// IMPORTANT: Load environment config first
import '../config/env';
import { config } from '../config/env';

import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { UserProfile } from './entities/UserProfile';
import { Session } from './entities/Session';
import { CoachProfile } from './entities/CoachProfile';
import { ClientCoachRelationship } from './entities/ClientCoachRelationship';
import { Package } from './entities/Package';
import { ClientPackage } from './entities/ClientPackage';
import { Invite } from './entities/Invite';
import { ConnectionRequest } from './entities/ConnectionRequest';

const isProduction = config.nodeEnv === 'production';

// Render (and most cloud providers) expose a single DATABASE_URL connection string.
// Fall back to individual vars for local development.
const connectionOptions = process.env.DATABASE_URL
  ? { url: process.env.DATABASE_URL }
  : {
      host: config.database.host,
      port: config.database.port,
      username: config.database.username,
      password: config.database.password,
      database: config.database.name,
    };

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...connectionOptions,

  // SSL — required on Render's managed Postgres
  ssl: isProduction ? { rejectUnauthorized: false } : false,

  // Connection pool settings
  extra: {
    max: 20,
    min: 5,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },

  // Never synchronize — use migrations instead
  synchronize: false,

  // Logging
  logging: isProduction ? ['error'] : 'all',

  // Entity registration
  entities: [
    User,
    UserProfile,
    Session,
    CoachProfile,
    ClientCoachRelationship,
    Package,
    ClientPackage,
    Invite,
    ConnectionRequest,
  ],

  // In production run compiled JS migrations; in dev run TS source directly
  migrations: isProduction
    ? ['dist/database/migrations/*.js']
    : ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',

  // Cache configuration (disabled for now)
  cache: false,

  // PostgreSQL specific settings
  maxQueryExecutionTime: 5000, // 5 seconds

  // Connection options
  connectTimeoutMS: 30000,
});