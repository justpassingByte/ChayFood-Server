import mongoose, { Document, Schema } from 'mongoose';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface IChat extends Document {
  userId: string;
  messages: Message[];
  context?: string;
  lastMessageAt: Date;
  isActive: boolean;
  metadata?: {
    userPreferences?: {
      dietary?: string[];
      allergies?: string[];
      spiceLevel?: number;
    };
    orderContext?: {
      lastOrderId?: mongoose.Types.ObjectId;
      cartItems?: mongoose.Types.ObjectId[];
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    messages: [{
      role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
      },
      content: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    context: {
      type: String,
      default: null
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    metadata: {
      userPreferences: {
        dietary: [String],
        allergies: [String],
        spiceLevel: Number
      },
      orderContext: {
        lastOrderId: {
          type: Schema.Types.ObjectId,
          ref: 'Order'
        },
        cartItems: [{
          type: Schema.Types.ObjectId,
          ref: 'MenuItem'
        }]
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes for better query performance
chatSchema.index({ lastMessageAt: -1 });
chatSchema.index({ 'metadata.orderContext.lastOrderId': 1 });
chatSchema.index({ createdAt: -1 });

// Virtual populate with User
chatSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Method to add new message
chatSchema.methods.addMessage = function(role: 'user' | 'assistant' | 'system', content: string) {
  this.messages.push({
    role,
    content,
    createdAt: new Date()
  });
  this.lastMessageAt = new Date();
  return this.save();
};

// Static method to find active chats for a user
chatSchema.statics.findActiveChatsForUser = function(userId: mongoose.Types.ObjectId) {
  return this.find({
    userId,
    isActive: true
  }).sort({ lastMessageAt: -1 });
};

export const Chat = mongoose.model<IChat>('Chat', chatSchema);