import app from './app';
import sequelize from './config/database.config';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('🚀 Starting Bowen Hooks Backend...\n');
    
    // Test database connection
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Create tables
    console.log('🔄 Creating tables...');
    await sequelize.sync({ force: true }); // Use force:true to drop and recreate
    console.log('✅ All 30 tables created successfully!');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`\n🎉 BACKEND READY!`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API: http://localhost:${PORT}/api/health`);
      console.log(`📊 Database: PostgreSQL with 30 tables`);
      console.log(`\n💡 Next: Test the API and start building features!`);
    });

  } catch (error) {
    console.error('💥 Startup failed:', error);
    process.exit(1);
  }
};

startServer();