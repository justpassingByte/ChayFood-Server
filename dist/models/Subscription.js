"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const subscriptionSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    plan: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Plan',
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
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
    selectedMenuItems: [{
            menuItemId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: 'MenuItem',
            },
            quantity: {
                type: Number,
                min: 1,
                default: 1,
            },
            dayOfWeek: {
                type: Number,
                min: 0,
                max: 6,
                required: true,
            },
            mealType: {
                type: String,
                enum: ['breakfast', 'lunch', 'dinner', 'snack'],
                required: true,
            },
        }],
    paymentStatus: {
        type: String,
        required: true,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending',
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['card', 'banking'],
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    specialInstructions: String,
}, {
    timestamps: true,
});
exports.Subscription = mongoose_1.default.model('Subscription', subscriptionSchema);
