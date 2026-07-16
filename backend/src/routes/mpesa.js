// backend/routes/mpesa.js - M-Pesa Payment Integration
import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import supabase from '../config/supabase.js';

const router = express.Router();

// M-Pesa Configuration
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passkey: process.env.MPESA_PASSKEY,
  shortcode: process.env.MPESA_SHORTCODE || '174379',
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox', // 'sandbox' or 'production'
  callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/mpesa/callback'
};

// Get OAuth Token
async function getMpesaToken() {
  try {
    const auth = Buffer.from(
      `${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`
    ).toString('base64');

    const url = MPESA_CONFIG.environment === 'production'
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    return response.data.access_token;
  } catch (error) {
    console.error('❌ Error getting M-Pesa token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with M-Pesa');
  }
}

// STK Push (Lipa Na M-Pesa Online)
router.post('/stk-push', async (req, res) => {
  try {
    const { phoneNumber, amount, orderId, orderNumber } = req.body;

    console.log('📱 Initiating M-Pesa STK Push:', { phoneNumber, amount, orderId });

    // Validate inputs
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Format phone number (remove +, 0, and non-numeric characters)
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    if (formattedPhone.startsWith('254')) {
      formattedPhone = formattedPhone.substring(3);
    }
    // Ensure it starts with 254 (Kenya) or 255 (Tanzania) - we'll use 254 for M-Pesa
    formattedPhone = '254' + formattedPhone;

    // Get M-Pesa token
    const token = await getMpesaToken();

    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(
      `${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`
    ).toString('base64');

    // Prepare STK Push request
    const url = MPESA_CONFIG.environment === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const stkData = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: MPESA_CONFIG.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CONFIG.callbackUrl,
      AccountReference: orderNumber || `BIB${Date.now()}`,
      TransactionDesc: `Payment for order ${orderNumber || orderId}`,
    };

    console.log('📤 Sending STK Push request:', { 
      PhoneNumber: stkData.PhoneNumber, 
      Amount: stkData.Amount,
      AccountReference: stkData.AccountReference 
    });

    const response = await axios.post(url, stkData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ STK Push response:', response.data);

    // Save transaction to database
    const { data: transaction, error: txError } = await supabase
      .from('mpesa_transactions')
      .insert({
        order_id: orderId,
        order_number: orderNumber,
        phone_number: formattedPhone,
        amount: Math.round(amount),
        merchant_request_id: response.data.MerchantRequestID,
        checkout_request_id: response.data.CheckoutRequestID,
        response_code: response.data.ResponseCode,
        response_description: response.data.ResponseDescription,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (txError) {
      console.error('Error saving transaction:', txError);
    }

    res.json({
      success: true,
      message: 'STK Push sent successfully',
      data: {
        merchantRequestId: response.data.MerchantRequestID,
        checkoutRequestId: response.data.CheckoutRequestID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        transactionId: transaction?.id
      }
    });

  } catch (error) {
    console.error('❌ M-Pesa STK Push error:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to initiate M-Pesa payment. Please try again.';
    
    if (error.response?.data?.ResponseDescription) {
      errorMessage = error.response.data.ResponseDescription;
    } else if (error.response?.data?.errorMessage) {
      errorMessage = error.response.data.errorMessage;
    }

    res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.response?.data : undefined
    });
  }
});

// M-Pesa Callback URL
router.post('/callback', async (req, res) => {
  try {
    console.log('📥 M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

    const { Body } = req.body;
    
    if (!Body || !Body.stkCallback) {
      console.log('⚠️ Invalid callback data');
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Callback received but no data' });
    }

    const { 
      MerchantRequestID, 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc,
      CallbackMetadata
    } = Body.stkCallback;

    console.log(`📊 Callback: ${CheckoutRequestID}, Result: ${ResultCode}, ${ResultDesc}`);

    // Find transaction
    const { data: transaction, error: findError } = await supabase
      .from('mpesa_transactions')
      .select('*')
      .eq('checkout_request_id', CheckoutRequestID)
      .single();

    if (findError || !transaction) {
      console.error('❌ Transaction not found:', CheckoutRequestID);
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Transaction not found' });
    }

    // Update transaction
    const updateData = {
      result_code: ResultCode,
      result_description: ResultDesc,
      updated_at: new Date().toISOString()
    };

    let paymentSuccessful = false;
    let mpesaReceiptNumber = null;
    let transactionAmount = transaction.amount;

    // Parse metadata if payment was successful
    if (ResultCode === 0 && CallbackMetadata) {
      const metadata = CallbackMetadata.Item;
      
      for (const item of metadata) {
        if (item.Name === 'MpesaReceiptNumber') {
          mpesaReceiptNumber = item.Value;
        } else if (item.Name === 'Amount') {
          transactionAmount = item.Value;
        }
      }

      paymentSuccessful = true;
      updateData.mpesa_receipt_number = mpesaReceiptNumber;
      updateData.amount = transactionAmount;
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();

      console.log(`✅ Payment successful! Receipt: ${mpesaReceiptNumber}, Amount: ${transactionAmount}`);
    } else {
      updateData.status = 'failed';
      updateData.failed_at = new Date().toISOString();
      console.log(`❌ Payment failed: ${ResultDesc}`);
    }

    // Update transaction
    const { error: updateError } = await supabase
      .from('mpesa_transactions')
      .update(updateData)
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
    }

    // If payment successful, update order
    if (paymentSuccessful && transaction.order_id) {
      console.log(`📝 Updating order ${transaction.order_id} to paid`);

      // Update order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          mpesa_receipt_number: mpesaReceiptNumber,
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.order_id)
        .select()
        .single();

      if (orderError) {
        console.error('Error updating order:', orderError);
      } else {
        console.log(`✅ Order ${order.order_number} updated to confirmed`);

        // Create notification for admin
        await supabase
          .from('notifications')
          .insert({
            type: 'order_paid',
            title: `💳 Order ${order.order_number} - Paid via M-Pesa`,
            message: `Order ${order.order_number} has been paid successfully via M-Pesa. Receipt: ${mpesaReceiptNumber}`,
            link: `/admin/orders`,
            data: {
              order_id: order.id,
              order_number: order.order_number,
              payment_method: 'mpesa'
            },
            created_at: new Date().toISOString()
          });
      }
    }

    // Always return success to M-Pesa
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Callback processed successfully' });

  } catch (error) {
    console.error('❌ Callback processing error:', error);
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Callback processed with error' });
  }
});

// Check transaction status
router.get('/status/:checkoutRequestId', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    if (!checkoutRequestId) {
      return res.status(400).json({ error: 'Checkout request ID is required' });
    }

    // Get transaction from database
    const { data: transaction, error } = await supabase
      .from('mpesa_transactions')
      .select('*')
      .eq('checkout_request_id', checkoutRequestId)
      .single();

    if (error || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      status: transaction.status,
      result_code: transaction.result_code,
      result_description: transaction.result_description,
      mpesa_receipt_number: transaction.mpesa_receipt_number,
      amount: transaction.amount,
      completed_at: transaction.completed_at
    });

  } catch (error) {
    console.error('Error checking transaction status:', error);
    res.status(500).json({ error: 'Failed to check transaction status' });
  }
});

export default router;