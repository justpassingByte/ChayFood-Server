import { Notification } from '../models/Notification';
import { UserNotificationPreference } from '../models/UserNotificationPreference';
import { User } from '../models/User';
import mongoose from 'mongoose';

/**
 * Create a new notification for a user
 */
export const createNotification = async (
  userId: mongoose.Types.ObjectId | string,
  title: string,
  message: string,
  type: 'promotion' | 'order_status' | 'system' | 'referral',
  options: {
    related?: { type: string; id: mongoose.Types.ObjectId };
    channels?: Array<'email' | 'push' | 'zalo' | 'in_app'>;
    scheduledFor?: Date;
    expiresAt?: Date;
  } = {}
): Promise<void> => {
  try {
    // Get user's notification preferences
    const userPrefs = await UserNotificationPreference.findOne({ user: userId });
    
    // Default channels if not specified
    const channels = options.channels || ['in_app'];
    
    // Only send through channels the user has enabled
    const enabledChannels = channels.filter(channel => {
      if (!userPrefs) return channel === 'in_app'; // Default to in-app only if no preferences
      
      // Check if the user has this channel enabled
      if (channel === 'in_app') return userPrefs.channels.inApp;
      if (channel === 'email') return userPrefs.channels.email;
      if (channel === 'push') return userPrefs.channels.push;
      if (channel === 'zalo') return userPrefs.channels.zalo;
      
      return false;
    });
    
    // Check if user wants this type of notification
    if (userPrefs) {
      if (type === 'promotion' && !userPrefs.types.promotions) return;
      if (type === 'order_status' && !userPrefs.types.orders) return;
      if (type === 'system' && !userPrefs.types.system) return;
    }
    
    // Create notification in database
    const notification = new Notification({
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
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create a promotion notification for all users
 */
export const notifyAllUsersAboutPromotion = async (
  title: string,
  message: string,
  options: {
    related?: { type: string; id: mongoose.Types.ObjectId };
    channels?: Array<'email' | 'push' | 'zalo' | 'in_app'>;
    scheduledFor?: Date;
    expiresAt?: Date;
  } = {}
): Promise<void> => {
  try {
    // Get all users
    const users = await User.find({ role: 'user' }).select('_id');
    
    // Create notification for each user
    for (const user of users) {
      await createNotification(
        user._id,
        title,
        message,
        'promotion',
        options
      );
    }
    
    console.log(`Sent promotion notification to ${users.length} users`);
  } catch (error) {
    console.error('Error notifying users about promotion:', error);
    throw error;
  }
};

/**
 * Create a flash sale notification for all users
 */
export const notifyAboutFlashSale = async (
  title: string,
  message: string,
  promotionId: mongoose.Types.ObjectId,
  startTime: Date,
  endTime: Date
): Promise<void> => {
  try {
    // Find users who have flash sale notifications enabled
    const userPrefs = await UserNotificationPreference.find({
      'types.flashSales': true
    }).select('user');
    
    const userIds = userPrefs.map(pref => pref.user);
    
    // Create a notification for each user
    for (const userId of userIds) {
      await createNotification(
        userId,
        title,
        message,
        'promotion',
        {
          related: { type: 'promotion', id: promotionId },
          channels: ['push', 'email', 'zalo', 'in_app'], // Try all channels for flash sales
          scheduledFor: new Date(), // Send immediately
          expiresAt: endTime, // Expires when the flash sale ends
        }
      );
    }
    
    console.log(`Sent flash sale notification to ${userIds.length} users`);
  } catch (error) {
    console.error('Error notifying about flash sale:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  notificationId: mongoose.Types.ObjectId | string,
  userId: mongoose.Types.ObjectId | string
): Promise<boolean> => {
  try {
    const result = await Notification.updateOne(
      { _id: notificationId, user: userId },
      { $set: { isRead: true } }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Get user's notifications with pagination
 */
export const getUserNotifications = async (
  userId: mongoose.Types.ObjectId | string,
  page = 1,
  limit = 20,
  onlyUnread = false
): Promise<{
  notifications: any[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}> => {
  try {
    const query: any = { user: userId };
    if (onlyUnread) {
      query.isRead = false;
    }
    
    const totalCount = await Notification.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    return {
      notifications,
      totalCount,
      currentPage: page,
      totalPages,
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
}; 