"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const review_controller_1 = require("../controllers/review-controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Lấy tất cả đánh giá cho một món ăn - Public
router.get('/menuitem/:menuItemId', review_controller_1.reviewController.getAllByMenuItem);
// Lấy tất cả đánh giá của người dùng hiện tại - Protected
router.get('/user', auth_1.authenticate, review_controller_1.reviewController.getAllByUser);
// Tạo đánh giá mới - Protected
router.post('/menuitem/:menuItemId', auth_1.authenticate, review_controller_1.reviewController.create);
// Cập nhật đánh giá - Protected
router.put('/:reviewId', auth_1.authenticate, review_controller_1.reviewController.update);
// Xóa đánh giá - Protected
router.delete('/:reviewId', auth_1.authenticate, review_controller_1.reviewController.delete);
exports.default = router;
