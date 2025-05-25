"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewController = void 0;
const Review_1 = require("../models/Review");
const MenuItem_1 = require("../models/MenuItem");
const mongoose_1 = __importDefault(require("mongoose"));
exports.reviewController = {
    // Lấy tất cả đánh giá của một món ăn
    getAllByMenuItem: async (req, res) => {
        try {
            const { menuItemId } = req.params;
            // Kiểm tra menuItemId có hợp lệ không
            if (!mongoose_1.default.Types.ObjectId.isValid(menuItemId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID món ăn không hợp lệ'
                });
            }
            // Kiểm tra món ăn có tồn tại không
            const menuItem = await MenuItem_1.MenuItem.findById(menuItemId);
            if (!menuItem) {
                return res.status(404).json({
                    success: false,
                    message: 'Món ăn không tồn tại'
                });
            }
            // Lấy tất cả đánh giá của món ăn và populate thông tin người dùng
            const reviews = await Review_1.Review.find({ menuItem: menuItemId })
                .populate('user', 'name email avatar')
                .sort({ date: -1 });
            // Tính toán điểm đánh giá trung bình
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
            return res.status(200).json({
                success: true,
                data: {
                    reviews,
                    totalReviews: reviews.length,
                    averageRating: parseFloat(averageRating.toFixed(1))
                }
            });
        }
        catch (error) {
            console.error('Error in getAllByMenuItem:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    },
    // Tạo đánh giá mới cho món ăn
    create: async (req, res) => {
        var _a;
        try {
            const { menuItemId } = req.params;
            const { rating, comment } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id; // Lấy ID người dùng từ authentication middleware
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Bạn cần đăng nhập để đánh giá'
                });
            }
            // Kiểm tra các trường bắt buộc
            if (!rating || !comment) {
                return res.status(400).json({
                    success: false,
                    message: 'Điểm đánh giá và nội dung đánh giá là bắt buộc'
                });
            }
            // Kiểm tra rating có hợp lệ không (từ 1-5)
            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Điểm đánh giá phải từ 1 đến 5'
                });
            }
            // Kiểm tra menuItemId có hợp lệ không
            if (!mongoose_1.default.Types.ObjectId.isValid(menuItemId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID món ăn không hợp lệ'
                });
            }
            // Kiểm tra món ăn có tồn tại không
            const menuItem = await MenuItem_1.MenuItem.findById(menuItemId);
            if (!menuItem) {
                return res.status(404).json({
                    success: false,
                    message: 'Món ăn không tồn tại'
                });
            }
            // Kiểm tra người dùng đã đánh giá món ăn này chưa
            const existingReview = await Review_1.Review.findOne({ user: userId, menuItem: menuItemId });
            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn đã đánh giá món ăn này rồi'
                });
            }
            // Tạo đánh giá mới
            const newReview = new Review_1.Review({
                user: userId,
                menuItem: menuItemId,
                rating,
                comment,
                date: new Date()
            });
            await newReview.save();
            // Lấy thông tin người dùng để trả về
            const populatedReview = await Review_1.Review.findById(newReview._id)
                .populate('user', 'name email avatar');
            return res.status(201).json({
                success: true,
                message: 'Đánh giá đã được tạo thành công',
                data: populatedReview
            });
        }
        catch (error) {
            console.error('Error in createReview:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    },
    // Cập nhật đánh giá
    update: async (req, res) => {
        var _a;
        try {
            const { reviewId } = req.params;
            const { rating, comment } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Lấy ID người dùng từ authentication middleware
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Bạn cần đăng nhập để cập nhật đánh giá'
                });
            }
            // Kiểm tra reviewId có hợp lệ không
            if (!mongoose_1.default.Types.ObjectId.isValid(reviewId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID đánh giá không hợp lệ'
                });
            }
            // Kiểm tra đánh giá có tồn tại không
            const review = await Review_1.Review.findById(reviewId);
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Đánh giá không tồn tại'
                });
            }
            // Kiểm tra người dùng có phải là người tạo đánh giá không
            if (review.user.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền cập nhật đánh giá này'
                });
            }
            // Cập nhật đánh giá
            if (rating) {
                if (rating < 1 || rating > 5) {
                    return res.status(400).json({
                        success: false,
                        message: 'Điểm đánh giá phải từ 1 đến 5'
                    });
                }
                review.rating = rating;
            }
            if (comment) {
                review.comment = comment;
            }
            await review.save();
            // Lấy thông tin người dùng để trả về
            const updatedReview = await Review_1.Review.findById(reviewId)
                .populate('user', 'name email avatar');
            return res.status(200).json({
                success: true,
                message: 'Đánh giá đã được cập nhật thành công',
                data: updatedReview
            });
        }
        catch (error) {
            console.error('Error in updateReview:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    },
    // Xóa đánh giá
    delete: async (req, res) => {
        var _a, _b;
        try {
            const { reviewId } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Lấy ID người dùng từ authentication middleware
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Bạn cần đăng nhập để xóa đánh giá'
                });
            }
            // Kiểm tra reviewId có hợp lệ không
            if (!mongoose_1.default.Types.ObjectId.isValid(reviewId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID đánh giá không hợp lệ'
                });
            }
            // Kiểm tra đánh giá có tồn tại không
            const review = await Review_1.Review.findById(reviewId);
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Đánh giá không tồn tại'
                });
            }
            // Kiểm tra người dùng có phải là người tạo đánh giá không (hoặc admin)
            if (review.user.toString() !== userId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền xóa đánh giá này'
                });
            }
            await Review_1.Review.findByIdAndDelete(reviewId);
            return res.status(200).json({
                success: true,
                message: 'Đánh giá đã được xóa thành công'
            });
        }
        catch (error) {
            console.error('Error in deleteReview:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    },
    // Lấy tất cả đánh giá của người dùng hiện tại
    getAllByUser: async (req, res) => {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Lấy ID người dùng từ authentication middleware
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Bạn cần đăng nhập để xem đánh giá'
                });
            }
            const reviews = await Review_1.Review.find({ user: userId })
                .populate('menuItem', 'name image price')
                .sort({ date: -1 });
            return res.status(200).json({
                success: true,
                data: reviews
            });
        }
        catch (error) {
            console.error('Error in getAllByUser:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    }
};
