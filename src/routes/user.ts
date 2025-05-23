import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin-middleware';
import { 
  getUserProfile,
  updateUserProfile,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultAddress,
  getCustomersList,
  getCustomerById
} from '../controllers/user-controller';

const router = express.Router();

// Admin routes
router.get('/customers', authenticateToken, adminMiddleware, getCustomersList);
router.get('/customers/:id', authenticateToken, adminMiddleware, getCustomerById);

// Profile routes
router.get('/profile', authenticateToken, getUserProfile);
router.put('/profile', authenticateToken, updateUserProfile);

// Address routes
router.get('/addresses', authenticateToken, getUserAddresses);
router.post('/addresses', authenticateToken, addUserAddress);
router.put('/addresses/:addressId', authenticateToken, updateUserAddress);
router.delete('/addresses/:addressId', authenticateToken, deleteUserAddress);
router.patch('/addresses/:addressId/default', authenticateToken, setDefaultAddress);

export default router; 