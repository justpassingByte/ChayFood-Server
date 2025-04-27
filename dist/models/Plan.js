"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Plan = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const planSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    duration: {
        type: Number,
        required: true,
        default: 7, // 7 days default
        min: 1
    },
    description: {
        type: String,
        required: true
    },
    mealsPerDay: {
        type: Number,
        required: true,
        min: 0
    },
    snacksPerDay: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    features: [{
            type: String,
            required: true
        }],
    isRecommended: {
        type: Boolean,
        default: false
    },
    isPremiumMenu: {
        type: Boolean,
        default: false
    },
    hasDietitianSupport: {
        type: Boolean,
        default: false
    },
    hasCustomization: {
        type: Boolean,
        default: false
    },
    hasPriorityDelivery: {
        type: Boolean,
        default: false
    },
    has24HrSupport: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
exports.Plan = mongoose_1.default.model('Plan', planSchema);
