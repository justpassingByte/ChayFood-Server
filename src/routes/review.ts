import express from 'express';
import { reviewController } from '../controllers/review-controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Lấy tất cả đánh giá cho một món ăn - Public
router.get('/menuitem/:menuItemId', reviewController.getAllByMenuItem);

// Lấy tất cả đánh giá của người dùng hiện tại - Protected
router.get('/user', authenticate, reviewController.getAllByUser);

// Tạo đánh giá mới - Protected
router.post('/menuitem/:menuItemId', authenticate, reviewController.create);

// Cập nhật đánh giá - Protected
router.put('/:reviewId', authenticate, reviewController.update);

// Xóa đánh giá - Protected
router.delete('/:reviewId', authenticate, reviewController.delete);

export default router; 