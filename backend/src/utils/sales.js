import supabase from '../config/supabase.js';

/** Count toward revenue / units sold: paid successfully, or delivered (e.g. COD). */
export function countsAsCompletedSale(order) {
  if (!order || order.status === 'cancelled') return false;
  return order.payment_status === 'paid' || order.status === 'delivered';
}

async function shiftSoldCount(productId, delta) {
  if (!productId || !delta) return;
  const { data: product } = await supabase
    .from('products')
    .select('sold_count')
    .eq('id', productId)
    .single();
  if (!product) return;
  const next = Math.max(0, Number(product.sold_count || 0) + delta);
  await supabase
    .from('products')
    .update({ sold_count: next, updated_at: new Date().toISOString() })
    .eq('id', productId);
}

export async function applySoldCountForOrder(order, direction) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const sign = direction === 'decrement' ? -1 : 1;
  for (const item of items) {
    const qty = Math.max(0, Number(item.quantity) || 0);
    if (!item.product_id || !qty) continue;
    await shiftSoldCount(item.product_id, sign * qty);
  }
}

export async function syncSoldCountOnOrderChange(previous, next) {
  const wasSale = countsAsCompletedSale(previous);
  const isSale = countsAsCompletedSale(next);
  if (!wasSale && isSale) await applySoldCountForOrder(next, 'increment');
  if (wasSale && !isSale) await applySoldCountForOrder(previous, 'decrement');
}
