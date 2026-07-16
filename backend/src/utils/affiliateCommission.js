/**
 * Affiliate commission helpers — shared by orders + Snippe payment flows
 */
import supabase from '../config/supabase.js';

export const TIER_CONFIG = {
  bronze: {
    min_orders: 0,
    max_orders: 19,
    commission_rate: 5,
    payout_days: 14,
    payout_label: '2 Weeks',
    level: 'bronze',
    requires_orders_for_withdraw: 19,
  },
  silver: {
    min_orders: 20,
    max_orders: 99,
    commission_rate: 6,
    payout_days: 7,
    payout_label: '1 Week',
    level: 'silver',
    requires_orders_for_withdraw: 10,
  },
  gold: {
    min_orders: 100,
    max_orders: 199,
    commission_rate: 7,
    payout_days: 3,
    payout_label: '3 Days',
    level: 'gold',
    requires_orders_for_withdraw: 5,
  },
  platinum: {
    min_orders: 200,
    max_orders: 300,
    commission_rate: 8,
    payout_days: 0,
    payout_label: 'Instant',
    level: 'platinum',
    requires_orders_for_withdraw: 3,
  },
  vip: {
    min_orders: 301,
    max_orders: Infinity,
    commission_rate: 10,
    payout_days: 0,
    payout_label: 'Instant',
    level: 'vip',
    requires_orders_for_withdraw: 0,
  },
};

export function getTierByOrderCount(orderCount) {
  if (orderCount <= 19) return TIER_CONFIG.bronze;
  if (orderCount <= 99) return TIER_CONFIG.silver;
  if (orderCount <= 199) return TIER_CONFIG.gold;
  if (orderCount <= 300) return TIER_CONFIG.platinum;
  return TIER_CONFIG.vip;
}

export async function getAffiliateCurrentTier(affiliateId) {
  const { count: orderCount, error } = await supabase
    .from('affiliate_orders')
    .select('id', { count: 'exact', head: true })
    .eq('affiliate_id', affiliateId)
    .eq('status', 'confirmed');

  if (error) {
    console.error('Error counting confirmed orders:', error);
    return TIER_CONFIG.bronze;
  }

  return getTierByOrderCount(orderCount || 0);
}

export async function updateAffiliateTier(affiliateId) {
  try {
    const tier = await getAffiliateCurrentTier(affiliateId);
    const { error } = await supabase
      .from('users')
      .update({
        affiliate_level: tier.level,
        updated_at: new Date().toISOString(),
      })
      .eq('id', affiliateId);

    if (error) console.error('Error updating affiliate tier:', error);
    return tier;
  } catch (error) {
    console.error('Error in updateAffiliateTier:', error);
    return TIER_CONFIG.bronze;
  }
}

/**
 * Confirm pending commission (called when payment is paid / order delivered)
 */
