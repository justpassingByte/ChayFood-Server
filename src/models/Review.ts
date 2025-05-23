import mongoose from 'mongoose';
import { IMenuItem } from './MenuItem';
import { IUser } from './User';

export interface IReview extends mongoose.Document {
  user: IUser['_id'];
  menuItem: IMenuItem['_id'];
  rating: number;
  comment: string;
  date: Date;
}

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Composite index for efficient queries by user and menu item
reviewSchema.index({ user: 1, menuItem: 1 }, { unique: true });
// Index for queries by menu item to get all reviews
reviewSchema.index({ menuItem: 1 });
// Index for queries by rating (for sorting)
reviewSchema.index({ rating: -1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema); 