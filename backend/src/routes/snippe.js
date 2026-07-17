/**
 * Snippe payment routes
 * POST /create-payment  — start mobile or card payment for an existing order
 * GET  /status/:orderId — poll payment status (fallback if webhook is slow)
 * POST /webhook         — Snippe payment.completed / payment.failed (raw body)
 */
import express from 'express';
import { supabase } from '../config/supabase.js';
import { snippe, SnippeService } from '../services/snippe.js';
import { confirmOrderCommission } from '../utils/affiliateCommission.js';

const router = express.Router();

const FRONTEND_URL = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
if (!FRONTEND_URL) {
  console.warn('⚠️ FRONTEND_URL is not set — card payment redirects will fail');
}
const MIN_AMOUNT_TZS = 500;

// Reuse existing payment columns until 2026_07_snippe_payment.sql is applied.
// After migration, prefer dedicated snippe_* columns if present.
const COL = {
  reference: 'pesapal_order_tracking_id',
  external: 'pesapal_payment_reference',
  paymentType: 'stripe_payment_status',
  channel: 'mpesa_checkout_request_id',
  failure: 'mpesa_receipt_number',
};

function mapChannelToMethod(channel) {
  const provider = String(channel?.provider || '').toLowerCase();
  if (provider.includes('mpesa') || provider.includes('vodacom')) return 'mpesa';
  if (provider.includes('airtel')) return 'airtel_money';
  if (provider.includes('tigo') || provider.includes('yas')) return 'tigo_pesa';
  if (provider.includes('halo')) return 'halopesa';
  if (channel?.type === 'card' || provider.includes('card')) return 'card';
  return 'snippe';
}

