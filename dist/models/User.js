"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: false,
        minlength: 6,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: false,
        trim: true,
    },
    address: {
        type: String,
        required: false,
        trim: true,
    },
    addresses: [{
            _id: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                default: () => new mongoose_1.default.Types.ObjectId()
            },
            name: {
                type: String,
                required: true,
                trim: true,
            },
            street: {
                type: String,
                required: true,
                trim: true,
            },
            city: {
                type: String,
                required: true,
                trim: true,
            },
            state: {
                type: String,
                required: true,
                trim: true,
            },
            postalCode: {
                type: String,
                required: true,
                trim: true,
            },
            additionalInfo: {
                type: String,
                trim: true,
            },
            isDefault: {
                type: Boolean,
                default: false,
            }
        }],
    dietaryPreferences: [{
            type: String,
            trim: true,
        }],
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    facebookId: {
        type: String,
        unique: true,
        sparse: true,
    },
    picture: {
        type: String,
    },
}, {
    timestamps: true,
});
// Hash password before saving (only for email/password signup)
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password)
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Method to compare password for login (only for email/password login)
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password)
        return false;
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
exports.User = mongoose_1.default.model('User', userSchema);
