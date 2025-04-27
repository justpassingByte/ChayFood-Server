import mongoose from 'mongoose';
import { IUser } from './User';
import { IMiniGame } from './MiniGame';

export interface IUserGamePlay extends mongoose.Document {
  user: IUser['_id'];
  game: IMiniGame['_id'];
  playDate: Date;
  reward?: {
    type: 'discount' | 'points' | 'free_item' | 'free_delivery';
    value: number;
    code?: string;
    used: boolean;
    usedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userGamePlaySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MiniGame',
    required: true,
  },
  playDate: {
    type: Date,
    default: Date.now,
  },
  reward: {
    type: {
      type: String,
      enum: ['discount', 'points', 'free_item', 'free_delivery'],
    },
    value: {
      type: Number,
      min: 0,
    },
    code: {
      type: String,
      trim: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
userGamePlaySchema.index({ user: 1, game: 1, playDate: 1 });
userGamePlaySchema.index({ 'reward.code': 1 });
userGamePlaySchema.index({ 'reward.used': 1 });

// Add a compound index to efficiently find plays for a specific day
userGamePlaySchema.index({ 
  user: 1,
  game: 1,
  playDate: 1
});

export const UserGamePlay = mongoose.model<IUserGamePlay>('UserGamePlay', userGamePlaySchema); 