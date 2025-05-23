import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getUserCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cart-controller';

const router = express.Router();

// All cart routes require authentication
router.use(authenticateToken);

// Get user's cart
router.get('/', getUserCart);

// Add item to cart
router.post('/items', addToCart);

// Update cart item
router.put('/items/:cartItemId', updateCartItem);

// Remove item from cart
router.delete('/items/:cartItemId', removeFromCart);

// Clear cart
router.delete('/', clearCart);

export default router; 