'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
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
  Bell,
  BellRing,
  Check,
  Clock,
  DollarSign,
  Eye,
  Package,
  RefreshCw,
  ShoppingBag,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { approveReview, deleteReview, getAdminDashboard, getAllReviews, getTopProducts, rejectReview } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function formatPrice(value) {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function timeAgo(value) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function StatCard({ label, value, note, icon: Icon, dark = false }) {
  return (
    <div className={`rounded-3xl border p-5 ${dark ? 'border-neutral-900 bg-neutral-950 text-white' : 'border-black/10 bg-white text-neutral-950'}`}>
      <div className="mb-5 flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${dark ? 'bg-white/10' : 'bg-neutral-100'}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className={`mt-1 text-sm ${dark ? 'text-white/60' : 'text-[var(--text-secondary)]'}`}>{label}</p>
      {note && <p className={`mt-3 text-xs ${dark ? 'text-white/45' : 'text-[var(--text-secondary)]'}`}>{note}</p>}
    </div>
  );
}

function ReviewBadge({ status }) {
  const tone = status === 'approved'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : status === 'rejected'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-amber-200 bg-amber-50 text-amber-700';
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}>{status || 'pending'}</span>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [chart, setChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);

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

  const fetchNotifications = async () => {
    const token = Cookies.get('bib_token');
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/notifications?limit=6`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useEffect(() => {
    loadData();
    fetchNotifications();
    const id = setInterval(fetchNotifications, 20000);
    return () => clearInterval(id);
  }, []);

  const markAsRead = async (id) => {
    const token = Cookies.get('bib_token');
    if (!token) return;
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(item => item.id === id ? { ...item, read: true } : item));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const markAllRead = async () => {
    const token = Cookies.get('bib_token');
    if (!token) return;
    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(item => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch {
      toast.error('Failed to update notifications');
    }
  };

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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 rounded-3xl shimmer-bg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard dark icon={DollarSign} label="Total revenue" value={formatPrice(stats.total_revenue)} note={`${stats.total_orders || 0} total orders`} />
        <StatCard icon={ShoppingBag} label="Pending orders" value={stats.pending_orders || 0} note="Need admin attention" />
        <StatCard icon={Award} label="Pending commission" value={formatPrice(stats.pending_commissions)} note={`${stats.total_affiliates || 0} active affiliates`} />
        <StatCard icon={Package} label="Active products" value={stats.total_products || 0} note={`${stats.total_users || 0} customers and users`} />
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-full bg-white p-1 shadow-sm">
        {[
          { id: 'overview', label: 'Overview', icon: ShoppingBag },
          { id: 'reviews', label: 'Reviews', icon: Star, count: reviewStats.pending },
        ].map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`inline-flex h-11 flex-shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${
              tab === item.id ? 'bg-neutral-950 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            {item.count > 0 && <span>{item.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-black/10 bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Revenue</p>
                <h2 className="mt-1 font-display text-3xl font-semibold">Last 30 days</h2>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111111" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#111111" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e5df" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={value => String(value).slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={value => `${Math.round(value / 1000)}K`} />
                  <Tooltip formatter={value => formatPrice(value)} />
                  <Area type="monotone" dataKey="revenue" stroke="#111111" fill="url(#revenueFill)" strokeWidth={2.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Products</p>
            <h2 className="mt-1 font-display text-3xl font-semibold">Top sellers</h2>
            <div className="mt-5 space-y-3">
              {topProducts.slice(0, 6).map((product, index) => {
                const image = product.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=120&h=120&fit=crop';
                return (
                  <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-black/5 p-3">
                    <span className="w-6 text-sm font-bold text-[var(--text-secondary)]">{index + 1}</span>
                    <img src={image} alt={product.name} className="h-12 w-12 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{product.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{product.sold_count || 0} sold</p>
                    </div>
                    <p className="text-sm font-bold">{formatPrice(product.sale_price || product.price)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-5 xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Orders</p>
                <h2 className="mt-1 font-display text-3xl font-semibold">Daily order volume</h2>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e5df" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={value => String(value).slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#111111" radius={[8, 8, 0, 0]} />
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

          <div className="rounded-3xl border border-black/10 bg-white p-5">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Moderation</p>
              <h2 className="mt-1 font-display text-3xl font-semibold">Customer reviews</h2>
            </div>
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="rounded-2xl border border-black/10 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{review.user_name || 'Customer'}</p>
                        <ReviewBadge status={review.status} />
                        <span className="text-xs text-[var(--text-secondary)]">{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
                        ))}
                      </div>
                      {review.title && <p className="mt-2 font-semibold">{review.title}</p>}
                      <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--text-secondary)]">{review.comment}</p>
                      <p className="mt-2 text-xs text-[var(--text-secondary)]">{review.product_name}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {review.status === 'pending' && (
                        <>
                          <button onClick={() => updateReview(review.id, 'approve')} className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white">
                            <Check className="h-4 w-4" /> Approve
                          </button>
                          <button onClick={() => updateReview(review.id, 'reject')} className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 px-4 text-sm font-semibold text-red-600">
                            <X className="h-4 w-4" /> Reject
                          </button>
                        </>
                      )}
                      <Link href={`/products/${review.product_id}`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 px-4 text-sm font-semibold">
                        <Eye className="h-4 w-4" /> Product
                      </Link>
                      <button onClick={() => updateReview(review.id, 'delete')} className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 px-4 text-sm font-semibold text-red-600">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {reviews.length === 0 && <div className="rounded-2xl border border-dashed border-black/10 p-10 text-center text-sm text-[var(--text-secondary)]">No reviews yet.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
