import mongoose from 'mongoose';
import { ICategory } from './Category';

export interface IMenuItem extends mongoose.Document {
  name: {
    en: string;
    vi: string;
  };
  description: {
    en: string;
    vi: string;
  };
  price: number;
  category: string;
  image: string;
  nutritionInfo: {
    calories: number;  // Total calories per serving
    protein: number;   // Protein content in grams
    carbs: number;     // Carbohydrate content in grams
    fat: number;       // Fat content in grams
  };
  isAvailable: boolean;
  preparationTime: number; // in minutes
  ingredients: string[];
  allergens?: string[];
}

const menuItemSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true, trim: true },
    vi: { type: String, required: true, trim: true },
  },
  description: {
    en: { type: String, required: true },
    vi: { type: String, required: true },
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
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
menuItemSchema.methods.getCalories = function(): number {
  return this.nutritionInfo.calories;
};

menuItemSchema.methods.getProtein = function(): number {
  return this.nutritionInfo.protein;
};

// Add index for querying by nutrition values
menuItemSchema.index({ 'nutritionInfo.calories': 1 });
menuItemSchema.index({ 'nutritionInfo.protein': 1 });
menuItemSchema.index({ category: 1 });

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', menuItemSchema); 