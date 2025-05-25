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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntent = createPaymentIntent;
exports.confirmPayment = confirmPayment;
exports.handleWebhook = handleWebhook;
exports.refundPayment = refundPayment;
exports.createStripeCheckoutSession = createStripeCheckoutSession;
exports.createStripeCheckoutSessionWithCart = createStripeCheckoutSessionWithCart;
const Order_1 = require("../models/Order");
const stripeService = __importStar(require("../services/stripe-service"));
const dotenv_1 = __importDefault(require("dotenv"));
const stripe_1 = __importDefault(require("../config/stripe"));
dotenv_1.default.config();
/**
 * Create a payment intent for a specific order
 */
async function createPaymentIntent(req, res) {
    var _a, _b, _c;
    try {
        const { orderId } = req.params;
        // Check if user is authenticated
        if (!req.user || !((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required',
                error: 'User must be logged in to process payment'
            });
            return;
        }
        // Find the order
        const order = await Order_1.Order.findById(orderId);
        if (!order) {
            res.status(404).json({
                status: 'error',
                message: 'Order not found',
                error: `Order with ID ${orderId} does not exist`
            });
            return;
        }
        // Verify user has access to this order
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'admin' && order.user.toString() !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c._id.toString())) {
            res.status(403).json({
                status: 'error',
                message: 'Not authorized',
                error: 'You do not have permission to process payment for this order'
            });
            return;
        }
        // Check if order is already paid
        if (order.paymentStatus === 'paid') {
            res.status(400).json({
                status: 'error',
                message: 'Order already paid',
                error: 'This order has already been paid for'
            });
            return;
        }
        // Create payment intent with Stripe
        const paymentIntent = await stripeService.createPaymentIntent(order);
        // Update the order with payment intent information
        order.paymentIntent = {
            id: paymentIntent.id,
            clientSecret: paymentIntent.clientSecret || '',
            status: paymentIntent.status
        };
        order.paymentMethod = 'stripe';
        await order.save();
        res.json({
            status: 'success',
            message: 'Payment intent created successfully',
            data: {
                clientSecret: paymentIntent.clientSecret,
                orderId: order._id,
                amount: order.totalAmount
            }
        });
    }
    catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating payment intent',
            error: error.message
        });
    }
}
/**
 * Confirm payment success for an order
 */
async function confirmPayment(req, res) {
    try {
        const { orderId } = req.params;
        const { paymentIntentId } = req.body;
        if (!paymentIntentId) {
            res.status(400).json({
                status: 'error',
                message: 'Missing payment intent ID',
                error: 'Payment intent ID is required'
            });
            return;
        }
        // Find the order
        const order = await Order_1.Order.findById(orderId);
        if (!order) {
            res.status(404).json({
                status: 'error',
                message: 'Order not found',
                error: `Order with ID ${orderId} does not exist`
            });
            return;
        }
        // Verify the payment intent matches the order
        if (!order.paymentIntent || order.paymentIntent.id !== paymentIntentId) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid payment intent',
                error: 'The provided payment intent does not match this order'
            });
            return;
        }
        // Retrieve the payment intent from Stripe to verify its status
        const paymentData = await stripeService.updatePaymentStatus(paymentIntentId, 'succeeded');
        if (paymentData.status === 'succeeded') {
            // Update the order with payment success
            order.paymentStatus = 'paid';
            order.status = 'confirmed';
            if (order.paymentIntent) {
                order.paymentIntent.status = 'succeeded';
            }
            await order.save();
            res.json({
                status: 'success',
                message: 'Payment confirmed successfully',
                data: {
                    orderId: order._id,
                    paymentStatus: order.paymentStatus,
                    orderStatus: order.status
                }
            });
        }
        else {
            res.status(400).json({
                status: 'error',
                message: 'Payment not successful',
                error: `Payment status is ${paymentData.status}`
            });
        }
    }
    catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error confirming payment',
            error: error.message
        });
    }
}
/**
 * Handle Stripe webhook events
 */
