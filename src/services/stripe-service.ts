import stripe from '../config/stripe';
import { IOrder } from '../models/Order';
import { Request } from 'express';

/**
 * Create a payment intent for the order
 * @param order - The order for which to create a payment intent
 * @returns Payment intent details
 */
export async function createPaymentIntent(order: IOrder) {
  try {
    // Create a payment intent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
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
  } catch (error: any) {
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
export async function updatePaymentStatus(paymentIntentId: string, status: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata
    };
  } catch (error: any) {
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
export function constructEventFromPayload(req: Request, signingSecret: string) {
  try {
    // Get the raw body and signature
    const payload = req.body;
    const sig = req.headers['stripe-signature'] as string;
    
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
    const event = stripe.webhooks.constructEvent(payload, sig, signingSecret);
    console.log('Event constructed successfully, type:', event.type);
    return event;
  } catch (error: any) {
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
export async function refundPayment(paymentIntentId: string, amount?: number) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount, // If undefined, Stripe will refund the full amount
    });
    
    return refund;
  } catch (error: any) {
    console.error('Error refunding payment:', error);
    throw new Error(`Stripe refund error: ${error.message}`);
  }
} 