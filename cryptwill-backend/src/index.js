require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

const { errorHandler } = require('./middlewares/errorHandler');
const { startCheckinMonitor } = require('./cron/checkinMonitor');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const assetRoutes = require('./routes/asset.routes');
const beneficiaryRoutes = require('./routes/beneficiary.routes');
const guardianRoutes = require('./routes/guardian.routes');
const contractRoutes = require('./routes/contract.routes');
const checkinRoutes = require('./routes/checkin.routes');
const vaultRoutes = require('./routes/vault.routes');
const notificationRoutes = require('./routes/notification.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const rulebookRoutes = require('./routes/rulebook.routes');

const app = express();
const server = http.createServer(app);
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = new Set([
  frontendOrigin,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};

// Socket.io for real-time updates
const io = new Server(server, {
  cors: {
    origin: Array.from(allowedOrigins),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log('[Socket] Client connected', socket.id);
  
  socket.on('join-user', (userId) => {
    socket.join(`user:${userId}`);
  });
  
  socket.on('join-contract', (contractId) => {
    socket.join(`contract:${contractId}`);
  });
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));

// Stripe/Razorpay webhooks need raw body, so we conditionally parse JSON
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate Limiting (apply to auth routes specifically)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: process.env.NODE_ENV === 'production' ? 10 : 100, // relaxed in dev
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes' },
  skip: (req) => process.env.NODE_ENV !== 'production', // skip entirely in dev
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
const lawyerRoutes = require('./routes/lawyer.routes');
app.use('/api/lawyers', lawyerRoutes);
app.use('/api/guardians', guardianRoutes);
app.use('/api/contract', contractRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/rulebook', rulebookRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CryptWill API',
    health: '/health',
    apiBase: '/api',
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  
  // Start the background cron jobs and workers
  if (process.env.NODE_ENV !== 'test' && process.env.RUN_WORKERS === 'true') {
    startCheckinMonitor();
    require('./workers/email.worker');
    require('./workers/sms.worker');
    console.log('[Workers] Email & SMS BullMQ workers started');
  } else {
    console.log('[Workers] Demo mode enabled - BullMQ workers skipped');
  }
});

module.exports = { app, server, io };