async function handleWebhook(req, res) {
    try {
        console.log('Received webhook event from Stripe');
        const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!stripeWebhookSecret) {
            console.error('STRIPE_WEBHOOK_SECRET is not set in environment variables');
            res.status(500).json({
                status: 'error',
                message: 'Server configuration error',
                error: 'Webhook secret is not configured'
            });
            return;
        }
        // Get the raw body for signature verification
        const rawBody = req.body;
        const signature = req.headers['stripe-signature'];
        console.log('Webhook signature received:', signature ? 'Yes' : 'No');
        if (!signature) {
            console.error('No Stripe signature found in headers');
            res.status(400).json({
                status: 'error',
                message: 'No Stripe signature found',
                error: 'Missing stripe-signature header'
            });
            return;
        }
        try {
            // Verify the webhook signature
            const event = stripeService.constructEventFromPayload(req, stripeWebhookSecret);
            console.log('Webhook event verified, type:', event.type);
            // Handle specific event types
            switch (event.type) {
                case 'payment_intent.succeeded':
                    console.log('Processing payment_intent.succeeded event');
                    await handlePaymentIntentSucceeded(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    console.log('Processing payment_intent.payment_failed event');
                    await handlePaymentIntentFailed(event.data.object);
                    break;
                case 'checkout.session.completed':
                    console.log('Processing checkout.session.completed event');
                    await handleCheckoutSessionCompleted(event.data.object);
                    break;
                // Add more event handlers as needed
                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }
            res.json({ received: true });
        }
        catch (verificationError) {
            console.error('Webhook signature verification failed:', verificationError);
            res.status(400).json({
                status: 'error',
                message: 'Webhook signature verification failed',
                error: verificationError.message
            });
        }
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({
            status: 'error',
            message: 'Webhook error',
            error: error.message
        });
    }
}
/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
    var _a;
    try {
        const orderId = (_a = paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.orderId;
        if (!orderId) {
            console.error('No order ID found in payment intent metadata');
            return;
        }
        // Find and update the order
        const order = await Order_1.Order.findById(orderId);
        if (!order) {
            console.error(`Order not found for payment intent: ${paymentIntent.id}`);
            return;
        }
        // Update order status
        order.paymentStatus = 'paid';
        order.status = 'confirmed';
        if (order.paymentIntent) {
            order.paymentIntent.status = 'succeeded';
        }
        order.stripePaymentId = paymentIntent.id;
        await order.save();
        console.log(`Order ${orderId} marked as paid via webhook`);
    }
    catch (error) {
        console.error('Error handling payment_intent.succeeded webhook:', error);
    }
}
/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent) {
    var _a;
    try {
        const orderId = (_a = paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.orderId;
        if (!orderId) {
            console.error('No order ID found in payment intent metadata');
            return;
        }
        // Find and update the order
        const order = await Order_1.Order.findById(orderId);
        if (!order) {
            console.error(`Order not found for payment intent: ${paymentIntent.id}`);
            return;
        }
        // Update order status
        order.paymentStatus = 'failed';
        if (order.paymentIntent) {
            order.paymentIntent.status = 'failed';
        }
        await order.save();
        console.log(`Order ${orderId} marked as payment failed via webhook`);
    }
    catch (error) {
        console.error('Error handling payment_intent.payment_failed webhook:', error);
    }
}
/**
 * Handle completed checkout session
 */
async function handleCheckoutSessionCompleted(session) {
    var _a, _b, _c;
    try {
        console.log('Processing checkout.session.completed webhook for session:', session.id);
        console.log('Session payment status:', session.payment_status);
        console.log('Session metadata:', session.metadata);
        // Check if this is for an existing order
        const orderId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.orderId;
        if (orderId) {
            console.log('Found orderId in metadata, updating existing order:', orderId);
            // Update existing order
            const order = await Order_1.Order.findById(orderId);
            if (order) {
                order.paymentStatus = 'paid';
                order.status = 'confirmed';
                order.stripePaymentId = session.payment_intent;
                // Store the session ID to retrieve it later
                order.stripeSessionId = session.id;
                await order.save();
                console.log(`Updated existing order ${orderId} from checkout session ${session.id}`);
                return;
            }
            else {
                console.log(`Order with ID ${orderId} not found for update`);
            }
        }
        else {
            console.log('No orderId in metadata, will create new order');
        }
        // If no existing order, create a new one from the metadata
        if (!((_b = session.metadata) === null || _b === void 0 ? void 0 : _b.items)) {
            console.error('No items found in session metadata');
            return;
        }
        try {
            // Parse metadata
            console.log('Parsing session metadata to create order');
            const items = JSON.parse(session.metadata.items);
            console.log('Items:', items.length);
            const deliveryAddress = JSON.parse(session.metadata.deliveryAddress);
            console.log('Delivery address:', deliveryAddress);
            const paymentMethod = session.metadata.paymentMethod;
            const specialInstructions = session.metadata.specialInstructions;
            let userId;
            if (session.metadata.user) {
                const userData = JSON.parse(session.metadata.user);
                userId = userData._id;
                console.log('Found user ID in metadata:', userId);
            }
            else if ((_c = session.customer_details) === null || _c === void 0 ? void 0 : _c.email) {
                // Try to find user by email if no user ID in metadata
                console.log('Looking up user by email:', session.customer_details.email);
                const User = require('../models/User').User;
                const user = await User.findOne({ email: session.customer_details.email });
                if (user) {
                    userId = user._id;
                    console.log('Found user by email:', userId);
                }
                else {
                    console.log('No user found with email:', session.customer_details.email);
                }
            }
            if (!userId) {
                console.error('Could not determine user for order');
                return;
            }
            // Create new order
            console.log('Creating new order for user:', userId);
            const newOrder = new Order_1.Order({
                user: userId,
                items: items.map((item) => ({
                    menuItem: item.menuItem,
                    quantity: item.quantity,
                    price: item.price,
                    specialInstructions: item.specialInstructions || ''
                })),
                totalAmount: parseFloat(session.metadata.totalAmount),
                deliveryAddress,
                paymentMethod,
                specialInstructions,
                status: 'confirmed',
                paymentStatus: 'paid',
                stripePaymentId: session.payment_intent,
                stripeSessionId: session.id
            });
            const savedOrder = await newOrder.save();
            console.log(`Created new order from checkout session ${session.id}, order ID: ${savedOrder._id}`);
        }
        catch (parseError) {
            console.error('Error parsing session metadata:', parseError);
            console.error('Raw metadata items:', session.metadata.items);
            console.error('Raw metadata deliveryAddress:', session.metadata.deliveryAddress);
        }
    }
    catch (error) {
        console.error('Error handling checkout.session.completed webhook:', error);
    }
}
/**
 * Refund an order payment
 */
async function refundPayment(req, res) {
    var _a, _b;
    try {
        const { orderId } = req.params;
        const { amount, reason } = req.body;
        // Check if user is admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            res.status(403).json({
                status: 'error',
                message: 'Admin access required',
                error: 'Only administrators can process refunds'
            });
            return;
        }
        // Find the order
        const order = await Order_1.Order.findById(orderId);
        if (!order) {
            res.status(404).json({
                status: 'error',
                message: 'Order not found',
                error: `Order with ID ${orderId} does not exist`
            });
            return;
        }
        // Check if order was paid with Stripe
        if (order.paymentMethod !== 'stripe' || !((_b = order.paymentIntent) === null || _b === void 0 ? void 0 : _b.id)) {
            res.status(400).json({
                status: 'error',
                message: 'Cannot refund this order',
                error: 'Only orders paid with Stripe can be refunded through this endpoint'
            });
            return;
        }
        // Check if order is already refunded
        if (order.paymentStatus !== 'paid') {
            res.status(400).json({
                status: 'error',
                message: 'Order cannot be refunded',
                error: `Order payment status is '${order.paymentStatus}', only paid orders can be refunded`
            });
            return;
        }
        // Process the refund
        const amountInCents = amount ? Math.round(amount * 100) : undefined;
        const refund = await stripeService.refundPayment(order.paymentIntent.id, amountInCents);
        // Update order status if full refund
        if (!amount || amount >= order.totalAmount) {
            order.paymentStatus = 'refunded';
            await order.save();
        }
        res.json({
            status: 'success',
            message: 'Refund processed successfully',
            data: {
                orderId: order._id,
                refundId: refund.id,
                amount: amount || order.totalAmount,
                reason: reason || 'Customer request'
            }
        });
    }
    catch (error) {
        console.error('Error processing refund:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error processing refund',
            error: error.message
        });
    }
}
/**
 * Create a Stripe Checkout Session for a specific order
 */
