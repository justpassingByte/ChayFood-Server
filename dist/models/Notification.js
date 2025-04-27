"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const notificationSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['promotion', 'order_status', 'system', 'referral'],
    },
    related: {
        type: {
            type: String,
            trim: true,
        },
        id: {
            type: mongoose_1.default.Schema.Types.ObjectId,
        },
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    channels: [{
            type: String,
            enum: ['email', 'push', 'zalo', 'in_app'],
        }],
    sentStatus: {
        type: Map,
        of: Boolean,
        default: {},
    },
    scheduledFor: {
        type: Date,
    },
    expiresAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Indexes for efficient queries
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 }, { expireAfterSeconds: 0 });
exports.Notification = mongoose_1.default.model('Notification', notificationSchema);
