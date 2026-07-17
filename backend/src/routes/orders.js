// backend/routes/orders.js - Fixed CREATE ORDER with fallbacks

import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getAffiliateCurrentTier,
  confirmOrderCommission,
  cancelOrderCommission,
  restoreOrderCommission,
  updateAffiliateTier,
  reconcileAffiliateBalances,
} from '../utils/affiliateCommission.js';

const router = express.Router();

function normalizePhoneDigits(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('255')) return digits;
  if (digits.startsWith('0')) return `255${digits.slice(1)}`;
  return digits;
}

// When a customer retries payment, reuse the same pending order instead of
// creating duplicates that inflate affiliate stats.
async function findReusablePendingOrder(userId, paymentMethod) {
  if (!userId) return null;
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .eq('payment_method', paymentMethod || 'snippe')
    .eq('payment_status', 'pending')
    .neq('status', 'cancelled')
    .gte('created_at', twoHoursAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

// Cancel abandoned unpaid attempts for this customer before creating a new order.
async function cancelStalePendingOrders(customerPhone, paymentMethod, userId) {
  if (!['snippe', 'pesapal', 'mpesa'].includes(paymentMethod)) return;
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const staleIds = new Set();

    if (userId) {
      const { data: byUser } = await supabase
        .from('orders')
        .select('id, affiliate_id, order_number')
        .eq('user_id', userId)
        .eq('payment_method', paymentMethod)
        .eq('payment_status', 'pending')
        .neq('status', 'cancelled')
        .gte('created_at', twoHoursAgo);
      (byUser || []).forEach((row) => staleIds.add(row.id));
    }

    const normalized = normalizePhoneDigits(customerPhone);
    if (normalized) {
      const { data: recent } = await supabase
        .from('orders')
        .select('id, affiliate_id, order_number, customer_phone')
        .eq('payment_method', paymentMethod)
        .eq('payment_status', 'pending')
        .neq('status', 'cancelled')
        .gte('created_at', twoHoursAgo);

      (recent || []).forEach((row) => {
        const rowDigits = normalizePhoneDigits(row.customer_phone);
        if (rowDigits && rowDigits === normalized) staleIds.add(row.id);
      });
    }

    if (!staleIds.size) return;

    for (const staleId of staleIds) {
      const { data: stale } = await supabase
        .from('orders')
        .select('id, affiliate_id, order_number')
        .eq('id', staleId)
        .single();
      if (!stale) continue;

      console.log(`🧹 Auto-cancelling abandoned unpaid order ${stale.order_number} (retry detected)`);
      if (stale.affiliate_id) {
        await cancelOrderCommission(stale.id, stale.affiliate_id, 'Abandoned - customer retried payment');
      }
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'failed',
          cancellation_reason: 'Abandoned - customer retried payment',
          updated_at: new Date().toISOString(),
        })
        .eq('id', stale.id);
    }
  } catch (err) {
    console.error('⚠️ cancelStalePendingOrders error (non-fatal):', err.message);
  }
}

