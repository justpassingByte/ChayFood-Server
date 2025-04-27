"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniGame = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const miniGameSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['spin_wheel', 'scratch_card', 'memory_match', 'quiz'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    rewards: [{
            _id: mongoose_1.default.Types.ObjectId,
            type: {
                type: String,
                required: true,
                enum: ['discount', 'points', 'free_item', 'free_delivery'],
            },
            value: {
                type: Number,
                required: true,
                min: 0,
            },
            code: {
                type: String,
                trim: true,
            },
            probability: {
                type: Number,
                required: true,
                min: 0,
                max: 100,
            },
            limit: {
                type: Number,
                default: 0, // 0 means unlimited
            },
            awarded: {
                type: Number,
                default: 0,
            },
        }],
    dailyPlayLimit: {
        type: Number,
        default: 1,
    },
    totalPlayLimit: {
        type: Number,
        default: 0, // 0 means unlimited
    },
}, {
    timestamps: true,
});
// Indexes for efficient queries
miniGameSchema.index({ isActive: 1 });
miniGameSchema.index({ startDate: 1, endDate: 1 });
exports.MiniGame = mongoose_1.default.model('MiniGame', miniGameSchema);
