// backend/server.js - BelieveinaBlessed API (Snippe payments)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import affiliateRoutes from './routes/affiliates.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import categoryRoutes from './routes/categories.js';
import slideRoutes from './routes/slides.js';
import competitionRoutes from './routes/competitions.js';
import flashSalesRoutes from './routes/flashSales.js';
import reviewRoutes from './routes/reviews.js';
import notificationRoutes from './routes/notifications.js';
import snippeRoutes, { snippeWebhookHandler } from './routes/snippe.js';

// Load environment variables
dotenv.config();

const app = express();
app.set('trust proxy', 1);

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== DIRECTORY SETUP ====================

// Ensure upload directories exist
const uploadDirs = ['uploads', 'uploads/products', 'uploads/slides', 'uploads/reviews'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// ==================== CORS CONFIGURATION ====================

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ALLOWED_ORIGIN,
  ...(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  // Local development frontends
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
].filter(Boolean);

// Enable CORS with proper options
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.some(o => o.includes('*') && origin.includes(o.replace('*', '')))) {
      console.log('✅ CORS allowed:', origin);
      callback(null, true);
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('⚠️ CORS allowing in non-production:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.sendStatus(200);
});

// ==================== MIDDLEWARE ====================

// Snippe webhook needs the raw body for HMAC signature verification
// (must be registered BEFORE express.json parses the body).
app.post(
  '/api/snippe/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
    try {
      req.body = JSON.parse(req.rawBody || '{}');
    } catch {
      req.body = {};
    }
    return snippeWebhookHandler(req, res, next);
  }
);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  if (req.headers.origin) {
    console.log('   Origin:', req.headers.origin);
  }
  next();
});

// ==================== HEALTH CHECKS ====================

// Root route - API status
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'BelieveinaBlessed API is running 🚀',
    version: '1.0.0',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      api: '/api',
      health: '/health',
      uploads: '/uploads',
      snippe: '/api/snippe'
    }
  });
});

// Health check endpoint for Fly.io
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    },
    version: process.version,
    node_env: process.env.NODE_ENV,
    snippe: process.env.SNIPPE_API_KEY ? 'configured' : 'not configured'
  });
});

// API Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==================== STATIC FILES ====================

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== API ROUTES ====================

// Mount routes - ORDER MATTERS!
console.log('📦 Mounting routes...');
console.log('='.repeat(40));

// Public routes
app.use('/api/auth', authRoutes);
console.log('   ✅ /api/auth');

app.use('/api/categories', categoryRoutes);
console.log('   ✅ /api/categories');

app.use('/api/slides', slideRoutes);
console.log('   ✅ /api/slides');

app.use('/api/competitions', competitionRoutes);
console.log('   ✅ /api/competitions');

app.use('/api/flash-sales', flashSalesRoutes);
console.log('   ✅ /api/flash-sales');

// Affiliate routes
app.use('/api/affiliates', affiliateRoutes);
console.log('   ✅ /api/affiliates');

// Order routes
app.use('/api/orders', orderRoutes);
console.log('   ✅ /api/orders');

// REVIEW ROUTES - Must come before product routes
app.use('/api', reviewRoutes);
console.log('   ✅ /api/reviews (mounted under /api)');

// NOTIFICATION ROUTES
app.use('/api/notifications', notificationRoutes);
console.log('   ✅ /api/notifications');

// Product routes - Must come after review routes
app.use('/api/products', productRoutes);
console.log('   ✅ /api/products');

// Snippe payment routes (webhook is mounted earlier with raw body)
app.use('/api/snippe', snippeRoutes);
console.log('   ✅ /api/snippe');

// Admin routes - Must come after all other routes
app.use('/api/admin', adminRoutes);
console.log('   ✅ /api/admin');

console.log('='.repeat(40));
console.log('✅ All routes mounted successfully');
// ==================== ERROR HANDLING ====================

// 404 handler - Catch all unmatched routes
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  console.error('   Stack:', err.stack);
  
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(err.status || 500).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.details || null
    })
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Node version: ${process.version}`);
  console.log('='.repeat(60));
  console.log('✅ Available endpoints:');
  console.log(`   - Health: http://${HOST}:${PORT}/health`);
  console.log(`   - API: http://${HOST}:${PORT}/api`);
  console.log(`   - Uploads: http://${HOST}:${PORT}/uploads`);
  console.log(`   - Snippe: http://${HOST}:${PORT}/api/snippe`);
  console.log('='.repeat(60));

  if (process.env.SNIPPE_API_KEY) {
    console.log('💳 Snippe is configured ✓');
  } else {
    console.log('⚠️ Snippe is NOT configured (missing SNIPPE_API_KEY)');
  }
});

// ==================== GRACEFUL SHUTDOWN ====================

process.on('SIGTERM', () => {
  console.log('📦 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📦 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.error('   Stack:', err.stack);
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Keeping server alive despite uncaught exception');
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('   Reason:', reason);
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Keeping server alive despite unhandled rejection');
  } else {
    process.exit(1);
  }
});

export default app;