// ==================== CREATE ORDER - FIXED ====================
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      items,
      customer_name, customer_email, customer_phone,
      shipping_address, payment_method,
      coupon_code, referral_code,
      country_code, country_name, customer_phone_local
    } = req.body;

    console.log('📦 Creating order with data:', { 
      items: items?.length, 
      customer_name, 
      payment_method,
      country_code,
      referral_code: referral_code || null,
      user_id: req.user?.id || null,
    });

    if (!items?.length) return res.status(400).json({ error: 'No items in order' });
    if (!customer_name || !customer_phone) return res.status(400).json({ error: 'Customer info required' });

    const paymentMethod = payment_method || 'snippe';

    // Reuse existing unpaid order on payment retry (prevents duplicate rows)
    const reusableOrder = await findReusablePendingOrder(req.user.id, paymentMethod);
    if (reusableOrder) {
      const { data: updatedOrder, error: reuseError } = await supabase
        .from('orders')
        .update({
          customer_name,
          customer_email: customer_email || null,
          customer_phone,
          shipping_address: shipping_address || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reusableOrder.id)
        .select()
        .single();

      if (!reuseError && updatedOrder) {
        console.log(`♻️ Reusing pending order ${updatedOrder.order_number} for payment retry`);
        return res.status(200).json({
          order: updatedOrder,
          order_number: updatedOrder.order_number,
          reused: true,
          message: 'Resuming your pending order. Complete payment to finish checkout.',
        });
      }
    }

    await cancelStalePendingOrders(customer_phone, paymentMethod, req.user.id);


    let subtotal = 0;
    const enrichedItems = [];

    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('id,name,price,sale_price,stock,images,commission_rate,sizes,colors')
        .eq('id', item.product_id)
        .single();

      if (!product) return res.status(400).json({ error: `Product ${item.product_id} not found` });
      if (product.stock < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });

      const size = item.size || item.selected_size || null;
      const color = item.color || item.selected_color || null;
      if (Array.isArray(product.sizes) && product.sizes.length > 0 && !size) {
        return res.status(400).json({ error: `Size is required for ${product.name}` });
      }
      if (Array.isArray(product.colors) && product.colors.length > 0 && !color) {
        return res.status(400).json({ error: `Color is required for ${product.name}` });
      }

      const unitPrice = product.sale_price || product.price;
      subtotal += unitPrice * item.quantity;
      enrichedItems.push({
        product_id: product.id,
        quantity: Number(item.quantity) || 1,
        size,
        color,
        unit_price: unitPrice,
        product_name: product.name,
        commission_rate: product.commission_rate || 10,
      });
    }

    let discount = 0;
    if (coupon_code) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (coupon && new Date(coupon.expires_at) > new Date()) {
        discount = coupon.type === 'percent'
          ? (subtotal * coupon.value) / 100
          : coupon.value;
        discount = Math.min(discount, subtotal);
      }
    }

    const total = subtotal - discount;
    const orderNumber = `BIB${Date.now()}`;

    let affiliateId = null;
    let affiliateInfo = null;
    let affiliateTier = 'bronze';
    const normalizedRef = String(referral_code || '').trim();
    
    if (normalizedRef) {
      // Case-insensitive referral match
      const { data: affRows, error: affError } = await supabase
        .from('users')
        .select('id, name, email, referral_code, affiliate_level, total_earnings, pending_earnings, withdrawable_balance')
        .ilike('referral_code', normalizedRef)
        .eq('affiliate_approved', true)
        .eq('status', 'active')
        .limit(1);
      
      const aff = affRows?.[0];
      if (!affError && aff) {
        // Don't attribute commission to yourself
        if (aff.id !== req.user?.id) {
          affiliateId = aff.id;
          affiliateInfo = aff;
          affiliateTier = aff.affiliate_level || 'bronze';
          console.log(`🔗 Affiliate found: ${aff.name} (${aff.referral_code})`);
        } else {
          console.log('⚠️ Skipping self-referral for user', req.user.id);
        }
      } else {
        console.warn('⚠️ Referral code not matched:', normalizedRef, affError?.message);
      }
    }

    // Build order data with only fields that exist
    const orderData = {
      order_number: orderNumber,
      customer_name,
      customer_email: customer_email || null,
      customer_phone,
      shipping_address: shipping_address || null,
      items: enrichedItems,
      subtotal,
      discount,
      total,
      payment_method: payment_method || 'snippe',
      status: 'pending',
      affiliate_id: affiliateId,
      referral_code: affiliateInfo?.referral_code || normalizedRef || null,
      user_id: req.user.id,
      affiliate_name: affiliateInfo?.name || null,
      affiliate_email: affiliateInfo?.email || null,
      commission_status: 'pending',
      commission_total: 0,
      affiliate_tier: affiliateTier,
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add optional fields if they exist in the request
    if (country_code) orderData.country_code = country_code;
    if (country_name) orderData.country_name = country_name;
    if (customer_phone_local) orderData.customer_phone_local = customer_phone_local;

    console.log('📦 Order data to insert:', { ...orderData, items: `${orderData.items?.length} items` });

    const { data: order, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error('Order creation error:', error);
      return res.status(500).json({ 
        error: 'Failed to create order: ' + error.message,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }

    // Reduce stock
    for (const item of enrichedItems) {
      await supabase.rpc('decrement_stock', { product_id: item.product_id, qty: item.quantity });
    }

    // Handle affiliate commission
    if (affiliateId && affiliateInfo) {
      let totalCommission = 0;
      const currentTier = await getAffiliateCurrentTier(affiliateId);
      
      for (const item of enrichedItems) {
        const commission = (item.unit_price * item.quantity * currentTier.commission_rate) / 100;
        totalCommission += commission;
        
        await supabase
          .from('affiliate_orders')
          .insert({
            affiliate_id: affiliateId,
            order_id: order.id,
            product_id: item.product_id,
            order_amount: item.unit_price * item.quantity,
            commission: commission,
            status: 'pending',
            referral_code: affiliateInfo?.referral_code || normalizedRef,
            product_name: item.product_name,
            commission_rate: currentTier.commission_rate,
            tier_at_time: currentTier.level,
            is_confirmed: false,
            created_at: new Date().toISOString()
          });
      }

      if (totalCommission > 0) {
        const { data: userData } = await supabase
          .from('users')
          .select('pending_earnings')
          .eq('id', affiliateId)
          .single();

        const currentPending = userData?.pending_earnings || 0;
        const newPending = currentPending + totalCommission;

        await supabase
          .from('users')
          .update({
            pending_earnings: newPending,
            updated_at: new Date().toISOString()
          })
          .eq('id', affiliateId);

        await supabase
          .from('orders')
          .update({
            commission_total: totalCommission,
            commission_status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        order.commission_total = totalCommission;
        order.commission_status = 'pending';
      }
    }

    res.status(201).json({ 
      order, 
      order_number: orderNumber,
      affiliate: affiliateInfo ? {
        id: affiliateInfo.id,
        name: affiliateInfo.name,
        referral_code: affiliateInfo.referral_code
      } : null,
      message: 'Order placed successfully! Awaiting admin confirmation.'
    });
  } catch (err) {
    console.error('❌ Order creation error:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to place order',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ==================== ADMIN UPDATE ORDER ====================
router.put('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellation_reason, payment_status } = req.body;

    console.log(`📝 Updating order ${id}`, { status, payment_status });

    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingOrder) {
      console.error('Error fetching order:', fetchError);
      return res.status(404).json({ error: 'Order not found' });
    }

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined && status !== null && status !== '') {
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      // Once delivered, do not allow cancel
      if (status === 'cancelled' && existingOrder.status === 'delivered') {
        return res.status(400).json({
          error: 'This order has already been delivered and cannot be cancelled. Handle it as a return/refund instead.',
        });
      }

      updateData.status = status;
      if (status === 'cancelled') {
        updateData.cancellation_reason = cancellation_reason || 'Order cancelled by admin';
      }
    }

    if (payment_status !== undefined && payment_status !== null && payment_status !== '') {
      const validPayments = ['pending', 'paid', 'failed', 'verifying', 'refunded'];
      if (!validPayments.includes(payment_status)) {
        return res.status(400).json({ error: 'Invalid payment status' });
      }
      updateData.payment_status = payment_status;
    }

    if (Object.keys(updateData).length <= 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    console.log(`📦 Order: ${existingOrder.order_number}, current: ${existingOrder.status}/${existingOrder.payment_status}, affiliate: ${existingOrder.affiliate_id}`);

    const nextStatus = updateData.status ?? existingOrder.status;
    const nextPayment = updateData.payment_status ?? existingOrder.payment_status;
    const hasAffiliate = !!existingOrder.affiliate_id;

    // Affiliate commission side-effects (before writing order, so balances stay consistent)
    if (hasAffiliate) {
      const becomingDelivered = nextStatus === 'delivered' && existingOrder.status !== 'delivered';
      const becomingConfirmedPaid =
        (nextStatus === 'confirmed' || nextPayment === 'paid') &&
        existingOrder.status !== 'cancelled' &&
        nextStatus !== 'cancelled';
      const becomingCancelled = nextStatus === 'cancelled' && existingOrder.status !== 'cancelled';
      const restoringFromCancel = nextStatus !== 'cancelled' && existingOrder.status === 'cancelled';

      if (becomingCancelled) {
        console.log(`❌ CANCELLED: Cancelling commission for order ${id}`);
        await cancelOrderCommission(id, existingOrder.affiliate_id, cancellation_reason);
        await reconcileAffiliateBalances(existingOrder.affiliate_id);
      } else if (restoringFromCancel) {
        console.log(`🔄 RESTORING: Restoring commission for order ${id}`);
        await restoreOrderCommission(id, existingOrder.affiliate_id);
        if (becomingDelivered || nextPayment === 'paid' || nextStatus === 'confirmed') {
          await confirmOrderCommission(id, existingOrder.affiliate_id, 'Admin restored + confirmed order');
        }
        await reconcileAffiliateBalances(existingOrder.affiliate_id);
      } else if (becomingDelivered || (becomingConfirmedPaid && (nextPayment === 'paid' || becomingDelivered))) {
        console.log(`💰 CONFIRMING commission for order ${id}`);
        await confirmOrderCommission(id, existingOrder.affiliate_id, 'Admin order update');
        await reconcileAffiliateBalances(existingOrder.affiliate_id);
      }
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        affiliate:affiliate_id (
          id,
          name,
          email,
          referral_code,
          affiliate_level
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return res.status(500).json({ error: 'Failed to update order: ' + updateError.message });
    }

    if (hasAffiliate) {
      const updatedTier = await updateAffiliateTier(existingOrder.affiliate_id);
      await supabase
        .from('orders')
        .update({
          affiliate_tier: updatedTier.level,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    const { data: finalOrder } = await supabase
      .from('orders')
      .select(`
        *,
        affiliate:affiliate_id (
          id,
          name,
          email,
          referral_code,
          affiliate_level
        )
      `)
      .eq('id', id)
      .single();

    const order = finalOrder || updatedOrder;
    console.log(`✅ Order ${id} updated to status=${order.status} payment=${order.payment_status}`);

    res.json({
      success: true,
      message: `Order updated successfully`,
      order: {
        ...order,
        affiliate_name: order.affiliate?.name || order.affiliate_name || null,
        affiliate_email: order.affiliate?.email || order.affiliate_email || null,
        affiliate_referral_code: order.affiliate?.referral_code || order.referral_code || null,
        affiliate_tier: order.affiliate?.affiliate_level || order.affiliate_tier || null,
      },
    });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({
      error: err.message || 'Failed to update order',
    });
  }
});

// ==================== GET ORDERS ====================

router.get('/track/:orderNumber', async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', req.params.orderNumber)
      .single();

    if (error || !order) return res.status(404).json({ error: 'Order not found' });

    // An order only becomes trackable once payment is confirmed. Pesapal
    // flips payment_status to 'paid' via its callback/IPN; manual M-Pesa
    // flips it to 'paid' once an admin verifies the submitted code. Until
    // then we tell the customer we're confirming payment rather than
    // showing delivery-tracking details for something that isn't paid yet.
    if (order.payment_status !== 'paid') {
      return res.json({
        order: null,
        paymentPending: true,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        order_number: order.order_number,
        message:
          order.payment_status === 'verifying'
            ? "We're confirming your M-Pesa payment. This usually takes a few minutes - check back shortly."
            : order.payment_status === 'failed'
            ? 'This payment was not successful. Please try paying again.'
            : 'Payment has not been completed for this order yet.',
      });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== MY ORDERS (logged-in customer) ====================
// Lets a signed-in shopper see their orders and jump straight into live
// tracking with one tap - no need to remember/type an order number.
// Include pending/verifying payment rows too, so the customer dashboard can
// show what is waiting for confirmation instead of feeling empty.
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_status, payment_method, total, items, customer_name, customer_email, customer_phone, shipping_address, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ orders: orders || [] });
  } catch (err) {
    console.error('❌ Error fetching my-orders:', err.message);
    res.status(500).json({ error: 'Failed to load your orders' });
  }
});

// ==================== GET ALL ORDERS (ADMIN) ====================
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { 
      status, 
      limit = 500, 
      offset = 0, 
      search,
      payment_method,
      affiliate_id,
      date_from,
      date_to
    } = req.query;

    console.log('📊 Fetching orders with filters:', { status, limit, offset });

    let query = supabase
      .from('orders')
      .select(`
        *,
        affiliate:affiliate_id (
          id,
          name,
          email,
          referral_code,
          affiliate_level,
          total_earnings,
          pending_earnings,
          withdrawable_balance
        )
      `, { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (payment_method) query = query.eq('payment_method', payment_method);
    if (affiliate_id) query = query.eq('affiliate_id', affiliate_id);
    if (date_from) query = query.gte('created_at', new Date(date_from).toISOString());
    if (date_to) query = query.lte('created_at', new Date(date_to).toISOString());

    query = query
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`✅ Found ${data?.length || 0} orders (total: ${count || 0})`);

    const ordersWithDetails = await Promise.all(
      (data || []).map(async (order) => {
        let commissionTotal = order.commission_total || 0;
        let commissionStatus = order.commission_status || 'pending';
        let affiliateTier = order.affiliate_tier || null;
        let commissionDetails = [];
        
        if (order.affiliate_id) {
          const { data: affOrders } = await supabase
            .from('affiliate_orders')
            .select('commission, status, tier_at_time, commission_rate, product_name, order_amount')
            .eq('order_id', order.id)
            .order('created_at', { ascending: false });
          
          if (affOrders && affOrders.length > 0) {
            const activeAffOrders = affOrders.filter((ao) => ao.status !== 'cancelled');
            commissionTotal = activeAffOrders.reduce((sum, ao) => sum + (ao.commission || 0), 0);
            commissionStatus = order.status === 'cancelled'
              ? 'cancelled'
              : (activeAffOrders[0]?.status || order.commission_status || 'pending');
            affiliateTier = order.affiliate?.affiliate_level || activeAffOrders[0]?.tier_at_time || order.affiliate_tier || null;
            commissionDetails = affOrders;
          }
        }

        return {
          ...order,
          affiliate_name: order.affiliate?.name || order.affiliate_name || null,
          affiliate_email: order.affiliate?.email || order.affiliate_email || null,
          affiliate_level: order.affiliate?.affiliate_level || affiliateTier || null,
          affiliate_referral_code: order.affiliate?.referral_code || null,
          affiliate_total_earnings: order.affiliate?.total_earnings || 0,
          affiliate_pending_earnings: order.affiliate?.pending_earnings || 0,
          affiliate_withdrawable_balance: order.affiliate?.withdrawable_balance || 0,
          commission_total: commissionTotal,
          commission_status: commissionStatus,
          commission_details: commissionDetails,
          affiliate_tier: order.affiliate?.affiliate_level || affiliateTier,
          is_paid: order.payment_status === 'paid',
          is_stripe: order.payment_method === 'stripe' || order.payment_method === 'bank'
        };
      })
    );

    // Apply search filter
    let filteredOrders = ordersWithDetails;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrders = ordersWithDetails.filter(order => 
        order.order_number?.toLowerCase().includes(searchLower) ||
        order.customer_name?.toLowerCase().includes(searchLower) ||
        order.customer_email?.toLowerCase().includes(searchLower) ||
        order.customer_phone?.includes(search) ||
        order.referral_code?.toLowerCase().includes(searchLower) ||
        order.affiliate_name?.toLowerCase().includes(searchLower) ||
        order.payment_method?.toLowerCase().includes(searchLower)
      );
    }

    const summary = {
      total_orders: count || 0,
      filtered_orders: filteredOrders.length,
      total_revenue: filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      total_commission: filteredOrders.reduce((sum, o) => sum + (o.commission_total || 0), 0),
      affiliate_orders: filteredOrders.filter(o => o.affiliate_id).length,
      paid_orders: filteredOrders.filter(o => o.payment_status === 'paid').length,
      stripe_orders: filteredOrders.filter(o => o.payment_method === 'stripe' || o.payment_method === 'bank').length,
      status_counts: {
        pending: filteredOrders.filter(o => o.status === 'pending').length,
        confirmed: filteredOrders.filter(o => o.status === 'confirmed').length,
        processing: filteredOrders.filter(o => o.status === 'processing').length,
        shipped: filteredOrders.filter(o => o.status === 'shipped').length,
        delivered: filteredOrders.filter(o => o.status === 'delivered').length,
        cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
      },
      payment_method_counts: filteredOrders.reduce((acc, o) => {
        const method = o.payment_method || 'cash';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      orders: filteredOrders,
      count: filteredOrders.length,
      total: count || 0,
      summary,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: count || 0,
        has_more: (Number(offset) + Number(limit)) < (count || 0)
      }
    });

  } catch (err) {
    console.error('❌ Error fetching orders:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to fetch orders',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ==================== GET SINGLE ORDER (ADMIN) ====================
router.get('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        affiliate:affiliate_id (
          id,
          name,
          email,
          referral_code,
          affiliate_level,
          total_earnings,
          pending_earnings,
          withdrawable_balance
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return res.status(404).json({ error: 'Order not found' });
    }

    let commissionDetails = [];
    if (order.affiliate_id) {
      const { data: affOrders } = await supabase
        .from('affiliate_orders')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false });
      
      if (affOrders) {
        commissionDetails = affOrders;
      }
    }

    res.json({
      order: {
        ...order,
        affiliate_name: order.affiliate?.name || order.affiliate_name || null,
        affiliate_email: order.affiliate?.email || order.affiliate_email || null,
        affiliate_level: order.affiliate?.affiliate_level || order.affiliate_tier || null,
        affiliate_referral_code: order.affiliate?.referral_code || null,
        commission_details: commissionDetails,
      }
    });

  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== STRIPE PAYMENT ROUTES ====================

router.post('/update-payment-status', authenticate, async (req, res) => {
  try {
    const { order_id, payment_intent_id, status } = req.body;

    if (!order_id || !payment_intent_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const isAdmin = req.user?.role === 'admin';
    const isOwner = order.user_id === req.user?.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: status || 'paid',
        stripe_payment_intent_id: payment_intent_id,
        stripe_payment_status: 'succeeded',
        status: order.status === 'cancelled' ? order.status : 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id)
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('notifications')
      .insert({
        type: 'order_paid',
        title: `💳 Order ${data.order_number} - Paid via Stripe`,
        message: `Order ${data.order_number} has been paid successfully via Stripe.`,
        link: `/admin/orders`,
        data: {
          order_id: data.id,
          order_number: data.order_number,
          payment_method: data.payment_method || 'stripe'
        },
        created_at: new Date().toISOString()
      });

    res.json({
      success: true,
      message: 'Payment status updated',
      order: data
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/payment-status/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('payment_status, stripe_payment_intent_id, stripe_payment_status, payment_method')
      .eq('id', orderId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      stripe_payment_intent_id: order.stripe_payment_intent_id,
      stripe_payment_status: order.stripe_payment_status
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
