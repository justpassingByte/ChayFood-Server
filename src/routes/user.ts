import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin-middleware';
import multer from 'multer';
import path from 'path';
import type { Request } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultAddress,
  getCustomersList,
  getCustomerById,
  getFullUserProfile
} from '../controllers/user-controller';

const router = express.Router();

// Multer config for avatar upload
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  }
});
const upload = multer({ storage });

// Admin routes
router.get('/customers', authenticateToken, adminMiddleware, getCustomersList);
router.get('/customers/:id', authenticateToken, adminMiddleware, getCustomerById);

// Profile routes
router.get('/profile', authenticateToken, getUserProfile);
console.log('Mounting /user/profile/full route');
router.get('/profile/full', authenticateToken, getFullUserProfile);
router.put('/profile', authenticateToken, upload.single('picture'), updateUserProfile);

// Address routes
router.get('/addresses', authenticateToken, getUserAddresses);
router.post('/addresses', authenticateToken, addUserAddress);
router.put('/addresses/:addressId', authenticateToken, updateUserAddress);
router.delete('/addresses/:addressId', authenticateToken, deleteUserAddress);
router.patch('/addresses/:addressId/default', authenticateToken, setDefaultAddress);

export default router; 