async function createStripeCheckoutSession(req, res) {
    var _a, _b, _c;
    try {
        const { orderId } = req.params;
        // Check if user is authenticated
        if (!req.user || !((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required',
                error: 'User must be logged in to process payment'
            });
            return;
        }
        // Find the order
        const order = await Order_1.Order.findById(orderId);
        if (!order) {
            res.status(404).json({
                status: 'error',
                message: 'Order not found',
                error: `Order with ID ${orderId} does not exist`
            });
            return;
        }
        // Verify user has access to this order
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'admin' && order.user.toString() !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c._id.toString())) {
            res.status(403).json({
                status: 'error',
                message: 'Not authorized',
                error: 'You do not have permission to process payment for this order'
            });
            return;
        }
        // Check if order is already paid
        if (order.paymentStatus === 'paid') {
            res.status(400).json({
                status: 'error',
                message: 'Order already paid',
                error: 'This order has already been paid for'
            });
            return;
        }
        // Create Stripe Checkout Session
        const session = await stripe_1.default.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: order.items.map(item => ({
                price_data: {
                    currency: 'vnd',
                    product_data: {
                        name: item.menuItem.name || 'Sản phẩm',
                    },
                    unit_amount: Math.round(item.price),
                },
                quantity: item.quantity,
            })),
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/order/success?orderId=${order._id}`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/order/${order._id}`,
            metadata: {
                orderId: order._id.toString(),
                userId: order.user.toString(),
            },
            customer_email: req.user.email,
        });
        res.json({
            status: 'success',
            url: session.url,
            sessionId: session.id
        });
    }
    catch (error) {
        console.error('Error creating Stripe Checkout Session:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating Stripe Checkout Session',
            error: error.message
        });
    }
}
/**
 * Create a Stripe Checkout Session with cart metadata (no orderId)
 */