export async function confirmOrderCommission(orderId, affiliateId, reason = 'Payment confirmed') {
  try {
    console.log(`💰 Confirming commission for order ${orderId}, affiliate ${affiliateId} — ${reason}`);

    const { data: affOrders, error: affFetchError } = await supabase
      .from('affiliate_orders')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'pending');

    if (affFetchError) {
      console.error('Error fetching affiliate orders:', affFetchError);
      return false;
    }

    if (!affOrders?.length) {
      console.log('⚠️ No pending affiliate orders found for', orderId);
      return false;
    }

    const currentTier = await getAffiliateCurrentTier(affiliateId);
    const currentCommissionRate = currentTier.commission_rate;
    let totalCommission = 0;

    for (const affOrder of affOrders) {
      const newCommission = (affOrder.order_amount * currentCommissionRate) / 100;
      totalCommission += newCommission;

      await supabase
        .from('affiliate_orders')
        .update({
          commission: newCommission,
          commission_rate: currentCommissionRate,
          tier_at_time: currentTier.level,
          status: 'confirmed',
          is_confirmed: true,
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', affOrder.id);
    }

    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('total_earnings, pending_earnings, withdrawable_balance, affiliate_level')
      .eq('id', affiliateId)
      .single();

    if (userFetchError) {
      console.error('Error fetching user data:', userFetchError);
      return false;
    }

    const { count: orderCount } = await supabase
      .from('affiliate_orders')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', affiliateId)
      .eq('status', 'confirmed');

    const tier = getTierByOrderCount(orderCount || 0);
    const isEligibleForWithdraw = (orderCount || 0) >= tier.requires_orders_for_withdraw;

    const updateData = {
      total_earnings: (userData.total_earnings || 0) + totalCommission,
      pending_earnings: Math.max(0, (userData.pending_earnings || 0) - totalCommission),
      affiliate_level: tier.level,
      updated_at: new Date().toISOString(),
    };

    if (isEligibleForWithdraw) {
      updateData.withdrawable_balance = (userData.withdrawable_balance || 0) + totalCommission;
    }

    await supabase.from('users').update(updateData).eq('id', affiliateId);

    await supabase
      .from('orders')
      .update({
        commission_total: totalCommission,
        commission_status: 'confirmed',
        affiliate_tier: tier.level,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    console.log(`✅ Commission CONFIRMED for affiliate ${affiliateId}: ${totalCommission} TZS`);
    return true;
  } catch (error) {
    console.error('Error confirming commission:', error);
    return false;
  }
}

export async function cancelOrderCommission(orderId, affiliateId, reason) {
  try {
    console.log(`❌ Cancelling commission for order ${orderId}, affiliate ${affiliateId}`);

    const { data: affOrders, error: affFetchError } = await supabase
      .from('affiliate_orders')
      .select('*')
      .eq('order_id', orderId);

    if (affFetchError || !affOrders?.length) {
      return false;
    }

    const confirmedOrders = affOrders.filter((ao) => ao.status === 'confirmed');
    const pendingOrders = affOrders.filter((ao) => ao.status === 'pending');
    const hasConfirmed = confirmedOrders.length > 0;
    const hasPending = pendingOrders.length > 0;

    await supabase
      .from('affiliate_orders')
      .update({
        status: 'cancelled',
        is_confirmed: false,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || 'Order cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    const { data: userData } = await supabase
      .from('users')
      .select('total_earnings, pending_earnings, withdrawable_balance')
      .eq('id', affiliateId)
      .single();

    if (userData) {
      const updateData = { updated_at: new Date().toISOString() };

      if (hasConfirmed) {
        const confirmedCommission = confirmedOrders.reduce((sum, ao) => sum + (ao.commission || 0), 0);
        updateData.total_earnings = Math.max(0, (userData.total_earnings || 0) - confirmedCommission);
        updateData.withdrawable_balance = Math.max(0, (userData.withdrawable_balance || 0) - confirmedCommission);
      }

      if (hasPending) {
        const pendingCommission = pendingOrders.reduce((sum, ao) => sum + (ao.commission || 0), 0);
        updateData.pending_earnings = Math.max(0, (userData.pending_earnings || 0) - pendingCommission);
      }

      if (hasConfirmed || hasPending) {
        await supabase.from('users').update(updateData).eq('id', affiliateId);
      }
    }

    await supabase
      .from('orders')
      .update({
        commission_total: 0,
        commission_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    await updateAffiliateTier(affiliateId);
    return true;
  } catch (error) {
    console.error('Error cancelling commission:', error);
    return false;
  }
}

export async function restoreOrderCommission(orderId, affiliateId) {
  try {
    const { data: affOrders, error: affFetchError } = await supabase
      .from('affiliate_orders')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'cancelled');

    if (affFetchError || !affOrders?.length) return false;

    const totalCommission = affOrders.reduce((sum, ao) => sum + (ao.commission || 0), 0);

    await supabase
      .from('affiliate_orders')
      .update({
        status: 'pending',
        is_confirmed: false,
        cancelled_at: null,
        cancellation_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)
      .eq('status', 'cancelled');

    const { data: userData } = await supabase
      .from('users')
      .select('pending_earnings')
      .eq('id', affiliateId)
      .single();

    if (userData) {
      await supabase
        .from('users')
        .update({
          pending_earnings: (userData.pending_earnings || 0) + totalCommission,
          updated_at: new Date().toISOString(),
        })
        .eq('id', affiliateId);
    }

    await supabase
      .from('orders')
      .update({
        commission_total: totalCommission,
        commission_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    await updateAffiliateTier(affiliateId);
    return true;
  } catch (error) {
    console.error('Error restoring commission:', error);
    return false;
  }
}
