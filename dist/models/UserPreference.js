"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPreference = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const userPreferenceSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    favoriteCategories: [{
            type: String,
            enum: ['main', 'side', 'dessert', 'beverage']
        }],
    dislikedIngredients: [{
            type: String
        }],
    preferredNutrition: {
        minProtein: {
            type: Number,
            min: 0
        },
        maxCalories: {
            type: Number,
            min: 0
        }
    },
    dietaryRestrictions: [{
            type: String
        }],
    favoriteItems: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'MenuItem'
        }],
    lastViewedItems: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'MenuItem'
        }]
}, {
    timestamps: true
});
// Add index for querying by user
userPreferenceSchema.index({ user: 1 });
exports.UserPreference = mongoose_1.default.model('UserPreference', userPreferenceSchema);
