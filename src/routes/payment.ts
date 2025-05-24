import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  refundPayment,
  createStripeCheckoutSession,
  createStripeCheckoutSessionWithCart
} from '../controllers/payment-controller';

const router = express.Router();

// Create a payment intent for an order
router.post('/create-intent/:orderId', authenticateToken, createPaymentIntent);

// Confirm payment for an order
router.post('/confirm/:orderId', authenticateToken, confirmPayment);

// Handle Stripe webhooks - no authentication for this route as it's called by Stripe
router.post('/webhook', handleWebhook);

// Test endpoint for webhook verification
router.get('/webhook-test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Webhook route is accessible',
    headers: req.headers['content-type']
  });
});

// Process refund for an order (admin only)
router.post('/refund/:orderId', authenticateToken, refundPayment);

// Create a Stripe Checkout Session for an order
router.post('/checkout-session/:orderId', authenticateToken, createStripeCheckoutSession);

// Create a Stripe Checkout Session for cart (no orderId)
router.post('/checkout-session', authenticateToken, createStripeCheckoutSessionWithCart);

export default router; 