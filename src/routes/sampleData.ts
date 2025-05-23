import express from 'express';
import { generateMenuItems, generateUsers, generateOrders, generateAll, clearSampleData } from '../controllers/sample-data-controller';
import { adminMiddleware } from '../middleware/admin-middleware';

const router = express.Router();

// All routes require admin authentication
router.use(adminMiddleware);

// Generate sample menu items
router.post('/menu-items', generateMenuItems);

// Generate sample users
router.post('/users', generateUsers);

// Generate sample orders
router.post('/orders', generateOrders);

// Generate complete dataset
router.post('/generate-all', generateAll);

// Clear all sample data
router.delete('/clear', clearSampleData);

export default router; 