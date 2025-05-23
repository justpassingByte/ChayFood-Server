"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItem = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const menuItemSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    category: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    // Nutrition information with detailed calorie and protein content
    nutritionInfo: {
        // Total calories per serving - important for dietary tracking
        calories: {
            type: Number,
            required: true,
            min: 0,
            index: true, // Allow efficient queries by calorie content
        },
        // Protein amount in grams - crucial for customers tracking protein intake
        protein: {
            type: Number,
            required: true,
            min: 0,
            index: true, // Allow efficient queries by protein content
        },
        carbs: { type: Number, required: true, min: 0 },
        fat: { type: Number, required: true, min: 0 },
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
    preparationTime: {
        type: Number,
        required: true,
    },
    ingredients: [{
            type: String,
            required: true,
        }],
    allergens: [{
            type: String,
        }],
}, {
    timestamps: true,
});
// Add methods to easily access nutrition information
menuItemSchema.methods.getCalories = function () {
    return this.nutritionInfo.calories;
};
menuItemSchema.methods.getProtein = function () {
    return this.nutritionInfo.protein;
};
// Add index for querying by nutrition values
menuItemSchema.index({ 'nutritionInfo.calories': 1 });
menuItemSchema.index({ 'nutritionInfo.protein': 1 });
menuItemSchema.index({ category: 1 });
exports.MenuItem = mongoose_1.default.model('MenuItem', menuItemSchema);
