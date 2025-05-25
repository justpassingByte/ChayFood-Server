import mongoose from 'mongoose';
import { IMenuItem } from './MenuItem';
import { IUser } from './User';

export interface ICartItem extends mongoose.Document {
  menuItem: IMenuItem['_id'];
  quantity: number;
  notes: string;
}

const cartItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, { _id: true });

export interface ICart extends mongoose.Document {
  user: IUser['_id'];
  items: ICartItem[];
  lastActive: Date;
}

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to calculate total price of cart
cartSchema.methods.calculateTotal = async function() {
  try {
    await this.populate('items.menuItem', 'price');
    
    return this.items.reduce((total: number, item: any) => {
      // Make sure menuItem exists and has a valid price
      if (item && item.menuItem && typeof item.menuItem.price === 'number') {
        return total + (item.menuItem.price * item.quantity);
      }
      // If any issues, just return the current total
      console.warn('Skip invalid cart item in total calculation:', item?._id);
      return total;
    }, 0);
  } catch (error) {
    console.error('Error calculating cart total:', error);
    return 0;
  }
};

// Add indexes for efficient querying
cartSchema.index({ user: 1 });
cartSchema.index({ lastActive: 1 });

export const Cart = mongoose.model<ICart>('Cart', cartSchema); 