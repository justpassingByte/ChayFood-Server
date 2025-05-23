import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Category } from './models/Category';

// This is a direct mongoose schema definition to match the old model structure
// for accessing existing menu items during migration
const OldMenuItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: {
    type: String,
    enum: ['main', 'side', 'dessert', 'beverage'],
  },
  image: String,
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
  },
  isAvailable: Boolean,
  preparationTime: Number,
  ingredients: [String],
  allergens: [String],
}, {
  timestamps: true,
  collection: 'menuitems' // Target the actual collection name
});

const OldMenuItem = mongoose.model('OldMenuItem', OldMenuItemSchema);

// Load environment variables
dotenv.config();

// Define our default categories with proper descriptions
const defaultCategories = [
  {
    name: 'Main Dishes',
    slug: 'main',
    description: 'Primary meal dishes that serve as the main course',
    displayOrder: 1,
    isActive: true
  },
  {
    name: 'Side Dishes',
    slug: 'side',
    description: 'Smaller dishes that complement the main course',
    displayOrder: 2,
    isActive: true
  },
  {
    name: 'Desserts',
    slug: 'dessert',
    description: 'Sweet treats to enjoy after your meal',
    displayOrder: 3,
    isActive: true
  },
  {
    name: 'Beverages',
    slug: 'beverage',
    description: 'Refreshing drinks to accompany your meal',
    displayOrder: 4,
    isActive: true
  }
];

async function migrateCategories() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chayfood';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create the categories
    console.log('Creating categories...');
    const categoryMap = new Map();
    
    for (const categoryData of defaultCategories) {
      // Check if this category already exists to prevent duplicates
      const existingCategory = await Category.findOne({ slug: categoryData.slug });
      
      if (existingCategory) {
        console.log(`Category ${categoryData.name} already exists, using existing one`);
        categoryMap.set(categoryData.slug, existingCategory._id);
      } else {
        const category = new Category(categoryData);
        await category.save();
        console.log(`Created category: ${category.name}`);
        categoryMap.set(categoryData.slug, category._id);
      }
    }

    // Update menu items to use the new category IDs
    console.log('Updating menu items...');
    const menuItems = await OldMenuItem.find({});
    console.log(`Found ${menuItems.length} menu items to update`);

    let updatedCount = 0;

    for (const menuItem of menuItems) {
      // Get the category string from the menu item
      const categoryString = menuItem.category;
      
      // Look up the corresponding category ObjectId
      const categoryId = categoryMap.get(categoryString);
      
      if (!categoryId) {
        console.log(`Warning: No matching category found for '${categoryString}' in menu item '${menuItem.name}'`);
        continue;
      }

      // Update the menu item directly in the database
      await mongoose.connection.collection('menuitems').updateOne(
        { _id: menuItem._id },
        { $set: { category: categoryId } }
      );

      updatedCount++;
      
      // Log progress for every 10 items
      if (updatedCount % 10 === 0) {
        console.log(`Updated ${updatedCount} menu items so far`);
      }
    }

    console.log(`Migration complete! Updated ${updatedCount} menu items.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateCategories(); 