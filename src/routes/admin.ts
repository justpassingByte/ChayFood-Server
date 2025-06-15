import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin-middleware';
import {
  getCustomersList,
  getCustomerById,
  getUserById
} from '../controllers/user-controller';

const router = express.Router();

// Admin routes for managing users
router.get('/customers', authenticateToken, adminMiddleware, getCustomersList);
router.get('/customers/:id', authenticateToken, adminMiddleware, getCustomerById);
router.get('/users/:id', authenticateToken, adminMiddleware, getUserById);

export default router; 