import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAvailablePlans,
  createSubscription,
  getUserSubscriptions,
  getSubscriptionById,
  updateMenuSelections,
  cancelSubscription
} from '../controllers/subscription-controller';

const router = express.Router();

// Get available subscription plans (public)
router.get('/plans', getAvailablePlans);

// Create a subscription (authenticated)
router.post('/', authenticateToken, createSubscription);

// Get user's subscriptions (authenticated)
router.get('/my-subscriptions', authenticateToken, getUserSubscriptions);

// Get subscription by ID (authenticated)
router.get('/:id', authenticateToken, getSubscriptionById);

// Update subscription menu selections (authenticated)
router.patch('/:id/menu', authenticateToken, updateMenuSelections);

// Cancel subscription (authenticated)
router.patch('/:id/cancel', authenticateToken, cancelSubscription);

export default router; 