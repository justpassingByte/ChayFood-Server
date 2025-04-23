import mongoose from 'mongoose';
import { IMenuItem } from './MenuItem';

export interface IMenuItemTag extends mongoose.Document {
  menuItem: IMenuItem['_id'];
  tags: string[];
  recommendedWith: IMenuItem['_id'][];
  occasionTags: string[];
}

const menuItemTagSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
    unique: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  recommendedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  occasionTags: [{
    type: String,
    enum: ['birthday', 'party', 'diet', 'healthy', 'holiday', 'celebration']
  }]
}, {
  timestamps: true
});

// Add indexes for efficient querying
menuItemTagSchema.index({ menuItem: 1 });
menuItemTagSchema.index({ tags: 1 });
menuItemTagSchema.index({ occasionTags: 1 });

export const MenuItemTag = mongoose.model<IMenuItemTag>('MenuItemTag', menuItemTagSchema); 