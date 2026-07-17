// backend/src/routes/pesapal.js - Direct API Integration (hardened)
import express from 'express';
import axios from 'axios';
import supabase from '../config/supabase.js';

const router = express.Router();

// ==================== CONFIG ====================
const PESAPAL_CONFIG = {
  consumerKey: process.env.PESAPAL_CONSUMER_KEY,
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET,
  environment: (process.env.PESAPAL_ENVIRONMENT || 'sandbox').trim(),
  // IMPORTANT: these MUST point at THIS backend (not the frontend domain),
  // because /callback and /ipn below only exist on the backend.
  callbackUrl: process.env.PESAPAL_CALLBACK_URL,
  ipnUrl: process.env.PESAPAL_IPN_URL,
  // Where to send the shopper's browser after we've processed the callback.
  frontendUrl: (process.env.FRONTEND_URL || '').replace(/\/$/, ''),
};

// Cache the IPN id in-memory for the life of the process so we don't
// re-register a new IPN on every single checkout (Pesapal sandbox rate
// limits repeated IPN registration and this was silently causing
// SubmitOrderRequest to be sent with notification_id=null -> 500 error).
let cachedIpnId = process.env.PESAPAL_IPN_ID || null;

function isConfigured() {
  return Boolean(PESAPAL_CONFIG.consumerKey && PESAPAL_CONFIG.consumerSecret);
}

function getApiUrls() {
  if (PESAPAL_CONFIG.environment === 'production' || PESAPAL_CONFIG.environment === 'live') {
    // NOTE: production auth lives on the SAME host as the rest of the v3 API.
    // (identity.pesapal.com is not a valid Pesapal v3 host - using it causes
    // every production auth request to fail.)
    return {
      base: 'https://pay.pesapal.com/v3',
      auth: 'https://pay.pesapal.com/v3',
    };
  }
  return {
    base: 'https://cybqa.pesapal.com/pesapalv3',
    auth: 'https://cybqa.pesapal.com/pesapalv3',
  };
}

// Pull a readable string out of whatever shape Pesapal's error responses take.
// Pesapal often returns `{ error: { type, code, message }, status, message }`
// -- error.response.data.error is an OBJECT, not a string. Previously this
// object was being pushed straight into `new Error(...)` on the frontend,
// which is why the browser only ever showed "[object Object]".
function extractPesapalErrorMessage(error, fallback) {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;

  if (typeof data.error === 'string') return data.error;
  if (data.error && typeof data.error === 'object') {
    return data.error.message || data.error.code || data.error.type || fallback;
  }
  if (typeof data.message === 'string' && data.message) return data.message;
  if (typeof data.error_description === 'string') return data.error_description;
  return fallback;
}

