require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { testConnection } = require('./config/database');
const { sequelize, User } = require('./models');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const circularRoutes = require('./routes/circulars');
const masterCirculars = require('./routes/masterCirculars');
const dailyStatsRoutes = require('./routes/dailyStats');
const monthlyStatsRoutes = require('./routes/monthlyStats');
const newsletterRoutes = require("./routes/newsletters");
const announcementRoutes = require('./routes/announcements');
const investorComplaintRoutes = require('./routes/investorComplaints');
const pressReleaseRoutes = require('./routes/pressReleases');
const shareholdersMeetingRoutes = require('./routes/shareholdersMeetings');
const sebiRoutes = require('./routes/sebi');
const rbiRoutes = require('./routes/rbi');
const financialResultRoutes = require('./routes/financialResults');
const annualReportRoutes = require('./routes/annualReports');
const annualReturnRoutes = require('./routes/annualReturns');
const newspaperPublicationRoutes = require('./routes/newspaperPublications');
const financialStatementRoutes = require('./routes/financialStatements');
const userRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');
const deleteRequestRoutes = require('./routes/deleteRequests');
const archiveRoutes = require('./routes/archive');

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
app.use('/api/circulars', circularRoutes);
app.use('/api/master-circulars', masterCirculars);
app.use('/api/stats/daily', dailyStatsRoutes);
app.use('/api/stats/monthly', monthlyStatsRoutes);
app.use("/api/newsletters", newsletterRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/investor-complaints', investorComplaintRoutes);
app.use('/api/press-releases', pressReleaseRoutes);
app.use('/api/shareholders-meetings', shareholdersMeetingRoutes);
app.use('/api/sebi', sebiRoutes);
app.use('/api/rbi', rbiRoutes);
app.use('/api/financial-results', financialResultRoutes);
app.use('/api/annual-reports', annualReportRoutes);
app.use('/api/annual-returns', annualReturnRoutes);
app.use('/api/newspaper-publications', newspaperPublicationRoutes);
app.use('/api/financial-statements', financialStatementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/delete-requests', deleteRequestRoutes);
app.use('/api/archives', archiveRoutes);

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
    await sequelize.sync({
      alter: true,
      logging: false
    });
    console.log('✅ Database models synchronized (force: true)');

    // 🌱 Create initial Super Admin
    const existingSuperAdmin = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username: 'superadmin' },
          { email: 'admin@arcl.com' }
        ]
      }
    });

    if (!existingSuperAdmin) {
      await User.create({
        username: 'superadmin',
        email: 'admin@arcl.com',
        password: 'admin123',
        role: 'super_admin',
        is_active: true
      });

      console.log('');
      console.log('🌱 INITIAL SUPER ADMIN CREATED:');
      console.log('   Email: admin@arcl.com');
      console.log('   Password: admin123');
      console.log('');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('');
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
    console.log('💥 Process terminated!');
  });
});

startServer();