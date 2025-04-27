/**
 * Notification Scheduler
 * 
 * This script demonstrates how the automated notification system works,
 * particularly for scheduled notifications like flash sales.
 */

// Import required modules
const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config();

// Import models
const { Promotion } = require('./models/Promotion');
const { Notification } = require('./models/Notification');
const { UserNotificationPreference } = require('./models/UserNotificationPreference');
const { User } = require('./models/User');

// Import notification service
const { notifyAboutFlashSale } = require('./services/notification-service');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

/**
 * Schedule flash sale notifications
 * This function checks for upcoming flash sales and schedules notifications
 */
async function scheduleFlashSaleNotifications() {
  try {
    console.log('Checking for upcoming flash sales...');
    
    const currentTime = new Date();
    // Find flash sales that:
    // 1. Are active
    // 2. Start in the future (within the next 24 hours)
    // 3. Haven't had notifications sent yet
    const upcomingFlashSales = await Promotion.find({
      promotionType: 'flash_sale',
      isActive: true,
      startDate: { 
        $gt: currentTime, 
        $lt: new Date(currentTime.getTime() + 24 * 60 * 60 * 1000) // next 24 hours
      },
      notificationSent: { $ne: true }
    });
    
    console.log(`Found ${upcomingFlashSales.length} upcoming flash sales`);
    
    for (const flashSale of upcomingFlashSales) {
      console.log(`Scheduling notification for flash sale: ${flashSale.name}`);
      
      // Calculate when to send the notification (e.g., 1 hour before the flash sale starts)
      const notificationTime = new Date(flashSale.startDate.getTime() - 60 * 60 * 1000);
      const currentTime = new Date();
      
      // If notification time is in the past, send immediately
      if (notificationTime < currentTime) {
        console.log(`Flash sale ${flashSale.name} notification time is in the past, sending now`);
        await sendFlashSaleNotification(flashSale);
      } else {
        // Convert to cron schedule format
        const cronSchedule = `${notificationTime.getMinutes()} ${notificationTime.getHours()} ${notificationTime.getDate()} ${notificationTime.getMonth() + 1} *`;
        console.log(`Scheduling notification for ${flashSale.name} at ${notificationTime.toISOString()} (${cronSchedule})`);
        
        // Schedule the notification
        cron.schedule(cronSchedule, async () => {
          await sendFlashSaleNotification(flashSale);
        });
      }
      
      // Mark as scheduled
      flashSale.notificationSent = true;
      await flashSale.save();
    }
  } catch (error) {
    console.error('Error scheduling flash sale notifications:', error);
  }
}

/**
 * Send flash sale notification to eligible users
 */
async function sendFlashSaleNotification(flashSale) {
  try {
    console.log(`Sending notification for flash sale: ${flashSale.name}`);
    
    // Send the notification using the service
    await notifyAboutFlashSale(
      `Flash Sale: ${flashSale.name}`,
      `${flashSale.description}. Use code ${flashSale.code} for ${flashSale.type === 'percentage' ? flashSale.value + '%' : flashSale.value + ' VND'} off.`,
      flashSale._id,
      flashSale.startDate,
      flashSale.endDate
    );
    
    console.log(`Flash sale notification sent for ${flashSale.name}`);
  } catch (error) {
    console.error(`Error sending flash sale notification for ${flashSale.name}:`, error);
  }
}

/**
 * Automatic system to check for pending notifications
 */
async function processScheduledNotifications() {
  try {
    console.log('Processing scheduled notifications...');
    
    const currentTime = new Date();
    
    // Find notifications that:
    // 1. Are scheduled for a time that has passed
    // 2. Haven't been sent yet
    const pendingNotifications = await Notification.find({
      scheduledFor: { $lte: currentTime },
      'sentStatus.processed': { $ne: true }
    });
    
    console.log(`Found ${pendingNotifications.length} pending notifications`);
    
    for (const notification of pendingNotifications) {
      console.log(`Processing notification: ${notification.title} for user ${notification.user}`);
      
      // In a real system, you would:
      // 1. Send notifications through configured channels
      // 2. Update sentStatus for each channel
      
      // For this example, we'll just mark it as processed
      notification.sentStatus = notification.sentStatus || {};
      notification.sentStatus.processed = true;
      
      // For each channel, mark as sent
      notification.channels.forEach(channel => {
        notification.sentStatus[channel] = true;
      });
      
      await notification.save();
      console.log(`Notification ${notification._id} processed`);
    }
  } catch (error) {
    console.error('Error processing scheduled notifications:', error);
  }
}

/**
 * Init function to start the scheduler
 */
async function initNotificationScheduler() {
  console.log('Starting notification scheduler...');
  
  // Schedule flash sale notification check to run every hour
  cron.schedule('0 * * * *', scheduleFlashSaleNotifications);
  
  // Schedule processing of pending notifications to run every 5 minutes
  cron.schedule('*/5 * * * *', processScheduledNotifications);
  
  // Run immediately on startup
  await scheduleFlashSaleNotifications();
  await processScheduledNotifications();
  
  console.log('Notification scheduler started');
}

// Run the scheduler in production
// For testing, just run the main functions
if (process.env.NODE_ENV === 'production') {
  initNotificationScheduler();
} else {
  // Run once for testing
  (async () => {
    try {
      await scheduleFlashSaleNotifications();
      await processScheduledNotifications();
      console.log('Test scheduling completed');
      
      // Simulate a flash sale right now
      console.log('\nSimulating a flash sale starting now...');
      const testFlashSale = new Promotion({
        name: 'Instant Flash Sale Test',
        description: 'Flash sale starting right now for testing',
        code: 'FLASH' + Math.floor(Math.random() * 1000),
        type: 'percentage',
        value: 25,
        minOrderValue: 100000,
        maxDiscount: 50000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        totalCodes: 30,
        usedCodes: 0,
        isActive: true,
        promotionType: 'flash_sale'
      });
      
      await testFlashSale.save();
      console.log(`Created instant flash sale: ${testFlashSale.name}`);
      
      await sendFlashSaleNotification(testFlashSale);
      
      // Wait a moment for processing to complete
      setTimeout(async () => {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
      }, 5000);
    } catch (error) {
      console.error('Error in test run:', error);
      await mongoose.disconnect();
    }
  })();
} 