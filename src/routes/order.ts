import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getOrders,
  getAllOrders,
  getUserOrders,
  getOrderById, 
  createOrder, 
  updateOrderStatus, 
  cancelOrder,
  confirmDelivery 
} from '../controllers/order-controller';
import { trackOrderCreation } from '../middleware/userPreferenceMiddleware';

const router = express.Router();

// Legacy route - Get all orders (admin) or user's orders based on role
router.get('/', authenticateToken, getOrders);

// Admin route - Get all orders in the system
router.get('/admin/all', authenticateToken, getAllOrders);

// User route - Get only the user's own orders
router.get('/user/my-orders', authenticateToken, getUserOrders);

// Get order by ID
router.get('/:id', authenticateToken, getOrderById);

// Create order - add tracking middleware after order creation
router.post('/', authenticateToken, createOrder, trackOrderCreation);

// Update order status (admin only)
router.patch('/:id/status', authenticateToken, updateOrderStatus);

// Cancel order
router.patch('/:id/cancel', authenticateToken, cancelOrder);

// Confirm order delivery (user)
router.patch('/:id/user/confirm-delivery', authenticateToken, confirmDelivery);

export default router; 