// backend/routes/stripe.js - Updated for Payment Element
import express from 'express';
import Stripe from 'stripe';
import supabase from '../config/supabase.js';

const router = express.Router();

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/stripe/create-payment-intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, order_id, currency = 'tzs' } = req.body;

    console.log(`💰 Creating payment intent: amount=${amount}, currency=${currency}, order=${order_id}`);

    // Validate amount - Minimum for TZS is 1000
    if (!amount || amount < 1000) {
      return res.status(400).json({ 
        error: `Minimum payment is 1000 TZS. You entered ${amount} TZS.` 
      });
    }

    // Validate order_id
    if (!order_id) {
      return res.status(400).json({ 
        error: 'Order ID is required' 
      });
    }

    // Stripe always expects amounts in the currency's smallest unit.
    // TZS/KES/USD are 2-decimal currencies for Stripe (unlike zero-decimal
    // currencies such as JPY), so "50000 TZS" must be sent as 5000000 (cents).
    // Sending the raw shilling amount here was silently charging customers
    // 100x less than the order total.
    const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd', 'ugx', 'clp', 'bif', 'djf', 'gnf', 'kmf', 'mga', 'pyg', 'rwf', 'vuv', 'xaf', 'xof', 'xpf'];
    const isZeroDecimal = zeroDecimalCurrencies.includes(currency.toLowerCase());
    const amountInSmallestUnit = isZeroDecimal ? Math.round(amount) : Math.round(amount * 100);
    
    // Create payment intent with Payment Element support
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata: {
        order_id: order_id,
        platform: 'believeinablessed'
      },
      statement_descriptor_suffix: 'BelieveinaBlessed',
    });

    console.log(`✅ Payment intent created: ${paymentIntent.id} for ${amountInSmallestUnit} ${currency}`);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountInSmallestUnit,
      currency: currency
    });
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    
    let errorMessage = 'Failed to create payment. Please try again.';
    let statusCode = 500;
    
    if (error.type === 'StripeInvalidRequestError') {
      statusCode = 400;
      if (error.message.includes('statement_descriptor')) {
        errorMessage = 'Payment configuration error. Please try again.';
      } else if (error.message.includes('currency')) {
        errorMessage = 'Invalid currency. Please contact support.';
      } else if (error.message.includes('amount')) {
        errorMessage = 'Invalid amount. Minimum payment is 1000 TZS.';
      } else {
        errorMessage = error.message;
      }
    } else if (error.type === 'StripeAPIError') {
      errorMessage = 'Payment service error. Please try again later.';
    } else if (error.type === 'StripeConnectionError') {
      errorMessage = 'Network error. Please check your connection and try again.';
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// POST /api/stripe/confirm-payment
router.post('/confirm-payment', async (req, res) => {
  try {
    const { payment_intent_id, order_id, status } = req.body;

    console.log('📝 Confirm payment request:', { payment_intent_id, order_id, status });

    if (!payment_intent_id) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Retrieve the payment intent from Stripe to verify
    console.log(`🔍 Verifying payment ${payment_intent_id} for order ${order_id}`);
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: `Payment not successful. Status: ${paymentIntent.status}` 
      });
    }

    console.log(`✅ Payment verified: ${paymentIntent.id}, status: ${paymentIntent.status}`);

    // Check if order exists
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, order_number, status')
      .eq('id', order_id)
      .single();

    if (checkError || !existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order in database
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        stripe_payment_intent_id: payment_intent_id,
        stripe_payment_status: paymentIntent.status,
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return res.status(500).json({ error: 'Failed to update order' });
    }

    console.log(`✅ Order ${order_id} updated to confirmed`);

    // Create notification for admin
    await supabase
      .from('notifications')
      .insert({
        type: 'order_paid',
        title: `💳 Order ${order.order_number} - Paid via Stripe`,
        message: `Order ${order.order_number} has been paid successfully via Stripe.`,
        link: `/admin/orders`,
        data: {
          order_id: order.id,
          order_number: order.order_number,
          payment_method: 'stripe'
        },
        created_at: new Date().toISOString()
      });

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      order: order
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to confirm payment' 
    });
  }
});

// GET /api/stripe/payment-status/:paymentIntentId
router.get('/payment-status/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      status: paymentIntent.status,
      paymentIntent: paymentIntent
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to check payment status' 
    });
  }
});

export default router;