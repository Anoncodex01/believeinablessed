// routes/affiliates.js - Complete updated file with working application/approval flow

import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, requireAdmin, requireAffiliate, requireApprovedAffiliate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import {
  countConfirmedAffiliateOrders,
  getTierByOrderCount as sharedGetTierByOrderCount,
  confirmOrderCommission,
  reconcileAffiliateBalances,
} from '../utils/affiliateCommission.js';
import {
  generateUniqueReferralCode,
  ensureNameBasedReferralCode,
} from '../utils/referralCode.js';

const router = express.Router();

// routes/affiliates.js - Updated with new withdrawal requirements

// ... (keep all the existing code, but update the TIER_CONFIG)

// ==================== TIER CONFIGURATION ====================
const TIER_CONFIG = {
  bronze: {
    min_orders: 0,
    max_orders: 19,
    commission_rate: 5,
    payout_days: 14,
    payout_label: '2 Weeks',
    level: 'bronze',
    requires_orders_for_withdraw: 19, // 19 orders to withdraw
    icon: '🥉',
    label: 'Bronze'
  },
  silver: {
    min_orders: 20,
    max_orders: 99,
    commission_rate: 6,
    payout_days: 7,
    payout_label: '1 Week',
    level: 'silver',
    requires_orders_for_withdraw: 10, // 10 orders to withdraw
    icon: '🥈',
    label: 'Silver'
  },
  gold: {
    min_orders: 100,
    max_orders: 199,
    commission_rate: 7,
    payout_days: 3,
    payout_label: '3 Days',
    level: 'gold',
    requires_orders_for_withdraw: 5, // 5 orders to withdraw
    icon: '🥇',
    label: 'Gold'
  },
  platinum: {
    min_orders: 200,
    max_orders: 300,
    commission_rate: 8,
    payout_days: 0,
    payout_label: 'Instant',
    level: 'platinum',
    requires_orders_for_withdraw: 3, // 3 orders to withdraw
    icon: '💎',
    label: 'Platinum'
  },
  vip: {
    min_orders: 301,
    max_orders: Infinity,
    commission_rate: 10,
    payout_days: 0,
    payout_label: 'Instant',
    level: 'vip',
    requires_orders_for_withdraw: 0, // 0 orders to withdraw - instant
    icon: '👑',
    label: 'VIP'
  }
};



function getTierByOrderCount(orderCount) {
  return sharedGetTierByOrderCount(orderCount);
}

function getNextTier(currentLevel) {
  const levels = ['bronze', 'silver', 'gold', 'platinum', 'vip'];
  const idx = levels.indexOf(currentLevel);
  if (idx < levels.length - 1) {
    return TIER_CONFIG[levels[idx + 1]];
  }
  return null;
}

async function getAffiliateOrderCount(affiliateId) {
  // Distinct confirmed checkout orders (not line-item rows)
  return countConfirmedAffiliateOrders(affiliateId);
}

function getTierIcon(level) {
  const icons = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎',
    vip: '👑'
  };
  return icons[level] || '⭐';
}

// ==================== AFFILIATE APPLICATION ROUTES ====================

