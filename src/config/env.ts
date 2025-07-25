// src/config/env.ts
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Determine the .env file path
const envPath = path.resolve(process.cwd(), '.env');

// Check if .env file exists
if (fs.existsSync(envPath)) {
  console.log('📄 Loading environment from .env file...');
} else {
  console.log('🐳 Running in containerized environment, using environment variables');
}

// Load environment variables before anything else (override system vars)
if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath, override: true });
  if (result.error) {
    console.error('❌ Error loading .env file:', result.error);
    if (process.env.NODE_ENV === 'production') {
      throw result.error;
    }
  } else {
    console.log('✅ Environment variables loaded from:', envPath);
  }
}

// Validate critical environment variables
const requiredVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Export environment configuration
export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    name: process.env.DB_NAME || 'steady_vitality',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_change_me',
    expiresIn: process.env.JWT_EXPIRE || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  },
  admin: {
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@steadyvitality.com',
    username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!',
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  }
};

// Export a helper to check if env is loaded
export const isEnvLoaded = () => {
  return missingVars.length === 0;
};