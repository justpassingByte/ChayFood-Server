import mongoose from 'mongoose';

export interface IMiniGame extends mongoose.Document {
  name: string;
  description: string;
  type: 'spin_wheel' | 'scratch_card' | 'memory_match' | 'quiz';
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  rewards: Array<{
    _id: mongoose.Types.ObjectId;
    type: 'discount' | 'points' | 'free_item' | 'free_delivery';
    value: number;
    code?: string;
    probability: number; // Percentage chance (0-100)
    limit: number; // Maximum number of times this reward can be won (0 = unlimited)
    awarded: number; // Number of times this reward has been awarded
  }>;
  dailyPlayLimit: number; // How many times a user can play per day
  totalPlayLimit: number; // How many times a user can play in total (0 = unlimited)
  createdAt: Date;
  updatedAt: Date;
}

const miniGameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['spin_wheel', 'scratch_card', 'memory_match', 'quiz'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  rewards: [{
    _id: mongoose.Types.ObjectId,
    type: {
      type: String,
      required: true,
      enum: ['discount', 'points', 'free_item', 'free_delivery'],
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    code: {
      type: String,
      trim: true,
    },
    probability: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    limit: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    awarded: {
      type: Number,
      default: 0,
    },
  }],
  dailyPlayLimit: {
    type: Number,
    default: 1,
  },
  totalPlayLimit: {
    type: Number,
    default: 0, // 0 means unlimited
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
miniGameSchema.index({ isActive: 1 });
miniGameSchema.index({ startDate: 1, endDate: 1 });

export const MiniGame = mongoose.model<IMiniGame>('MiniGame', miniGameSchema); 