async function markOrderPaid(order, paymentData = {}) {
  // Always load a full order row so affiliate_id / commission_status are present
  let workingOrder = order;
  if (!order?.affiliate_id || order.commission_status === undefined) {
    const { data: fullOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order.id)
      .single();
    if (fullOrder) workingOrder = fullOrder;
  }

  if (workingOrder.payment_status === 'paid') {
    // Payment already marked — still try to confirm affiliate if stuck pending/cancelled
    if (workingOrder.affiliate_id && workingOrder.commission_status !== 'confirmed') {
      await confirmOrderCommission(workingOrder.id, workingOrder.affiliate_id, 'Snippe payment already paid — retry confirm');
    }
    return { alreadyPaid: true, order: workingOrder };
  }

  const channelMethod = mapChannelToMethod(paymentData.channel);
  const update = {
    payment_status: 'paid',
    status: 'confirmed',
    [COL.reference]: paymentData.reference || workingOrder[COL.reference],
    [COL.external]: paymentData.external_reference || workingOrder[COL.external] || null,
    [COL.channel]: paymentData.channel
      ? `${paymentData.channel.type || ''}:${paymentData.channel.provider || ''}`
      : workingOrder[COL.channel] || null,
    payment_method:
      channelMethod !== 'snippe' ? channelMethod : workingOrder.payment_method || 'snippe',
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from('orders')
    .update(update)
    .eq('id', workingOrder.id)
    .neq('payment_status', 'paid')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  const finalOrder = updated || workingOrder;

  // Confirm affiliate commission as soon as payment succeeds
  const affiliateId = finalOrder.affiliate_id || workingOrder.affiliate_id;
  if (affiliateId) {
    try {
      await confirmOrderCommission(finalOrder.id, affiliateId, 'Snippe payment confirmed');
    } catch (affErr) {
      console.error('⚠️ Affiliate commission confirm failed:', affErr.message);
    }
  } else {
    console.log(`ℹ️ Order ${finalOrder.order_number} has no affiliate — skipping commission`);
  }

  try {
    await supabase.from('notifications').insert({
      type: 'order_paid',
      title: `💳 Order ${finalOrder.order_number} - Paid via Snippe`,
      message: `Order ${finalOrder.order_number} has been paid successfully via Snippe.`,
      link: `/admin/orders`,
      data: {
        order_id: finalOrder.id,
        order_number: finalOrder.order_number,
        amount: finalOrder.total,
        payment_reference: paymentData.reference,
        channel: paymentData.channel || null,
        affiliate_id: affiliateId || null,
      },
      is_read: false,
      created_at: new Date().toISOString(),
    });
  } catch (notifErr) {
    console.warn('⚠️ Failed to create order_paid notification:', notifErr.message);
  }

  return { alreadyPaid: false, order: finalOrder };
}

async function markOrderFailed(order, paymentData = {}) {
  if (order.payment_status === 'paid') {
    return order;
  }

  const { data } = await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
      [COL.reference]: paymentData.reference || order[COL.reference],
      [COL.failure]: paymentData.failure_reason || 'Payment failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .neq('payment_status', 'paid')
    .select('*')
    .single();

  const failedOrder = data || order;

  // Do NOT cancel affiliate commission on payment failure.
  // Customer can retry payment on the same order; cancelling would leave
  // commission stuck and never credit the affiliate after a successful retry.
  console.log(
    `⚠️ Payment failed for ${failedOrder.order_number} — keeping affiliate commission pending for retry`
  );

  return failedOrder;
}

// ---------- Create payment ----------
router.post('/create-payment', async (req, res) => {
  try {
    const {
      order_id,
      payment_type = 'mobile',
      customer_name,
      customer_email,
      customer_phone,
      address,
      city,
    } = req.body;

    if (!order_id) {
      return res.status(400).json({ success: false, error: 'order_id is required' });
    }

    const normalizedType = payment_type === 'card' ? 'card' : 'mobile';

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.payment_status === 'paid') {
      return res.json({
        success: true,
        already_paid: true,
        order_number: order.order_number,
        payment_status: 'paid',
      });
    }

    const amount = Math.round(Number(order.total) || 0);
    if (amount < MIN_AMOUNT_TZS) {
      return res.status(400).json({
        success: false,
        error: `Minimum payment amount is ${MIN_AMOUNT_TZS} TZS`,
      });
    }

    const name = SnippeService.splitName(customer_name || order.customer_name);
    const phone = customer_phone || order.customer_phone;
    const email =
      customer_email ||
      order.customer_email ||
      `order-${order.order_number.toLowerCase()}@believeinablessed.com`;

    const shipping = order.shipping_address || {};
    const redirectUrl = `${FRONTEND_URL}/checkout/success?order=${encodeURIComponent(order.order_number)}`;
    const cancelUrl = `${FRONTEND_URL}/checkout/failure?order=${encodeURIComponent(order.order_number)}`;

    const paymentResult = await snippe.createPayment({
      payment_type: normalizedType,
      details: {
        amount,
        currency: 'TZS',
        ...(normalizedType === 'card'
          ? { redirect_url: redirectUrl, cancel_url: cancelUrl }
          : {}),
      },
      phone_number: phone,
      customer: {
        firstname: name.firstname,
        lastname: name.lastname,
        email,
        address: address || shipping.address || 'Customer Address',
        city: city || shipping.city || 'Dar es Salaam',
        state: 'DSM',
        postcode: '14101',
        country: 'TZ',
      },
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        payment_type: normalizedType,
      },
    });

    if (paymentResult.status !== 'success' || !paymentResult.data?.reference) {
      return res.status(502).json({
        success: false,
        error: paymentResult.message || 'Failed to create Snippe payment',
      });
    }

    const paymentData = paymentResult.data;

    await supabase
      .from('orders')
      .update({
        payment_method: 'snippe',
        [COL.paymentType]: normalizedType,
        [COL.reference]: paymentData.reference,
        [COL.external]: paymentData.external_reference || null,
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    // If Snippe already completed (rare), finalize immediately
    if (paymentData.status === 'completed') {
      await markOrderPaid(order, paymentData);
    } else if (paymentData.status === 'failed') {
      await markOrderFailed(order, paymentData);
    }

    return res.json({
      success: true,
      payment_type: normalizedType,
      reference: paymentData.reference,
      payment_url: paymentData.payment_url || null,
      status: paymentData.status || 'pending',
      order_id: order.id,
      order_number: order.order_number,
      amount,
      expires_at: paymentData.expires_at || null,
    });
  } catch (err) {
    console.error('❌ Snippe create-payment error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to create payment',
    });
  }
});

