import mongoose from 'mongoose';

export interface IPromotion extends mongoose.Document {
  name: string;
  description: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_item' | 'free_delivery';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  isFlashSale: boolean;
  flashSaleHours?: Array<{
    dayOfWeek: number; // 0-6 for Sunday-Saturday
    startHour: number; // 0-23
    endHour: number; // 0-23
  }>;
  usageLimit: number;
  usageCount: number;
  isReferral: boolean;
  referralBonusPoints?: number;
  createdAt: Date;
  updatedAt: Date;
  notificationSent?: boolean;
  totalCodes: number;
  usedCodes: number;
  promotionType: string;
}

const promotionSchema = new mongoose.Schema({
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
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed', 'free_item', 'free_delivery'],
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  minOrderValue: {
    type: Number,
    min: 0,
  },
  maxDiscount: {
    type: Number,
    min: 0,
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
  isFlashSale: {
    type: Boolean,
    default: false,
  },
  flashSaleHours: [{
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
    },
    startHour: {
      type: Number,
      min: 0,
      max: 23,
    },
    endHour: {
      type: Number,
      min: 0,
      max: 23,
    },
  }],
  usageLimit: {
    type: Number,
    default: 0, // 0 means unlimited
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  isReferral: {
    type: Boolean,
    default: false,
  },
  referralBonusPoints: {
    type: Number,
    min: 0,
  },
  notificationSent: {
    type: Boolean,
    default: false,
  },
  totalCodes: {
    type: Number,
    default: 0,
  },
  usedCodes: {
    type: Number,
    default: 0,
  },
  promotionType: {
    type: String,
    enum: ['regular', 'flash_sale'],
    default: 'regular',
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
promotionSchema.index({ code: 1 });
promotionSchema.index({ isActive: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });
promotionSchema.index({ isFlashSale: 1 });
promotionSchema.index({ promotionType: 1 });

export const Promotion = mongoose.model<IPromotion>('Promotion', promotionSchema); 