import mongoose from 'mongoose';
import { IUser } from './User';
import { IMenuItem } from './MenuItem';

export interface IUserPreference extends mongoose.Document {
  user: IUser['_id'];
  favoriteCategories: string[];
  dislikedIngredients: string[];
  preferredNutrition: {
    minProtein?: number;
    maxCalories?: number;
  };
  dietaryRestrictions: string[];
  favoriteItems: IMenuItem['_id'][];
  lastViewedItems: IMenuItem['_id'][];
}

const userPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  favoriteCategories: [{
    type: String,
    enum: ['main', 'side', 'dessert', 'beverage']
  }],
  dislikedIngredients: [{
    type: String
  }],
  preferredNutrition: {
    minProtein: {
      type: Number,
      min: 0
    },
    maxCalories: {
      type: Number,
      min: 0
    }
  },
  dietaryRestrictions: [{
    type: String
  }],
  favoriteItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  lastViewedItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }]
}, {
  timestamps: true
});

// Add index for querying by user
userPreferenceSchema.index({ user: 1 });

export const UserPreference = mongoose.model<IUserPreference>('UserPreference', userPreferenceSchema); 