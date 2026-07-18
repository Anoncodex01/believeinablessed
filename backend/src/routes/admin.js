// routes/admin.js
import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { ensureNameBasedReferralCode } from '../utils/referralCode.js';

const router = express.Router();

// GET /api/admin/dashboard - overview stats
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const [ordersRes, usersRes, productsRes, affiliatesRes, affOrdersRes] = await Promise.all([
      supabase.from('orders').select('total, status, created_at, affiliate_id, referral_code'),
      supabase.from('users').select('id, role, created_at').eq('status', 'active'),
      supabase.from('products').select('id, status, sold_count').eq('status', 'active'),
      supabase.from('users').select('id, name, email, referral_code, total_earnings, pending_earnings, withdrawable_balance').eq('role', 'affiliate'),
      supabase.from('affiliate_orders').select('commission, status, affiliate_id'),
    ]);

    const orders = ordersRes.data || [];
    const users = usersRes.data || [];
    const products = productsRes.data || [];
    const affiliates = affiliatesRes.data || [];
    const affOrders = affOrdersRes.data || [];

    const activeOrders = orders.filter((o) => o.status !== 'cancelled');
    const totalRevenue = activeOrders.reduce((s, o) => s + (o.total || 0), 0);

    const pendingCommissions = affOrders
      .filter(o => o.status === 'pending')
      .reduce((s, o) => s + (o.commission || 0), 0);

    const confirmedCommissions = affOrders
      .filter(o => o.status === 'confirmed')
      .reduce((s, o) => s + (o.commission || 0), 0);

    // Orders with affiliates count (exclude cancelled)
    const affiliateOrders = activeOrders.filter((o) => o.affiliate_id).length;

    // Revenue last 30 days
    const revenueChart = buildRevenueChart(orders);

    res.json({
      stats: {
        total_revenue: totalRevenue,
        total_orders: activeOrders.length,
        cancelled_orders: orders.filter((o) => o.status === 'cancelled').length,
        pending_orders: orders.filter(o => o.status === 'pending').length,
        total_users: users.filter(u => u.role !== 'admin').length,
        total_affiliates: affiliates.length,
        total_products: products.length,
        pending_commissions: pendingCommissions,
        confirmed_commissions: confirmedCommissions,
        affiliate_orders: affiliateOrders,
        affiliates_total_earnings: affiliates.reduce((s, a) => s + (a.total_earnings || 0), 0),
      },
      revenue_chart: revenueChart,
      affiliates: affiliates.map(a => ({
        id: a.id,
        name: a.name,
        email: a.email,
        referral_code: a.referral_code,
        total_earnings: a.total_earnings || 0,
        pending_earnings: a.pending_earnings || 0,
        withdrawable_balance: a.withdrawable_balance || 0,
      })),
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

function buildRevenueChart(orders) {
  const last30 = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOrders = orders.filter(o => o.created_at?.startsWith(dateStr) && o.status !== 'cancelled');
    const revenue = dayOrders.reduce((s, o) => s + (o.total || 0), 0);
    const affiliateOrders = dayOrders.filter(o => o.affiliate_id).length;
    last30.push({ 
      date: dateStr, 
      revenue, 
      orders: dayOrders.length,
      affiliateOrders: affiliateOrders,
    });
  }
  return last30;
}

// ==================== USERS MANAGEMENT ====================

// GET /api/admin/users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id,name,email,phone,role,affiliate_level,total_earnings,pending_earnings,withdrawable_balance,status,referral_code,created_at,affiliate_approved,affiliate_requested_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ users: data });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users/by-referral/:code - Get user by referral code
router.get('/users/by-referral/:code', authenticate, requireAdmin, async (req, res) => {
  try {
    const { code } = req.params;
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, referral_code, affiliate_level, total_earnings')
      .eq('referral_code', code)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user by referral:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/users/:id — full profile: account, affiliate, orders, commissions, withdrawals
router.get('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: userRaw, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (userError || !userRaw) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...user } = userRaw;

    const [
      customerOrdersRes,
      affiliateOrdersRes,
      referredOrdersRes,
      withdrawalsRes,
      clicksRes,
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_phone, customer_email, total, status, payment_status, payment_method, commission_total, commission_status, affiliate_id, referral_code, created_at, items')
        .eq('user_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('affiliate_orders')
        .select('id, order_id, product_name, order_amount, commission, commission_rate, status, tier_at_time, referral_code, created_at, confirmed_at, cancelled_at, cancellation_reason')
        .eq('affiliate_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_phone, customer_email, total, status, payment_status, payment_method, commission_total, commission_status, created_at')
        .eq('affiliate_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('withdrawals')
        .select('id, amount, status, method, account_details, admin_notes, created_at, updated_at')
        .eq('affiliate_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('affiliate_clicks')
        .select('id, product_id, referral_code, created_at')
        .eq('affiliate_id', id)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    if (customerOrdersRes.error) console.error('customer orders:', customerOrdersRes.error.message);
    if (affiliateOrdersRes.error) console.error('affiliate orders:', affiliateOrdersRes.error.message);
    if (referredOrdersRes.error) console.error('referred orders:', referredOrdersRes.error.message);
    if (withdrawalsRes.error) console.error('withdrawals:', withdrawalsRes.error.message);
    if (clicksRes.error) console.error('clicks:', clicksRes.error.message);

    const customerOrders = customerOrdersRes.data || [];
    const affiliateOrderRows = affiliateOrdersRes.data || [];
    const referredOrders = referredOrdersRes.data || [];
    const withdrawals = withdrawalsRes.data || [];
    const clicks = clicksRes.data || [];

    // Enrich clicks with product names
    const productIds = [...new Set(clicks.map((c) => c.product_id).filter(Boolean))];
    let productMap = {};
    if (productIds.length) {
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);
      productMap = Object.fromEntries((products || []).map((p) => [p.id, p.name]));
    }
    const enrichedClicks = clicks.map((c) => ({
      ...c,
      product_name: c.product_id ? (productMap[c.product_id] || 'Product') : 'Landing / general',
    }));

    const { count: totalClicksCount } = await supabase
      .from('affiliate_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', id);

    const countByStatus = (rows, key = 'status') =>
      rows.reduce((acc, row) => {
        const s = row[key] || 'unknown';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});

    const confirmedCommission = affiliateOrderRows
      .filter((r) => r.status === 'confirmed')
      .reduce((s, r) => s + Number(r.commission || 0), 0);
    const pendingCommission = affiliateOrderRows
      .filter((r) => r.status === 'pending')
      .reduce((s, r) => s + Number(r.commission || 0), 0);
    const cancelledCommission = affiliateOrderRows
      .filter((r) => r.status === 'cancelled')
      .reduce((s, r) => s + Number(r.commission || 0), 0);

    const confirmedProductSales = affiliateOrderRows.filter((r) => r.status === 'confirmed').length;
    const pendingProductSales = affiliateOrderRows.filter((r) => r.status === 'pending').length;

    const paidReferred = referredOrders.filter((o) => o.payment_status === 'paid');
    const unpaidReferred = referredOrders.filter((o) => o.payment_status !== 'paid' && o.status !== 'cancelled');
    const cancelledReferred = referredOrders.filter((o) => o.status === 'cancelled');

    // Keep displayed pending in sync with live commission rows
    if (Number(user.pending_earnings || 0) !== pendingCommission) {
      user.pending_earnings = pendingCommission;
    }
    if (Number(user.total_earnings || 0) !== confirmedCommission) {
      // Prefer live ledger for admin view accuracy
      user.total_earnings = confirmedCommission;
    }

    const role = String(user.role || '').toLowerCase();
    const isAffiliate =
      role === 'affiliate' ||
      role === 'affiliate_pending' ||
      !!user.affiliate_approved ||
      !!user.affiliate_requested_at ||
      !!user.referral_code ||
      paidReferred.length > 0 ||
      unpaidReferred.length > 0 ||
      affiliateOrderRows.length > 0 ||
      (totalClicksCount || 0) > 0;

    res.json({
      user: {
        ...user,
        is_affiliate: isAffiliate,
      },
      summary: {
        customer_orders: customerOrders.length,
        customer_orders_by_status: countByStatus(customerOrders),
        customer_paid: customerOrders.filter((o) => o.payment_status === 'paid').length,
        customer_unpaid: customerOrders.filter((o) => o.payment_status !== 'paid' && o.status !== 'cancelled').length,
        customer_spent: customerOrders
          .filter((o) => o.payment_status === 'paid' || o.status === 'delivered')
          .reduce((s, o) => s + Number(o.total || 0), 0),
        referred_orders: referredOrders.length,
        referred_orders_by_status: countByStatus(referredOrders),
        referred_paid: paidReferred.length,
        referred_unpaid: unpaidReferred.length,
        referred_cancelled: cancelledReferred.length,
        referred_revenue: paidReferred.reduce((s, o) => s + Number(o.total || 0), 0),
        affiliate_order_rows: affiliateOrderRows.length,
        affiliate_orders_by_status: countByStatus(affiliateOrderRows),
        confirmed_orders: confirmedProductSales,
        pending_orders: pendingProductSales,
        confirmed_commission: confirmedCommission,
        pending_commission: pendingCommission,
        cancelled_commission: cancelledCommission,
        total_clicks: totalClicksCount ?? enrichedClicks.length,
        withdrawals: withdrawals.length,
        withdrawals_by_status: countByStatus(withdrawals),
        withdrawn_total: withdrawals
          .filter((w) => ['approved', 'paid', 'completed', 'processing'].includes(w.status))
          .reduce((s, w) => s + Number(w.amount || 0), 0),
      },
      customer_orders: customerOrders,
      referred_orders: referredOrders,
      affiliate_orders: affiliateOrderRows,
      withdrawals,
      clicks: enrichedClicks,
    });
  } catch (err) {
    console.error('Get user detail error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id — edit profile, role, tier, ban/suspend
router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      status,
      affiliate_level,
      role,
      affiliate_approved,
      name,
      email,
      phone,
      affiliate_phone,
      affiliate_social_media,
      affiliate_experience,
      affiliate_experience_years,
      affiliate_admin_notes,
      referral_code,
    } = req.body;

    const updates = {};
    if (status !== undefined) {
      if (!['active', 'suspended', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Use active, suspended, or pending.' });
      }
      updates.status = status;
    }
    if (affiliate_level !== undefined) updates.affiliate_level = affiliate_level;
    if (role !== undefined) {
      if (!['customer', 'affiliate', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      updates.role = role;
    }
    if (affiliate_approved !== undefined) {
      updates.affiliate_approved = !!affiliate_approved;
      if (affiliate_approved) {
        updates.affiliate_approved_at = new Date().toISOString();
        if (!updates.affiliate_level) updates.affiliate_level = 'bronze';
      }
    }
    if (name !== undefined) updates.name = String(name).trim();
    if (email !== undefined) updates.email = String(email).trim().toLowerCase();
    if (phone !== undefined) updates.phone = phone || null;
    if (affiliate_phone !== undefined) updates.affiliate_phone = affiliate_phone || null;
    if (affiliate_social_media !== undefined) updates.affiliate_social_media = affiliate_social_media || null;
    if (affiliate_experience !== undefined) updates.affiliate_experience = affiliate_experience || null;
    if (affiliate_experience_years !== undefined) updates.affiliate_experience_years = affiliate_experience_years;
    if (affiliate_admin_notes !== undefined) updates.affiliate_admin_notes = affiliate_admin_notes || null;
    if (referral_code !== undefined) {
      updates.referral_code = String(referral_code).trim().toUpperCase() || null;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select(`
        id, name, email, phone, role, avatar_url, status, referral_code, referred_by,
        affiliate_level, total_earnings, pending_earnings, withdrawable_balance,
        affiliate_approved, affiliate_requested_at, affiliate_approved_at,
        affiliate_phone, affiliate_social_media, affiliate_experience,
        affiliate_experience_years, affiliate_admin_notes,
        created_at, updated_at
      `)
      .single();

    if (error) throw error;
    res.json({ user: data });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== ANALYTICS ====================

// GET /api/admin/analytics/top-products
router.get('/analytics/top-products', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id,name,images,sold_count,price,sale_price,rating,review_count')
      .eq('status', 'active')
      .order('sold_count', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json({ products: data });
  } catch (err) {
    console.error('Top products error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/analytics/top-affiliates
router.get('/analytics/top-affiliates', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, referral_code, total_earnings, affiliate_level')
      .eq('role', 'affiliate')
      .eq('affiliate_approved', true)
      .eq('status', 'active')
      .order('total_earnings', { ascending: false })
      .limit(10);

    if (error) throw error;

    // Get order counts for each affiliate
    const affiliatesWithOrders = await Promise.all(
      (data || []).map(async (affiliate) => {
        const { count } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('affiliate_id', affiliate.id);

        const { data: affOrders } = await supabase
          .from('affiliate_orders')
          .select('commission')
          .eq('affiliate_id', affiliate.id)
          .eq('status', 'confirmed');

        const totalCommission = affOrders?.reduce((sum, ao) => sum + (ao.commission || 0), 0) || 0;

        return {
          ...affiliate,
          order_count: count || 0,
          confirmed_commission: totalCommission,
        };
      })
    );

    res.json({ affiliates: affiliatesWithOrders });
  } catch (err) {
    console.error('Top affiliates error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== COUPONS MANAGEMENT ====================

// GET /api/admin/coupons
router.get('/coupons', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ coupons: data });
  } catch (err) {
    console.error('Get coupons error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/coupons
router.post('/coupons', authenticate, requireAdmin, async (req, res) => {
  try {
    const { code, type, value, min_order, expires_at, max_uses } = req.body;
    
    if (!code || !type || !value) {
      return res.status(400).json({ error: 'Code, type and value are required' });
    }

    const { data, error } = await supabase
      .from('coupons')
      .insert({ 
        code: code.toUpperCase().trim(), 
        type, 
        value: Number(value), 
        min_order: Number(min_order) || 0, 
        expires_at, 
        max_uses: Number(max_uses) || null, 
        is_active: true, 
        used_count: 0 
      })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json({ coupon: data });
  } catch (err) {
    console.error('Create coupon error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/coupons/:id
router.put('/coupons/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    
    const { data, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json({ coupon: data });
  } catch (err) {
    console.error('Update coupon error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/coupons/:id
router.delete('/coupons/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await supabase.from('coupons').delete().eq('id', req.params.id);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (err) {
    console.error('Delete coupon error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== SETTINGS ====================

// GET /api/admin/settings
router.get('/settings', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data } = await supabase.from('settings').select('*');
    const settings = {};
    (data || []).forEach(s => { settings[s.key] = s.value; });
    res.json({ settings });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/settings
router.put('/settings', authenticate, requireAdmin, async (req, res) => {
  try {
    const updates = req.body; // { key: value, ... }
    for (const [key, value] of Object.entries(updates)) {
      await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== PENDING AFFILIATES (Admin) ====================

// GET /api/admin/pending-affiliates - Get pending affiliate requests
router.get('/pending-affiliates', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, affiliate_requested_at, created_at, referral_code, status')
      .eq('role', 'affiliate')
      .eq('affiliate_approved', false)
      .eq('status', 'pending')
      .order('affiliate_requested_at', { ascending: true });

    if (error) throw error;
    res.json({ success: true, pending: data || [] });
  } catch (error) {
    console.error('Error fetching pending affiliates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/admin/approve-affiliate/:id - Approve an affiliate
router.put('/approve-affiliate/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, affiliate_approved, email, name, referral_code')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role !== 'affiliate') {
      return res.status(400).json({ success: false, error: 'User is not an affiliate' });
    }

    if (user.affiliate_approved) {
      return res.status(400).json({ success: false, error: 'Affiliate already approved' });
    }

    // Generate name-based referral code if missing / legacy BIB…
    const referralCode = await ensureNameBasedReferralCode(user);

    const { data, error } = await supabase
      .from('users')
      .update({
        affiliate_approved: true,
        status: 'active',
        referral_code: referralCode,
        affiliate_level: 'bronze',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Affiliate approved: ${user.email} (${id}) by admin ${req.user.email}`);

    res.json({
      success: true,
      message: 'Affiliate approved successfully',
      affiliate: {
        id: data.id,
        name: data.name,
        email: data.email,
        referral_code: data.referral_code,
        affiliate_level: data.affiliate_level,
        status: data.status
      }
    });
  } catch (error) {
    console.error('Error approving affiliate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/admin/reject-affiliate/:id - Reject an affiliate
router.put('/reject-affiliate/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, affiliate_approved, email')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role !== 'affiliate') {
      return res.status(400).json({ success: false, error: 'User is not an affiliate' });
    }

    if (user.affiliate_approved) {
      return res.status(400).json({ success: false, error: 'Affiliate already approved' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        role: 'user',
        affiliate_approved: false,
        status: 'active',
        affiliate_requested_at: null,
        affiliate_level: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log(`❌ Affiliate rejected: ${user.email} (${id}) by admin ${req.user.email}. Reason: ${reason || 'No reason provided'}`);

    res.json({
      success: true,
      message: 'Affiliate request rejected',
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status
      }
    });
  } catch (error) {
    console.error('Error rejecting affiliate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;