"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const subscription_controller_1 = require("../controllers/subscription-controller");
const router = express_1.default.Router();
// Get available subscription plans (public)
router.get('/plans', subscription_controller_1.getAvailablePlans);
// Create a subscription (authenticated)
router.post('/', auth_1.authenticateToken, subscription_controller_1.createSubscription);
// Get user's subscriptions (authenticated)
router.get('/my-subscriptions', auth_1.authenticateToken, subscription_controller_1.getUserSubscriptions);
// Get subscription by ID (authenticated)
router.get('/:id', auth_1.authenticateToken, subscription_controller_1.getSubscriptionById);
// Update subscription menu selections (authenticated)
router.patch('/:id/menu', auth_1.authenticateToken, subscription_controller_1.updateMenuSelections);
// Cancel subscription (authenticated)
router.patch('/:id/cancel', auth_1.authenticateToken, subscription_controller_1.cancelSubscription);
exports.default = router;
