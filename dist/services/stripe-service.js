"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntent = createPaymentIntent;
exports.updatePaymentStatus = updatePaymentStatus;
exports.constructEventFromPayload = constructEventFromPayload;
exports.refundPayment = refundPayment;
const stripe_1 = __importDefault(require("../config/stripe"));
/**
 * Create a payment intent for the order
 * @param order - The order for which to create a payment intent
 * @returns Payment intent details
 */
async function createPaymentIntent(order) {
    try {
        // Create a payment intent with the order amount and currency
        const paymentIntent = await stripe_1.default.paymentIntents.create({
            amount: Math.round(order.totalAmount * 100), // Stripe requires amount in cents
            currency: 'vnd', // Vietnamese Dong
            metadata: {
                orderId: order._id.toString(),
                userId: order.user.toString()
            },
            description: `Payment for Order #${order._id}`,
            // You can add automatic payment methods here
            automatic_payment_methods: {
                enabled: true,
            },
        });
        return {
            id: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            status: paymentIntent.status
        };
    }
    catch (error) {
        console.error('Error creating Stripe payment intent:', error);
        throw new Error(`Stripe payment error: ${error.message}`);
    }
}
/**
 * Update payment status based on Stripe webhook events
 * @param paymentIntentId - The Stripe payment intent ID
 * @param status - The new payment status
 * @returns Updated payment intent data
 */
async function updatePaymentStatus(paymentIntentId, status) {
    try {
        const paymentIntent = await stripe_1.default.paymentIntents.retrieve(paymentIntentId);
        return {
            id: paymentIntent.id,
            status: paymentIntent.status,
            metadata: paymentIntent.metadata
        };
    }
    catch (error) {
        console.error('Error updating payment status:', error);
        throw new Error(`Stripe payment status update error: ${error.message}`);
    }
}
/**
 * Verify Stripe webhook signature
 * @param req - Express request object
 * @param signingSecret - Webhook signing secret
 * @returns Parsed event if signature is valid
 */
function constructEventFromPayload(req, signingSecret) {
    try {
        // Get the raw body and signature
        const payload = req.body;
        const sig = req.headers['stripe-signature'];
        if (!sig) {
            throw new Error('No Stripe signature found in request headers');
        }
        console.log('Constructing Stripe event from payload');
        console.log('Signature present:', !!sig);
        console.log('Payload type:', typeof payload);
        // For debugging
        if (typeof payload !== 'string' && !Buffer.isBuffer(payload)) {
            console.log('Payload is not a string or buffer, it might be parsed JSON already');
            console.log('Headers:', req.headers);
        }
        // Construct and return the event
        const event = stripe_1.default.webhooks.constructEvent(payload, sig, signingSecret);
        console.log('Event constructed successfully, type:', event.type);
        return event;
    }
    catch (error) {
        console.error('Webhook signature verification failed:', error);
        console.error('Error details:', {
            message: error.message,
            type: error.type,
            headers: req.headers['stripe-signature'] ? 'Present' : 'Missing'
        });
        throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
}
/**
 * Refund a payment
 * @param paymentIntentId - The Stripe payment intent ID to refund
 * @param amount - Amount to refund (in cents), or undefined for full refund
 * @returns Refund object
 */
async function refundPayment(paymentIntentId, amount) {
    try {
        const refund = await stripe_1.default.refunds.create({
            payment_intent: paymentIntentId,
            amount: amount, // If undefined, Stripe will refund the full amount
        });
        return refund;
    }
    catch (error) {
        console.error('Error refunding payment:', error);
        throw new Error(`Stripe refund error: ${error.message}`);
    }
}