// POST /api/affiliates/apply - User applies to become an affiliate
router.post('/apply', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone, social_media, reason, experience } = req.body;

    // Check if user already applied
    const { data: existing, error: checkError } = await supabase
      .from('users')
      .select('affiliate_approved, affiliate_requested_at, role')
      .eq('id', userId)
      .single();

    if (checkError) throw checkError;

    if (existing.affiliate_approved) {
      return res.status(400).json({ error: 'You are already an approved affiliate' });
    }

    if (existing.affiliate_requested_at) {
      return res.status(400).json({ error: 'You have already applied. Please wait for admin approval.' });
    }

    // Name-based referral code, e.g. Alvin → ALVIN
    const { data: applicant } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single();
    const referralCode = await generateUniqueReferralCode(applicant?.name || req.user.name || 'AFFILIATE', userId);

    // Update user with affiliate application - Set role to 'affiliate_pending'
    const { data, error } = await supabase
      .from('users')
      .update({
        affiliate_requested_at: new Date().toISOString(),
        affiliate_approved: false,
        referral_code: referralCode,
        affiliate_level: 'bronze',
        affiliate_phone: phone || null,
        affiliate_social_media: social_media || null,
        affiliate_experience: reason || null,
        affiliate_experience_years: experience ? parseInt(experience) : null,
        role: 'affiliate_pending',  // KEY: Set to pending
        status: 'active'
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Create notification for admin
    await supabase
      .from('notifications')
      .insert({
        type: 'affiliate_application',
        title: '📝 New Affiliate Application',
        message: `${req.user.name || 'User'} has applied to become an affiliate. Phone: ${phone || 'N/A'}`,
        link: '/admin/affiliates',
        data: {
          user_id: userId,
          user_name: req.user.name,
          user_email: req.user.email,
          phone: phone,
          social_media: social_media,
          reason: reason,
          referral_code: referralCode
        },
        created_at: new Date().toISOString()
      });

    // Create notification for user
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'affiliate_application_submitted',
        title: '📝 Affiliate Application Submitted',
        message: 'Your application has been submitted successfully. Admin will review it shortly.',
        link: '/affiliate',
        created_at: new Date().toISOString()
      });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully! Please wait for admin approval.',
      referral_code: referralCode
    });
  } catch (err) {
    console.error('Affiliate application error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/affiliates/applications - Admin gets all pending applications
router.get('/applications', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        phone,
        affiliate_phone,
        affiliate_social_media,
        affiliate_experience,
        affiliate_experience_years,
        affiliate_requested_at,
        referral_code,
        affiliate_level,
        created_at,
        status
      `)
      .eq('role', 'affiliate_pending')  // Only get pending applications
      .eq('affiliate_approved', false)
      .not('affiliate_requested_at', 'is', null)
      .order('affiliate_requested_at', { ascending: false });

    if (error) throw error;

    console.log(`📋 Found ${data?.length || 0} pending applications`);
    res.json({ applications: data || [] });
  } catch (err) {
    console.error('Get applications error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/affiliates/applications/:id - Admin approves or rejects affiliate
router.put('/applications/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
    }

    // Get the user application
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (userError) throw userError;

    // Check if user is actually pending
    if (user.role !== 'affiliate_pending') {
      return res.status(400).json({ error: 'User is not a pending affiliate' });
    }

    const adminId = req.user.id;

    if (status === 'approved') {
      const referralCode = await ensureNameBasedReferralCode(user);

      // Approve the affiliate
      const { data, error } = await supabase
        .from('users')
        .update({
          affiliate_approved: true,
          affiliate_approved_at: new Date().toISOString(),
          affiliate_approved_by: adminId,
          affiliate_admin_notes: admin_notes || null,
          role: 'affiliate',  // Change to affiliate
          status: 'active',
          affiliate_level: 'bronze',
          referral_code: referralCode,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Create notification for user
      await supabase
        .from('notifications')
        .insert({
          user_id: id,
          type: 'affiliate_approved',
          title: '🎉 Affiliate Application Approved!',
          message: `Congratulations! Your affiliate application has been approved. Start sharing your referral code: ${referralCode}`,
          link: '/affiliate/dashboard',
          created_at: new Date().toISOString()
        });

      // Create admin notification
      await supabase
        .from('notifications')
        .insert({
          type: 'affiliate_approved',
          title: '✅ Affiliate Approved',
          message: `${user.name} has been approved as an affiliate.`,
          link: '/admin/affiliates',
          data: { user_id: id, user_name: user.name },
          created_at: new Date().toISOString()
        });

      res.json({ 
        success: true, 
        message: 'Affiliate approved successfully!',
        user: data 
      });

    } else {
      // Reject the affiliate - revert to regular user
      const { data, error } = await supabase
        .from('users')
        .update({
          affiliate_approved: false,
          affiliate_approved_at: new Date().toISOString(),
          affiliate_approved_by: adminId,
          affiliate_admin_notes: admin_notes || 'Application rejected',
          role: 'user',  // Revert to user
          affiliate_requested_at: null,
          referral_code: null,
          affiliate_level: null,
          affiliate_phone: null,
          affiliate_social_media: null,
          affiliate_experience: null,
          affiliate_experience_years: null,
          status: 'active'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Create notification for user
      await supabase
        .from('notifications')
        .insert({
          user_id: id,
          type: 'affiliate_rejected',
          title: '❌ Affiliate Application Rejected',
          message: admin_notes || 'Your affiliate application was not approved at this time. You can reapply later.',
          link: '/affiliate',
          created_at: new Date().toISOString()
        });

      res.json({ 
        success: true, 
        message: 'Affiliate application rejected.',
        user: data 
      });
    }
  } catch (err) {
    console.error('Process application error:', err);
    res.status(500).json({ 
      error: err.message,
      details: err.details || 'Unknown error'
    });
  }
});

// ==================== PUBLIC ROUTES ====================

// GET /api/affiliates/stats - public stats for homepage
router.get('/stats', async (req, res) => {
  try {
    const { count: totalAffiliates, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'affiliate')
      .eq('status', 'active')
      .eq('affiliate_approved', true);

    if (countError) throw countError;

    const { data: totalPaidOutData, error: paidOutError } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('status', 'completed');

    if (paidOutError) throw paidOutError;

    const totalPaidOut = totalPaidOutData?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyData, error: monthlyError } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', startOfMonth.toISOString());

    if (monthlyError) throw monthlyError;

    const monthlyCommissions = monthlyData?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

    const { data: topAffiliates, error: topError } = await supabase
      .from('users')
      .select('id, name, email, total_earnings, affiliate_level, avatar_url')
      .eq('role', 'affiliate')
      .eq('status', 'active')
      .eq('affiliate_approved', true)
      .order('total_earnings', { ascending: false })
      .limit(5);

    if (topError) throw topError;

    const { data: affiliateOrders, error: ordersError } = await supabase
      .from('affiliate_orders')
      .select('order_amount, commission, status')
      .eq('status', 'confirmed');

    if (ordersError) throw ordersError;

    const totalSales = affiliateOrders?.reduce((sum, o) => sum + (o.order_amount || 0), 0) || 0;

    const formattedTopAffiliates = await Promise.all((topAffiliates || []).map(async (affiliate) => {
      const salesCount = await countConfirmedAffiliateOrders(affiliate.id);

      return {
        id: affiliate.id,
        name: affiliate.name || 'Anonymous',
        email: affiliate.email,
        sales: salesCount,
        earnings: affiliate.total_earnings || 0,
        level: affiliate.affiliate_level,
        avatar: affiliate.avatar_url,
      };
    }));

    let commissionRate = '5-10';
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'affiliate_commission_rate')
      .single();

    if (!settingsError && settingsData) {
      commissionRate = settingsData.value;
    }

    // Get tier breakdown
    const { data: tierBreakdown, error: tierError } = await supabase
      .from('users')
      .select('affiliate_level')
      .eq('role', 'affiliate')
      .eq('affiliate_approved', true);

    if (!tierError && tierBreakdown) {
      const breakdown = tierBreakdown.reduce((acc, user) => {
        const level = user.affiliate_level || 'bronze';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {});
      
      res.json({
        success: true,
        data: {
          totalAffiliates: totalAffiliates || 0,
          totalPaidOut: totalPaidOut,
          monthlyCommissions: monthlyCommissions,
          totalSales: totalSales,
          topAffiliates: formattedTopAffiliates,
          commissionRate: commissionRate,
          tierBreakdown: breakdown
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          totalAffiliates: totalAffiliates || 0,
          totalPaidOut: totalPaidOut,
          monthlyCommissions: monthlyCommissions,
          totalSales: totalSales,
          topAffiliates: formattedTopAffiliates,
          commissionRate: commissionRate
        }
      });
    }
  } catch (err) {
    console.error('Error fetching affiliate stats:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to fetch affiliate statistics' 
    });
  }
});

// ==================== AFFILIATE DASHBOARD ROUTES ====================

// GET /api/affiliates/dashboard - affiliate's own stats
// Pending affiliates can open a limited dashboard so they can see their
// application status, referral code, public leaderboard, and sharing tools.
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) throw userError;

    const allowedRoles = ['affiliate', 'affiliate_pending', 'admin'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Affiliate access required' });
    }

    // Convert legacy BIB… codes to owner name (e.g. ALVIN)
    try {
      const nameCode = await ensureNameBasedReferralCode(user);
      if (nameCode) user.referral_code = nameCode;
    } catch (codeErr) {
      console.warn('⚠️ Referral code migrate skipped:', codeErr.message);
    }

    // Self-heal: paid affiliate orders that never got commission confirmed
    try {
      const { data: stuckPaid } = await supabase
        .from('orders')
        .select('id, order_number, commission_status')
        .eq('affiliate_id', userId)
        .eq('payment_status', 'paid')
        .neq('status', 'cancelled')
        .or('commission_status.is.null,commission_status.eq.pending,commission_status.eq.cancelled');

      for (const stuck of stuckPaid || []) {
        console.log(`🔧 Repairing stuck commission for ${stuck.order_number}`);
        await confirmOrderCommission(stuck.id, userId, 'Dashboard auto-repair after paid order');
      }

      if (stuckPaid?.length) {
        const { data: refreshedUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        if (refreshedUser) Object.assign(user, refreshedUser);
      }
    } catch (repairErr) {
      console.warn('⚠️ Commission repair skipped:', repairErr.message);
    }

    const { data: ordersRaw, error: ordersError } = await supabase
      .from('affiliate_orders')
      .select(`
        *,
        orders:order_id (
          order_number,
          customer_name
        )
      `)
      .eq('affiliate_id', userId)
      .order('created_at', { ascending: false });
    
    if (ordersError) throw ordersError;

    const orders = (ordersRaw || []).map((row) => ({
      ...row,
      customer_name: row.orders?.customer_name || row.customer_name || null,
      order_number: row.orders?.order_number || null,
      orders: undefined,
    }));

    // Fix balances/tier after cancelled orders or duplicate pending rows
    await reconcileAffiliateBalances(userId);
    const { data: refreshedUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (refreshedUser) Object.assign(user, refreshedUser);

    const { data: clicks, error: clicksError } = await supabase
      .from('affiliate_clicks')
      .select('*')
      .eq('affiliate_id', userId)
      .order('created_at', { ascending: false });
    
    if (clicksError) throw clicksError;

    const confirmedOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'delivered');
    const totalOrderCount = await countConfirmedAffiliateOrders(userId);
    
    const currentTier = getTierByOrderCount(totalOrderCount);
    const nextTier = getNextTier(currentTier.level);
    
    let progressToNext = 100;
    let ordersToNext = 0;
    let nextTierName = null;
    
    if (nextTier) {
      const nextMin = nextTier.min_orders;
      const currentMin = currentTier.min_orders;
      const range = nextMin - currentMin;
      const achieved = totalOrderCount - currentMin;
      progressToNext = Math.min(100, (achieved / range) * 100);
      ordersToNext = Math.max(0, nextMin - totalOrderCount);
      nextTierName = nextTier.level.charAt(0).toUpperCase() + nextTier.level.slice(1);
    }

    let withdrawableBalance = user.withdrawable_balance || 0;
    if (currentTier.level === 'bronze' && totalOrderCount < 19) {
      withdrawableBalance = 0;
    }

    const pendingWithdrawals = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('affiliate_id', userId)
      .eq('status', 'pending');
    
    const pendingAmount = pendingWithdrawals.data?.reduce((sum, w) => sum + w.amount, 0) || 0;

    const chartData = buildChartData(orders || []);

    res.json({
      stats: {
        total_earnings: user.total_earnings || 0,
        pending_earnings: user.pending_earnings || 0,
        withdrawable_balance: withdrawableBalance,
        affiliate_level: user.affiliate_level || 'bronze',
        current_tier: currentTier.level,
        referral_code: user.referral_code,
        total_clicks: clicks?.length || 0,
        total_orders: totalOrderCount,
        conversion_rate: clicks?.length ? ((totalOrderCount / clicks?.length) * 100).toFixed(1) : '0.0',
        tier_info: {
          current: currentTier.level,
          current_label: currentTier.level.charAt(0).toUpperCase() + currentTier.level.slice(1),
          commission_rate: currentTier.level === 'vip' ? '9-10%' : `${currentTier.commission_rate}%`,
          payout_time: currentTier.payout_label,
          min_orders: currentTier.min_orders,
          max_orders: currentTier.max_orders === Infinity ? '+' : currentTier.max_orders,
          next_tier: nextTierName,
          orders_to_next: ordersToNext,
          progress_to_next: Math.round(progressToNext),
          is_max_level: !nextTier,
          pending_payouts: pendingAmount,
          withdraw_requirement: currentTier.requires_orders_for_withdraw
        }
      },
      approval_status: user.affiliate_approved ? 'approved' : 'pending',
      is_approved: user.affiliate_approved === true,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        affiliate_phone: user.affiliate_phone,
        affiliate_social_media: user.affiliate_social_media,
        affiliate_requested_at: user.affiliate_requested_at,
        affiliate_approved: user.affiliate_approved
      },
      orders: orders || [],
      clicks: clicks || [],
      chart_data: chartData,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

function buildChartData(orders) {
  const last30 = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOrders = orders.filter(
      (o) => o.created_at?.startsWith(dateStr) && o.status !== 'cancelled'
    );
    const earnings = dayOrders
      .filter((o) => o.status === 'confirmed' || o.status === 'delivered')
      .reduce((s, o) => s + (o.commission || 0), 0);
    last30.push({ date: dateStr, earnings, orders: dayOrders.length });
  }
  return last30;
}

// POST /api/affiliates/generate-link - generate affiliate link
router.post('/generate-link', authenticate, async (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ error: 'product_id required' });

    if (!['affiliate', 'affiliate_pending', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Affiliate access required' });
    }

    if (!process.env.FRONTEND_URL) {
      return res.status(500).json({ error: 'FRONTEND_URL is not configured' });
    }

    const code = await ensureNameBasedReferralCode({
      id: req.user.id,
      name: req.user.name,
      referral_code: req.user.referral_code,
    });
    const link = `${process.env.FRONTEND_URL.replace(/\/$/, '')}/products/${product_id}?ref=${code}`;

    await supabase.from('affiliate_links').upsert({
      affiliate_id: req.user.id,
      product_id,
      link,
      referral_code: code,
    }, { onConflict: 'affiliate_id,product_id' });

    res.json({ link, code });
  } catch (err) {
    console.error('Generate link error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/affiliates/track-click - track when someone clicks affiliate link
router.post('/track-click', async (req, res) => {
  try {
    const { referral_code, product_id, source } = req.body;
    if (!referral_code) return res.status(400).json({ error: 'referral_code required' });

    const code = String(referral_code).trim().toUpperCase();

    const { data: affiliate } = await supabase
      .from('users')
      .select('id, referral_code, affiliate_approved, status')
      .ilike('referral_code', code)
      .eq('role', 'affiliate')
      .limit(1)
      .maybeSingle();

    if (!affiliate) {
      // Silent success so storefront UX is never blocked by a bad/old code
      return res.json({ message: 'Ignored', tracked: false });
    }

    if (affiliate.status !== 'active' || affiliate.affiliate_approved !== true) {
      return res.json({ message: 'Affiliate inactive', tracked: false });
    }

    // Soft dedupe: same affiliate + product within 2 minutes counts as one click
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    let dedupeQuery = supabase
      .from('affiliate_clicks')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .gte('created_at', twoMinutesAgo)
      .limit(1);

    if (product_id) {
      dedupeQuery = dedupeQuery.eq('product_id', product_id);
    } else {
      dedupeQuery = dedupeQuery.is('product_id', null);
    }

    const { data: recent } = await dedupeQuery.maybeSingle();
    if (recent) {
      return res.json({ message: 'Click already counted', tracked: false, deduped: true });
    }

    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;

    const { error: insertError } = await supabase.from('affiliate_clicks').insert({
      affiliate_id: affiliate.id,
      product_id: product_id || null,
      referral_code: affiliate.referral_code || code,
      ip_address: ip,
    });

    if (insertError) {
      console.error('Click insert error:', insertError);
      return res.status(500).json({ error: 'Failed to track click' });
    }

    res.json({ message: 'Click tracked', tracked: true, source: source || null });
  } catch (err) {
    console.error('Track click error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/affiliates/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const { data, error } = await supabase
      .from('users')
      .select('id,name,avatar_url,affiliate_level,total_earnings,referral_code')
      .eq('role', 'affiliate')
      .eq('status', 'active')
      .eq('affiliate_approved', true)
      .order('total_earnings', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Pull each affiliate's confirmed sales count so the leaderboard shows
    // real numbers instead of always reading 0.
    const formattedData = await Promise.all(
      data.map(async (user) => {
        let sales = 0;
        try {
          sales = await getAffiliateOrderCount(user.id);
        } catch (e) {
          console.error(`⚠️ Could not count sales for ${user.id}:`, e.message);
        }
        return {
          ...user,
          sales,
          tier_badge: user.affiliate_level.charAt(0).toUpperCase() + user.affiliate_level.slice(1),
          tier_icon: getTierIcon(user.affiliate_level),
        };
      })
    );

    res.json({ leaderboard: formattedData });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/affiliates/withdraw - request withdrawal
router.post('/withdraw', authenticate, requireApprovedAffiliate, async (req, res) => {
  try {
    const { amount, method, account_details } = req.body;
    if (!amount || amount < 1000) {
      return res.status(400).json({ error: 'Minimum withdrawal is 1000 TZS' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('withdrawable_balance, affiliate_level')
      .eq('id', req.user.id)
      .single();

    if (userError) throw userError;

    const orderCount = await getAffiliateOrderCount(req.user.id);
    const tier = getTierByOrderCount(orderCount);
    
    if (orderCount < tier.requires_orders_for_withdraw) {
      return res.status(400).json({ 
        error: `Your tier (${tier.level}) requires ${tier.requires_orders_for_withdraw} orders to withdraw. You currently have ${orderCount} orders.` 
      });
    }

    if ((user?.withdrawable_balance || 0) < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const lastWithdrawal = await supabase
      .from('withdrawals')
      .select('created_at')
      .eq('affiliate_id', req.user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (tier.payout_days > 0 && lastWithdrawal.data && lastWithdrawal.data.length > 0) {
      const lastDate = new Date(lastWithdrawal.data[0].created_at);
      const daysSince = (new Date() - lastDate) / (1000 * 60 * 60 * 24);
      if (daysSince < tier.payout_days) {
        const daysLeft = Math.ceil(tier.payout_days - daysSince);
        return res.status(400).json({ 
          error: `Your tier allows withdrawals every ${tier.payout_days} days. Please wait ${daysLeft} more days.` 
        });
      }
    }

    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        affiliate_id: req.user.id,
        amount,
        method: method || 'mpesa',
        account_details,
        status: 'pending',
        tier_at_time: tier.level
      })
      .select()
      .single();

    if (withdrawalError) throw withdrawalError;

    await supabase
      .from('users')
      .update({ withdrawable_balance: (user.withdrawable_balance - amount) })
      .eq('id', req.user.id);

    res.json({ 
      message: 'Withdrawal request submitted successfully!', 
      withdrawal,
      estimated_payout: tier.payout_days === 0 ? 'Instant' : `Within ${tier.payout_days} days`
    });
  } catch (err) {
    console.error('Withdrawal error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/affiliates/withdrawals
router.get('/withdrawals', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'affiliate_pending') {
      return res.json({ withdrawals: [] });
    }
    if (!['affiliate', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Affiliate access required' });
    }

    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('affiliate_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ withdrawals: data });
  } catch (err) {
    console.error('Get withdrawals error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== ADMIN MANAGEMENT ROUTES ====================

// GET /api/affiliates/admin/overview - Admin affiliate performance dashboard
router.get('/admin/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    const [usersRes, ordersRes, clicksRes, withdrawalsRes] = await Promise.all([
      supabase
        .from('users')
        .select('id,name,email,phone,role,affiliate_level,total_earnings,pending_earnings,withdrawable_balance,status,referral_code,created_at,affiliate_approved,affiliate_requested_at,affiliate_approved_at,affiliate_phone,affiliate_social_media,affiliate_experience,affiliate_experience_years,affiliate_admin_notes')
        .in('role', ['affiliate', 'affiliate_pending'])
        .order('created_at', { ascending: false }),
      supabase
        .from('affiliate_orders')
        .select('id,affiliate_id,order_id,product_id,order_amount,commission,status,referral_code,commission_rate,tier_at_time,product_name,created_at'),
      supabase
        .from('affiliate_clicks')
        .select('id,affiliate_id,created_at'),
      supabase
        .from('withdrawals')
        .select('id,affiliate_id,amount,status,method,account_details,admin_notes,created_at,updated_at')
        .order('created_at', { ascending: false })
    ]);

    if (usersRes.error) throw usersRes.error;
    if (ordersRes.error) throw ordersRes.error;
    if (clicksRes.error) throw clicksRes.error;
    if (withdrawalsRes.error) throw withdrawalsRes.error;

    const users = usersRes.data || [];
    const orders = ordersRes.data || [];
    const clicks = clicksRes.data || [];
    const withdrawals = withdrawalsRes.data || [];

    const affiliates = users.map((user) => {
      const affiliateOrders = orders.filter(order => order.affiliate_id === user.id);
      const affiliateClicks = clicks.filter(click => click.affiliate_id === user.id);
      const affiliateWithdrawals = withdrawals.filter(withdrawal => withdrawal.affiliate_id === user.id);
      const confirmedOrders = affiliateOrders.filter(order => ['confirmed', 'delivered'].includes(order.status));
      const pendingOrders = affiliateOrders.filter(order => order.status === 'pending');
      const paidOrders = affiliateOrders.filter(order => order.status === 'paid');
      const cancelledOrders = affiliateOrders.filter(order => order.status === 'cancelled');
      const distinctConfirmedOrders = new Set(confirmedOrders.map((o) => o.order_id).filter(Boolean)).size;
      const tier = getTierByOrderCount(distinctConfirmedOrders);

      return {
        ...user,
        approval_status: user.affiliate_approved ? 'approved' : 'pending',
        order_count: distinctConfirmedOrders,
        total_orders: affiliateOrders.length,
        pending_orders: pendingOrders.length,
        paid_orders: paidOrders.length,
        cancelled_orders: cancelledOrders.length,
        clicks: affiliateClicks.length,
        conversion_rate: affiliateClicks.length ? Number(((distinctConfirmedOrders / affiliateClicks.length) * 100).toFixed(1)) : 0,
        sales_volume: affiliateOrders
          .filter(order => order.status !== 'cancelled')
          .reduce((sum, order) => sum + Number(order.order_amount || 0), 0),
        pending_commission: pendingOrders.reduce((sum, order) => sum + Number(order.commission || 0), 0),
        confirmed_commission: confirmedOrders.reduce((sum, order) => sum + Number(order.commission || 0), 0),
        paid_commission: paidOrders.reduce((sum, order) => sum + Number(order.commission || 0), 0),
        cancelled_commission: cancelledOrders.reduce((sum, order) => sum + Number(order.commission || 0), 0),
        withdrawal_requested: affiliateWithdrawals.reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0),
        withdrawal_pending: affiliateWithdrawals
          .filter(withdrawal => withdrawal.status === 'pending')
          .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0),
        withdrawal_paid: affiliateWithdrawals
          .filter(withdrawal => withdrawal.status === 'paid')
          .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0),
        current_tier: tier.level,
        tier_commission: tier.level === 'vip' ? '9-10%' : `${tier.commission_rate}%`,
        tier_payout: tier.payout_label,
        withdraw_requirement: tier.requires_orders_for_withdraw,
        recent_orders: affiliateOrders
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .slice(0, 5)
      };
    });

    const pendingApplications = affiliates.filter(user => user.role === 'affiliate_pending' && user.affiliate_approved === false);
    const approvedAffiliates = affiliates.filter(user => user.role === 'affiliate' && user.affiliate_approved === true);
    const pendingWithdrawals = withdrawals.filter(withdrawal => withdrawal.status === 'pending');

    const summary = {
      total_affiliates: approvedAffiliates.length,
      pending_applications: pendingApplications.length,
      suspended_affiliates: approvedAffiliates.filter(user => user.status === 'suspended').length,
      total_clicks: clicks.length,
      total_affiliate_orders: orders.filter(order => order.status !== 'cancelled').length,
      total_sales_volume: orders
        .filter(order => order.status !== 'cancelled')
        .reduce((sum, order) => sum + Number(order.order_amount || 0), 0),
      pending_commission: orders
        .filter(order => order.status === 'pending')
        .reduce((sum, order) => sum + Number(order.commission || 0), 0),
      confirmed_commission: orders
        .filter(order => ['confirmed', 'delivered'].includes(order.status))
        .reduce((sum, order) => sum + Number(order.commission || 0), 0),
      paid_commission: orders
        .filter(order => order.status === 'paid')
        .reduce((sum, order) => sum + Number(order.commission || 0), 0),
      withdrawable_balance: approvedAffiliates.reduce((sum, user) => sum + Number(user.withdrawable_balance || 0), 0),
      pending_withdrawals: pendingWithdrawals.length,
      pending_withdrawal_amount: pendingWithdrawals.reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0),
      paid_withdrawal_amount: withdrawals
        .filter(withdrawal => withdrawal.status === 'paid')
        .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0)
    };

    const tier_breakdown = Object.keys(TIER_CONFIG).reduce((acc, level) => {
      const tierAffiliates = approvedAffiliates.filter(user => (user.affiliate_level || 'bronze') === level);
      acc[level] = {
        count: tierAffiliates.length,
        total_earnings: tierAffiliates.reduce((sum, user) => sum + Number(user.total_earnings || 0), 0),
        commission: TIER_CONFIG[level].commission_rate,
        payout: TIER_CONFIG[level].payout_label,
        withdraw_requirement: TIER_CONFIG[level].requires_orders_for_withdraw
      };
      return acc;
    }, {});

    res.json({
      success: true,
      summary,
      affiliates,
      applications: pendingApplications,
      withdrawals,
      tier_breakdown
    });
  } catch (err) {
    console.error('Admin affiliate overview error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/affiliates/all - Get all affiliates with tier stats
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id,name,email,phone,affiliate_level,total_earnings,pending_earnings,withdrawable_balance,status,referral_code,created_at,affiliate_approved,affiliate_requested_at,affiliate_approved_at,affiliate_phone,affiliate_social_media,affiliate_experience,affiliate_experience_years,affiliate_admin_notes')
      .eq('role', 'affiliate')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const affiliatesWithCounts = await Promise.all((data || []).map(async (affiliate) => {
      const orderCount = await countConfirmedAffiliateOrders(affiliate.id);
      const tier = getTierByOrderCount(orderCount);
      
      return {
        ...affiliate,
        order_count: orderCount,
        current_tier: tier.level,
        tier_commission: tier.level === 'vip' ? '9-10%' : `${tier.commission_rate}%`,
        tier_payout: tier.payout_label
      };
    }));

    res.json({ affiliates: affiliatesWithCounts });
  } catch (err) {
    console.error('Get all affiliates error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/affiliates/admin/withdrawals - Get all withdrawals
router.get('/admin/withdrawals', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from('withdrawals')
      .select(`
        *,
        users:affiliate_id (
          name,
          email,
          phone,
          affiliate_level,
          referral_code
        )
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    
    res.json({ withdrawals: data });
  } catch (err) {
    console.error('Get withdrawals error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/affiliates/admin/withdrawals/:id - approve/reject withdrawal
router.put('/admin/withdrawals/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    
    const { data: withdrawal, error: getError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (getError) throw getError;

    const { data, error } = await supabase
      .from('withdrawals')
      .update({ 
        status, 
        admin_notes,
        updated_at: new Date().toISOString(),
        completed_at: status === 'paid' ? new Date().toISOString() : null
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (status === 'rejected') {
      const { data: user } = await supabase
        .from('users')
        .select('withdrawable_balance')
        .eq('id', withdrawal.affiliate_id)
        .single();

      if (user) {
        await supabase
          .from('users')
          .update({ 
            withdrawable_balance: (user.withdrawable_balance + withdrawal.amount)
          })
          .eq('id', withdrawal.affiliate_id);
      }
    }

    // Notify user
    await supabase
      .from('notifications')
      .insert({
        user_id: withdrawal.affiliate_id,
        type: 'withdrawal_update',
        title: `Withdrawal ${status}`,
        message: `Your withdrawal of ${withdrawal.amount} TZS has been ${status}.`,
        link: '/affiliate/dashboard',
        created_at: new Date().toISOString()
      });

    res.json({ withdrawal: data });
  } catch (err) {
    console.error('Update withdrawal error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/affiliates/admin/tier-breakdown - Get tier breakdown for admin
router.get('/admin/tier-breakdown', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('affiliate_level, id, total_earnings')
      .eq('role', 'affiliate')
      .eq('affiliate_approved', true);

    if (error) throw error;

    const breakdown = {
      bronze: { count: 0, totalEarnings: 0, minOrders: 0, maxOrders: 19, commission: '5%', payout: '2 Weeks' },
      silver: { count: 0, totalEarnings: 0, minOrders: 20, maxOrders: 99, commission: '6%', payout: '1 Week' },
      gold: { count: 0, totalEarnings: 0, minOrders: 100, maxOrders: 199, commission: '7%', payout: '3 Days' },
      platinum: { count: 0, totalEarnings: 0, minOrders: 200, maxOrders: 300, commission: '8%', payout: 'Instant' },
      vip: { count: 0, totalEarnings: 0, minOrders: 301, maxOrders: '∞', commission: '9-10%', payout: 'Instant' }
    };

    data?.forEach(user => {
      const level = user.affiliate_level || 'bronze';
      if (breakdown[level]) {
        breakdown[level].count++;
        breakdown[level].totalEarnings += user.total_earnings || 0;
      }
    });

    res.json({ success: true, breakdown });
  } catch (err) {
    console.error('Tier breakdown error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/affiliates/admin/:id/tier - Update affiliate tier
router.put('/admin/:id/tier', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { tier } = req.body;

    if (!TIER_CONFIG[tier]) {
      return res.status(400).json({ error: 'Invalid tier level' });
    }

    // Check if user exists and is an affiliate
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('id', id)
      .single();

    if (checkError) throw checkError;

    if (existingUser.role !== 'affiliate') {
      return res.status(400).json({ error: 'User is not an affiliate' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        affiliate_level: tier,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Create notification for user
    await supabase
      .from('notifications')
      .insert({
        user_id: id,
        type: 'tier_update',
        title: `🎯 Tier Updated to ${TIER_CONFIG[tier].level}`,
        message: `Admin has updated your affiliate tier to ${TIER_CONFIG[tier].level} with ${TIER_CONFIG[tier].commission_rate}% commission and ${TIER_CONFIG[tier].payout_label} payouts.`,
        link: '/affiliate/dashboard',
        created_at: new Date().toISOString()
      });

    res.json({ 
      success: true, 
      message: `Tier updated to ${tier} successfully`,
      user: data 
    });
  } catch (err) {
    console.error('Update tier error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/affiliates/admin/:id/status - Update affiliate status (active/suspended)
router.put('/admin/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active, suspended, or inactive' });
    }

    // Check if user exists and is an affiliate
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('id', id)
      .single();

    if (checkError) throw checkError;

    if (existingUser.role !== 'affiliate') {
      return res.status(400).json({ error: 'User is not an affiliate' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Create notification for user
    const statusMessages = {
      active: {
        title: '✅ Account Activated',
        message: 'Your affiliate account has been reactivated. You can now continue earning commissions.'
      },
      suspended: {
        title: '⛔ Account Suspended',
        message: 'Your affiliate account has been suspended. Please contact admin for more information.'
      },
      inactive: {
        title: '📌 Account Deactivated',
        message: 'Your affiliate account has been deactivated. Please contact admin if you have questions.'
      }
    };

    await supabase
      .from('notifications')
      .insert({
        user_id: id,
        type: 'status_update',
        title: statusMessages[status].title,
        message: statusMessages[status].message,
        link: '/affiliate/dashboard',
        created_at: new Date().toISOString()
      });

    res.json({ 
      success: true, 
      message: `Status updated to ${status} successfully`,
      user: data 
    });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/affiliates/admin/:id/update - Update affiliate details (name, email, phone, tier, status)
router.put('/admin/:id/update', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, affiliate_level, status } = req.body;

    // Check if user exists and is an affiliate
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('id', id)
      .single();

    if (checkError) throw checkError;

    if (existingUser.role !== 'affiliate') {
      return res.status(400).json({ error: 'User is not an affiliate' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (affiliate_level && TIER_CONFIG[affiliate_level]) updateData.affiliate_level = affiliate_level;
    if (status && ['active', 'suspended', 'inactive'].includes(status)) updateData.status = status;
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'Affiliate updated successfully',
      user: data 
    });
  } catch (err) {
    console.error('Update affiliate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/affiliates/admin/:id - Delete affiliate permanently
router.delete('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if affiliate exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, name, email')
      .eq('id', id)
      .single();

    if (userError) throw userError;

    if (user.role !== 'affiliate') {
      return res.status(400).json({ error: 'User is not an affiliate' });
    }

    // Delete affiliate orders
    const { error: ordersError } = await supabase
      .from('affiliate_orders')
      .delete()
      .eq('affiliate_id', id);

    if (ordersError) console.error('Error deleting affiliate orders:', ordersError);

    // Delete affiliate clicks
    const { error: clicksError } = await supabase
      .from('affiliate_clicks')
      .delete()
      .eq('affiliate_id', id);

    if (clicksError) console.error('Error deleting affiliate clicks:', clicksError);

    // Delete withdrawals
    const { error: withdrawalsError } = await supabase
      .from('withdrawals')
      .delete()
      .eq('affiliate_id', id);

    if (withdrawalsError) console.error('Error deleting withdrawals:', withdrawalsError);

    // Delete affiliate links
    const { error: linksError } = await supabase
      .from('affiliate_links')
      .delete()
      .eq('affiliate_id', id);

    if (linksError) console.error('Error deleting affiliate links:', linksError);

    // Update user back to regular user
    const { data, error } = await supabase
      .from('users')
      .update({
        role: 'user',
        affiliate_approved: false,
        affiliate_level: null,
        referral_code: null,
        affiliate_requested_at: null,
        affiliate_approved_at: null,
        affiliate_approved_by: null,
        affiliate_phone: null,
        affiliate_social_media: null,
        affiliate_experience: null,
        affiliate_experience_years: null,
        affiliate_admin_notes: null,
        total_earnings: 0,
        pending_earnings: 0,
        withdrawable_balance: 0,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Create notification for user
    await supabase
      .from('notifications')
      .insert({
        user_id: id,
        type: 'account_deleted',
        title: '📝 Affiliate Account Removed',
        message: 'Your affiliate account has been removed by admin. You are now a regular user.',
        link: '/',
        created_at: new Date().toISOString()
      });

    res.json({ 
      success: true, 
      message: 'Affiliate deleted successfully',
      user: data 
    });
  } catch (err) {
    console.error('Delete affiliate error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
