"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const payment_controller_1 = require("../controllers/payment-controller");
const router = express_1.default.Router();
// Create a payment intent for an order
router.post('/create-intent/:orderId', auth_1.authenticateToken, payment_controller_1.createPaymentIntent);
// Confirm payment for an order
router.post('/confirm/:orderId', auth_1.authenticateToken, payment_controller_1.confirmPayment);
// Handle Stripe webhooks - no authentication for this route as it's called by Stripe
router.post('/webhook', payment_controller_1.handleWebhook);
// Test endpoint for webhook verification
router.get('/webhook-test', (req, res) => {
    res.json({
        status: 'success',
        message: 'Webhook route is accessible',
        headers: req.headers['content-type']
    });
});
// Process refund for an order (admin only)
router.post('/refund/:orderId', auth_1.authenticateToken, payment_controller_1.refundPayment);
// Create a Stripe Checkout Session for an order
router.post('/checkout-session/:orderId', auth_1.authenticateToken, payment_controller_1.createStripeCheckoutSession);
// Create a Stripe Checkout Session for cart (no orderId)
router.post('/checkout-session', auth_1.authenticateToken, payment_controller_1.createStripeCheckoutSessionWithCart);
exports.default = router;
