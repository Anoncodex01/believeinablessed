'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Ban,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  Edit3,
  MousePointer,
  RefreshCw,
  Save,
  ShoppingBag,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { getAdminUser, updateUser } from '@/lib/api';

const ROLE_TONES = {
  admin: 'border-teal-700/25 bg-teal-700/10 text-teal-800 dark:text-teal-300',
  affiliate: 'border-amber-600/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  affiliate_pending: 'border-amber-600/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  customer: 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
  user: 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
};

const STATUS_TONES = {
  active: 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  suspended: 'border-red-600/25 bg-red-500/10 text-red-700 dark:text-red-400',
  pending: 'border-amber-600/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  confirmed: 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  processing: 'border-sky-600/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  shipped: 'border-indigo-600/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  delivered: 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  cancelled: 'border-red-600/25 bg-red-500/10 text-red-700 dark:text-red-400',
  paid: 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  approved: 'border-sky-600/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  rejected: 'border-red-600/25 bg-red-500/10 text-red-700 dark:text-red-400',
};

const TIER_TONES = {
  bronze: 'border-orange-600/25 bg-orange-500/10 text-orange-700 dark:text-orange-400',
  silver: 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
  gold: 'border-amber-600/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  platinum: 'border-cyan-600/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  vip: 'border-teal-700/25 bg-teal-700/10 text-teal-800 dark:text-teal-300',
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'affiliate', label: 'Affiliate', icon: Wallet },
  { id: 'withdrawals', label: 'Withdrawals', icon: CreditCard },
];

