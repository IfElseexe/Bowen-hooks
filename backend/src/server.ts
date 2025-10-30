import app from './app';
import sequelize from './config/database.config';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log('🚀 Starting Bowen Hooks Backend...\n');
    
    // Test database connection
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // PRODUCTION SAFE SYNC - Never drop data
    console.log('🔄 Syncing database (safe mode)...');
    await sequelize.sync({ alter: false }); // Don't alter tables in production
    console.log('✅ Database ready - data is safe!');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`\n🎉 BACKEND DEPLOYED SUCCESSFULLY!`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: PostgreSQL - Data Persists`);
      console.log(`\n🚀 API is ready for frontend team!`);
    });

  } catch (error) {
    console.error('💥 Startup failed:', error);
    process.exit(1);
  }
};

startServer();