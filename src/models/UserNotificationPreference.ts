import mongoose from 'mongoose';
import { IUser } from './User';

export interface IUserNotificationPreference extends mongoose.Document {
  user: IUser['_id'];
  channels: {
    email: boolean;
    push: boolean;
    zalo: boolean;
    inApp: boolean;
  };
  types: {
    promotions: boolean;
    orders: boolean;
    system: boolean;
    newMenuItems: boolean;
    flashSales: boolean;
  };
  frequency: 'immediately' | 'daily' | 'weekly';
  emailAddress?: string;
  phoneNumber?: string;
  zaloId?: string;
  pushToken?: string;
  unsubscribeToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const userNotificationPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  channels: {
    email: {
      type: Boolean,
      default: true,
    },
    push: {
      type: Boolean,
      default: true,
    },
    zalo: {
      type: Boolean,
      default: true,
    },
    inApp: {
      type: Boolean,
      default: true,
    },
  },
  types: {
    promotions: {
      type: Boolean,
      default: true,
    },
    orders: {
      type: Boolean,
      default: true,
    },
    system: {
      type: Boolean,
      default: true,
    },
    newMenuItems: {
      type: Boolean,
      default: true,
    },
    flashSales: {
      type: Boolean,
      default: true,
    },
  },
  frequency: {
    type: String,
    enum: ['immediately', 'daily', 'weekly'],
    default: 'immediately',
  },
  emailAddress: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  zaloId: {
    type: String,
    trim: true,
  },
  pushToken: {
    type: String,
  },
  unsubscribeToken: {
    type: String,
    required: true,
    unique: true,
  },
}, {
  timestamps: true,
});

// Create index for efficient querying
userNotificationPreferenceSchema.index({ user: 1 });
userNotificationPreferenceSchema.index({ unsubscribeToken: 1 });

export const UserNotificationPreference = mongoose.model<IUserNotificationPreference>(
  'UserNotificationPreference',
  userNotificationPreferenceSchema
); 