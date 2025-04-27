"use strict";
/**
 * Utility to create a sample menu item directly in the database
 *
 * Run this script with:
 * npx ts-node src/utils/create-sample-menu-item.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const MenuItem_1 = require("../models/MenuItem");
dotenv_1.default.config();
const createSampleMenuItem = async () => {
    try {
        // Connect to MongoDB
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chayfood';
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
        // Sample menu item data
        const sampleMenuItem = {
            name: "Vegan Pad Thai",
            description: "Classic Thai noodles with tofu and vegetables",
            price: 12.99,
            category: "main",
            image: "https://placekitten.com/500/300",
            nutritionInfo: {
                calories: 450,
                protein: 15,
                carbs: 65,
                fat: 12
            },
            preparationTime: 15,
            ingredients: ["rice noodles", "tofu", "bean sprouts", "peanuts", "lime"]
        };
        // Create and save the menu item
        const menuItem = new MenuItem_1.MenuItem(sampleMenuItem);
        const savedItem = await menuItem.save();
        console.log('Menu item created successfully:');
        console.log(JSON.stringify(savedItem, null, 2));
        // Disconnect from MongoDB
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
    catch (error) {
        console.error('Error creating sample menu item:', error);
    }
};
// Execute the function when the script is run directly
if (require.main === module) {
    createSampleMenuItem();
}
exports.default = createSampleMenuItem;
