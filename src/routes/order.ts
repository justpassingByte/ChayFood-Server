import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getOrders,
  getAllOrders,
  getUserOrders,
  getOrderById, 
  createOrder, 
  updateOrderStatus, 
  cancelOrder 
} from '../controllers/order-controller';

const router = express.Router();

// Legacy route - Get all orders (admin) or user's orders based on role
router.get('/', authenticateToken, getOrders);

// Admin route - Get all orders in the system
router.get('/admin/all', authenticateToken, getAllOrders);

// User route - Get only the user's own orders
router.get('/user/my-orders', authenticateToken, getUserOrders);

// Get order by ID
router.get('/:id', authenticateToken, getOrderById);

// Create order
router.post('/', authenticateToken, createOrder);

// Update order status (admin only)
router.patch('/:id/status', authenticateToken, updateOrderStatus);

// Cancel order
router.patch('/:id/cancel', authenticateToken, cancelOrder);

export default router; 