// Get OAuth Token
async function getPesapalToken() {
  if (!isConfigured()) {
    const err = new Error('Pesapal is not configured on the server (missing PESAPAL_CONSUMER_KEY/SECRET).');
    err.code = 'PESAPAL_NOT_CONFIGURED';
    throw err;
  }

  try {
    const urls = getApiUrls();

    console.log('🔑 Getting Pesapal token...');
    console.log('   Environment:', PESAPAL_CONFIG.environment);
    console.log('   Consumer Key:', PESAPAL_CONFIG.consumerKey?.substring(0, 6) + '...');

    const response = await axios.post(
      `${urls.auth}/api/Auth/RequestToken`,
      {
        consumer_key: PESAPAL_CONFIG.consumerKey,
        consumer_secret: PESAPAL_CONFIG.consumerSecret,
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    if (!response.data?.token) {
      console.error('❌ Pesapal auth responded without a token:', response.data);
      throw new Error(extractPesapalErrorMessage({ response }, 'Pesapal did not return an access token. Check that your consumer key/secret match the selected environment (sandbox vs production).'));
    }

    console.log('✅ Pesapal token obtained');
    return response.data.token;
  } catch (error) {
    if (error.code === 'PESAPAL_NOT_CONFIGURED') throw error;
    console.error('❌ Error getting Pesapal token:', error.response?.status, error.response?.data || error.message);
    const message = extractPesapalErrorMessage(error, 'Failed to authenticate with Pesapal. Verify PESAPAL_CONSUMER_KEY / PESAPAL_CONSUMER_SECRET and PESAPAL_ENVIRONMENT.');
    const wrapped = new Error(message);
    wrapped.status = error.response?.status;
    throw wrapped;
  }
}

// Register IPN (Instant Payment Notification) - only once, then cached.
async function getOrRegisterIPN(token, fallbackIpnUrl) {
  if (cachedIpnId) return cachedIpnId;

  const ipnUrl = PESAPAL_CONFIG.ipnUrl || fallbackIpnUrl;
  if (!ipnUrl) {
    const err = new Error('PESAPAL_IPN_URL is not set. It must be a public HTTPS URL pointing at this backend, e.g. https://your-api-domain.com/api/pesapal/ipn');
    err.code = 'PESAPAL_IPN_URL_MISSING';
    throw err;
  }
  if (!PESAPAL_CONFIG.ipnUrl) {
    console.warn(`⚠️ PESAPAL_IPN_URL is not set as an env var - falling back to ${ipnUrl}. Set it explicitly with: fly secrets set PESAPAL_IPN_URL=${ipnUrl}`);
  }

  try {
    const urls = getApiUrls();

    // Re-use an already-registered IPN if Pesapal already has one for this URL,
    // instead of creating a new one on every deploy/restart.
    try {
      const list = await axios.get(`${urls.base}/api/URLSetup/GetIpnList`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        timeout: 15000,
      });
      const existing = Array.isArray(list.data)
        ? list.data.find((ipn) => ipn.url === ipnUrl)
        : null;
      if (existing?.ipn_id) {
        console.log('♻️  Reusing existing Pesapal IPN registration:', existing.ipn_id);
        cachedIpnId = existing.ipn_id;
        return cachedIpnId;
      }
    } catch (listErr) {
      console.warn('⚠️ Could not fetch existing IPN list, will attempt fresh registration:', listErr.response?.data || listErr.message);
    }

    console.log('📝 Registering IPN with Pesapal:', ipnUrl);

    const response = await axios.post(
      `${urls.base}/api/URLSetup/RegisterIPN`,
      {
        url: ipnUrl,
        ipn_notification_type: 'POST',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    if (!response.data?.ipn_id) {
      console.error('❌ Pesapal RegisterIPN responded without an ipn_id:', response.data);
      const err = new Error('Pesapal rejected the IPN registration. Make sure PESAPAL_IPN_URL is publicly reachable over HTTPS.');
      err.code = 'PESAPAL_IPN_REGISTER_FAILED';
      throw err;
    }

    console.log('✅ IPN registered:', response.data.ipn_id);
    cachedIpnId = response.data.ipn_id;
    return cachedIpnId;
  } catch (error) {
    if (error.code === 'PESAPAL_IPN_URL_MISSING' || error.code === 'PESAPAL_IPN_REGISTER_FAILED') throw error;
    console.error('❌ Error registering IPN:', error.response?.data || error.message);
    const message = extractPesapalErrorMessage(error, 'Failed to register the IPN URL with Pesapal.');
    const wrapped = new Error(message);
    wrapped.code = 'PESAPAL_IPN_REGISTER_FAILED';
    throw wrapped;
  }
}

// ==================== PAYMENT METHODS (fixes the 404 the frontend was hitting) ====================
// Pesapal doesn't expose a "list payment methods" API - the choices shown to the
// shopper are whatever is enabled on your Pesapal merchant account (Settings ->
// Payment methods on the Pesapal dashboard). This endpoint just tells the frontend
// what to *display* as badges, and whether Pesapal is even configured.
router.get('/payment-methods', (req, res) => {
  res.json({
    success: true,
    configured: isConfigured(),
    environment: PESAPAL_CONFIG.environment,
    paymentMethods: [
      { id: 'mpesa', name: 'M-Pesa', type: 'mobile_money' },
      { id: 'airtel_money', name: 'Airtel Money', type: 'mobile_money' },
      { id: 'tigo_pesa', name: 'Tigo Pesa', type: 'mobile_money' },
      { id: 'halopesa', name: 'HaloPesa', type: 'mobile_money' },
      { id: 'card', name: 'Visa / Mastercard', type: 'card' },
    ],
  });
});

// Create Payment Order
router.post('/create-order', async (req, res) => {
  try {
    const {
      amount,
      currency = 'TZS',
      orderId,
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      description,
    } = req.body;

    console.log('📦 Creating Pesapal order:', { amount, currency, orderId, orderNumber });

    if (!isConfigured()) {
      return res.status(500).json({
        error: 'Pesapal is not configured on the server. Set PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET.',
      });
    }

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // PESAPAL_CALLBACK_URL should be set as an env var, but if it's missing
    // (e.g. it wasn't set as a Fly secret yet) derive it from the request
    // itself rather than hard-failing the whole payment.
    const callbackUrl = PESAPAL_CONFIG.callbackUrl || `${req.protocol}://${req.get('host')}/api/pesapal/callback`;
    if (!PESAPAL_CONFIG.callbackUrl) {
      console.warn(`⚠️ PESAPAL_CALLBACK_URL is not set as an env var - falling back to ${callbackUrl}. Set it explicitly with: fly secrets set PESAPAL_CALLBACK_URL=${callbackUrl}`);
    }

    const token = await getPesapalToken();
    const ipnId = await getOrRegisterIPN(token, `${req.protocol}://${req.get('host')}/api/pesapal/ipn`);
    const urls = getApiUrls();

    const orderData = {
      id: orderNumber || `ORDER-${Date.now()}`,
      currency,
      amount: Math.round(amount),
      description: description || `Order ${orderNumber || orderId}`,
      callback_url: callbackUrl,
      notification_id: ipnId,
      billing_address: {
        email_address: customerEmail || 'customer@example.com',
        phone_number: customerPhone || '0000000000',
        country_code: 'TZ',
        first_name: customerName?.split(' ')[0] || 'Customer',
        last_name: customerName?.split(' ').slice(1).join(' ') || 'Name',
      },
    };

    console.log('📤 Sending order to Pesapal:', { ...orderData, notification_id: ipnId });

    const response = await axios.post(
      `${urls.base}/api/Transactions/SubmitOrderRequest`,
      orderData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    if (response.data?.error) {
      // Pesapal replies 200 OK but embeds the failure in the body sometimes.
      throw { response: { data: response.data } };
    }

    console.log('✅ Pesapal order created:', response.data);

    const { data: transaction, error: txError } = await supabase
      .from('pesapal_transactions')
      .insert({
        order_id: orderId,
        order_number: orderNumber,
        pesapal_order_tracking_id: response.data.order_tracking_id,
        pesapal_merchant_reference: response.data.merchant_reference,
        amount: Math.round(amount),
        currency,
        status: 'pending',
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError) {
      console.error('⚠️ Order created on Pesapal but failed to save local transaction row:', txError.message);
    }

    res.json({
      success: true,
      data: {
        orderTrackingId: response.data.order_tracking_id,
        merchantReference: response.data.merchant_reference,
        redirectUrl: response.data.redirect_url,
        transactionId: transaction?.id,
      },
    });
  } catch (error) {
    console.error('❌ Pesapal order creation error:', error.response?.status, JSON.stringify(error.response?.data || error.message));

    const errorMessage = extractPesapalErrorMessage(
      error,
      error.message || 'Failed to create payment. Please try again or choose a different payment method.'
    );

    res.status(error.status || 500).json({
      error: errorMessage,
      code: error.code,
      details: process.env.NODE_ENV === 'development'
        ? { message: error.message, response: error.response?.data }
        : undefined,
    });
  }
});

// Get Order Status
router.get('/order-status/:orderTrackingId', async (req, res) => {
  try {
    const { orderTrackingId } = req.params;
    if (!orderTrackingId) return res.status(400).json({ error: 'Order tracking ID is required' });

    const token = await getPesapalToken();
    const urls = getApiUrls();

    const response = await axios.get(`${urls.base}/api/Transactions/GetTransactionStatus`, {
      params: { orderTrackingId },
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    console.log('✅ Order status:', response.data);

    const { data: transaction } = await supabase
      .from('pesapal_transactions')
      .update({
        status: response.data.status,
        payment_status: response.data.payment_status,
        payment_method: response.data.payment_method,
        payment_reference: response.data.payment_reference,
        updated_at: new Date().toISOString(),
      })
      .eq('pesapal_order_tracking_id', orderTrackingId)
      .select()
      .single();

    // Keep the order row in sync too, in case the IPN never arrived.
    if (response.data.payment_status === 'COMPLETED' || response.data.status === 'COMPLETED') {
      if (transaction?.order_id) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            payment_method: mapPesapalMethod(response.data.payment_method),
            pesapal_order_tracking_id: orderTrackingId,
            pesapal_payment_reference: response.data.payment_reference,
            status: 'confirmed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.order_id)
          .neq('payment_status', 'paid');
      }
    }

    res.json({
      status: response.data.status,
      payment_status: response.data.payment_status,
      payment_method: response.data.payment_method,
      payment_reference: response.data.payment_reference,
      transaction,
    });
  } catch (error) {
    console.error('❌ Error checking order status:', error.response?.data || error.message);
    res.status(500).json({ error: extractPesapalErrorMessage(error, 'Failed to check order status') });
  }
});

// Normalise Pesapal's free-text payment_method (e.g. "M-PESA", "Airtel Money",
// "Visa") into the same values used elsewhere in the admin (mpesa, airtel_money,
// tigo_pesa, card) so admin filtering/reporting is consistent across gateways.
function mapPesapalMethod(raw) {
  const m = (raw || '').toLowerCase();
  if (m.includes('mpesa') || m.includes('m-pesa')) return 'mpesa';
  if (m.includes('airtel')) return 'airtel_money';
  if (m.includes('tigo')) return 'tigo_pesa';
  if (m.includes('halo')) return 'halopesa';
  if (m.includes('visa') || m.includes('master') || m.includes('card')) return 'card';
  return 'pesapal';
}

// IPN (Instant Payment Notification) Webhook
router.post('/ipn', async (req, res) => {
  try {
    console.log('📥 Pesapal IPN received:', JSON.stringify(req.body, null, 2));

    const {
      orderTrackingId,
      merchantReference,
      status,
      paymentStatus,
      paymentMethod,
      paymentReference,
    } = { ...req.body, ...req.query }; // Pesapal sends these as query params on some accounts

    if (!orderTrackingId) {
      console.log('⚠️ Invalid IPN data - no order tracking ID');
      return res.status(200).json({ status: 'success' });
    }

    const { data: transaction, error: findError } = await supabase
      .from('pesapal_transactions')
      .select('*')
      .eq('pesapal_order_tracking_id', orderTrackingId)
      .single();

    if (findError || !transaction) {
      console.error('❌ Transaction not found:', orderTrackingId);
      return res.status(200).json({ status: 'success' });
    }

    const normalizedMethod = mapPesapalMethod(paymentMethod);

    const updateData = {
      status: status || transaction.status,
      payment_status: paymentStatus || transaction.payment_status,
      payment_method: paymentMethod || transaction.payment_method,
      payment_reference: paymentReference || transaction.payment_reference,
      updated_at: new Date().toISOString(),
    };

    let paymentSuccessful = false;
    if (paymentStatus === 'COMPLETED' || status === 'COMPLETED') {
      paymentSuccessful = true;
      updateData.completed_at = new Date().toISOString();
    } else if (paymentStatus === 'FAILED' || status === 'FAILED') {
      updateData.failed_at = new Date().toISOString();
    }

    await supabase.from('pesapal_transactions').update(updateData).eq('id', transaction.id);

    if (paymentSuccessful && transaction.order_id) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_method: normalizedMethod, // so admin can filter by mpesa / airtel_money / tigo_pesa / card
          pesapal_order_tracking_id: orderTrackingId,
          pesapal_payment_reference: paymentReference,
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.order_id)
        .select()
        .single();

      if (orderError) {
        console.error('Error updating order:', orderError);
      } else {
        await supabase.from('notifications').insert({
          type: 'order_paid',
          title: `💳 Order ${order.order_number} - Paid via ${paymentMethod || 'Pesapal'}`,
          message: `Order ${order.order_number} has been paid successfully via ${paymentMethod || 'Pesapal'}.`,
          link: `/admin/orders`,
          data: {
            order_id: order.id,
            order_number: order.order_number,
            payment_method: normalizedMethod,
            payment_reference: paymentReference,
          },
          created_at: new Date().toISOString(),
        });
      }
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('❌ IPN processing error:', error);
    res.status(200).json({ status: 'success' });
  }
});

// Callback URL (browser redirect after payment). This route lives on the
// BACKEND (that's what PESAPAL_CALLBACK_URL points to), so it must redirect
// with an ABSOLUTE frontend URL - a relative res.redirect('/checkout/success')
// would send the shopper's browser to a route that doesn't exist on the API host.
router.get('/callback', async (req, res) => {
  try {
    const { orderTrackingId, orderMerchantReference, status, payment_status } = req.query;
    console.log('📥 Pesapal Callback:', { orderTrackingId, status, payment_status });

    if (!orderTrackingId) {
      return res.redirect(`${PESAPAL_CONFIG.frontendUrl}/checkout?error=missing_tracking_id`);
    }

    const { data: transaction } = await supabase
      .from('pesapal_transactions')
      .select('*')
      .eq('pesapal_order_tracking_id', orderTrackingId)
      .single();

    // Always double check with Pesapal directly rather than trusting the query
    // string alone (the callback params can be unreliable / omitted).
    let finalStatus = status || payment_status;
    try {
      const token = await getPesapalToken();
      const urls = getApiUrls();
      const statusResp = await axios.get(`${urls.base}/api/Transactions/GetTransactionStatus`, {
        params: { orderTrackingId },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });
      finalStatus = statusResp.data?.payment_status || statusResp.data?.status || finalStatus;

      if (transaction) {
        await supabase
          .from('pesapal_transactions')
          .update({
            status: statusResp.data?.status || transaction.status,
            payment_status: finalStatus,
            payment_method: statusResp.data?.payment_method || transaction.payment_method,
            payment_reference: statusResp.data?.payment_reference || transaction.payment_reference,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);

        if (finalStatus === 'COMPLETED' && transaction.order_id) {
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              payment_method: mapPesapalMethod(statusResp.data?.payment_method),
              status: 'confirmed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', transaction.order_id)
            .neq('payment_status', 'paid');
        }
      }
    } catch (statusErr) {
      console.warn('⚠️ Could not re-verify status on callback, falling back to query params:', statusErr.message);
    }

    const orderRef = transaction?.order_number || orderMerchantReference || '';
    if (finalStatus === 'COMPLETED') {
      return res.redirect(`${PESAPAL_CONFIG.frontendUrl}/checkout/success?order=${encodeURIComponent(orderRef)}`);
    }
    return res.redirect(`${PESAPAL_CONFIG.frontendUrl}/checkout/failure?order=${encodeURIComponent(orderRef)}`);
  } catch (error) {
    console.error('❌ Callback error:', error);
    return res.redirect(`${PESAPAL_CONFIG.frontendUrl}/checkout?error=callback_failed`);
  }
});

export default router;
