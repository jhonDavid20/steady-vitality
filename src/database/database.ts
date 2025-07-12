import { AppDataSource } from './data-source';
import { User, UserRole } from './entities/User';
import { SystemSettings } from './entities/SystemSettings';
import * as bcrypt from 'bcryptjs';

export class DatabaseManager {
  /**
   * Initialize the database connection
   */
  static async initialize(): Promise<void> {
    try {
      await AppDataSource.initialize();
      console.log('✅ Database connection established successfully');
      
      // Run initial setup if needed
      await this.runInitialSetup();
    } catch (error) {
      console.error('❌ Error during database initialization:', error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  static async close(): Promise<void> {
    try {
      await AppDataSource.destroy();
      console.log('✅ Database connection closed successfully');
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
      throw error;
    }
  }

  /**
   * Run initial database setup
   */
  private static async runInitialSetup(): Promise<void> {
    try {
      await this.createDefaultAdmin();
      await this.seedSystemSettings();
      console.log('✅ Initial database setup completed');
    } catch (error) {
      console.error('❌ Error during initial setup:', error);
      throw error;
    }
  }

  /**
   * Create default admin user if none exists
   */
  private static async createDefaultAdmin(): Promise<void> {
    const userRepository = AppDataSource.getRepository(User);
    
    // Check if any admin user exists
    const adminExists = await userRepository.findOne({
      where: { role: UserRole.ADMIN }
    });

    if (!adminExists) {
      const defaultAdmin = userRepository.create({
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@steadyvitality.com',
        username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!',
        firstName: 'System',
        lastName: 'Administrator',
        role: UserRole.ADMIN,
        isActive: true,
        isEmailVerified: true,
      });

      await userRepository.save(defaultAdmin);
      console.log('✅ Default admin user created');
    }
  }

  /**
   * Seed system settings with default values
   */
  private static async seedSystemSettings(): Promise<void> {
    const settingsRepository = AppDataSource.getRepository(SystemSettings);
    
    const defaultSettings = SystemSettings.getDefaultSettings();

    for (const setting of defaultSettings) {
      const exists = await settingsRepository.findOne({
        where: { key: setting.key }
      });

      if (!exists) {
        const newSetting = settingsRepository.create(setting);
        await settingsRepository.save(newSetting);
      }
    }

    console.log('✅ System settings seeded');
  }

  /**
   * Check database health
   */
  static async healthCheck(): Promise<{
    isConnected: boolean;
    error?: string;
    details: {
      host: string;
      database: string;
      isInitialized: boolean;
    };
  }> {
    try {
      const isConnected = AppDataSource.isInitialized;
      
      if (!isConnected) {
        return {
          isConnected: false,
          error: 'Database not initialized',
          details: {
            host: AppDataSource.options.host as string,
            database: AppDataSource.options.database as string,
            isInitialized: false,
          },
        };
      }

      // Test with a simple query
      await AppDataSource.query('SELECT 1');

      return {
        isConnected: true,
        details: {
          host: AppDataSource.options.host as string,
          database: AppDataSource.options.database as string,
          isInitialized: true,
        },
      };
    } catch (error) {
      return {
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          host: AppDataSource.options.host as string,
          database: AppDataSource.options.database as string,
          isInitialized: AppDataSource.isInitialized,
        },
      };
    }
  }

  /**
   * Run database migrations
   */
  static async runMigrations(): Promise<void> {
    try {
      await AppDataSource.runMigrations();
      console.log('✅ Database migrations completed');
    } catch (error) {
      console.error('❌ Error running migrations:', error);
      throw error;
    }
  }

  /**
   * Revert last migration
   */
  static async revertMigration(): Promise<void> {
    try {
      await AppDataSource.undoLastMigration();
      console.log('✅ Last migration reverted');
    } catch (error) {
      console.error('❌ Error reverting migration:', error);
      throw error;
    }
  }

  /**
   * Drop all tables (USE WITH CAUTION!)
   */
  static async dropDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop database in production environment');
    }

    try {
      await AppDataSource.dropDatabase();
      console.log('✅ Database dropped');
    } catch (error) {
      console.error('❌ Error dropping database:', error);
      throw error;
    }
  }

  /**
   * Synchronize database schema (USE WITH CAUTION!)
   */
  static async synchronizeSchema(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot synchronize schema in production environment');
    }

    try {
      await AppDataSource.synchronize();
      console.log('✅ Database schema synchronized');
    } catch (error) {
      console.error('❌ Error synchronizing schema:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  static async getStatistics(): Promise<{
    totalUsers: number;
    totalAdmins: number;
    totalCoaches: number;
    totalClients: number;
    activeAssignments: number;
    totalSessions: number;
  }> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      
      const [
        totalUsers,
        totalAdmins,
        totalCoaches,
        totalClients,
      ] = await Promise.all([
        userRepository.count(),
        userRepository.count({ where: { role: UserRole.ADMIN } }),
        userRepository.count({ where: { role: UserRole.COACH } }),
        userRepository.count({ where: { role: UserRole.CLIENT } }),
      ]);

      // Additional statistics would require other entities
      return {
        totalUsers,
        totalAdmins,
        totalCoaches,
        totalClients,
        activeAssignments: 0, // Will be implemented when CoachTraineeAssignment is available
        totalSessions: 0, // Will be implemented when Session tracking is available
      };
    } catch (error) {
      console.error('❌ Error getting database statistics:', error);
      throw error;
    }
  }
}

/**
 * Database utility functions
 */
export class DatabaseUtils {
  /**
   * Create a database transaction
   */
  static async transaction<T>(
    operation: (manager: any) => Promise<T>
  ): Promise<T> {
    return AppDataSource.transaction(operation);
  }

  /**
   * Get repository for an entity
   */
  static getRepository<T>(entity: any) {
    return AppDataSource.getRepository<T>(entity);
  }

  /**
   * Execute raw SQL query
   */
  static async query(sql: string, parameters?: any[]): Promise<any> {
    return AppDataSource.query(sql, parameters);
  }

  /**
   * Clear all data from a table (USE WITH CAUTION!)
   */
  static async clearTable(tableName: string): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clear tables in production environment');
    }

    await AppDataSource.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
  }

  /**
   * Backup database (PostgreSQL specific)
   */
  static async createBackup(backupPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = backupPath || `backup_${timestamp}.sql`;
    
    // This would typically use pg_dump command
    // Implementation depends on your deployment environment
    console.log(`Creating backup: ${filename}`);
    return filename;
  }
}

/**
 * Environment-specific database configurations
 */
export const DatabaseConfig = {
  development: {
    logging: true,
    synchronize: true,
    dropSchema: false,
  },
  
  test: {
    logging: false,
    synchronize: true,
    dropSchema: true,
  },
  
  staging: {
    logging: ['error', 'warn'],
    synchronize: false,
    dropSchema: false,
  },
  
  production: {
    logging: ['error'],
    synchronize: false,
    dropSchema: false,
  },
};

/**
 * Database connection status
 */
export const getDatabaseStatus = () => {
  return {
    isInitialized: AppDataSource.isInitialized,
    hasMetadata: AppDataSource.hasMetadata,
    isConnected: AppDataSource.isInitialized && !AppDataSource.isDestroyed,
  };
};