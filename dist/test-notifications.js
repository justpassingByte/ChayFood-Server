"use strict";
/**
 * Test Notifications System
 *
 * This script demonstrates how to test the various notification features
 * of the ChayFood backend.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import required modules
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const UserNotificationPreference_1 = require("./models/UserNotificationPreference");
const User_1 = require("./models/User");
const Promotion_1 = require("./models/Promotion");
// Import services
const notificationService = __importStar(require("./services/notification-service"));
// Connect to MongoDB
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chayfood')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
});
// Helper function to pause execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// Main test function
async function testNotificationSystem() {
    try {
        console.log('Starting notification system tests...');
        // 1. Test user notification preferences
        console.log('\n---- Test 1: User Notification Preferences ----');
        const testUser = await User_1.User.findOne({ role: 'user' });
        if (!testUser) {
            console.log('No test user found. Create a user first.');
            return;
        }
        console.log(`Found test user: ${testUser.email}`);
        // Check if the user has notification preferences
        let userPrefs = await UserNotificationPreference_1.UserNotificationPreference.findOne({ user: testUser._id });
        if (!userPrefs) {
            console.log('Creating notification preferences for test user...');
            // Generate a random unsubscribe token
            const unsubscribeToken = Math.random().toString(36).substring(2, 15);
            // Create default preferences
            userPrefs = new UserNotificationPreference_1.UserNotificationPreference({
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
        }
        else {
            console.log('User already has notification preferences');
        }
        // 2. Create a simple notification
        console.log('\n---- Test 2: Create Simple Notification ----');
        await notificationService.createNotification(testUser._id, 'Test Notification', 'This is a test notification message', 'system', {
            channels: ['in_app', 'email']
        });
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
        const promotion = new Promotion_1.Promotion({
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
        await notificationService.notifyAllUsersAboutPromotion(`New Promotion: ${promotion.name}`, `Get ${promotion.value}% off your order with code ${promotion.code}`, {
            related: { type: 'promotion', id: promotion._id }
        });
        console.log('Sent promotion notification to all users');
        // 6. Test flash sale notifications
        console.log('\n---- Test 6: Test Flash Sale Notifications ----');
        const flashSalePromotion = new Promotion_1.Promotion({
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
        await notificationService.notifyAboutFlashSale('Flash Sale Alert!', `${flashSalePromotion.name} - ${flashSalePromotion.description}. Use code ${flashSalePromotion.code}`, flashSalePromotion._id, flashSalePromotion.startDate, flashSalePromotion.endDate);
        console.log('Sent flash sale notifications');
        // 7. Get notifications again to see the new ones
        console.log('\n---- Test 7: Check Updated Notifications ----');
        const updatedNotifications = await notificationService.getUserNotifications(testUser._id);
        console.log(`Now found ${updatedNotifications.totalCount} notifications for user`);
        console.log('\nNotification system tests completed successfully!');
    }
    catch (error) {
        console.error('Error testing notification system:', error);
    }
    finally {
        // Disconnect from MongoDB
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
// Run the test
testNotificationSystem();
