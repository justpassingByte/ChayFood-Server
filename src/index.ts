import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import configurePassport from './config/passport';

// Import routes
import authRoutes from './routes/auth';
import menuRoutes from './routes/menu';
import orderRoutes from './routes/order';
import subscriptionRoutes from './routes/subscription';
import planRoutes from './routes/plan';
import recommendationRoutes from './routes/recommendationRoutes';
import userRoutes from './routes/user';
import loyaltyRoutes from './routes/loyalty';
import promotionRoutes from './routes/promotion';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'chayfood_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
configurePassport(); // Configure passport strategies

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'ChayFood API is running',
    endpoints: {
      menu: '/menu',
      auth: '/auth',
      order: '/order',
      subscription: '/subscription',
      plan: '/plan',
      recommendation: '/recommendation'
    }
  });
});

// Routes - updated to match README documentation
app.use('/auth', authRoutes);
app.use('/menu', menuRoutes);
app.use('/order', orderRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/plan', planRoutes);
app.use('/recommendation', recommendationRoutes);
app.use('/user', userRoutes);
app.use('/loyalty', loyaltyRoutes);
app.use('/promotion', promotionRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    status: 'error',
    message: 'Route not found',
    path: req.path
  });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chayfood';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at: http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- Menu: http://localhost:' + PORT + '/menu');
  console.log('- Auth: http://localhost:' + PORT + '/auth');
  console.log('- Order: http://localhost:' + PORT + '/order');
  console.log('- Subscription: http://localhost:' + PORT + '/subscription');
  console.log('- Plan: http://localhost:' + PORT + '/plan');
  console.log('- Recommendation: http://localhost:' + PORT + '/recommendation');
  console.log('- User: http://localhost:' + PORT + '/user');
  console.log('- Loyalty: http://localhost:' + PORT + '/loyalty');
  console.log('- Promotion: http://localhost:' + PORT + '/promotion');
}); 