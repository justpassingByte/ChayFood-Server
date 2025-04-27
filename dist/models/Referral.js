"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Referral = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const referralSchema = new mongoose_1.Schema({
    referrer: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    referredEmail: { type: String, required: true },
    referredUser: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' },
    code: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'completed', 'expired'], default: 'pending' },
    bonusApplied: { type: Boolean, default: false },
    completedAt: Date,
    bonusAppliedAt: Date,
}, {
    timestamps: true
});
// Create compound index for referrer and referredEmail
referralSchema.index({ referrer: 1, referredEmail: 1 }, { unique: true });
// Index on code for quick lookups
referralSchema.index({ code: 1 }, { unique: true });
// Index on createdAt for sorting and filtering
referralSchema.index({ createdAt: -1 });
exports.Referral = (0, mongoose_1.model)('Referral', referralSchema);
