"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const loyalty_service_1 = require("../services/loyalty-service");
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
/**
 * Get user's loyalty points
 */
router.get('/points', auth_1.authenticateToken, async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication required'
            });
        }
        const pointsData = await (0, loyalty_service_1.getUserLoyaltyPoints)(req.user._id);
        res.json({
            status: 'success',
            message: 'Loyalty points retrieved successfully',
            data: pointsData
        });
    }
    catch (error) {
        console.error('Error getting loyalty points:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error getting loyalty points',
            error: error.message
        });
    }
});
/**
 * Use points for a discount
 */
router.post('/redeem', auth_1.authenticateToken, async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication required'
            });
        }
        const { points, orderId } = req.body;
        if (!points || isNaN(points) || points <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Valid points amount required'
            });
        }
        // Convert string orderId to ObjectId if provided
        let orderObjectId;
        if (orderId) {
            orderObjectId = new mongoose_1.default.Types.ObjectId(orderId);
        }
        const success = await (0, loyalty_service_1.usePointsForDiscount)(req.user._id, points, orderObjectId);
        if (!success) {
            return res.status(400).json({
                status: 'error',
                message: 'Insufficient points or invalid redemption'
            });
        }
        res.json({
            status: 'success',
            message: `Successfully redeemed ${points} points`,
            data: { pointsRedeemed: points }
        });
    }
    catch (error) {
        console.error('Error redeeming points:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error redeeming points',
            error: error.message
        });
    }
});
exports.default = router;
