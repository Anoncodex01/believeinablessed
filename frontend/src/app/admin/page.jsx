'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  Check,
  Clock,
  DollarSign,
  Eye,
  Package,
  ShoppingBag,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { approveReview, deleteReview, getAdminDashboard, getAllReviews, getTopProducts, rejectReview } from '@/lib/api';

function formatPrice(value) {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function StatCard({ label, value, note, icon: Icon, dark = false }) {
  return (
    <div className={`border p-5 ${dark ? 'border-neutral-900 bg-neutral-950 text-white' : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]'}`}>
      <div className={`mb-4 flex h-10 w-10 items-center justify-center ${dark ? 'bg-white/10' : 'bg-teal-700/10 text-teal-700'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-display text-2xl font-semibold tracking-tight">{value}</p>
      <p className={`mt-1 text-[11px] font-semibold tracking-[0.14em] uppercase ${dark ? 'text-white/55' : 'text-[var(--text-secondary)]'}`}>{label}</p>
      {note && <p className={`mt-3 text-xs ${dark ? 'text-white/45' : 'text-[var(--text-secondary)]'}`}>{note}</p>}
    </div>
  );
}

function ReviewBadge({ status }) {
  const tone = status === 'approved'
    ? 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
    : status === 'rejected'
    ? 'border-red-600/25 bg-red-500/10 text-red-700 dark:text-red-400'
    : 'border-amber-600/25 bg-amber-500/10 text-amber-700 dark:text-amber-400';
  return (
    <span className={`border px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${tone}`}>
      {status || 'pending'}
    </span>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [chart, setChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, productsRes, reviewsRes] = await Promise.all([
        getAdminDashboard(),
        getTopProducts(),
        getAllReviews({ limit: 100 }),
      ]);
      setStats(dashboardRes.data.stats || {});
      setChart(dashboardRes.data.revenue_chart || []);
      setTopProducts(productsRes.data.products || []);
      setReviews(reviewsRes.data.reviews || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateReview = async (id, action) => {
    try {
      if (action === 'approve') await approveReview(id);
      if (action === 'reject') await rejectReview(id);
      if (action === 'delete') {
        if (!window.confirm('Delete this review?')) return;
        await deleteReview(id);
      }
      toast.success(action === 'approve' ? 'Review approved' : action === 'reject' ? 'Review rejected' : 'Review deleted');
      loadData();
    } catch {
      toast.error('Could not update review');
    }
  };

  const reviewStats = useMemo(() => ({
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
  }), [reviews]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 border border-[var(--border)] shimmer-bg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-6 sm:px-6">
        <p className="section-kicker">Overview</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
          Store performance
        </h2>
        <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
          Revenue, orders, affiliates, and review moderation in one place.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard dark icon={DollarSign} label="Total revenue" value={formatPrice(stats.total_revenue)} note={`${stats.total_orders || 0} active orders${stats.cancelled_orders ? ` · ${stats.cancelled_orders} cancelled` : ''}`} />
        <StatCard icon={ShoppingBag} label="Pending orders" value={stats.pending_orders || 0} note="Need admin attention" />
        <StatCard icon={Award} label="Pending commission" value={formatPrice(stats.pending_commissions)} note={`${stats.total_affiliates || 0} active affiliates`} />
        <StatCard icon={Package} label="Active products" value={stats.total_products || 0} note={`${stats.total_users || 0} customers and users`} />
      </div>

      <div className="flex gap-2 overflow-x-auto border border-[var(--border)] bg-[var(--bg-card)] p-1">
        {[
          { id: 'overview', label: 'Overview', icon: ShoppingBag },
          { id: 'reviews', label: 'Reviews', icon: Star, count: reviewStats.pending },
        ].map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`inline-flex h-11 flex-shrink-0 items-center gap-2 px-5 text-sm font-semibold transition ${
              tab === item.id
                ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            {item.count > 0 && (
              <span className="border border-current/20 px-1.5 py-0.5 text-[10px]">{item.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <p className="section-kicker">Revenue</p>
            <h3 className="font-display text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">Last 30 days</h3>
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={value => String(value).slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={value => `${Math.round(value / 1000)}K`} />
                  <Tooltip formatter={value => formatPrice(value)} />
                  <Area type="monotone" dataKey="revenue" stroke="#0f766e" fill="url(#revenueFill)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <p className="section-kicker">Products</p>
            <h3 className="font-display text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">Top sellers</h3>
            <div className="mt-5 space-y-2">
              {topProducts.slice(0, 6).map((product, index) => {
                const image = product.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=120&h=120&fit=crop';
                return (
                  <div key={product.id} className="flex items-center gap-3 border border-[var(--border)] p-3">
                    <span className="w-5 text-sm font-bold text-[var(--text-secondary)]">{index + 1}</span>
                    <img src={image} alt={product.name} className="h-11 w-11 object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text)]">{product.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{product.sold_count || 0} sold</p>
                    </div>
                    <p className="text-sm font-bold text-[var(--text)]">{formatPrice(product.sale_price || product.price)}</p>
                  </div>
                );
              })}
              {topProducts.length === 0 && (
                <p className="py-8 text-center text-sm text-[var(--text-secondary)]">No product sales yet.</p>
              )}
            </div>
          </div>

          <div className="border border-[var(--border)] bg-[var(--bg-card)] p-5 xl:col-span-2">
            <p className="section-kicker">Orders</p>
            <h3 className="font-display text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">Daily order volume</h3>
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={value => String(value).slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Star} label="Total reviews" value={reviewStats.total} />
            <StatCard icon={Clock} label="Pending" value={reviewStats.pending} />
            <StatCard icon={Check} label="Approved" value={reviewStats.approved} />
            <StatCard icon={X} label="Rejected" value={reviewStats.rejected} />
          </div>

          <div className="border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <p className="section-kicker">Moderation</p>
            <h3 className="font-display text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">Customer reviews</h3>
            <div className="mt-5 space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="border border-[var(--border)] p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[var(--text)]">{review.user_name || 'Customer'}</p>
                        <ReviewBadge status={review.status} />
                        <span className="text-xs text-[var(--text-secondary)]">{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
                        ))}
                      </div>
                      {review.title && <p className="mt-2 font-semibold text-[var(--text)]">{review.title}</p>}
                      <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--text-secondary)]">{review.comment}</p>
                      <p className="mt-2 text-xs text-[var(--text-secondary)]">{review.product_name}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {review.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => updateReview(review.id, 'approve')}
                            className="inline-flex h-10 items-center gap-2 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300"
                          >
                            <Check className="h-4 w-4" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => updateReview(review.id, 'reject')}
                            className="inline-flex h-10 items-center gap-2 border border-[var(--border)] px-4 text-sm font-semibold text-red-600 transition hover:border-red-500"
                          >
                            <X className="h-4 w-4" /> Reject
                          </button>
                        </>
                      )}
                      <Link
                        href={`/products/${review.product_id}`}
                        target="_blank"
                        className="inline-flex h-10 items-center gap-2 border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text)] transition hover:border-teal-700"
                      >
                        <Eye className="h-4 w-4" /> Product
                      </Link>
                      <button
                        type="button"
                        onClick={() => updateReview(review.id, 'delete')}
                        className="inline-flex h-10 items-center gap-2 border border-[var(--border)] px-4 text-sm font-semibold text-red-600 transition hover:border-red-500"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--text-secondary)]">
                  No reviews yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
