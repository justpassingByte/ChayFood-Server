"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoyaltyPoints = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const loyaltyPointsSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    totalPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    availablePoints: {
        type: Number,
        default: 0,
        min: 0
    },
    pointsHistory: [{
            points: {
                type: Number,
                required: true
            },
            type: {
                type: String,
                enum: ['earned', 'spent', 'expired'],
                required: true
            },
            order: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: 'Order'
            },
            description: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }]
}, {
    timestamps: true
});
// Add index for querying by user
loyaltyPointsSchema.index({ user: 1 });
exports.LoyaltyPoints = mongoose_1.default.model('LoyaltyPoints', loyaltyPointsSchema);
