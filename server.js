require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { testConnection } = require('./config/database');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const circularRoutes = require('./routes/circulars');
const masterCirculars = require('./routes/masterCirculars');
const dailyStatsRoutes = require('./routes/dailyStats');
const monthlyStatsRoutes = require('./routes/monthlyStats');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ARCL API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});


app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    if (path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }
}));

// API Routes
app.use('/api', authRoutes);
app.use('/api/circulars', circularRoutes);
app.use('/api/master-circulars', masterCirculars);
app.use('/api/stats/daily', dailyStatsRoutes);
app.use('/api/stats/monthly', monthlyStatsRoutes);


// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync models (use { alter: true } in development, migrations in production)
    await sequelize.sync({
      alter: process.env.NODE_ENV === 'development',
      logging: false
    });
    console.log('✅ Database models synchronized');

    // Create initial admin if specified in env
    if (process.env.INITIAL_ADMIN_USERNAME && process.env.INITIAL_ADMIN_PASSWORD) {
      const { createInitialAdmin } = require('./controllers/authController');
      await createInitialAdmin(
        process.env.INITIAL_ADMIN_USERNAME,
        process.env.INITIAL_ADMIN_PASSWORD
      );
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation:`);
      console.log(`   - Health Check: GET http://localhost:${PORT}/health`);
      console.log(`   - Login: POST http://localhost:${PORT}/api/login`);
      console.log(`   - Circulars: GET/POST http://localhost:${PORT}/api/circulars`);
      console.log("   - Master Circulars: GET/POST http://localhost:5000/api/master-circulars");
      console.log(`   - Daily Stats: GET/POST http://localhost:${PORT}/api/stats/daily`);
      console.log(`   - Monthly Stats: GET/POST http://localhost:${PORT}/api/stats/monthly`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    S
    console.log('💥 Process terminated!');
  });
});

startServer();