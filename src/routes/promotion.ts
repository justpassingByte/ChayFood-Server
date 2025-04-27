import express from 'express';
import * as promotionController from '../controllers/promotion-controller';
import { authenticateToken } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin-middleware';

const router = express.Router();

// Public routes
router.get('/active-flash-sales', promotionController.getActiveFlashSales);

// User routes (requires authentication)
router.get('/', authenticateToken, promotionController.getAllPromotions);
router.get('/:id', authenticateToken, promotionController.getPromotionById);

// Admin routes (requires admin privileges)
router.post('/', authenticateToken, adminMiddleware, promotionController.createPromotion);
router.post('/flash-sale', authenticateToken, adminMiddleware, promotionController.createFlashSale);
router.put('/:id', authenticateToken, adminMiddleware, promotionController.updatePromotion);
router.delete('/:id', authenticateToken, adminMiddleware, promotionController.deletePromotion);
router.get('/:id/stats', authenticateToken, adminMiddleware, promotionController.getPromotionStats);

export default router; 