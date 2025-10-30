import app from './app';
import sequelize from './config/database.config';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log('🚀 Starting Bowen Hooks Backend...\n');
    
    // Log database connection info (without password)
    console.log('🔧 Environment:', process.env.NODE_ENV);
    console.log('🔧 Database Host:', process.env.DB_HOST || 'Using DATABASE_URL');
    
    // Try database connection
    try {
      console.log('🔄 Connecting to database...');
      await sequelize.authenticate();
      console.log('✅ Database connected successfully!');
      
      // Sync database safely
      console.log('🔄 Syncing database...');
      await sequelize.sync({ alter: false });
      console.log('✅ Database synced safely');
    } catch (dbError: any) {
      console.error('💥 Database connection failed:');
      console.error('Error:', dbError.message);
      console.error('Please check your DATABASE_URL or database configuration');
      process.exit(1);
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`\n🎉 BACKEND DEPLOYED SUCCESSFULLY!`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: Connected & Ready`);
      console.log(`\n🚀 API is ready for frontend team!`);
      console.log(`🔗 Health check: https://bowen-hooks-backend.onrender.com/health`);
    });

  } catch (error: any) {
    console.error('💥 Startup failed:', error.message);
    process.exit(1);
  }
};

startServer();