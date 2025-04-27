"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserLoyaltyPoints = exports.usePointsForDiscount = exports.awardPointsForOrder = void 0;
const LoyaltyPoints_1 = require("../models/LoyaltyPoints");
/**
 * Calculate points based on order amount (10 points per $1)
 */
const calculatePointsForOrder = (order) => {
    // Basic rule: 10 points per $1 spent
    const pointsEarned = Math.floor(order.totalAmount * 10);
    return pointsEarned;
};
/**
 * Award points to a user for a new order
 */
const awardPointsForOrder = async (userId, order) => {
    try {
        const pointsEarned = calculatePointsForOrder(order);
        // Find or create user's loyalty record
        let loyaltyRecord = await LoyaltyPoints_1.LoyaltyPoints.findOne({ user: userId });
        if (!loyaltyRecord) {
            loyaltyRecord = new LoyaltyPoints_1.LoyaltyPoints({
                user: userId,
                totalPoints: 0,
                availablePoints: 0,
                pointsHistory: []
            });
        }
        // Update points
        loyaltyRecord.totalPoints += pointsEarned;
        loyaltyRecord.availablePoints += pointsEarned;
        // Add to history
        loyaltyRecord.pointsHistory.push({
            points: pointsEarned,
            type: 'earned',
            order: order._id,
            description: `Earned from order #${order._id}`,
            createdAt: new Date()
        });
        await loyaltyRecord.save();
    }
    catch (error) {
        console.error('Error awarding loyalty points:', error);
        throw error;
    }
};
exports.awardPointsForOrder = awardPointsForOrder;
/**
 * Use loyalty points for a discount
 */
const usePointsForDiscount = async (userId, pointsToUse, orderId) => {
    try {
        const loyaltyRecord = await LoyaltyPoints_1.LoyaltyPoints.findOne({ user: userId });
        if (!loyaltyRecord || loyaltyRecord.availablePoints < pointsToUse) {
            return false;
        }
        // Update points
        loyaltyRecord.availablePoints -= pointsToUse;
        // Add to history
        loyaltyRecord.pointsHistory.push({
            points: pointsToUse,
            type: 'spent',
            order: orderId,
            description: orderId
                ? `Redeemed for discount on order #${orderId}`
                : 'Redeemed for discount',
            createdAt: new Date()
        });
        await loyaltyRecord.save();
        return true;
    }
    catch (error) {
        console.error('Error using loyalty points:', error);
        throw error;
    }
};
exports.usePointsForDiscount = usePointsForDiscount;
/**
 * Get user's loyalty points
 */
const getUserLoyaltyPoints = async (userId) => {
    try {
        let loyaltyRecord = await LoyaltyPoints_1.LoyaltyPoints.findOne({ user: userId })
            .populate('pointsHistory.order', 'status createdAt');
        if (!loyaltyRecord) {
            // If no record exists, create one with zero points
            loyaltyRecord = new LoyaltyPoints_1.LoyaltyPoints({
                user: userId,
                totalPoints: 0,
                availablePoints: 0,
                pointsHistory: []
            });
            await loyaltyRecord.save();
        }
        return {
            totalPoints: loyaltyRecord.totalPoints,
            availablePoints: loyaltyRecord.availablePoints,
            history: loyaltyRecord.pointsHistory
        };
    }
    catch (error) {
        console.error('Error fetching loyalty points:', error);
        throw error;
    }
};
exports.getUserLoyaltyPoints = getUserLoyaltyPoints;
