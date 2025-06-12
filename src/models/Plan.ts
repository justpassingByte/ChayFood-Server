import mongoose from 'mongoose';

export interface IPlan extends mongoose.Document {
  name: {
    en: string;
    vi: string;
  };
  code: string;
  price: number;
  duration: number; // in days
  description: {
    en: string;
    vi: string;
  };
  mealsPerDay: number;
  snacksPerDay: number;
  features: {
    en: string;
    vi: string;
  }[];
  isRecommended: boolean;
  isPremiumMenu: boolean;
  hasDietitianSupport: boolean;
  hasCustomization: boolean;
  hasPriorityDelivery: boolean;
  has24HrSupport: boolean;
  isActive: boolean;
}

const planSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true, trim: true },
    vi: { type: String, required: true, trim: true },
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    default: 7,  // 7 days default
    min: 1
  },
  description: {
    en: { type: String, required: true },
    vi: { type: String, required: true },
  },
  mealsPerDay: {
    type: Number,
    required: true,
    min: 0
  },
  snacksPerDay: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  features: [{
    en: { type: String, required: true },
    vi: { type: String, required: true },
  }],
  isRecommended: {
    type: Boolean,
    default: false
  },
  isPremiumMenu: {
    type: Boolean,
    default: false
  },
  hasDietitianSupport: {
    type: Boolean,
    default: false
  },
  hasCustomization: {
    type: Boolean,
    default: false
  },
  hasPriorityDelivery: {
    type: Boolean,
    default: false
  },
  has24HrSupport: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Plan = mongoose.model<IPlan>('Plan', planSchema); 