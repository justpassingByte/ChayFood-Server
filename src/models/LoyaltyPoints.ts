import mongoose from 'mongoose';
import { IUser } from './User';

export interface ILoyaltyPoints extends mongoose.Document {
  user: IUser['_id'];
  totalPoints: number;
  availablePoints: number;
  pointsHistory: Array<{
    points: number;
    type: 'earned' | 'spent' | 'expired';
    order?: mongoose.Types.ObjectId;
    description: string;
    createdAt: Date;
  }>;
}

const loyaltyPointsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  availablePoints: {
    type: Number,
    default: 0,
    min: 0
  },
  pointsHistory: [{
    points: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['earned', 'spent', 'expired'],
      required: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    description: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Add index for querying by user
loyaltyPointsSchema.index({ user: 1 });

export const LoyaltyPoints = mongoose.model<ILoyaltyPoints>('LoyaltyPoints', loyaltyPointsSchema); 