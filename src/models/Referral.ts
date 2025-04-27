import mongoose, { Document, Schema, model } from 'mongoose';
import { IUser } from './User';

export interface IReferral extends Document {
  referrer: IUser['_id'];
  referredEmail: string;
  referredUser?: IUser['_id'];
  code: string;
  status: 'pending' | 'completed' | 'expired';
  bonusApplied: boolean;
  completedAt?: Date;
  bonusAppliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferral>({
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referredEmail: { type: String, required: true },
  referredUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  code: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'completed', 'expired'], default: 'pending' },
  bonusApplied: { type: Boolean, default: false },
  completedAt: Date,
  bonusAppliedAt: Date,
}, {
  timestamps: true
});

// Create compound index for referrer and referredEmail
referralSchema.index({ referrer: 1, referredEmail: 1 }, { unique: true });

// Index on code for quick lookups
referralSchema.index({ code: 1 }, { unique: true });

// Index on createdAt for sorting and filtering
referralSchema.index({ createdAt: -1 });

export const Referral = model<IReferral>('Referral', referralSchema); 