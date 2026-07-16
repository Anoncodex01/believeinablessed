'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Award,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  Filter,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  Smartphone,
  Truck,
  User,
  X,
} from 'lucide-react';
import {
  getAdminOrders,
  updateOrder,
} from '@/lib/api';

function formatPrice(value) {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return 'Recently';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatAddress(value) {
  if (!value) return 'No address';
  if (typeof value === 'string') return value;
  return [value.city, value.address].filter(Boolean).join(', ') || 'No address';
}

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_FILTERS = ['', 'snippe', 'mpesa', 'airtel_money', 'tigo_pesa', 'card'];

const STATUS_TONES = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  confirmed: 'border-blue-200 bg-blue-50 text-blue-700',
  processing: 'border-violet-200 bg-violet-50 text-violet-700',
  shipped: 'border-orange-200 bg-orange-50 text-orange-700',
  delivered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelled: 'border-red-200 bg-red-50 text-red-700',
};

const PAYMENT_LABELS = {
  snippe: 'Snippe',
  mpesa: 'M-Pesa',
  airtel_money: 'Airtel Money',
  airtel: 'Airtel Money',
  tigo_pesa: 'Tigo Pesa',
  tigo: 'Tigo Pesa',
  card: 'Card',
  pesapal: 'Pesapal (legacy)',
  cash: 'Cash (legacy)',
  stripe: 'Card (legacy)',
};

const TIER_TONES = {
  bronze: 'border-orange-200 bg-orange-50 text-orange-700',
  silver: 'border-neutral-200 bg-neutral-100 text-neutral-700',
  gold: 'border-amber-200 bg-amber-50 text-amber-700',
  platinum: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  vip: 'border-purple-200 bg-purple-50 text-purple-700',
};

function selectableStatuses(current) {
  return current === 'delivered' ? STATUSES.filter(status => status !== 'cancelled') : STATUSES;
}

function StatusBadge({ status }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_TONES[status] || STATUS_TONES.pending}`}>{status || 'pending'}</span>;
}

function PaymentBadge({ method, paid }) {
  const isMobile = ['mpesa', 'airtel_money', 'airtel', 'tigo_pesa', 'tigo', 'snippe'].includes(method);
  const Icon = isMobile ? Smartphone : CreditCard;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
      <Icon className="h-3.5 w-3.5" />
      {PAYMENT_LABELS[method] || method || 'Payment'}
      {paid && <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />}
    </span>
  );
}

function TierBadge({ tier }) {
  if (!tier) return <span className="text-xs text-[var(--text-secondary)]">Direct</span>;
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${TIER_TONES[tier] || TIER_TONES.bronze}`}>{tier}</span>;
}

