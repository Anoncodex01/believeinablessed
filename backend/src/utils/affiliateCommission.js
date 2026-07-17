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

/** Count distinct paid/confirmed orders (not line items). */
export async function countConfirmedAffiliateOrders(affiliateId) {
  const { data, error } = await supabase
    .from('affiliate_orders')
    .select('order_id')
    .eq('affiliate_id', affiliateId)
    .eq('status', 'confirmed');

  if (error) {
    console.error('Error counting confirmed orders:', error);
    return 0;
  }

  return new Set((data || []).map((row) => row.order_id).filter(Boolean)).size;
}

export async function getAffiliateCurrentTier(affiliateId) {
  const orderCount = await countConfirmedAffiliateOrders(affiliateId);
  return getTierByOrderCount(orderCount);
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

async function recalculateWithdrawableBalance(affiliateId) {
  const { data: confirmed } = await supabase
    .from('affiliate_orders')
    .select('commission')
    .eq('affiliate_id', affiliateId)
    .eq('status', 'confirmed');

  const totalConfirmed = (confirmed || []).reduce((sum, row) => sum + Number(row.commission || 0), 0);

  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('amount')
    .eq('affiliate_id', affiliateId)
    .in('status', ['pending', 'approved', 'completed', 'processing']);

  const withdrawn = (withdrawals || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return Math.max(0, totalConfirmed - withdrawn);
}

export async function reconcileAffiliateBalances(affiliateId) {
  try {
    const { data: rows, error } = await supabase
      .from('affiliate_orders')
      .select('commission, status')
      .eq('affiliate_id', affiliateId);

    if (error) {
      console.error('reconcileAffiliateBalances error:', error);
      return false;
    }

    const pendingEarnings = (rows || [])
      .filter((row) => row.status === 'pending')
      .reduce((sum, row) => sum + Number(row.commission || 0), 0);

    const totalEarnings = (rows || [])
      .filter((row) => row.status === 'confirmed')
      .reduce((sum, row) => sum + Number(row.commission || 0), 0);

    const orderCount = await countConfirmedAffiliateOrders(affiliateId);
    const tier = getTierByOrderCount(orderCount);
    const withdrawable = orderCount >= tier.requires_orders_for_withdraw
      ? await recalculateWithdrawableBalance(affiliateId)
      : 0;

    await supabase
      .from('users')
      .update({
        pending_earnings: pendingEarnings,
        total_earnings: totalEarnings,
        withdrawable_balance: withdrawable,
        affiliate_level: tier.level,
        updated_at: new Date().toISOString(),
      })
      .eq('id', affiliateId);

    return true;
  } catch (error) {
    console.error('reconcileAffiliateBalances failed:', error);
    return false;
  }
}

/**
 * Confirm pending commission (called when payment is paid / order delivered).
 * Also recovers rows that were wrongly cancelled after a failed payment attempt.
 */
export async function confirmOrderCommission(orderId, affiliateId, reason = 'Payment confirmed') {
  try {
    if (!orderId || !affiliateId) {
      console.warn('⚠️ confirmOrderCommission missing orderId or affiliateId');
      return false;
    }

    console.log(`💰 Confirming commission for order ${orderId}, affiliate ${affiliateId} — ${reason}`);

    let { data: affOrders, error: affFetchError } = await supabase
      .from('affiliate_orders')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'pending');

    if (affFetchError) {
      console.error('Error fetching affiliate orders:', affFetchError);
      return false;
    }

    // Recover after a failed payment attempt cancelled pending rows on the same order
    if (!affOrders?.length) {
      const { data: cancelledRows } = await supabase
        .from('affiliate_orders')
        .select('*')
        .eq('order_id', orderId)
        .eq('status', 'cancelled');

      if (cancelledRows?.length) {
        console.log(`🔄 Restoring ${cancelledRows.length} cancelled affiliate rows before confirm`);
        await restoreOrderCommission(orderId, affiliateId);
        const restored = await supabase
          .from('affiliate_orders')
          .select('*')
          .eq('order_id', orderId)
          .eq('status', 'pending');
        affOrders = restored.data || [];
      }
    }

    // Already confirmed — ensure order + tier are in sync
    if (!affOrders?.length) {
      const { data: alreadyConfirmed } = await supabase
        .from('affiliate_orders')
        .select('id, commission')
        .eq('order_id', orderId)
        .eq('status', 'confirmed');

      if (alreadyConfirmed?.length) {
        const total = alreadyConfirmed.reduce((sum, row) => sum + Number(row.commission || 0), 0);
        await supabase
          .from('orders')
          .update({
            commission_total: total,
            commission_status: 'confirmed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
        await updateAffiliateTier(affiliateId);
        console.log('ℹ️ Commission already confirmed for', orderId);
        return true;
      }

      console.log('⚠️ No pending affiliate orders found for', orderId);
      return false;
    }

    const originalPendingTotal = affOrders.reduce((sum, ao) => sum + Number(ao.commission || 0), 0);
    let totalCommission = 0;

    for (const affOrder of affOrders) {
      // Keep the rate locked when the order was created — do not recalculate at payment time
      const lockedCommission = Number(affOrder.commission || 0);
      const lockedRate = Number(affOrder.commission_rate || TIER_CONFIG.bronze.commission_rate);
      const lockedTier = affOrder.tier_at_time || TIER_CONFIG.bronze.level;
      totalCommission += lockedCommission;

      await supabase
        .from('affiliate_orders')
        .update({
          commission: lockedCommission,
          commission_rate: lockedRate,
          tier_at_time: lockedTier,
          status: 'confirmed',
          is_confirmed: true,
          confirmed_at: new Date().toISOString(),
          cancelled_at: null,
          cancellation_reason: null,
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

    const orderCount = await countConfirmedAffiliateOrders(affiliateId);
    const tier = getTierByOrderCount(orderCount);
    const isEligibleForWithdraw = orderCount >= tier.requires_orders_for_withdraw;

    const updateData = {
      total_earnings: (userData.total_earnings || 0) + totalCommission,
      // Subtract what was previously reserved as pending (original rates)
      pending_earnings: Math.max(0, (userData.pending_earnings || 0) - originalPendingTotal),
      affiliate_level: tier.level,
      updated_at: new Date().toISOString(),
    };

    if (isEligibleForWithdraw) {
      updateData.withdrawable_balance = await recalculateWithdrawableBalance(affiliateId);
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

    await reconcileAffiliateBalances(affiliateId);

    console.log(
      `✅ Commission CONFIRMED for affiliate ${affiliateId}: ${totalCommission} TZS | tier=${tier.level} | confirmed_orders=${orderCount}`
    );
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

    // Don't re-cancel already cancelled rows
    const activeOrders = affOrders.filter((ao) => ao.status !== 'cancelled');
    if (!activeOrders.length) return true;

    const confirmedOrders = activeOrders.filter((ao) => ao.status === 'confirmed');
    const pendingOrders = activeOrders.filter((ao) => ao.status === 'pending');
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
      .eq('order_id', orderId)
      .neq('status', 'cancelled');

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
      }

      if (hasPending) {
        const pendingCommission = pendingOrders.reduce((sum, ao) => sum + (ao.commission || 0), 0);
        updateData.pending_earnings = Math.max(0, (userData.pending_earnings || 0) - pendingCommission);
      }

      if (hasConfirmed || hasPending) {
        await supabase.from('users').update(updateData).eq('id', affiliateId);
        // Keep withdrawable accurate after clawbacks
        const orderCount = await countConfirmedAffiliateOrders(affiliateId);
        const tier = getTierByOrderCount(orderCount);
        const withdrawable = orderCount >= tier.requires_orders_for_withdraw
          ? await recalculateWithdrawableBalance(affiliateId)
          : 0;
        await supabase
          .from('users')
          .update({
            withdrawable_balance: withdrawable,
            affiliate_level: tier.level,
            updated_at: new Date().toISOString(),
          })
          .eq('id', affiliateId);
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
    await reconcileAffiliateBalances(affiliateId);
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