function formatPrice(value) {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Badge({ children, tone }) {
  return (
    <span className={`inline-flex border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tone || STATUS_TONES.pending}`}>
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, dark = false }) {
  return (
    <div className={`border p-5 ${dark ? 'border-neutral-900 bg-neutral-950 text-white' : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]'}`}>
      <div className={`mb-4 flex h-10 w-10 items-center justify-center ${dark ? 'bg-white/10' : 'bg-teal-700/10 text-teal-700'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-display text-2xl font-semibold tracking-tight">{value}</p>
      <p className={`mt-1 text-[11px] font-semibold tracking-[0.14em] uppercase ${dark ? 'text-white/55' : 'text-[var(--text-secondary)]'}`}>{label}</p>
    </div>
  );
}

function isAffiliateAccount(user, summary = {}) {
  if (!user) return false;
  if (user.is_affiliate === true) return true;
  const role = String(user.role || '').toLowerCase();
  if (role === 'affiliate' || role === 'affiliate_pending') return true;
  if (user.affiliate_approved) return true;
  if (user.affiliate_requested_at) return true;
  if (user.referral_code) return true;
  if (Number(summary.referred_orders || 0) > 0) return true;
  if (Number(summary.affiliate_order_rows || 0) > 0) return true;
  if (Number(summary.total_clicks || 0) > 0) return true;
  if (Number(user.total_earnings || 0) > 0) return true;
  if (Number(user.pending_earnings || 0) > 0) return true;
  if (user.affiliate_phone || user.affiliate_social_media) return true;
  return false;
}

function formatRoleLabel(role) {
  if (role === 'affiliate_pending') return 'affiliate (pending)';
  return role || 'customer';
}

function EmptyState({ message }) {
  return (
    <div className="border border-dashed border-[var(--border)] px-5 py-10 text-center text-sm text-[var(--text-secondary)]">
      {message}
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: res } = await getAdminUser(userId);
      setData(res);
      const u = res.user || {};
      setForm({
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        role: u.role || 'customer',
        status: u.status || 'active',
        affiliate_level: u.affiliate_level || 'bronze',
        affiliate_approved: !!u.affiliate_approved,
        referral_code: u.referral_code || '',
        affiliate_phone: u.affiliate_phone || '',
        affiliate_social_media: u.affiliate_social_media || '',
        affiliate_experience: u.affiliate_experience || '',
        affiliate_experience_years: u.affiliate_experience_years ?? '',
        affiliate_admin_notes: u.affiliate_admin_notes || '',
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to load user');
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  }, [userId, router]);

  useEffect(() => {
    load();
  }, [load]);

  const user = data?.user;
  const summary = data?.summary || {};
  const affiliateAccount = isAffiliateAccount(user, summary);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: form.role,
        status: form.status,
        affiliate_level: form.affiliate_level,
        affiliate_approved: form.affiliate_approved,
        referral_code: form.referral_code.trim() || undefined,
        affiliate_phone: form.affiliate_phone.trim() || null,
        affiliate_social_media: form.affiliate_social_media.trim() || null,
        affiliate_experience: form.affiliate_experience.trim() || null,
        affiliate_experience_years: form.affiliate_experience_years === '' ? null : Number(form.affiliate_experience_years),
        affiliate_admin_notes: form.affiliate_admin_notes.trim() || null,
      };
      await updateUser(userId, payload);
      toast.success('User updated');
      setEditing(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleBanToggle = async () => {
    if (!user) return;
    const next = user.status === 'suspended' ? 'active' : 'suspended';
    const label = next === 'suspended' ? 'ban' : 'unban';
    if (!window.confirm(`${label === 'ban' ? 'Ban' : 'Unban'} ${user.name}? They ${next === 'suspended' ? 'will not be able to log in' : 'will regain access'}.`)) {
      return;
    }
    setSaving(true);
    try {
      await updateUser(userId, { status: next });
      toast.success(next === 'suspended' ? 'User banned' : 'User reactivated');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const copyText = async (text) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <div className="h-28 shimmer-bg" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 shimmer-bg" />
          ))}
        </div>
        <div className="h-96 shimmer-bg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/admin/users"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--text)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to users
            </Link>
            <p className="section-kicker">User profile</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center bg-neutral-950 text-sm font-bold text-white dark:bg-white dark:text-neutral-950">
                {(user.name || '?').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
                  {user.name}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={ROLE_TONES[user.role] || ROLE_TONES.customer}>{formatRoleLabel(user.role)}</Badge>
              <Badge tone={STATUS_TONES[user.status] || STATUS_TONES.pending}>{user.status}</Badge>
              {affiliateAccount && (
                <Badge tone={TIER_TONES[(user.affiliate_level || 'bronze').toLowerCase()] || TIER_TONES.bronze}>
                  {(user.affiliate_level || 'bronze').toUpperCase()} level
                </Badge>
              )}
              {affiliateAccount && (
                <Badge tone={user.affiliate_approved ? STATUS_TONES.active : STATUS_TONES.pending}>
                  {user.affiliate_approved ? 'Approved affiliate' : 'Affiliate pending approval'}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex h-11 items-center gap-2 border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm font-semibold text-[var(--text)]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="inline-flex h-11 items-center gap-2 border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm font-semibold text-[var(--text)]"
            >
              {editing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
              {editing ? 'Cancel edit' : 'Edit'}
            </button>
            <button
              type="button"
              disabled={saving || user.role === 'admin'}
              onClick={handleBanToggle}
              className={`inline-flex h-11 items-center gap-2 px-4 text-sm font-semibold text-white disabled:opacity-50 ${
                user.status === 'suspended' ? 'bg-emerald-700' : 'bg-red-700'
              }`}
            >
              {user.status === 'suspended' ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
              {user.status === 'suspended' ? 'Unban' : 'Ban user'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard dark icon={Wallet} label="Total earnings" value={formatPrice(summary.confirmed_commission ?? user.total_earnings)} />
        <StatCard icon={MousePointer} label="Clicks" value={summary.total_clicks || 0} />
        <StatCard icon={Clock} label="Pending orders" value={summary.pending_orders || summary.referred_unpaid || 0} />
        <StatCard icon={CreditCard} label="Withdrawable" value={formatPrice(user.withdrawable_balance)} />
      </div>

      {editing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight text-[var(--text)]">Edit user</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Update profile, role, affiliate settings, and notes.</p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex h-11 items-center gap-2 bg-neutral-950 px-4 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-neutral-950"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['name', 'Full name', 'text'],
              ['email', 'Email', 'email'],
              ['phone', 'Phone', 'text'],
              ['referral_code', 'Referral code', 'text'],
              ['affiliate_phone', 'Affiliate phone', 'text'],
              ['affiliate_social_media', 'Social media', 'text'],
              ['affiliate_experience_years', 'Experience (years)', 'number'],
            ].map(([key, label, type]) => (
              <label key={key} className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{label}</span>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  className="input h-11 w-full"
                />
              </label>
            ))}

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Role</span>
              <select value={form.role} onChange={(e) => setField('role', e.target.value)} className="input h-11 w-full">
                <option value="customer">Customer</option>
                <option value="affiliate">Affiliate</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Status</span>
              <select value={form.status} onChange={(e) => setField('status', e.target.value)} className="input h-11 w-full">
                <option value="active">Active</option>
                <option value="suspended">Suspended (banned)</option>
                <option value="pending">Pending</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Affiliate tier</span>
              <select value={form.affiliate_level} onChange={(e) => setField('affiliate_level', e.target.value)} className="input h-11 w-full">
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
                <option value="vip">VIP</option>
              </select>
            </label>

            <label className="flex items-center gap-3 border border-[var(--border)] px-4 py-3 sm:col-span-2 lg:col-span-1">
              <input
                type="checkbox"
                checked={form.affiliate_approved}
                onChange={(e) => setField('affiliate_approved', e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-[var(--text)]">Affiliate approved</span>
            </label>

            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Affiliate experience</span>
              <textarea
                value={form.affiliate_experience}
                onChange={(e) => setField('affiliate_experience', e.target.value)}
                rows={2}
                className="input w-full py-3"
              />
            </label>

            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Admin notes</span>
              <textarea
                value={form.affiliate_admin_notes}
                onChange={(e) => setField('affiliate_admin_notes', e.target.value)}
                rows={3}
                className="input w-full py-3"
                placeholder="Internal notes about this user…"
              />
            </label>
          </div>
        </motion.div>
      )}

      <div className="flex flex-wrap gap-2 border border-[var(--border)] bg-[var(--bg-card)] p-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex h-11 items-center gap-2 px-4 text-sm font-semibold transition ${
              tab === id
                ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6">
            <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--text)]">Account</h3>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ['Name', user.name],
                ['Email', user.email, true],
                ['Phone', user.phone || '—'],
                ['Role', user.role],
                ['Status', user.status],
                ['Joined', formatDate(user.created_at)],
                ['Updated', formatDate(user.updated_at)],
                ['Referred by', user.referred_by || '—'],
              ].map(([label, value, copyable]) => (
                <div key={label} className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
                  <dt className="text-[var(--text-secondary)]">{label}</dt>
                  <dd className="flex items-center gap-2 text-right font-medium text-[var(--text)]">
                    {value}
                    {copyable && value && value !== '—' && (
                      <button type="button" onClick={() => copyText(value)} className="text-[var(--text-secondary)] hover:text-[var(--text)]">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6">
            <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--text)]">Affiliate snapshot</h3>
            {!affiliateAccount ? (
              <p className="mt-4 text-sm text-[var(--text-secondary)]">This account is not an affiliate.</p>
            ) : (
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  ['Referral code', user.referral_code || '—', true],
                  ['Tier', user.affiliate_level || 'bronze'],
                  ['Approved', user.affiliate_approved ? 'Yes' : 'No'],
                  ['Requested', formatDate(user.affiliate_requested_at)],
                  ['Approved at', formatDate(user.affiliate_approved_at)],
                  ['Confirmed earnings', formatPrice(summary.confirmed_commission ?? user.total_earnings)],
                  ['Pending commission', formatPrice(summary.pending_commission ?? user.pending_earnings)],
                  ['Withdrawable', formatPrice(user.withdrawable_balance)],
                  ['Paid referred orders', summary.referred_paid || 0],
                  ['Unpaid referred orders', summary.referred_unpaid || 0],
                  ['Confirmed sales', summary.confirmed_orders || 0],
                  ['Pending sales', summary.pending_orders || 0],
                  ['Clicks', summary.total_clicks || 0],
                  ['Affiliate phone', user.affiliate_phone || '—'],
                  ['Social', user.affiliate_social_media || '—'],
                ].map(([label, value, copyable]) => (
                  <div key={label} className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
                    <dt className="text-[var(--text-secondary)]">{label}</dt>
                    <dd className="flex items-center gap-2 text-right font-medium text-[var(--text)]">
                      {value}
                      {copyable && value && value !== '—' && (
                        <button type="button" onClick={() => copyText(value)} className="text-[var(--text-secondary)] hover:text-[var(--text)]">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {user.affiliate_admin_notes && (
              <div className="mt-5 border border-[var(--border)] bg-[var(--surface-warm)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Admin notes</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text)]">{user.affiliate_admin_notes}</p>
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-6">
          <section className="border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--text)]">Orders placed by this user</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Paid {summary.customer_paid || 0} · Unpaid {summary.customer_unpaid || 0} · Total {summary.customer_orders || 0}
              </p>
            </div>
            {(data.customer_orders || []).length === 0 ? (
              <EmptyState message="No customer orders yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                    <tr>
                      {['Order', 'Total', 'Payment', 'Fulfillment', 'Date'].map((h) => (
                        <th key={h} className="px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {data.customer_orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[var(--bg-secondary)]">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-[var(--text)]">{order.order_number}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{Array.isArray(order.items) ? `${order.items.length} items` : '—'}</p>
                        </td>
                        <td className="px-5 py-3 font-medium">{formatPrice(order.total)}</td>
                        <td className="px-5 py-3">
                          <Badge tone={order.payment_status === 'paid' ? STATUS_TONES.paid : STATUS_TONES.pending}>
                            {order.payment_status === 'paid' ? 'Paid / success' : (order.payment_status || 'pending')}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={STATUS_TONES[order.status] || STATUS_TONES.pending}>{order.status}</Badge>
                        </td>
                        <td className="px-5 py-3 text-xs text-[var(--text-secondary)]">{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--text)]">Orders referred by this affiliate</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Paid {summary.referred_paid || 0} · Pending payment {summary.referred_unpaid || 0} · Cancelled {summary.referred_cancelled || 0}
              </p>
            </div>
            {(data.referred_orders || []).length === 0 ? (
              <EmptyState message="No referred orders yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-sm">
                  <thead className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                    <tr>
                      {['Order', 'Customer', 'Total', 'Payment', 'Commission', 'Fulfillment', 'Date'].map((h) => (
                        <th key={h} className="px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {data.referred_orders.map((order) => {
                      const isPaid = order.payment_status === 'paid';
                      const isCancelled = order.status === 'cancelled' || order.commission_status === 'cancelled';
                      let commissionLabel = 'Pending';
                      let commissionTone = 'text-amber-600';
                      if (isCancelled) {
                        commissionLabel = 'Removed';
                        commissionTone = 'text-red-600';
                      } else if (order.commission_status === 'confirmed' || (isPaid && Number(order.commission_total) > 0 && order.commission_status !== 'pending')) {
                        commissionLabel = formatPrice(order.commission_total);
                        commissionTone = 'text-emerald-600';
                      } else if (Number(order.commission_total) > 0) {
                        commissionLabel = `${formatPrice(order.commission_total)} pending`;
                      }

                      return (
                        <tr key={order.id} className="hover:bg-[var(--bg-secondary)]">
                          <td className="px-5 py-3 font-semibold text-[var(--text)]">{order.order_number}</td>
                          <td className="px-5 py-3">
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-xs text-[var(--text-secondary)]">{order.customer_phone || order.customer_email || '—'}</p>
                          </td>
                          <td className="px-5 py-3 font-medium">{formatPrice(order.total)}</td>
                          <td className="px-5 py-3">
                            <Badge tone={isPaid ? STATUS_TONES.paid : STATUS_TONES.pending}>
                              {isPaid ? 'Paid / success' : (order.payment_status || 'pending')}
                            </Badge>
                          </td>
                          <td className={`px-5 py-3 font-semibold ${commissionTone}`}>{commissionLabel}</td>
                          <td className="px-5 py-3">
                            <Badge tone={STATUS_TONES[order.status] || STATUS_TONES.pending}>{order.status}</Badge>
                          </td>
                          <td className="px-5 py-3 text-xs text-[var(--text-secondary)]">{formatDate(order.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'affiliate' && (
        <div className="space-y-6">
          <section className="border border-amber-600/25 bg-amber-500/5 overflow-hidden">
            <div className="border-b border-amber-600/20 px-5 py-4">
              <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--text)]">Pending commissions</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Waiting for payment success — {summary.pending_orders || 0} orders · {formatPrice(summary.pending_commission)}
              </p>
            </div>
            {(data.affiliate_orders || []).filter((r) => r.status === 'pending').length === 0 ? (
              <EmptyState message="No pending commissions." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b border-amber-600/20 bg-amber-500/10 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                    <tr>
                      {['Product', 'Order amount', 'Rate', 'Commission', 'Date'].map((h) => (
                        <th key={h} className="px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {data.affiliate_orders.filter((r) => r.status === 'pending').map((row) => (
                      <tr key={row.id}>
                        <td className="px-5 py-3 font-medium">{row.product_name || 'Product'}</td>
                        <td className="px-5 py-3">{formatPrice(row.order_amount)}</td>
                        <td className="px-5 py-3">{row.commission_rate != null ? `${row.commission_rate}%` : '—'}</td>
                        <td className="px-5 py-3 font-semibold text-amber-600">{formatPrice(row.commission)}</td>
                        <td className="px-5 py-3 text-xs text-[var(--text-secondary)]">{formatDate(row.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--text)]">Confirmed commissions</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Payment successful — commission earned.</p>
            </div>
            {(data.affiliate_orders || []).filter((r) => r.status === 'confirmed').length === 0 ? (
              <EmptyState message="No confirmed commissions yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                    <tr>
                      {['Product', 'Order amount', 'Rate', 'Commission', 'Confirmed'].map((h) => (
                        <th key={h} className="px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {data.affiliate_orders.filter((r) => r.status === 'confirmed').map((row) => (
                      <tr key={row.id}>
                        <td className="px-5 py-3 font-medium">{row.product_name || 'Product'}</td>
                        <td className="px-5 py-3">{formatPrice(row.order_amount)}</td>
                        <td className="px-5 py-3">{row.commission_rate != null ? `${row.commission_rate}%` : '—'}</td>
                        <td className="px-5 py-3 font-semibold text-emerald-600">{formatPrice(row.commission)}</td>
                        <td className="px-5 py-3 text-xs text-[var(--text-secondary)]">{formatDate(row.confirmed_at || row.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--text)]">Full commission ledger</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Every row including cancelled.</p>
            </div>
            {(data.affiliate_orders || []).length === 0 ? (
              <EmptyState message="No commission records yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                    <tr>
                      {['Product', 'Order amount', 'Rate', 'Commission', 'Tier', 'Status', 'Date'].map((h) => (
                        <th key={h} className="px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {data.affiliate_orders.map((row) => (
                      <tr key={row.id} className="hover:bg-[var(--bg-secondary)]">
                        <td className="px-5 py-3">
                          <p className="font-medium text-[var(--text)]">{row.product_name || 'Product'}</p>
                          <p className="text-xs text-[var(--text-secondary)] font-mono">{row.order_id?.slice(0, 8)}…</p>
                        </td>
                        <td className="px-5 py-3">{formatPrice(row.order_amount)}</td>
                        <td className="px-5 py-3">{row.commission_rate != null ? `${row.commission_rate}%` : '—'}</td>
                        <td className={`px-5 py-3 font-semibold ${row.status === 'cancelled' ? 'text-red-600' : row.status === 'pending' ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {formatPrice(row.commission)}
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={TIER_TONES[row.tier_at_time] || TIER_TONES.bronze}>{row.tier_at_time || '—'}</Badge>
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={STATUS_TONES[row.status] || STATUS_TONES.pending}>{row.status}</Badge>
                          {row.cancellation_reason && (
                            <p className="mt-1 text-[10px] text-red-600">{row.cancellation_reason}</p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-[var(--text-secondary)]">{formatDate(row.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--text)]">Referral clicks</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Counted when someone opens an affiliate link (`?ref=CODE`) or a referred product page. Total: {summary.total_clicks || 0}
              </p>
            </div>
            {(data.clicks || []).length === 0 ? (
              <EmptyState message="No referral clicks recorded yet. Share a link like /products/ID?ref=THEIRCODE to start tracking." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                    <tr>
                      {['Product / page', 'Referral code', 'Date'].map((h) => (
                        <th key={h} className="px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {data.clicks.map((click) => (
                      <tr key={click.id}>
                        <td className="px-5 py-3 font-medium">{click.product_name || 'Landing / general'}</td>
                        <td className="px-5 py-3 font-mono text-xs">{click.referral_code || '—'}</td>
                        <td className="px-5 py-3 text-xs text-[var(--text-secondary)]">{formatDate(click.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'withdrawals' && (
        <section className="border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--text)]">Withdrawals</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {summary.withdrawals || 0} requests · {formatPrice(summary.withdrawn_total)} paid/processing
            </p>
          </div>
          {(data.withdrawals || []).length === 0 ? (
            <EmptyState message="No withdrawal requests." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  <tr>
                    {['Amount', 'Method', 'Account', 'Status', 'Notes', 'Date'].map((h) => (
                      <th key={h} className="px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-[var(--bg-secondary)]">
                      <td className="px-5 py-3 font-semibold">{formatPrice(w.amount)}</td>
                      <td className="px-5 py-3 uppercase text-xs">{w.method || '—'}</td>
                      <td className="px-5 py-3 text-xs text-[var(--text-secondary)]">{w.account_details || '—'}</td>
                      <td className="px-5 py-3">
                        <Badge tone={STATUS_TONES[w.status] || STATUS_TONES.pending}>{w.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-xs text-[var(--text-secondary)]">{w.admin_notes || '—'}</td>
                      <td className="px-5 py-3 text-xs text-[var(--text-secondary)]">{formatDate(w.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