// ---------- Poll status ----------
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.payment_status === 'paid') {
      // Retry commission confirm if payment succeeded earlier but affiliate credit got stuck
      if (order.affiliate_id && order.commission_status !== 'confirmed') {
        try {
          await confirmOrderCommission(order.id, order.affiliate_id, 'Status poll — paid order retry confirm');
        } catch (affErr) {
          console.error('⚠️ Paid-order commission retry failed:', affErr.message);
        }
      }
      return res.json({
        success: true,
        payment_status: 'paid',
        order_status: order.status,
        order_number: order.order_number,
      });
    }

    const paymentRef = order[COL.reference];
    if (!paymentRef) {
      return res.json({
        success: true,
        payment_status: order.payment_status || 'pending',
        order_number: order.order_number,
      });
    }

    const statusResult = await snippe.getPaymentStatus(paymentRef);

    if (statusResult.status === 'success' && statusResult.data) {
      const snippeStatus = statusResult.data.status;

      if (snippeStatus === 'completed') {
        await markOrderPaid(order, statusResult.data);
        return res.json({
          success: true,
          payment_status: 'paid',
          order_status: 'confirmed',
          order_number: order.order_number,
        });
      }

      if (snippeStatus === 'failed' || snippeStatus === 'expired' || snippeStatus === 'voided') {
        await markOrderFailed(order, statusResult.data);
        return res.json({
          success: true,
          payment_status: 'failed',
          snippe_status: snippeStatus,
          order_number: order.order_number,
          failure_reason: statusResult.data.failure_reason || null,
        });
      }
    }

    return res.json({
      success: true,
      payment_status: order.payment_status || 'pending',
      snippe_status: statusResult.data?.status || 'pending',
      order_number: order.order_number,
    });
  } catch (err) {
    console.error('❌ Snippe status error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- Webhook (mounted with raw body in server.js) ----------
export async function snippeWebhookHandler(req, res) {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const eventHeader = req.headers['x-webhook-event'];

    const rawBody =
      typeof req.rawBody === 'string'
        ? req.rawBody
        : Buffer.isBuffer(req.body)
          ? req.body.toString('utf8')
          : typeof req.body === 'string'
            ? req.body
            : JSON.stringify(req.body || {});

    const webhookSecret = process.env.SNIPPE_WEBHOOK_SECRET;
    if (webhookSecret && signature && timestamp) {
      const eventTime = Number(timestamp);
      const now = Math.floor(Date.now() / 1000);
      if (!Number.isNaN(eventTime) && now - eventTime > 300) {
        return res.status(400).json({ error: 'Webhook timestamp too old' });
      }

      const isValid = SnippeService.verifyWebhookSignature(
        rawBody,
        signature,
        webhookSecret,
        timestamp
      );
      if (!isValid) {
        console.error('❌ Invalid Snippe webhook signature');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    } else if (webhookSecret && (!signature || !timestamp)) {
      console.warn('⚠️ Snippe webhook missing signature headers');
    }

    let event;
    try {
      event = typeof req.body === 'object' && !Buffer.isBuffer(req.body)
        ? req.body
        : JSON.parse(rawBody);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    // Support both 2026-01-25 envelope and legacy flat format
    const eventType = event.type || event.event || eventHeader || '';
    const data = event.data || event;

    console.log('📩 Snippe webhook:', {
      eventType,
      reference: data?.reference,
      status: data?.status,
    });

    // Acknowledge quickly; process below (still sync but fast)
    if (!data?.reference) {
      return res.status(200).json({ received: true, skipped: 'no reference' });
    }

    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq(COL.reference, data.reference)
      .maybeSingle();

    // Fallback: metadata.order_id
    let resolvedOrder = order;
    if (!resolvedOrder && data.metadata?.order_id) {
      const { data: byMeta } = await supabase
        .from('orders')
        .select('*')
        .eq('id', data.metadata.order_id)
        .maybeSingle();
      resolvedOrder = byMeta;
    }

    if (!resolvedOrder) {
      console.warn('⚠️ Snippe webhook: order not found for reference', data.reference);
      return res.status(200).json({ received: true, skipped: 'order not found' });
    }

    if (
      eventType === 'payment.completed' ||
      data.status === 'completed'
    ) {
      await markOrderPaid(resolvedOrder, data);
    } else if (
      eventType === 'payment.failed' ||
      eventType === 'payment.expired' ||
      eventType === 'payment.voided' ||
      data.status === 'failed' ||
      data.status === 'expired' ||
      data.status === 'voided'
    ) {
      await markOrderFailed(resolvedOrder, data);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Snippe webhook error:', err);
    // Still return 200 to avoid endless retries for application bugs;
    // return 500 only for transient issues if needed.
    return res.status(200).json({ received: true, error: err.message });
  }
}

// Webhook is mounted in server.js with express.raw() for signature verification.
// Do not register it here — JSON body parsing would break HMAC checks.

export default router;
