import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { UserProfile } from './entities/UserProfile';
import { Session } from './entities/Session';
import { SystemSettings } from './entities/SystemSettings';
import { AuditLog } from './entities/AuditLog';
import { CoachTraineeAssignment } from './entities/CoachTraineeAssignment';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'steady_vitality',
  
  // SSL Configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  
  // Connection pool settings
  extra: {
    max: 20,
    min: 5,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
  
  // Synchronize only in development
  synchronize: process.env.NODE_ENV === 'development',
  
  // Logging
  logging: process.env.NODE_ENV === 'development' ? 'all' : ['error'],
  
  // Entity registration
  entities: [
    User,
    UserProfile,
    Session,
    SystemSettings,
    AuditLog,
    CoachTraineeAssignment
  ],
  
  // Migrations
  migrations: ['src/database/migrations/**/*.ts'],
  migrationsTableName: 'migrations',
  
  // Subscribers
  subscribers: ['src/database/subscribers/**/*.ts'],
  
  // Cache configuration
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
    duration: 30000, // 30 seconds
  },
  
  // PostgreSQL specific settings
  maxQueryExecutionTime: 5000, // 5 seconds
  
  // Connection options
  connectTimeoutMS: 30000,
});