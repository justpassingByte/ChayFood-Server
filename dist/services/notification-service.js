"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserNotifications = exports.markNotificationAsRead = exports.notifyAboutFlashSale = exports.notifyAllUsersAboutPromotion = exports.createNotification = void 0;
const Notification_1 = require("../models/Notification");
const UserNotificationPreference_1 = require("../models/UserNotificationPreference");
const User_1 = require("../models/User");
/**
 * Create a new notification for a user
 */
const createNotification = async (userId, title, message, type, options = {}) => {
    try {
        // Get user's notification preferences
        const userPrefs = await UserNotificationPreference_1.UserNotificationPreference.findOne({ user: userId });
        // Default channels if not specified
        const channels = options.channels || ['in_app'];
        // Only send through channels the user has enabled
        const enabledChannels = channels.filter(channel => {
            if (!userPrefs)
                return channel === 'in_app'; // Default to in-app only if no preferences
            // Check if the user has this channel enabled
            if (channel === 'in_app')
                return userPrefs.channels.inApp;
            if (channel === 'email')
                return userPrefs.channels.email;
            if (channel === 'push')
                return userPrefs.channels.push;
            if (channel === 'zalo')
                return userPrefs.channels.zalo;
            return false;
        });
        // Check if user wants this type of notification
        if (userPrefs) {
            if (type === 'promotion' && !userPrefs.types.promotions)
                return;
            if (type === 'order_status' && !userPrefs.types.orders)
                return;
            if (type === 'system' && !userPrefs.types.system)
                return;
        }
        // Create notification in database
        const notification = new Notification_1.Notification({
            user: userId,
            title,
            message,
            type,
            related: options.related,
            channels: enabledChannels,
            scheduledFor: options.scheduledFor,
            expiresAt: options.expiresAt,
        });
        await notification.save();
        // Here you would implement the actual sending logic for each channel
        // This is a placeholder for actual implementation
        console.log(`Notification created for user ${userId} via channels: ${enabledChannels.join(', ')}`);
        // For real implementation, you'd call specific services for each channel:
        // if (enabledChannels.includes('email')) await sendEmailNotification(userId, title, message);
        // if (enabledChannels.includes('push')) await sendPushNotification(userId, title, message);
        // if (enabledChannels.includes('zalo')) await sendZaloNotification(userId, title, message);
    }
    catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};
exports.createNotification = createNotification;
/**
 * Create a promotion notification for all users
 */
const notifyAllUsersAboutPromotion = async (title, message, options = {}) => {
    try {
        // Get all users
        const users = await User_1.User.find({ role: 'user' }).select('_id');
        // Create notification for each user
        for (const user of users) {
            await (0, exports.createNotification)(user._id, title, message, 'promotion', options);
        }
        console.log(`Sent promotion notification to ${users.length} users`);
    }
    catch (error) {
        console.error('Error notifying users about promotion:', error);
        throw error;
    }
};
exports.notifyAllUsersAboutPromotion = notifyAllUsersAboutPromotion;
/**
 * Create a flash sale notification for all users
 */
const notifyAboutFlashSale = async (title, message, promotionId, startTime, endTime) => {
    try {
        // Find users who have flash sale notifications enabled
        const userPrefs = await UserNotificationPreference_1.UserNotificationPreference.find({
            'types.flashSales': true
        }).select('user');
        const userIds = userPrefs.map(pref => pref.user);
        // Create a notification for each user
        for (const userId of userIds) {
            await (0, exports.createNotification)(userId, title, message, 'promotion', {
                related: { type: 'promotion', id: promotionId },
                channels: ['push', 'email', 'zalo', 'in_app'], // Try all channels for flash sales
                scheduledFor: new Date(), // Send immediately
                expiresAt: endTime, // Expires when the flash sale ends
            });
        }
        console.log(`Sent flash sale notification to ${userIds.length} users`);
    }
    catch (error) {
        console.error('Error notifying about flash sale:', error);
        throw error;
    }
};
exports.notifyAboutFlashSale = notifyAboutFlashSale;
/**
 * Mark notification as read
 */
const markNotificationAsRead = async (notificationId, userId) => {
    try {
        const result = await Notification_1.Notification.updateOne({ _id: notificationId, user: userId }, { $set: { isRead: true } });
        return result.modifiedCount > 0;
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
/**
 * Get user's notifications with pagination
 */
const getUserNotifications = async (userId, page = 1, limit = 20, onlyUnread = false) => {
    try {
        const query = { user: userId };
        if (onlyUnread) {
            query.isRead = false;
        }
        const totalCount = await Notification_1.Notification.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);
        const notifications = await Notification_1.Notification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        return {
            notifications,
            totalCount,
            currentPage: page,
            totalPages,
        };
    }
    catch (error) {
        console.error('Error getting user notifications:', error);
        throw error;
    }
};
exports.getUserNotifications = getUserNotifications;
