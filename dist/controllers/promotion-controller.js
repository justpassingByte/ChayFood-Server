"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPromotions = getAllPromotions;
exports.getPromotionById = getPromotionById;
exports.createPromotion = createPromotion;
exports.createFlashSale = createFlashSale;
exports.updatePromotion = updatePromotion;
exports.deletePromotion = deletePromotion;
exports.getActiveFlashSales = getActiveFlashSales;
exports.getPromotionStats = getPromotionStats;
const Promotion_1 = require("../models/Promotion");
const mongoose_1 = __importDefault(require("mongoose"));
const notification_service_1 = require("../services/notification-service");
/**
 * Get all promotions with pagination and filters
 */
async function getAllPromotions(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Filter parameters
        const type = req.query.type;
        const isActive = req.query.isActive === 'true';
        const promotionType = req.query.promotionType;
        // Build query
        const query = {};
        if (type)
            query.type = type;
        if (req.query.isActive !== undefined)
            query.isActive = isActive;
        if (promotionType)
            query.promotionType = promotionType;
        // Get current date
        const now = new Date();
        // Active promotions filter
        if (req.query.status === 'active') {
            query.startDate = { $lte: now };
            query.endDate = { $gte: now };
            query.isActive = true;
        }
        // Upcoming promotions filter
        if (req.query.status === 'upcoming') {
            query.startDate = { $gt: now };
            query.isActive = true;
        }
        // Expired promotions filter
        if (req.query.status === 'expired') {
            query.endDate = { $lt: now };
        }
        // Find promotions with filters and pagination
        const promotions = await Promotion_1.Promotion.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const totalCount = await Promotion_1.Promotion.countDocuments(query);
        res.json({
            status: 'success',
            message: `Retrieved ${promotions.length} promotions`,
            data: {
                promotions,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                    hasMore: skip + promotions.length < totalCount
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching promotions',
            error: error.message
        });
    }
}
/**
 * Get promotion by ID
 */
async function getPromotionById(req, res) {
    try {
        const { id } = req.params;
        // Validate MongoDB ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid promotion ID format'
            });
            return;
        }
        const promotion = await Promotion_1.Promotion.findById(id);
        if (!promotion) {
            res.status(404).json({
                status: 'error',
                message: 'Promotion not found'
            });
            return;
        }
        res.json({
            status: 'success',
            message: 'Promotion retrieved successfully',
            data: promotion
        });
    }
    catch (error) {
        console.error('Error fetching promotion:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching promotion',
            error: error.message
        });
    }
}
/**
 * Create a new promotion
 */
async function createPromotion(req, res) {
    var _a;
    try {
        // Check if user is admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }
        const { name, description, code, type, value, minOrderValue, maxDiscount, startDate, endDate, totalCodes, isActive, promotionType } = req.body;
        // Validate code uniqueness
        const existingPromotion = await Promotion_1.Promotion.findOne({ code });
        if (existingPromotion) {
            res.status(400).json({
                status: 'error',
                message: 'Promotion code already exists. Please use a unique code.'
            });
            return;
        }
        // Create promotion
        const promotion = new Promotion_1.Promotion({
            name,
            description,
            code,
            type,
            value,
            minOrderValue,
            maxDiscount,
            startDate,
            endDate,
            totalCodes,
            usedCodes: 0,
            isActive: isActive || true,
            promotionType: promotionType || 'regular'
        });
        await promotion.save();
        // Send notification if promotion is active and immediate
        if (isActive && new Date(startDate) <= new Date()) {
            await (0, notification_service_1.notifyAllUsersAboutPromotion)(`New Promotion: ${name}`, `${description}. Use code ${code} to get ${type === 'percentage' ? value + '%' : value + ' VND'} off your order.`, {
                related: { type: 'promotion', id: promotion._id }
            });
        }
        res.status(201).json({
            status: 'success',
            message: 'Promotion created successfully',
            data: promotion
        });
    }
    catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating promotion',
            error: error.message
        });
    }
}
/**
 * Create a flash sale
 */
