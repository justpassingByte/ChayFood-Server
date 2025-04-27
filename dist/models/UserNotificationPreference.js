"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNotificationPreference = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const userNotificationPreferenceSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    channels: {
        email: {
            type: Boolean,
            default: true,
        },
        push: {
            type: Boolean,
            default: true,
        },
        zalo: {
            type: Boolean,
            default: true,
        },
        inApp: {
            type: Boolean,
            default: true,
        },
    },
    types: {
        promotions: {
            type: Boolean,
            default: true,
        },
        orders: {
            type: Boolean,
            default: true,
        },
        system: {
            type: Boolean,
            default: true,
        },
        newMenuItems: {
            type: Boolean,
            default: true,
        },
        flashSales: {
            type: Boolean,
            default: true,
        },
    },
    frequency: {
        type: String,
        enum: ['immediately', 'daily', 'weekly'],
        default: 'immediately',
    },
    emailAddress: {
        type: String,
        trim: true,
        lowercase: true,
    },
    phoneNumber: {
        type: String,
        trim: true,
    },
    zaloId: {
        type: String,
        trim: true,
    },
    pushToken: {
        type: String,
    },
    unsubscribeToken: {
        type: String,
        required: true,
        unique: true,
    },
}, {
    timestamps: true,
});
// Create index for efficient querying
userNotificationPreferenceSchema.index({ user: 1 });
userNotificationPreferenceSchema.index({ unsubscribeToken: 1 });
exports.UserNotificationPreference = mongoose_1.default.model('UserNotificationPreference', userNotificationPreferenceSchema);
