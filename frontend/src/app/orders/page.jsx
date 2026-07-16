// app/orders/page.jsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { getMyOrders } from '@/lib/api';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  Heart,
  Home,
  LogOut,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  User,
  XCircle,
} from 'lucide-react';

function formatPrice(n) {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(n || 0);
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
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return [value.city, value.address].filter(Boolean).join(', ');
  }
  return String(value);
}

const STATUS_ICONS = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const STATUS_STYLES = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  confirmed: 'border-blue-200 bg-blue-50 text-blue-700',
  processing: 'border-violet-200 bg-violet-50 text-violet-700',
  shipped: 'border-orange-200 bg-orange-50 text-orange-700',
  delivered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelled: 'border-red-200 bg-red-50 text-red-700',
};

const PAYMENT_LABELS = {
  paid: 'Paid',
  pending: 'Payment pending',
  verifying: 'Payment verifying',
  failed: 'Payment failed',
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
];

function getOrderItemsCount(order) {
  return Array.isArray(order.items)
    ? order.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
    : 0;
}

function OrderStatusBadge({ status }) {
  const Icon = STATUS_ICONS[status] || Package;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
      <Icon className="h-3.5 w-3.5" />
      {status || 'pending'}
    </span>
  );
}

function OrderCard({ order, onTrack }) {
  const itemCount = getOrderItemsCount(order);
  const paymentLabel = PAYMENT_LABELS[order.payment_status] || order.payment_status || 'Payment pending';
  const canTrack = order.payment_status === 'paid';
  const shippingAddress = formatAddress(order.shipping_address);

  return (
    <article className="rounded-3xl border border-black/10 bg-white p-4 transition hover:border-neutral-950 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm font-semibold text-neutral-950 dark:text-white">{order.order_number}</p>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {itemCount} item{itemCount === 1 ? '' : 's'} - {formatDate(order.created_at)}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-lg font-bold text-neutral-950 dark:text-white">{formatPrice(order.total)}</p>
          <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">{paymentLabel}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-black/5 pt-4 dark:border-white/10 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0 text-sm text-[var(--text-secondary)]">
          {shippingAddress ? (
            <span className="inline-flex max-w-full items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{shippingAddress}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {paymentLabel}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onTrack(order)}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition ${
            canTrack
              ? 'bg-neutral-950 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-950'
              : 'border border-black/10 text-neutral-700 hover:border-neutral-950 dark:border-white/10 dark:text-neutral-200'
          }`}
        >
          {canTrack ? 'Track order' : 'View status'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

export default function CustomerDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const roleDashboardHref = user?.role === 'admin'
    ? '/admin'
    : user?.role === 'affiliate' || user?.role === 'affiliate_pending'
    ? '/affiliate/dashboard'
    : null;

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMyOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login?redirect=/orders');
      return;
    }
    if (user.role === 'admin') {
      router.replace('/admin');
      return;
    }
    if (user.role === 'affiliate' || user.role === 'affiliate_pending') {
      router.replace('/affiliate/dashboard');
      return;
    }
    loadOrders();
  }, [user, authLoading, router, loadOrders]);

  const stats = useMemo(() => {
    const pending = orders.filter(order => ['pending', 'confirmed', 'processing'].includes(order.status)).length;
    const active = orders.filter(order => ['confirmed', 'processing', 'shipped'].includes(order.status)).length;
    const delivered = orders.filter(order => order.status === 'delivered').length;
    const totalSpent = orders
      .filter(order => order.payment_status === 'paid' && order.status !== 'cancelled')
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    return { pending, active, delivered, totalSpent };
  }, [orders]);

  const activeOrder = useMemo(() => (
    orders.find(order => ['shipped', 'processing', 'confirmed'].includes(order.status) && order.payment_status === 'paid') ||
    orders.find(order => order.status === 'pending') ||
    orders[0]
  ), [orders]);

  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'pending' && ['pending', 'confirmed', 'processing'].includes(order.status)) ||
        (filter === 'active' && ['confirmed', 'processing', 'shipped'].includes(order.status)) ||
        (filter === 'delivered' && order.status === 'delivered');

      const matchesSearch =
        !search ||
        order.order_number?.toLowerCase().includes(search) ||
        order.status?.toLowerCase().includes(search) ||
        order.payment_status?.toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, query]);

  const goToTracking = (order) => {
    router.push(`/track?order=${encodeURIComponent(order.order_number)}`);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!authLoading && roleDashboardHref) {
    return (
      <main className="min-h-screen bg-[#f7f6f3] pt-16 dark:bg-neutral-950">
        <Navbar />
        <section className="mx-auto flex min-h-[55vh] max-w-[1500px] items-center justify-center px-4 py-12 sm:px-8 lg:px-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent dark:border-white dark:border-t-transparent" />
            <p className="text-sm font-semibold text-[var(--text-secondary)]">Opening your dashboard...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f3] pt-16 pb-24 dark:bg-neutral-950 md:pb-0">
      <Navbar />

      <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[32px] bg-neutral-950 text-white">
              <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/55">Customer Dashboard</p>
                  <h1 className="mt-3 font-display text-4xl font-semibold leading-none sm:text-6xl">
                    Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">
                    Track current orders, review pending payments, and jump back into shopping from one clean account page.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                  <Link href="/products" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-neutral-950">
                    Shop
                    <ShoppingBag className="h-4 w-4" />
                  </Link>
                  <Link href="/track" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white">
                    Track
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Pending orders', value: stats.pending, icon: Clock },
                { label: 'Active tracking', value: stats.active, icon: Truck },
                { label: 'Delivered', value: stats.delivered, icon: CheckCircle },
                { label: 'Total spent', value: formatPrice(stats.totalSpent), icon: CreditCard },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-3xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-950 dark:bg-white/10 dark:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-950 dark:text-white">{value}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{label}</p>
                </div>
              ))}
            </div>

            {activeOrder && (
              <div className="rounded-[32px] border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Current order</p>
                    <h2 className="mt-1 font-display text-3xl font-semibold text-neutral-950 dark:text-white">Live order status</h2>
                  </div>
                  <OrderStatusBadge status={activeOrder.status} />
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <p className="font-mono text-sm font-semibold text-blue-500">{activeOrder.order_number}</p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {PAYMENT_LABELS[activeOrder.payment_status] || activeOrder.payment_status || 'Payment pending'} - {formatPrice(activeOrder.total)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToTracking(activeOrder)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-950"
                  >
                    Open tracking
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-[32px] border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Orders</p>
                  <h2 className="mt-1 font-display text-3xl font-semibold text-neutral-950 dark:text-white">Order history</h2>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="relative block">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input
                      value={query}
                      onChange={event => setQuery(event.target.value)}
                      className="h-11 w-full rounded-full border border-black/10 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-neutral-950 dark:border-white/10 dark:bg-white/5 sm:w-64"
                      placeholder="Search order"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={loadOrders}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black/10 px-4 text-sm font-semibold transition hover:border-neutral-950 dark:border-white/10 dark:hover:border-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                {FILTERS.map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key)}
                    className={`h-10 flex-shrink-0 rounded-full px-5 text-sm font-semibold transition ${
                      filter === item.key
                        ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                        : 'bg-neutral-100 text-neutral-600 hover:text-neutral-950 dark:bg-white/10 dark:text-neutral-300 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {(loading || authLoading) && (
                <div className="py-14 text-center">
                  <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent dark:border-white dark:border-t-transparent" />
                </div>
              )}

              {!loading && !authLoading && orders.length === 0 && (
                <div className="rounded-3xl border border-dashed border-black/10 p-10 text-center dark:border-white/10">
                  <Package className="mx-auto mb-4 h-10 w-10 text-[var(--text-secondary)]" />
                  <p className="font-semibold text-neutral-950 dark:text-white">No orders yet</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
                    Once you place an order, it will appear here with tracking and payment status.
                  </p>
                  <Link href="/products" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white dark:bg-white dark:text-neutral-950">
                    Start shopping
                  </Link>
                </div>
              )}

              {!loading && !authLoading && orders.length > 0 && filteredOrders.length === 0 && (
                <div className="rounded-3xl border border-dashed border-black/10 p-8 text-center text-sm text-[var(--text-secondary)] dark:border-white/10">
                  No orders match this filter.
                </div>
              )}

              <div className="space-y-3">
                {!loading && filteredOrders.map(order => (
                  <OrderCard key={order.id} order={order} onTrack={goToTracking} />
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                  <User className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-neutral-950 dark:text-white">{user?.name || 'Customer'}</p>
                  <p className="truncate text-sm text-[var(--text-secondary)]">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 rounded-2xl bg-neutral-100 p-4 dark:bg-white/10">
                  <Phone className="h-4 w-4 text-[var(--text-secondary)]" />
                  <span className="text-neutral-950 dark:text-white">{user?.phone || 'Phone not added'}</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-neutral-100 p-4 dark:bg-white/10">
                  <Home className="h-4 w-4 text-[var(--text-secondary)]" />
                  <span className="text-neutral-950 dark:text-white">Saved checkout details</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-black/10 text-sm font-semibold text-neutral-950 transition hover:border-red-500 hover:text-red-500 dark:border-white/10 dark:text-white"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>

            <div className="rounded-[32px] border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Quick actions</p>
              <div className="mt-4 grid gap-3">
                <Link href="/products" className="flex items-center justify-between rounded-2xl border border-black/10 p-4 text-sm font-semibold transition hover:border-neutral-950 dark:border-white/10 dark:hover:border-white">
                  Continue shopping
                  <ShoppingBag className="h-4 w-4" />
                </Link>
                <Link href="/track" className="flex items-center justify-between rounded-2xl border border-black/10 p-4 text-sm font-semibold transition hover:border-neutral-950 dark:border-white/10 dark:hover:border-white">
                  Track by order number
                  <Truck className="h-4 w-4" />
                </Link>
                <Link href="/products?sort=popular" className="flex items-center justify-between rounded-2xl border border-black/10 p-4 text-sm font-semibold transition hover:border-neutral-950 dark:border-white/10 dark:hover:border-white">
                  Browse popular items
                  <Heart className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </main>
  );
}
