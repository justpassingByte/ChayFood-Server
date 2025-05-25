import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getUserProfile,
  updateUserProfile,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultAddress,
  getFullUserProfile
} from '../controllers/user-controller';

const router = express.Router();

// Profile routes
router.get('/profile', authenticateToken, getUserProfile);
router.put('/profile', authenticateToken, updateUserProfile);
router.get('/profile/full', authenticateToken, getFullUserProfile);
console.log('Mounted /user/profile/full');

// Address routes
router.get('/addresses', authenticateToken, getUserAddresses);
router.post('/addresses', authenticateToken, addUserAddress);
router.put('/addresses/:addressId', authenticateToken, updateUserAddress);
router.delete('/addresses/:addressId', authenticateToken, deleteUserAddress);
router.patch('/addresses/:addressId/default', authenticateToken, setDefaultAddress);

export default router; 