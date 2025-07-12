import 'reflect-metadata';
import dotenv from 'dotenv';
import { DatabaseManager } from './database/database';
import app from './app';

// Load environment variables
dotenv.config();

// Configuration
const PORT = parseInt(process.env.PORT || '3000');
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connections
    await DatabaseManager.close();
    console.log('✅ Database connections closed');
    
    // Exit process
    console.log('👋 Server shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error: Error) => {
  console.error('💥 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('💥 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

/**
 * Handle graceful shutdown signals
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const requiredVars = [
    'DB_HOST',
    'DB_PORT', 
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
}

/**
 * Display startup banner
 */
function displayBanner(): void {
  console.log('\n' + '='.repeat(60));
  console.log('🏃‍♂️ STEADY VITALITY - HEALTH & FITNESS PLATFORM');
  console.log('='.repeat(60));
  console.log(`📊 Environment: ${NODE_ENV.toUpperCase()}`);
  console.log(`🚀 Port: ${PORT}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`⚡ Node.js: ${process.version}`);
  console.log(`🕐 Started: ${new Date().toISOString()}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<void> {
  console.log('🔍 Checking database health...');
  
  const health = await DatabaseManager.healthCheck();
  
  if (!health.isConnected) {
    console.error('❌ Database health check failed:', health.error);
    console.error('Database details:', health.details);
    throw new Error('Database connection failed');
  }
  
  console.log('✅ Database health check passed');
  console.log(`   Host: ${health.details.host}`);
  console.log(`   Database: ${health.details.database}`);
  console.log(`   Initialized: ${health.details.isInitialized}`);
}

/**
 * Display database statistics
 */
async function displayStatistics(): Promise<void> {
  try {
    const stats = await DatabaseManager.getStatistics();
    console.log('\n📊 Database Statistics:');
    console.log(`   Total Users: ${stats.totalUsers}`);
    console.log(`   Admins: ${stats.totalAdmins}`);
    console.log(`   Coaches: ${stats.totalCoaches}`);
    console.log(`   Clients: ${stats.totalClients}`);
    console.log(`   Active Assignments: ${stats.activeAssignments}`);
    console.log(`   Total Sessions: ${stats.totalSessions}`);
  } catch (error) {
    console.log('📊 Database statistics not available yet (tables may not exist)');
  }
}

/**
 * Main server startup function
 */
async function startServer(): Promise<void> {
  try {
    // Display startup banner
    displayBanner();
    
    // Validate environment
    console.log('🔧 Validating environment variables...');
    validateEnvironment();
    console.log('✅ Environment validation passed');
    
    // Initialize database
    console.log('🗄️  Initializing database connection...');
    await DatabaseManager.initialize();
    console.log('✅ Database initialized successfully');
    
    // Check database health
    await checkDatabaseHealth();
    
    // Display statistics
    await displayStatistics();
    
    // Start Express server
    console.log(`🚀 Starting Express server on port ${PORT}...`);
    
    const server = app.listen(PORT, () => {
      console.log('✅ Server started successfully!');
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      
      if (NODE_ENV === 'development') {
        console.log('\n💡 Development Tips:');
        console.log('   - Use Ctrl+C to stop the server');
        console.log('   - Check /health endpoint for server status');
        console.log('   - API endpoints will be available at /api/*');
        console.log('   - Admin panel will be available at /admin/*');
      }
      
      console.log('\n🎉 Steady Vitality is ready to help people transform their lives!');
      console.log('='.repeat(60));
    });

    // Configure server timeout
    server.timeout = 30000; // 30 seconds
    
    // Store server reference for graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n🔄 SIGTERM received, starting graceful shutdown...');
      server.close(() => {
        gracefulShutdown('SIGTERM');
      });
    });

    process.on('SIGINT', () => {
      console.log('\n🔄 SIGINT received, starting graceful shutdown...');
      server.close(() => {
        gracefulShutdown('SIGINT');
      });
    });

  } catch (error) {
    console.error('\n💥 Failed to start server:');
    console.error('Error:', error instanceof Error ? error.message : error);
    
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    // Try to close database connections before exiting
    try {
      await DatabaseManager.close();
    } catch (closeError) {
      console.error('Error closing database:', closeError);
    }
    
    console.error('\n❌ Server startup failed. Please check the error above and try again.');
    process.exit(1);
  }
}

/**
 * Development mode helpers
 */
if (NODE_ENV === 'development') {
  // Enable better stack traces in development
  Error.stackTraceLimit = Infinity;
  
  // Log additional debugging information
  console.log('🔧 Development mode enabled');
  console.log('   - Enhanced error logging');
  console.log('   - Database synchronization enabled');
  console.log('   - Detailed query logging enabled');
}

/**
 * Production mode optimizations
 */
if (NODE_ENV === 'production') {
  // Limit stack trace in production
  Error.stackTraceLimit = 10;
  
  console.log('🏭 Production mode enabled');
  console.log('   - Enhanced security settings');
  console.log('   - Optimized performance');
  console.log('   - Limited error details in responses');
}

// Start the server
startServer().catch((error) => {
  console.error('💥 Critical startup error:', error);
  process.exit(1);
});