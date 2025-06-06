import express from 'express';
import passport from 'passport';
import { 
  register, 
  login, 
  handleOAuthCallback, 
  checkAuthStatus, 
  logout, 
  forgotPassword,
  resetPassword
} from '../controllers/auth-controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Email/password authentication
router.post('/register', register);
router.post('/login', login);

// Password reset
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Google OAuth2 routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_auth_failed' }),
  handleOAuthCallback
);

// Facebook OAuth routes
router.get(
  '/facebook',
  passport.authenticate('facebook', { scope: ['email', 'public_profile'] })
);

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login?error=facebook_auth_failed' }),
  handleOAuthCallback
);

// Check authentication status
router.get('/status', authenticateToken, checkAuthStatus);

// Logout
router.get('/logout', logout);

export default router; 