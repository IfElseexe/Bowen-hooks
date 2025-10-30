import { Sequelize } from 'sequelize-typescript';
import path from 'path';
import logger from '../utils/logger';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bowen_hooks_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  
  // Connection pool configuration
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '5'),
    min: parseInt(process.env.DB_POOL_MIN || '0'),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000')
  },

  // Model loading
  models: [path.join(__dirname, '../models')],

  // Logging
  logging: process.env.NODE_ENV === 'development' 
    ? (msg) => logger.debug(msg)
    : false,

  // Timezone
  timezone: '+01:00', // WAT (West Africa Time)

  // Other options
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },

  // Query options
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

// Sync database (for development only)
export const syncDatabase = async (options: { force?: boolean; alter?: boolean } = {}): Promise<void> => {
  try {
    await sequelize.sync(options);
    logger.info('✅ Database synchronized successfully');
  } catch (error) {
    logger.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

// Close database connection
export const closeConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('👋 Database connection closed');
  } catch (error) {
    logger.error('❌ Error closing database connection:', error);
    throw error;
  }
};

export { sequelize };
export default sequelize;