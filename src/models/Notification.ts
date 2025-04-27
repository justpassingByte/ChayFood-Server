import mongoose from 'mongoose';
import { IUser } from './User';

export interface INotification extends mongoose.Document {
  user: IUser['_id'];
  title: string;
  message: string;
  type: 'promotion' | 'order_status' | 'system' | 'referral';
  related?: {
    type: string;
    id: mongoose.Types.ObjectId;
  };
  isRead: boolean;
  channels: Array<'email' | 'push' | 'zalo' | 'in_app'>;
  sentStatus: Record<string, boolean>; // Track whether notification was sent on each channel
  scheduledFor?: Date; // For scheduled notifications
  expiresAt?: Date; // For time-sensitive notifications
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['promotion', 'order_status', 'system', 'referral'],
  },
  related: {
    type: {
      type: String,
      trim: true,
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  channels: [{
    type: String,
    enum: ['email', 'push', 'zalo', 'in_app'],
  }],
  sentStatus: {
    type: Map,
    of: Boolean,
    default: {},
  },
  scheduledFor: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 }, { expireAfterSeconds: 0 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema); 