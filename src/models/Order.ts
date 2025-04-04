import mongoose from 'mongoose';
import { IMenuItem } from './MenuItem';
import { IUser } from './User';

export interface IOrder extends mongoose.Document {
  user: IUser['_id'];
  items: Array<{
    menuItem: IMenuItem['_id'];
    quantity: number;
    price: number;
    specialInstructions?: string;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    additionalInfo?: string;
  };
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: 'cod' | 'card' | 'banking';
  deliveryTime?: Date;
  specialInstructions?: string;
}

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    specialInstructions: String,
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending',
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
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cod', 'card', 'banking'],
  },
  deliveryTime: Date,
  specialInstructions: String,
}, {
  timestamps: true,
});

// Calculate total amount before saving
orderSchema.pre('save', async function(next) {
  if (this.isModified('items')) {
    this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
  next();
});

export const Order = mongoose.model<IOrder>('Order', orderSchema); 