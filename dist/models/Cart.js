"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cart = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const cartItemSchema = new mongoose_1.default.Schema({
    menuItem: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
const cartSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
cartSchema.methods.calculateTotal = async function () {
    try {
        await this.populate('items.menuItem', 'price');
        return this.items.reduce((total, item) => {
            // Make sure menuItem exists and has a valid price
            if (item && item.menuItem && typeof item.menuItem.price === 'number') {
                return total + (item.menuItem.price * item.quantity);
            }
            // If any issues, just return the current total
            console.warn('Skip invalid cart item in total calculation:', item === null || item === void 0 ? void 0 : item._id);
            return total;
        }, 0);
    }
    catch (error) {
        console.error('Error calculating cart total:', error);
        return 0;
    }
};
// Add indexes for efficient querying
cartSchema.index({ user: 1 });
cartSchema.index({ lastActive: 1 });
exports.Cart = mongoose_1.default.model('Cart', cartSchema);
