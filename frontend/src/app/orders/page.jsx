// app/orders/page.jsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  pending: 'border-amber-600/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  confirmed: 'border-teal-700/25 bg-teal-700/10 text-teal-800 dark:text-teal-300',
  processing: 'border-sky-600/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  shipped: 'border-orange-600/25 bg-orange-500/10 text-orange-700 dark:text-orange-400',
  delivered: 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  cancelled: 'border-red-600/25 bg-red-500/10 text-red-700 dark:text-red-400',
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
    <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
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
    <article className="border border-[var(--border)] bg-[var(--bg-card)] p-4 transition hover:border-teal-700/40 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm font-semibold text-[var(--text)]">{order.order_number}</p>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {itemCount} item{itemCount === 1 ? '' : 's'} · {formatDate(order.created_at)}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-lg font-bold text-[var(--text)]">{formatPrice(order.total)}</p>
          <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">{paymentLabel}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0 text-sm text-[var(--text-secondary)]">
          {shippingAddress ? (
            <span className="inline-flex max-w-full items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0 text-teal-700" />
              <span className="truncate">{shippingAddress}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-teal-700" />
              {paymentLabel}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onTrack(order)}
          className={`inline-flex h-11 items-center justify-center gap-2 px-5 text-sm font-semibold transition ${
            canTrack
              ? 'bg-neutral-950 text-white hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300'
              : 'border border-[var(--border)] text-[var(--text)] hover:border-teal-700'
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
      <main className="min-h-screen overflow-x-hidden bg-[var(--bg)] pb-20 pt-16 md:pb-0">
        <Navbar />
        <section className="home-shell flex min-h-[55vh] items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin border-2 border-neutral-950 border-t-transparent dark:border-white dark:border-t-transparent" />
            <p className="text-sm font-semibold text-[var(--text-secondary)]">Opening your dashboard...</p>
          </div>
        </section>
      </main>
    );
  }

  const firstName = user?.name ? user.name.split(' ')[0] : '';

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg)] pb-20 pt-16 md:pb-0">
      <Navbar />

      <div className="home-shell py-10 sm:py-14 lg:py-16">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8 overflow-hidden border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-8 sm:px-8 sm:py-10 lg:px-10"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(15,118,110,0.08),_transparent_55%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="section-kicker">Your orders</p>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
                Welcome back{firstName ? `, ${firstName}` : ''}.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                Track shipments, review payments, and pick up where you left off — all in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/products"
                className="inline-flex h-11 items-center justify-center gap-2 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300"
              >
                Shop
                <ShoppingBag className="h-4 w-4" />
              </Link>
              <Link
                href="/track"
                className="inline-flex h-11 items-center justify-center gap-2 border border-[var(--border)] px-5 text-sm font-semibold text-[var(--text)] transition hover:border-teal-700"
              >
                Track order
                <Truck className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              {[
                { label: 'Pending', value: stats.pending, icon: Clock },
                { label: 'In transit', value: stats.active, icon: Truck },
                { label: 'Delivered', value: stats.delivered, icon: CheckCircle },
                { label: 'Total spent', value: formatPrice(stats.totalSpent), icon: CreditCard },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center bg-teal-700/10 text-teal-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-display text-2xl font-semibold tracking-tight text-[var(--text)]">{value}</p>
                  <p className="mt-1 text-[11px] font-semibold tracking-[0.14em] text-[var(--text-secondary)] uppercase">{label}</p>
                </div>
              ))}
            </motion.div>

            {activeOrder && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 }}
                className="border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6"
              >
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="section-kicker">Current order</p>
                    <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
                      Live status
                    </h2>
                  </div>
                  <OrderStatusBadge status={activeOrder.status} />
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <p className="font-mono text-sm font-semibold text-teal-700">{activeOrder.order_number}</p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {PAYMENT_LABELS[activeOrder.payment_status] || activeOrder.payment_status || 'Payment pending'} · {formatPrice(activeOrder.total)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToTracking(activeOrder)}
                    className="inline-flex h-11 items-center justify-center gap-2 bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300"
                  >
                    Open tracking
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6"
            >
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="section-kicker">History</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
                    Your orders
                  </h2>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="relative block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input
                      value={query}
                      onChange={event => setQuery(event.target.value)}
                      className="input h-11 w-full pl-10 sm:w-56"
                      placeholder="Search order"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={loadOrders}
                    className="inline-flex h-11 items-center justify-center gap-2 border border-[var(--border)] px-4 text-sm font-semibold transition hover:border-teal-700"
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
                    className={`h-10 flex-shrink-0 px-4 text-sm font-semibold transition ${
                      filter === item.key
                        ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                        : 'border border-[var(--border)] text-[var(--text-secondary)] hover:border-teal-700 hover:text-[var(--text)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {(loading || authLoading) && (
                <div className="py-14 text-center">
                  <div className="mx-auto h-9 w-9 animate-spin border-2 border-neutral-950 border-t-transparent dark:border-white dark:border-t-transparent" />
                </div>
              )}

              {!loading && !authLoading && orders.length === 0 && (
                <div className="border border-dashed border-[var(--border)] p-10 text-center">
                  <Package className="mx-auto mb-4 h-10 w-10 text-[var(--text-secondary)]" />
                  <p className="font-display text-lg font-semibold text-[var(--text)]">No orders yet</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
                    Once you place an order, it will appear here with tracking and payment status.
                  </p>
                  <Link
                    href="/products"
                    className="mt-5 inline-flex h-11 items-center justify-center bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300"
                  >
                    Start shopping
                  </Link>
                </div>
              )}

              {!loading && !authLoading && orders.length > 0 && filteredOrders.length === 0 && (
                <div className="border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-secondary)]">
                  No orders match this filter.
                </div>
              )}

              <div className="space-y-3">
                {!loading && filteredOrders.map(order => (
                  <OrderCard key={order.id} order={order} onTrack={goToTracking} />
                ))}
              </div>
            </motion.div>
          </div>

          <aside className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              className="border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold tracking-tight text-[var(--text)]">{user?.name || 'Customer'}</p>
                  <p className="truncate text-sm text-[var(--text-secondary)]">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3 border border-[var(--border)] bg-[var(--bg)] p-3.5">
                  <Phone className="h-4 w-4 text-teal-700" />
                  <span className="text-[var(--text)]">{user?.phone || 'Phone not added'}</span>
                </div>
                <div className="flex items-center gap-3 border border-[var(--border)] bg-[var(--bg)] p-3.5">
                  <Home className="h-4 w-4 text-teal-700" />
                  <span className="text-[var(--text)]">Saved checkout details</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 border border-[var(--border)] text-sm font-semibold text-[var(--text)] transition hover:border-red-500 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.14 }}
              className="border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6"
            >
              <p className="section-kicker">Quick actions</p>
              <div className="mt-4 grid gap-2">
                <Link href="/products" className="flex items-center justify-between border border-[var(--border)] p-4 text-sm font-semibold text-[var(--text)] transition hover:border-teal-700">
                  Continue shopping
                  <ShoppingBag className="h-4 w-4 text-teal-700" />
                </Link>
                <Link href="/track" className="flex items-center justify-between border border-[var(--border)] p-4 text-sm font-semibold text-[var(--text)] transition hover:border-teal-700">
                  Track by order number
                  <Truck className="h-4 w-4 text-teal-700" />
                </Link>
                <Link href="/products?sort=popular" className="flex items-center justify-between border border-[var(--border)] p-4 text-sm font-semibold text-[var(--text)] transition hover:border-teal-700">
                  Browse popular items
                  <Heart className="h-4 w-4 text-teal-700" />
                </Link>
              </div>
            </motion.div>
          </aside>
        </div>
      </div>

      <Footer />
      <BottomNav />
    </main>
  );
}
