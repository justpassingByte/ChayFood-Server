import mongoose from 'mongoose';

export interface ICategory extends mongoose.Document {
  name: {
    en: string;
    vi: string;
  };
  description: {
    en: string;
    vi: string;
  };
  slug: string;
  image?: string;
  isActive: boolean;
  displayOrder: number;
}

const categorySchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true, trim: true, unique: true },
    vi: { type: String, required: true, trim: true, unique: true },
  },
  description: {
    en: { type: String, required: true },
    vi: { type: String, required: true },
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  image: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  displayOrder: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

// Add indexes for efficient querying
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ displayOrder: 1 });

export const Category = mongoose.model<ICategory>('Category', categorySchema); 