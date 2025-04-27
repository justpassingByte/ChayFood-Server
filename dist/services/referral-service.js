"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserReferrals = exports.applyReferralBonus = exports.completeReferral = exports.createReferral = void 0;
const Referral_1 = require("../models/Referral");
const User_1 = require("../models/User");
const notification_service_1 = require("./notification-service");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a unique referral code for a user
 */
const generateReferralCode = async (userId) => {
    const user = await User_1.User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    // Generate a code based on username and random string
    const username = user.name || user.email.split('@')[0];
    const randomString = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
    const code = `${username.substring(0, 5).toUpperCase()}-${randomString}`;
    // Ensure code is unique
    const existingCode = await Referral_1.Referral.findOne({ code });
    if (existingCode) {
        return generateReferralCode(userId); // Try again with a new code
    }
    return code;
};
/**
 * Create a new referral
 */
const createReferral = async (referrerId, referredEmail) => {
    try {
        // Check if referred email already exists
        const existingUser = await User_1.User.findOne({ email: referredEmail });
        if (existingUser) {
            throw new Error('User is already registered');
        }
        // Check if referral already exists
        const existingReferral = await Referral_1.Referral.findOne({
            referrer: referrerId,
            referredEmail: referredEmail,
        });
        if (existingReferral) {
            throw new Error('Referral already exists for this email');
        }
        // Generate referral code
        const code = await generateReferralCode(referrerId.toString());
        // Create referral
        const referral = new Referral_1.Referral({
            referrer: referrerId,
            referredEmail,
            code,
            status: 'pending',
        });
        await referral.save();
        // Send notification to referrer
        await (0, notification_service_1.createNotification)(referrerId, 'Referral Created', `Your referral code for ${referredEmail} is ${code}`, 'referral', {
            channels: ['email', 'in_app'],
            related: { type: 'referral', id: referral._id },
        });
        return referral;
    }
    catch (error) {
        console.error('Error creating referral:', error);
        throw error;
    }
};
exports.createReferral = createReferral;
/**
 * Complete a referral when referred user signs up
 */
const completeReferral = async (code, referredUserId) => {
    try {
        const referral = await Referral_1.Referral.findOne({ code });
        if (!referral) {
            throw new Error('Invalid referral code');
        }
        if (referral.status !== 'pending') {
            throw new Error('Referral is not pending');
        }
        // Update referral status
        referral.status = 'completed';
        referral.referredUser = referredUserId;
        referral.completedAt = new Date();
        await referral.save();
        // Send notification to referrer
        await (0, notification_service_1.createNotification)(referral.referrer, 'Referral Completed', 'Your referral was successful! The bonus will be applied soon.', 'referral', {
            channels: ['email', 'in_app'],
            related: { type: 'referral', id: referral._id },
        });
        return referral;
    }
    catch (error) {
        console.error('Error completing referral:', error);
        throw error;
    }
};
exports.completeReferral = completeReferral;
/**
 * Apply bonus for completed referral
 */
const applyReferralBonus = async (referralId) => {
    try {
        const referral = await Referral_1.Referral.findById(referralId);
        if (!referral) {
            throw new Error('Referral not found');
        }
        if (referral.status !== 'completed') {
            throw new Error('Referral is not completed');
        }
        if (referral.bonusApplied) {
            throw new Error('Bonus already applied');
        }
        // Apply bonus logic here (e.g., add points, credits, etc.)
        // This will depend on your specific bonus system
        // For example:
        // await User.findByIdAndUpdate(referral.referrer, { $inc: { points: 1000 } });
        // await User.findByIdAndUpdate(referral.referredUser, { $inc: { points: 500 } });
        // Update referral
        referral.bonusApplied = true;
        referral.bonusAppliedAt = new Date();
        await referral.save();
        // Notify both users
        await (0, notification_service_1.createNotification)(referral.referrer, 'Referral Bonus Applied', 'Your referral bonus has been credited to your account!', 'referral', {
            channels: ['email', 'in_app'],
            related: { type: 'referral', id: referral._id },
        });
        await (0, notification_service_1.createNotification)(referral.referredUser, 'Welcome Bonus Applied', 'Your signup bonus has been credited to your account!', 'referral', {
            channels: ['email', 'in_app'],
            related: { type: 'referral', id: referral._id },
        });
        return referral;
    }
    catch (error) {
        console.error('Error applying referral bonus:', error);
        throw error;
    }
};
exports.applyReferralBonus = applyReferralBonus;
/**
 * Get user's referrals
 */
const getUserReferrals = async (userId, status, page = 1, limit = 20) => {
    try {
        const query = { referrer: userId };
        if (status) {
            query.status = status;
        }
        const totalCount = await Referral_1.Referral.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);
        const referrals = await Referral_1.Referral.find(query)
            .populate('referredUser', 'username email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        return {
            referrals,
            totalCount,
            currentPage: page,
            totalPages,
        };
    }
    catch (error) {
        console.error('Error getting user referrals:', error);
        throw error;
    }
};
exports.getUserReferrals = getUserReferrals;
