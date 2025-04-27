"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserGamePlay = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const userGamePlaySchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    game: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'MiniGame',
        required: true,
    },
    playDate: {
        type: Date,
        default: Date.now,
    },
    reward: {
        type: {
            type: String,
            enum: ['discount', 'points', 'free_item', 'free_delivery'],
        },
        value: {
            type: Number,
            min: 0,
        },
        code: {
            type: String,
            trim: true,
        },
        used: {
            type: Boolean,
            default: false,
        },
        usedAt: {
            type: Date,
        },
    },
}, {
    timestamps: true,
});
// Indexes for efficient queries
userGamePlaySchema.index({ user: 1, game: 1, playDate: 1 });
userGamePlaySchema.index({ 'reward.code': 1 });
userGamePlaySchema.index({ 'reward.used': 1 });
// Add a compound index to efficiently find plays for a specific day
userGamePlaySchema.index({
    user: 1,
    game: 1,
    playDate: 1
});
exports.UserGamePlay = mongoose_1.default.model('UserGamePlay', userGamePlaySchema);
