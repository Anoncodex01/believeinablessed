// backend/src/routes/payments.js
// Single place the frontend asks "what can I pay with right now?" and where
// manual mobile-money (Airtel Money / Tigo Pesa) references get recorded.
import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ==================== GET /api/payments/methods ====================
// Drives the payment badges on checkout. A method only shows as "available"
// if its credentials actually exist in the environment, so the storefront
// never offers a payment option that will fail.
router.get('/methods', (req, res) => {
  const configured = {
    pesapal: Boolean(process.env.PESAPAL_CONSUMER_KEY && process.env.PESAPAL_CONSUMER_SECRET),
  };

  res.json({
    success: true,
    methods: [
      {
        id: 'pesapal',
        label: 'Pesapal (M-Pesa, Airtel Money, Tigo Pesa, Cards)',
        badges: ['mpesa', 'airtel_money', 'tigo_pesa', 'card'],
        available: configured.pesapal,
        mode: 'redirect',
      },
      {
        id: 'mpesa',
        label: 'M-Pesa',
        badges: ['mpesa'],
        available: true,
        mode: 'manual', // directions-only: no STK push, customer pays then submits a code
      },
    ],
    tills: {
      mpesa: process.env.MOBILE_MONEY_TILL_MPESA || null,
      airtel: process.env.MOBILE_MONEY_TILL_AIRTEL || null,
      tigo: process.env.MOBILE_MONEY_TILL_TIGO || null,
    },
  });
});

// ==================== POST /api/payments/manual-mobile/submit ====================
// Customer picked Airtel Money / Tigo Pesa (no direct API yet), paid via USSD
// on their phone, and is submitting the transaction reference they received
// so an admin can verify and confirm it against the mobile network's SMS.
router.post('/manual-mobile/submit', async (req, res) => {
  try {
    const { order_id, order_number, provider, phone_number, reference } = req.body;

    if (!order_id || !provider || !reference) {
      return res.status(400).json({ error: 'order_id, provider and reference are required' });
    }
    if (!['airtel_money', 'tigo_pesa', 'mpesa', 'halopesa'].includes(provider)) {
      return res.status(400).json({ error: 'Unsupported provider' });
    }

    const { data: existingOrder, error: orderFetchError } = await supabase
      .from('orders')
      .select('id, order_number, payment_status')
      .eq('id', order_id)
      .single();

    if (orderFetchError || !existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { data: txn, error: txnError } = await supabase
      .from('mobile_money_transactions')
      .insert({
        order_id,
        order_number: order_number || existingOrder.order_number,
        provider,
        phone_number: phone_number || null,
        reference,
        status: 'awaiting_verification',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txnError) {
      console.error('Error saving mobile money reference:', txnError);
      return res.status(500).json({ error: 'Failed to save payment reference: ' + txnError.message });
    }

    // Mark the order as "verifying" so it's visible to admins, without
    // marking it paid until a human/aggregator confirms the reference.
    await supabase
      .from('orders')
      .update({
        payment_method: provider,
        payment_status: 'verifying',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    await supabase.from('notifications').insert({
      type: 'payment_verification_needed',
      title: `📱 ${provider.replace('_', ' ')} reference submitted for ${existingOrder.order_number}`,
      message: `Customer submitted reference ${reference}. Please verify against your ${provider.replace('_', ' ')} SMS/statement and mark the order as paid.`,
      link: `/admin/orders`,
      data: { order_id, order_number: existingOrder.order_number, provider, reference },
      created_at: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Reference received. We will confirm your payment shortly.',
      transaction: txn,
    });
  } catch (err) {
    console.error('❌ manual-mobile/submit error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit payment reference' });
  }
});

// ==================== GET /api/payments/manual-mobile/pending (admin) ====================
router.get('/manual-mobile/pending', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mobile_money_transactions')
      .select('*')
      .eq('status', 'awaiting_verification')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, transactions: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PUT /api/payments/manual-mobile/:id/verify (admin) ====================
router.put('/manual-mobile/:id/verify', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { approve } = req.body; // true = confirm paid, false = reject

    const { data: txn, error: fetchError } = await supabase
      .from('mobile_money_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !txn) return res.status(404).json({ error: 'Transaction not found' });

    await supabase
      .from('mobile_money_transactions')
      .update({
        status: approve ? 'confirmed' : 'rejected',
        verified_by: req.user?.id || 'admin',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (approve) {
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', txn.order_id);

      await supabase.from('notifications').insert({
        type: 'order_paid',
        title: `✅ Order ${txn.order_number} confirmed paid via ${txn.provider.replace('_', ' ')}`,
        message: `Reference ${txn.reference} verified.`,
        link: `/admin/orders`,
        data: { order_id: txn.order_id, order_number: txn.order_number, payment_method: txn.provider },
        created_at: new Date().toISOString(),
      });
    } else {
      await supabase
        .from('orders')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', txn.order_id);
    }

    res.json({ success: true, message: approve ? 'Payment confirmed' : 'Payment rejected' });
  } catch (err) {
    console.error('❌ manual-mobile verify error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
