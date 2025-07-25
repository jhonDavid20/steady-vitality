// src/database/data-source.ts

// IMPORTANT: Load environment config first
import '../config/env';
import { config } from '../config/env';

import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { UserProfile } from './entities/UserProfile';
import { Session } from './entities/Session';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  
  // SSL Configuration for production
  ssl: config.nodeEnv === 'production' ? {
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
  synchronize: config.nodeEnv === 'development',
  
  // Logging
  logging: config.nodeEnv === 'development' ? 'all' : ['error'],
  
  // Entity registration
  entities: [
    User,
    UserProfile,
    Session
  ],
  
  
  // Cache configuration (disabled for now)
  cache: false,
  
  // PostgreSQL specific settings
  maxQueryExecutionTime: 5000, // 5 seconds
  
  // Connection options
  connectTimeoutMS: 30000,
});