import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

// Initialize Stripe with your secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey) {
  console.warn('Warning: STRIPE_SECRET_KEY is not set in environment variables');
}

// Create Stripe instance
const stripe = new Stripe(stripeSecretKey);

export default stripe; 