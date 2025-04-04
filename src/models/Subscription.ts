import mongoose from 'mongoose';
import { IUser } from './User';
import { IPlan } from './Plan';

export interface ISubscription extends mongoose.Document {
  user: IUser['_id'];
  plan: IPlan['_id'];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    additionalInfo?: string;
  };
  selectedMenuItems?: Array<{
    menuItemId: mongoose.Types.ObjectId;
    quantity: number;
    dayOfWeek: number; // 0-6 for Sunday-Saturday
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  }>;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: 'card' | 'banking';
  totalAmount: number;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  deliveryAddress: {
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    additionalInfo: String,
  },
  selectedMenuItems: [{
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
    },
    quantity: {
      type: Number,
      min: 1,
      default: 1,
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      required: true,
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true,
    },
  }],
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['card', 'banking'],
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  specialInstructions: String,
}, {
  timestamps: true,
});

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);