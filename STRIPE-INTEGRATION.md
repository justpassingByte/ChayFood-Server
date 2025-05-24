# Stripe Payment Integration for ChayFood

This document explains how to set up and use the Stripe payment integration for the ChayFood backend.

## Setup

### 1. Environment Variables

Configure the following environment variables in your `.env` file:

```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### 2. Stripe Account Setup

1. Create a [Stripe account](https://stripe.com) if you don't have one.
2. Go to the Stripe Dashboard to get your API keys.
3. Set up a webhook in the Stripe Dashboard:
   - URL: `https://your-backend-url.com/payment/webhook`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

## Payment Flow

### Server-side (Backend)

1. **Create Payment Intent**
   - When a user places an order and selects Stripe as the payment method
   - Endpoint: `POST /payment/create-intent/:orderId`
   - Response includes a `clientSecret` for the frontend to complete the payment

2. **Handle Webhooks**
   - Endpoint: `POST /payment/webhook`
   - Processes payment events from Stripe
   - Updates order status based on payment outcomes

3. **Confirm Payment**
   - Endpoint: `POST /payment/confirm/:orderId`
   - For client-side confirmation (alternative to webhooks)
   - Updates order status when payment is confirmed

4. **Refund Payment**
   - Endpoint: `POST /payment/refund/:orderId`
   - Admin-only feature to process refunds
   - Can refund partial or full amounts

### Client-side (Frontend)

```javascript
// Example frontend code using React
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// 1. Load Stripe.js
const stripePromise = loadStripe('pk_test_your_publishable_key');

// 2. Create a payment form component
function CheckoutForm({ orderId, amount }) {
  const stripe = useStripe();
  const elements = useElements();
  
  async function handleSubmit(event) {
    event.preventDefault();
    
    // 3. Create payment intent on the server
    const response = await fetch(`/api/payment/create-intent/${orderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    
    const { clientSecret } = await response.json();
    
    // 4. Confirm the payment with Stripe.js
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: 'Customer Name',
        },
      },
    });
    
    if (result.error) {
      // Handle error
      console.error(result.error.message);
    } else if (result.paymentIntent.status === 'succeeded') {
      // Payment succeeded, confirm on server
      await fetch(`/api/payment/confirm/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentIntentId: result.paymentIntent.id 
        }),
      });
      
      // Navigate to success page
      window.location.href = `/order-success/${orderId}`;
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>Pay Now</button>
    </form>
  );
}

// 5. Wrap your checkout form with Elements provider
function StripeCheckout({ orderId, amount }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm orderId={orderId} amount={amount} />
    </Elements>
  );
}
```

## Integrating with Order Creation

### Backend Integration

When creating an order, the user can select 'stripe' as the payment method:

```javascript
// Example order creation with Stripe payment
const orderData = {
  items: [
    { menuItem: '60d21b4667d0d8992e610c85', quantity: 2, price: 75000 },
    { menuItem: '60d21b4667d0d8992e610c86', quantity: 1, price: 45000 }
  ],
  deliveryAddress: {
    street: '123 Nguyễn Huệ',
    city: 'Hồ Chí Minh',
    state: 'TP HCM',
    postalCode: '70000',
    additionalInfo: 'Tòa nhà A, Tầng 5'
  },
  paymentMethod: 'stripe', // <-- Select Stripe as payment method
  specialInstructions: 'Không hành, nhiều ớt'
};

// POST request to create order
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + userToken
  },
  body: JSON.stringify(orderData)
});

const { data: order } = await response.json();

// Redirect to payment page with order ID
window.location.href = `/payment/${order._id}`;
```

### Complete Payment Flow

1. User creates order with `paymentMethod: 'stripe'`
2. Order is created with `paymentStatus: 'pending'`
3. Frontend redirects to payment page with order ID
4. Payment page creates payment intent and shows Stripe payment form
5. User enters card details and submits payment
6. On successful payment:
   - Order status is updated to `confirmed`
   - Payment status is updated to `paid`
   - User is redirected to order confirmation page

## Testing

1. Use Stripe test mode with test cards:
   - Success: `4242 4242 4242 4242`
   - Requires Authentication: `4000 0025 0000 3155`
   - Declined: `4000 0000 0000 0002`

2. Use the Stripe CLI to test webhooks locally:
   ```
   stripe listen --forward-to localhost:5000/payment/webhook
   ```

## Webhook Events

The integration handles the following webhook events:

1. `payment_intent.succeeded` - Updates order to `paid` status and sets order status to `confirmed`
2. `payment_intent.payment_failed` - Updates order payment status to `failed`

## Error Handling

The integration includes robust error handling:

1. Validation of payment status and order ownership
2. Proper error messages and status codes
3. Webhook signature verification to prevent fraud
4. Logging of payment events for debugging

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe.js Reference](https://stripe.com/docs/js)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test) 