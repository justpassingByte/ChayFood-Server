import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getAllMenuItems, 
  getMenuItemById, 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  getNutritionalMenuItems,
  searchMenuItems
} from '../controllers/menu-controller';
import { trackItemView } from '../middleware/userPreferenceMiddleware';

const router = express.Router();

// Debug endpoint to check request body
router.post('/test', (req, res) => {
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  res.json({
    message: 'Request received',
    bodyReceived: req.body,
    contentType: req.headers['content-type'],
    bodyIsEmpty: Object.keys(req.body).length === 0
  });
});

// Get all menu items
router.get('/', getAllMenuItems);

// Search menu items
router.get('/search', searchMenuItems);

// Get menu items filtered by nutritional content (calories and protein)
router.get('/nutrition', getNutritionalMenuItems);

// Get menu item by ID (track view for authenticated users)
router.get('/:id', trackItemView, getMenuItemById);

// Create new menu item (admin only)
router.post('/', authenticateToken, createMenuItem);

// Update menu item (admin only)
router.put('/:id', authenticateToken, updateMenuItem);

// Delete menu item (admin only)
router.delete('/:id', authenticateToken, deleteMenuItem);

export default router; 