function StatCard({ label, value, icon: Icon, dark = false }) {
  return (
    <div className={`rounded-3xl border p-5 ${dark ? 'border-neutral-900 bg-neutral-950 text-white' : 'border-black/10 bg-white text-neutral-950'}`}>
      <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-full ${dark ? 'bg-white/10' : 'bg-neutral-100'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className={`mt-1 text-sm ${dark ? 'text-white/60' : 'text-[var(--text-secondary)]'}`}>{label}</p>
    </div>
  );
}

function normalizeOrder(order) {
  return {
    ...order,
    affiliate_name: order.affiliate?.name || order.affiliate_name || null,
    affiliate_email: order.affiliate?.email || order.affiliate_email || null,
    affiliate_referral_code: order.affiliate?.referral_code || order.affiliate_referral_code || order.referral_code || null,
    affiliate_tier: order.affiliate?.affiliate_level || order.affiliate_tier || null,
    commission_total: Number(order.commission_total || 0),
    commission_status: order.commission_status || 'pending',
    payment_method: order.payment_method || 'snippe',
    payment_status: order.payment_status || 'pending',
  };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [affiliateFilter, setAffiliateFilter] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState('');
  const [mobileFilters, setMobileFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getAdminOrders({
        ...(filter ? { status: filter } : {}),
        ...(paymentFilter ? { payment_method: paymentFilter } : {}),
      });
      setOrders((data.orders || []).map(normalizeOrder));
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter, paymentFilter]);

  useEffect(() => {
    setPage(1);
  }, [filter, paymentFilter, affiliateFilter, query]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    toast.success('Orders refreshed');
  };

  const affiliates = useMemo(() => {
    const map = new Map();
    orders.forEach(order => {
      if (order.affiliate_id && !map.has(order.affiliate_id)) {
        map.set(order.affiliate_id, {
          id: order.affiliate_id,
          name: order.affiliate_name || order.affiliate_referral_code || 'Affiliate',
          code: order.affiliate_referral_code,
        });
      }
    });
    return Array.from(map.values());
  }, [orders]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return orders.filter(order => {
      const matchesAffiliate = affiliateFilter ? order.affiliate_id === affiliateFilter : true;
      const matchesSearch = !search ||
        order.order_number?.toLowerCase().includes(search) ||
        order.customer_name?.toLowerCase().includes(search) ||
        order.customer_email?.toLowerCase().includes(search) ||
        order.customer_phone?.toLowerCase?.().includes(search) ||
        order.affiliate_name?.toLowerCase().includes(search) ||
        order.affiliate_referral_code?.toLowerCase().includes(search);
      return matchesAffiliate && matchesSearch;
    });
  }, [orders, affiliateFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const stats = useMemo(() => ({
    total: filtered.length,
    revenue: filtered.reduce((sum, order) => sum + Number(order.total || 0), 0),
    affiliateOrders: filtered.filter(order => order.affiliate_id).length,
    commission: filtered.reduce((sum, order) => sum + Number(order.commission_total || 0), 0),
    pending: filtered.filter(order => order.status === 'pending').length,
    delivered: filtered.filter(order => order.status === 'delivered').length,
  }), [filtered]);

  const handleStatus = async (order, nextStatus) => {
    if (nextStatus === 'cancelled') {
      if (order.status === 'delivered') {
        toast.error('Delivered orders cannot be cancelled. Handle as return/refund instead.');
        return;
      }
      if (!window.confirm('Cancel this order? Affiliate commission will be removed.')) return;
    }

    setUpdating(order.id);
    try {
      await updateOrder(order.id, { status: nextStatus });
      toast.success(`Order marked ${nextStatus}`);
      await load();
      setSelected(prev => prev?.id === order.id ? { ...prev, status: nextStatus } : prev);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update order');
    } finally {
      setUpdating('');
    }
  };

  const commissionText = (order) => {
    if (!order.affiliate_id) return { text: 'Direct', tone: 'text-[var(--text-secondary)]' };
    if (order.status === 'cancelled') return { text: 'Removed', tone: 'text-red-600' };
    if (order.status === 'delivered' && order.commission_total > 0) return { text: formatPrice(order.commission_total), tone: 'text-emerald-600' };
    return { text: 'Pending', tone: 'text-amber-600' };
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard dark icon={ShoppingBag} label="Orders in view" value={stats.total} />
        <StatCard icon={CreditCard} label="Revenue in view" value={formatPrice(stats.revenue)} />
        <StatCard icon={Award} label="Affiliate orders" value={stats.affiliateOrders} />
        <StatCard icon={Clock} label="Commission in view" value={formatPrice(stats.commission)} />
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search order, customer, phone, email, affiliate..."
              className="h-12 w-full rounded-full border border-black/10 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </label>
          <button onClick={() => setMobileFilters(prev => !prev)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-black/10 px-4 text-sm font-semibold xl:hidden">
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <div className={`${mobileFilters ? 'grid' : 'hidden'} gap-2 xl:flex xl:flex-wrap xl:items-center`}>
            <select value={filter} onChange={event => setFilter(event.target.value)} className="h-11 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold outline-none">
              <option value="">All statuses</option>
              {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <select value={paymentFilter} onChange={event => setPaymentFilter(event.target.value)} className="h-11 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold outline-none">
              {PAYMENT_FILTERS.map(method => <option key={method || 'all'} value={method}>{method ? PAYMENT_LABELS[method] || method : 'All payments'}</option>)}
            </select>
            {affiliates.length > 0 && (
              <select value={affiliateFilter} onChange={event => setAffiliateFilter(event.target.value)} className="h-11 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold outline-none">
                <option value="">All affiliates</option>
                {affiliates.map(affiliate => <option key={affiliate.id} value={affiliate.id}>{affiliate.name} {affiliate.code ? `(${affiliate.code})` : ''}</option>)}
              </select>
            )}
            {(filter || paymentFilter || affiliateFilter || query) && (
              <button onClick={() => { setFilter(''); setPaymentFilter(''); setAffiliateFilter(''); setQuery(''); }} className="h-11 rounded-full bg-neutral-100 px-4 text-sm font-semibold">Clear</button>
            )}
            <button onClick={refresh} title="Refresh" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white transition hover:border-neutral-950">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1160px]">
            <thead className="border-b border-black/10 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              <tr>
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Affiliate</th>
                <th className="px-5 py-4">Commission</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-sm">
              {loading ? Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}><td colSpan={9} className="px-5 py-4"><div className="h-10 rounded-xl shimmer-bg" /></td></tr>
              )) : paginated.map(order => {
                const commission = commissionText(order);
                return (
                  <tr key={order.id} className="align-middle">
                    <td className="px-5 py-4">
                      <p className="font-mono font-bold text-neutral-950">{order.order_number}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{Array.isArray(order.items) ? `${order.items.length} item${order.items.length === 1 ? '' : 's'}` : 'Items unavailable'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{order.customer_name || 'Customer'}</p>
                      <div className="mt-1 space-y-0.5 text-xs text-[var(--text-secondary)]">
                        {order.customer_phone && <p className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{order.customer_phone}</p>}
                        {order.customer_email && <p className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{order.customer_email}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold">{formatPrice(order.total)}</td>
                    <td className="px-5 py-4"><PaymentBadge method={order.payment_method} paid={order.payment_status === 'paid'} /></td>
                    <td className="px-5 py-4">
                      {order.affiliate_id ? (
                        <div>
                          <p className="font-semibold">{order.affiliate_name || 'Affiliate'}</p>
                          <p className="font-mono text-xs text-[var(--text-secondary)]">{order.affiliate_referral_code}</p>
                          <div className="mt-1"><TierBadge tier={order.affiliate_tier} /></div>
                        </div>
                      ) : <span className="text-[var(--text-secondary)]">Direct</span>}
                    </td>
                    <td className={`px-5 py-4 font-bold ${commission.tone}`}>{commission.text}</td>
                    <td className="px-5 py-4">
                      <select
                        value={order.status}
                        onChange={event => handleStatus(order, event.target.value)}
                        disabled={updating === order.id}
                        className={`h-9 rounded-full border px-3 text-xs font-semibold capitalize outline-none ${STATUS_TONES[order.status] || STATUS_TONES.pending}`}
                      >
                        {selectableStatuses(order.status).map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-xs text-[var(--text-secondary)]">{formatDate(order.created_at)}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => setSelected(order)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 transition hover:border-neutral-950">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && <div className="p-10 text-center text-sm text-[var(--text-secondary)]">No orders found.</div>}
      </div>

      {filtered.length > pageSize && (
        <div className="flex flex-col gap-3 rounded-3xl border border-black/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span>Show</span>
            <select value={pageSize} onChange={event => setPageSize(Number(event.target.value))} className="h-10 rounded-full border border-black/10 px-3 text-sm font-semibold">
              {[5, 10, 20, 50].map(value => <option key={value} value={value}>{value}</option>)}
            </select>
            <span>per page</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page === 1} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(prev => Math.min(totalPages, prev + 1))} disabled={page === totalPages} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Order Details</p>
                <h3 className="mt-1 font-display text-3xl font-semibold">{selected.order_number}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full p-2 hover:bg-neutral-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Customer</p>
                <p className="mt-2 font-semibold">{selected.customer_name || 'Customer'}</p>
                <p className="text-sm text-[var(--text-secondary)]">{selected.customer_phone}</p>
                <p className="text-sm text-[var(--text-secondary)]">{selected.customer_email}</p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Delivery</p>
                <p className="mt-2 text-sm leading-6">{formatAddress(selected.shipping_address)}</p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Payment</p>
                <div className="mt-2"><PaymentBadge method={selected.payment_method} paid={selected.payment_status === 'paid'} /></div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Status: {selected.payment_status || 'pending'}</p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Affiliate</p>
                {selected.affiliate_id ? (
                  <>
                    <p className="mt-2 font-semibold">{selected.affiliate_name || 'Affiliate'}</p>
                    <p className="font-mono text-xs text-[var(--text-secondary)]">{selected.affiliate_referral_code}</p>
                    <p className={`mt-2 font-bold ${commissionText(selected).tone}`}>{commissionText(selected).text}</p>
                  </>
                ) : <p className="mt-2 text-sm text-[var(--text-secondary)]">Direct order</p>}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-black/10 p-4">
              <p className="mb-3 font-semibold">Items</p>
              <div className="space-y-2">
                {Array.isArray(selected.items) && selected.items.length > 0 ? selected.items.map((item, index) => (
                  <div key={index} className="flex justify-between gap-3 text-sm">
                    <span className="text-[var(--text-secondary)]">{item.product_name || item.product_id} x {item.quantity}{item.size ? ` (${item.size})` : ''}</span>
                    <span className="font-semibold">{formatPrice(Number(item.unit_price || 0) * Number(item.quantity || 1))}</span>
                  </div>
                )) : <p className="text-sm text-[var(--text-secondary)]">No item details.</p>}
              </div>
              <div className="mt-4 border-t border-black/10 pt-3">
                <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Subtotal</span><span>{formatPrice(selected.subtotal)}</span></div>
                {selected.discount > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>Discount</span><span>-{formatPrice(selected.discount)}</span></div>}
                <div className="mt-2 flex justify-between text-lg font-bold"><span>Total</span><span>{formatPrice(selected.total)}</span></div>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-3 font-semibold">Update status</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {selectableStatuses(selected.status).map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatus(selected, status)}
                    className={`h-11 rounded-full border text-sm font-semibold capitalize ${selected.status === status ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-black/10'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

