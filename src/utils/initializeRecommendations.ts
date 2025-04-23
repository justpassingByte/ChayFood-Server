import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Order } from '../models/Order';
import { UserPreference } from '../models/UserPreference';
import { MenuItemTag } from '../models/MenuItemTag';
import { MenuItem } from '../models/MenuItem';

// Load environment variables
dotenv.config();

/**
 * Initialize recommendation data based on existing orders
 */
async function initializeRecommendations() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chayfood';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Step 1: Process user preferences based on order history
    console.log('Processing user preferences...');
    const users = await mongoose.model('User').find({}).select('_id');
    let processedUsers = 0;

    for (const user of users) {
      // Get user's orders
      const userOrders = await Order.find({ user: user._id })
        .sort({ createdAt: -1 })
        .populate('items.menuItem');

      // Only process users with at least one order
      if (userOrders.length > 0) {
        // Extract menu items and their quantities from orders
        const menuItemCounts: { [key: string]: number } = {};
        const menuItems: { [key: string]: any } = {};

        userOrders.forEach(order => {
          order.items.forEach(item => {
            const menuItemId = item.menuItem._id.toString();
            menuItemCounts[menuItemId] = (menuItemCounts[menuItemId] || 0) + item.quantity;
            menuItems[menuItemId] = item.menuItem;
          });
        });

        // Get favorite items based on order frequency
        const favoriteItems = Object.entries(menuItemCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([id]) => id);

        // Get favorite categories
        const categories = favoriteItems
          .map(id => menuItems[id].category)
          .filter((value, index, self) => self.indexOf(value) === index)
          .slice(0, 3);

        // Create or update user preference
        await UserPreference.findOneAndUpdate(
          { user: user._id },
          {
            user: user._id,
            favoriteItems,
            favoriteCategories: categories,
            lastViewedItems: favoriteItems.slice(0, 3),
            dislikedIngredients: [],
            preferredNutrition: {},
            dietaryRestrictions: []
          },
          { upsert: true, new: true }
        );

        processedUsers++;
        if (processedUsers % 10 === 0) {
          console.log(`Processed ${processedUsers} users...`);
        }
      }
    }
    console.log(`Completed processing ${processedUsers} users with order history`);

    // Step 2: Generate menu item tags and co-occurrence data
    console.log('Generating menu item tags and co-occurrence data...');
    const menuItems = await MenuItem.find({});
    
    // Initialize occasion tags based on item categories and properties
    for (const menuItem of menuItems) {
      const occasionTags = [];
      
      // Tag items as appropriate for specific occasions based on properties
      if (menuItem.category === 'dessert') {
        occasionTags.push('birthday', 'celebration');
      }
      
      if (menuItem.category === 'main' || menuItem.category === 'side') {
        occasionTags.push('party');
      }
      
      if (menuItem.nutritionInfo.calories < 400) {
        occasionTags.push('diet');
      }
      
      if (menuItem.nutritionInfo.protein > 15 && menuItem.nutritionInfo.fat < 10) {
        occasionTags.push('healthy');
      }
      
      // Create menu item tag
      await MenuItemTag.findOneAndUpdate(
        { menuItem: menuItem._id },
        {
          menuItem: menuItem._id,
          tags: [],
          recommendedWith: [],
          occasionTags
        },
        { upsert: true, new: true }
      );
    }
    console.log(`Tagged ${menuItems.length} menu items with occasion tags`);

    // Step 3: Find co-occurrence patterns in orders
    console.log('Finding co-occurrence patterns in orders...');
    const allOrders = await Order.find({})
      .select('items.menuItem')
      .populate('items.menuItem');

    // Track which items are frequently ordered together
    const coOccurrences: { [key: string]: { [key: string]: number } } = {};
    
    // Initialize co-occurrence tracking for all menu items
    menuItems.forEach(item => {
      coOccurrences[item._id.toString()] = {};
    });
    
    // Count co-occurrences in orders
    allOrders.forEach(order => {
      const menuItemIds = order.items.map(item => item.menuItem._id.toString());
      
      // For each pair of items in the order, increment their co-occurrence count
      for (let i = 0; i < menuItemIds.length; i++) {
        for (let j = 0; j < menuItemIds.length; j++) {
          if (i !== j) {
            const itemId1 = menuItemIds[i];
            const itemId2 = menuItemIds[j];
            
            if (!coOccurrences[itemId1][itemId2]) {
              coOccurrences[itemId1][itemId2] = 0;
            }
            
            coOccurrences[itemId1][itemId2]++;
          }
        }
      }
    });
    
    // Update recommended items for each menu item
    for (const [itemId, occurrences] of Object.entries(coOccurrences)) {
      const sortedItems = Object.entries(occurrences)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)  // Take top 5 co-occurring items
        .map(([id]) => id);
      
      if (sortedItems.length > 0) {
        await MenuItemTag.findOneAndUpdate(
          { menuItem: itemId },
          { recommendedWith: sortedItems },
          { new: true }
        );
      }
    }
    
    console.log(`Updated co-occurrence data for ${menuItems.length} menu items`);
    console.log('Recommendation system data initialization complete!');
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error initializing recommendation data:', error);
    process.exit(1);
  }
}

// Execute the initialization
initializeRecommendations(); 