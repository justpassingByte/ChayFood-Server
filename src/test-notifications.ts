/**
 * Test Notifications System
 * 
 * This script demonstrates how to test the various notification features
 * of the ChayFood backend.
 */

// Import required modules
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Import models
import { Notification } from './models/Notification';
import { UserNotificationPreference } from './models/UserNotificationPreference';
import { User } from './models/User';
import { Promotion } from './models/Promotion';

// Import services
import * as notificationService from './services/notification-service';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chayfood')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Helper function to pause execution
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Main test function
async function testNotificationSystem(): Promise<void> {
  try {
    console.log('Starting notification system tests...');
    
    // 1. Test user notification preferences
    console.log('\n---- Test 1: User Notification Preferences ----');
    const testUser = await User.findOne({ role: 'user' });
    
    if (!testUser) {
      console.log('No test user found. Create a user first.');
      return;
    }
    
    console.log(`Found test user: ${testUser.email}`);
    
    // Check if the user has notification preferences
    let userPrefs = await UserNotificationPreference.findOne({ user: testUser._id });
    
    if (!userPrefs) {
      console.log('Creating notification preferences for test user...');
      
      // Generate a random unsubscribe token
      const unsubscribeToken = Math.random().toString(36).substring(2, 15);
      
      // Create default preferences
      userPrefs = new UserNotificationPreference({
        user: testUser._id,
        channels: {
          email: true,
          push: true,
          zalo: true,
          inApp: true
        },
        types: {
          promotions: true,
          orders: true,
          system: true,
          newMenuItems: true,
          flashSales: true
        },
        frequency: 'immediately',
        unsubscribeToken
      });
      
      await userPrefs.save();
      console.log('Notification preferences created.');
    } else {
      console.log('User already has notification preferences');
    }
    
    // 2. Create a simple notification
    console.log('\n---- Test 2: Create Simple Notification ----');
    await notificationService.createNotification(
      testUser._id,
      'Test Notification',
      'This is a test notification message',
      'system',
      {
        channels: ['in_app', 'email']
      }
    );
    console.log('Test notification created successfully');
    
    // Wait a moment for the notification to be saved
    await sleep(1000);
    
    // 3. Get user's notifications
    console.log('\n---- Test 3: Retrieve User Notifications ----');
    const notifications = await notificationService.getUserNotifications(testUser._id);
    console.log(`Found ${notifications.totalCount} notifications for user`);
    
    if (notifications.notifications.length > 0) {
      const latestNotification = notifications.notifications[0];
      console.log('Latest notification:');
      console.log(JSON.stringify({
        title: latestNotification.title,
        message: latestNotification.message,
        type: latestNotification.type,
        isRead: latestNotification.isRead,
        channels: latestNotification.channels
      }, null, 2));
      
      // 4. Mark notification as read
      console.log('\n---- Test 4: Mark Notification as Read ----');
      await notificationService.markNotificationAsRead(latestNotification._id, testUser._id);
      console.log('Notification marked as read');
    }
    
    // 5. Test promotion notification
    console.log('\n---- Test 5: Test Promotion Notification ----');
    const promotion = new Promotion({
      name: 'Test Promotion',
      description: 'Test promotion for notification system',
      code: 'TEST' + Math.floor(Math.random() * 1000),
      type: 'percentage',
      value: 15,
      minOrderValue: 100000,
      maxDiscount: 50000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      totalCodes: 100,
      usedCodes: 0,
      isActive: true
    });
    
    await promotion.save();
    console.log(`Created test promotion: ${promotion.name} (${promotion.code})`);
    
    // Notify all users about the promotion
    await notificationService.notifyAllUsersAboutPromotion(
      `New Promotion: ${promotion.name}`,
      `Get ${promotion.value}% off your order with code ${promotion.code}`,
      {
        related: { type: 'promotion', id: promotion._id }
      }
    );
    console.log('Sent promotion notification to all users');
    
    // 6. Test flash sale notifications
    console.log('\n---- Test 6: Test Flash Sale Notifications ----');
    const flashSalePromotion = new Promotion({
      name: 'Flash Sale Test',
      description: 'Limited time flash sale for testing',
      code: 'FLASH' + Math.floor(Math.random() * 1000),
      type: 'fixed',
      value: 30000,
      minOrderValue: 150000,
      maxDiscount: 30000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
      totalCodes: 50,
      usedCodes: 0,
      isActive: true,
      promotionType: 'flash_sale'
    });
    
    await flashSalePromotion.save();
    console.log(`Created flash sale promotion: ${flashSalePromotion.name}`);
    
    // Notify about flash sale
    await notificationService.notifyAboutFlashSale(
      'Flash Sale Alert!',
      `${flashSalePromotion.name} - ${flashSalePromotion.description}. Use code ${flashSalePromotion.code}`,
      flashSalePromotion._id,
      flashSalePromotion.startDate,
      flashSalePromotion.endDate
    );
    console.log('Sent flash sale notifications');
    
    // 7. Get notifications again to see the new ones
    console.log('\n---- Test 7: Check Updated Notifications ----');
    const updatedNotifications = await notificationService.getUserNotifications(testUser._id);
    console.log(`Now found ${updatedNotifications.totalCount} notifications for user`);
    
    console.log('\nNotification system tests completed successfully!');
  } catch (error) {
    console.error('Error testing notification system:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testNotificationSystem(); 