async function createFlashSale(req, res) {
    var _a;
    try {
        // Check if user is admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }
        const { name, description, code, type, value, minOrderValue, maxDiscount, startDate, endDate, totalCodes, isActive, shouldNotify } = req.body;
        // Validate code uniqueness
        const existingPromotion = await Promotion_1.Promotion.findOne({ code });
        if (existingPromotion) {
            res.status(400).json({
                status: 'error',
                message: 'Promotion code already exists. Please use a unique code.'
            });
            return;
        }
        // Create flash sale
        const flashSale = new Promotion_1.Promotion({
            name,
            description,
            code,
            type,
            value,
            minOrderValue,
            maxDiscount,
            startDate,
            endDate,
            totalCodes,
            usedCodes: 0,
            isActive: isActive || true,
            promotionType: 'flash_sale'
        });
        await flashSale.save();
        // Send notification immediately if specified
        if (shouldNotify) {
            await (0, notification_service_1.notifyAboutFlashSale)(`Flash Sale: ${name}`, `${description}. Use code ${code} to get ${type === 'percentage' ? value + '%' : value + ' VND'} off your order.`, flashSale._id, new Date(startDate), new Date(endDate));
            // Mark as notified
            flashSale.notificationSent = true;
            await flashSale.save();
        }
        res.status(201).json({
            status: 'success',
            message: 'Flash sale created successfully',
            data: flashSale
        });
    }
    catch (error) {
        console.error('Error creating flash sale:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating flash sale',
            error: error.message
        });
    }
}
/**
 * Update a promotion
 */
async function updatePromotion(req, res) {
    var _a;
    try {
        // Check if user is admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }
        const { id } = req.params;
        // Validate MongoDB ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid promotion ID format'
            });
            return;
        }
        const { name, description, code, type, value, minOrderValue, maxDiscount, startDate, endDate, totalCodes, isActive, promotionType } = req.body;
        // Check if promotion exists
        const existingPromotion = await Promotion_1.Promotion.findById(id);
        if (!existingPromotion) {
            res.status(404).json({
                status: 'error',
                message: 'Promotion not found'
            });
            return;
        }
        // If code is changing, validate uniqueness
        if (code && code !== existingPromotion.code) {
            const codeExists = await Promotion_1.Promotion.findOne({ code, _id: { $ne: id } });
            if (codeExists) {
                res.status(400).json({
                    status: 'error',
                    message: 'Promotion code already exists. Please use a unique code.'
                });
                return;
            }
        }
        // Update promotion
        const updatedPromotion = await Promotion_1.Promotion.findByIdAndUpdate(id, {
            name,
            description,
            code,
            type,
            value,
            minOrderValue,
            maxDiscount,
            startDate,
            endDate,
            totalCodes,
            isActive,
            promotionType
        }, { new: true, runValidators: true });
        if (!updatedPromotion) {
            res.status(404).json({
                status: 'error',
                message: 'Promotion not found'
            });
            return;
        }
        res.json({
            status: 'success',
            message: 'Promotion updated successfully',
            data: updatedPromotion
        });
    }
    catch (error) {
        console.error('Error updating promotion:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error updating promotion',
            error: error.message
        });
    }
}
/**
 * Delete a promotion
 */
async function deletePromotion(req, res) {
    var _a;
    try {
        // Check if user is admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }
        const { id } = req.params;
        // Validate MongoDB ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid promotion ID format'
            });
            return;
        }
        const deletedPromotion = await Promotion_1.Promotion.findByIdAndDelete(id);
        if (!deletedPromotion) {
            res.status(404).json({
                status: 'error',
                message: 'Promotion not found'
            });
            return;
        }
        res.json({
            status: 'success',
            message: 'Promotion deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error deleting promotion',
            error: error.message
        });
    }
}
/**
 * Get active flash sales
 */
async function getActiveFlashSales(req, res) {
    try {
        const now = new Date();
        const flashSales = await Promotion_1.Promotion.find({
            promotionType: 'flash_sale',
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        });
        res.json({
            status: 'success',
            message: `Retrieved ${flashSales.length} active flash sales`,
            data: flashSales
        });
    }
    catch (error) {
        console.error('Error fetching active flash sales:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching active flash sales',
            error: error.message
        });
    }
}
/**
 * Get promotion usage statistics
 */
async function getPromotionStats(req, res) {
    var _a;
    try {
        // Check if user is admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }
        const { id } = req.params;
        // Validate MongoDB ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid promotion ID format'
            });
            return;
        }
        const promotion = await Promotion_1.Promotion.findById(id);
        if (!promotion) {
            res.status(404).json({
                status: 'error',
                message: 'Promotion not found'
            });
            return;
        }
        // Calculate statistics
        const stats = {
            totalCodes: promotion.totalCodes,
            usedCodes: promotion.usedCodes,
            remainingCodes: promotion.totalCodes - promotion.usedCodes,
            usagePercentage: ((promotion.usedCodes / promotion.totalCodes) * 100).toFixed(2) + '%',
            isActive: promotion.isActive,
            isExpired: new Date() > new Date(promotion.endDate),
            daysRemaining: Math.max(0, Math.ceil((new Date(promotion.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        };
        res.json({
            status: 'success',
            message: 'Promotion statistics retrieved successfully',
            data: {
                promotion,
                stats
            }
        });
    }
    catch (error) {
        console.error('Error getting promotion statistics:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error getting promotion statistics',
            error: error.message
        });
    }
}
