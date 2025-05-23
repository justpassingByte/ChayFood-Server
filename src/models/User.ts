import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface UserAddress {
  _id: mongoose.Types.ObjectId;
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  additionalInfo?: string;
  isDefault: boolean;
}

export interface IUser extends mongoose.Document {
  email: string;
  password?: string;
  name: string;
  phone?: string;
  address?: string;
  addresses?: UserAddress[];
  dietaryPreferences?: string[];
  role: 'user' | 'admin';
  googleId?: string;
  facebookId?: string;
  picture?: string;
  comparePassword?(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: false,
    minlength: 6,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: false,
    trim: true,
  },
  address: {
    type: String,
    required: false,
    trim: true,
  },
  addresses: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    street: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    additionalInfo: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    }
  }],
  dietaryPreferences: [{
    type: String,
    trim: true,
  }],
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  facebookId: {
    type: String,
    unique: true,
    sparse: true,
  },
  picture: {
    type: String,
  },
}, {
  timestamps: true,
});

// Hash password before saving (only for email/password signup)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password for login (only for email/password login)
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema); 