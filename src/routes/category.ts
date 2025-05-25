import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getAllCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../controllers/category-controller';

const router = express.Router();

// Get all categories
router.get('/', getAllCategories);

// Get category by ID
router.get('/:id', getCategoryById);

// Create new category (admin only)
router.post('/', authenticateToken, createCategory);

// Update category (admin only)
router.put('/:id', authenticateToken, updateCategory);

// Delete category (admin only)
router.delete('/:id', authenticateToken, deleteCategory);

export default router; 