async function createStripeCheckoutSessionWithCart(req, res) {
    var _a;
    try {
        // Check if user is authenticated
        if (!req.user || !((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required',
                error: 'User must be logged in to process payment'
            });
            return;
        }
        const { items, deliveryAddress, paymentMethod, specialInstructions, user } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid items data',
                error: 'Checkout session must contain at least one item'
            });
            return;
        }
        if (!deliveryAddress) {
            res.status(400).json({
                status: 'error',
                message: 'Missing delivery address',
                error: 'Delivery address is required'
            });
            return;
        }
        // Tính tổng tiền
        let totalAmount = 0;
        const line_items = items.map((item) => {
            var _a;
            totalAmount += item.price * item.quantity;
            return {
                price_data: {
                    currency: 'vnd',
                    product_data: {
                        name: ((_a = item.menuItem) === null || _a === void 0 ? void 0 : _a.name) || 'Sản phẩm',
                    },
                    unit_amount: Math.round(item.price),
                },
                quantity: item.quantity,
            };
        });
        // Tạo Stripe Checkout Session
        const session = await stripe_1.default.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/order/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/cart`,
            metadata: {
                items: JSON.stringify(items),
                deliveryAddress: JSON.stringify(deliveryAddress),
                paymentMethod: paymentMethod || 'stripe',
                specialInstructions: specialInstructions || '',
                user: user ? JSON.stringify(user) : '',
                totalAmount: totalAmount.toString()
            },
            customer_email: req.user.email,
        });
        res.json({
            status: 'success',
            url: session.url,
            sessionId: session.id
        });
    }
    catch (error) {
        console.error('Error creating Stripe Checkout Session with cart:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating Stripe Checkout Session',
            error: error.message
        });
    }
}
