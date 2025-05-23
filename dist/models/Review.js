"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const reviewSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    menuItem: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// Composite index for efficient queries by user and menu item
reviewSchema.index({ user: 1, menuItem: 1 }, { unique: true });
// Index for queries by menu item to get all reviews
reviewSchema.index({ menuItem: 1 });
// Index for queries by rating (for sorting)
reviewSchema.index({ rating: -1 });
exports.Review = mongoose_1.default.model('Review', reviewSchema);
