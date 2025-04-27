"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItemTag = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const menuItemTagSchema = new mongoose_1.default.Schema({
    menuItem: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true,
        unique: true
    },
    tags: [{
            type: String,
            trim: true
        }],
    recommendedWith: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'MenuItem'
        }],
    occasionTags: [{
            type: String,
            enum: ['birthday', 'party', 'diet', 'healthy', 'holiday', 'celebration']
        }]
}, {
    timestamps: true
});
// Add indexes for efficient querying
menuItemTagSchema.index({ menuItem: 1 });
menuItemTagSchema.index({ tags: 1 });
menuItemTagSchema.index({ occasionTags: 1 });
exports.MenuItemTag = mongoose_1.default.model('MenuItemTag', menuItemTagSchema);
