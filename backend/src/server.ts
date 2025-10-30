import app from './app';
import sequelize from './config/database.config';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log('🚀 Starting Bowen Hooks Backend...\n');
    
    // Try database connection but don't block startup
    try {
      console.log('🔄 Attempting database connection...');
      await sequelize.authenticate();
      console.log('✅ Database connected successfully!');
      await sequelize.sync({ alter: false });
      console.log('✅ Database synced');
    } catch (dbError: any) {
      console.warn('⚠️ Database connection failed, but starting server anyway');
      console.warn('Database will be unavailable, but API endpoints will respond');
    }
    
    // Start server regardless of database status
    app.listen(PORT, () => {
      console.log(`\n🎉 BACKEND DEPLOYED SUCCESSFULLY!`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
      console.log(`\n🚀 API is ready for frontend team!`);
      console.log(`🔗 Test URL: https://bowen-hooks-backend.onrender.com/health`);
    });

  } catch (error: any) {
    console.error('💥 Startup failed:', error);
    process.exit(1);
  }
};

startServer();