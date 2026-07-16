'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Activity,
  ArrowUpRight,
  Ban,
  Check,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  Edit3,
  Eye,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  deleteAffiliate,
  getAdminAffiliateOverview,
  updateAffiliate,
  updateAffiliateApplication,
  updateAffiliateStatus,
  updateWithdrawal,
} from '@/lib/api';

const TIER_META = {
  bronze: { label: 'Bronze', tone: 'border-orange-200 bg-orange-50 text-orange-700', commission: '5%' },
  silver: { label: 'Silver', tone: 'border-neutral-200 bg-neutral-100 text-neutral-700', commission: '6%' },
  gold: { label: 'Gold', tone: 'border-amber-200 bg-amber-50 text-amber-700', commission: '7%' },
  platinum: { label: 'Platinum', tone: 'border-cyan-200 bg-cyan-50 text-cyan-700', commission: '8%' },
  vip: { label: 'VIP', tone: 'border-purple-200 bg-purple-50 text-purple-700', commission: '9-10%' },
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'applications', label: 'Applications', icon: UserCheck },
  { id: 'affiliates', label: 'Affiliates', icon: Users },
  { id: 'withdrawals', label: 'Withdrawals', icon: Wallet },
];

const WITHDRAWAL_TONES = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  approved: 'border-blue-200 bg-blue-50 text-blue-700',
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-red-200 bg-red-50 text-red-700',
};

function formatPrice(value) {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function initials(name) {
  return (name || 'Affiliate')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function TierBadge({ tier }) {
  const info = TIER_META[tier || 'bronze'] || TIER_META.bronze;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${info.tone}`}>
      {info.label}
    </span>
  );
}

function StatusBadge({ status, approved }) {
  if (status === 'suspended') {
    return <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Suspended</span>;
  }
  if (approved) {
    return <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active</span>;
  }
  return <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending</span>;
}

function WithdrawalBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${WITHDRAWAL_TONES[status] || WITHDRAWAL_TONES.pending}`}>
      {status || 'pending'}
    </span>
  );
}

function StatCard({ label, value, detail, icon: Icon, dark = false }) {
  return (
    <div className={`rounded-3xl border p-5 ${dark ? 'border-neutral-900 bg-neutral-950 text-white' : 'border-black/10 bg-white text-neutral-950'}`}>
      <div className="mb-5 flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${dark ? 'bg-white/10 text-white' : 'bg-neutral-100 text-neutral-950'}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className={`mt-1 text-sm ${dark ? 'text-white/60' : 'text-[var(--text-secondary)]'}`}>{label}</p>
      {detail && <p className={`mt-3 text-xs ${dark ? 'text-white/45' : 'text-[var(--text-secondary)]'}`}>{detail}</p>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, note }) {
  return (
    <div className="rounded-3xl border border-dashed border-black/10 bg-white p-10 text-center">
      <Icon className="mx-auto mb-4 h-10 w-10 text-[var(--text-secondary)]" />
      <p className="font-semibold text-[var(--text)]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">{note}</p>
    </div>
  );
}

export default function AdminAffiliatesPage() {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [overview, setOverview] = useState({
    summary: {},
    affiliates: [],
    applications: [],
    withdrawals: [],
    tier_breakdown: {},
  });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    affiliate_level: 'bronze',
    status: 'active',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await getAdminAffiliateOverview();
      setOverview({
        summary: data.summary || {},
        affiliates: data.affiliates || [],
        applications: data.applications || [],
        withdrawals: data.withdrawals || [],
        tier_breakdown: data.tier_breakdown || {},
      });
    } catch (error) {
      console.error('Failed to load affiliate admin data:', error);
      toast.error(error.response?.data?.error || 'Failed to load affiliate data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const search = query.trim().toLowerCase();
  const approvedAffiliates = useMemo(() => (
    overview.affiliates.filter(affiliate => affiliate.role === 'affiliate' && affiliate.affiliate_approved)
  ), [overview.affiliates]);

  const filteredAffiliates = useMemo(() => (
    approvedAffiliates.filter(affiliate => (
      !search ||
      affiliate.name?.toLowerCase().includes(search) ||
      affiliate.email?.toLowerCase().includes(search) ||
      affiliate.referral_code?.toLowerCase().includes(search)
    ))
  ), [approvedAffiliates, search]);

  const filteredApplications = useMemo(() => (
    overview.applications.filter(app => (
      !search ||
      app.name?.toLowerCase().includes(search) ||
      app.email?.toLowerCase().includes(search) ||
      app.referral_code?.toLowerCase().includes(search)
    ))
  ), [overview.applications, search]);

  const filteredWithdrawals = useMemo(() => (
    overview.withdrawals.filter(withdrawal => {
      const affiliate = overview.affiliates.find(item => item.id === withdrawal.affiliate_id);
      return !search ||
        affiliate?.name?.toLowerCase().includes(search) ||
        affiliate?.email?.toLowerCase().includes(search) ||
        affiliate?.referral_code?.toLowerCase().includes(search) ||
        withdrawal.status?.toLowerCase().includes(search);
    })
  ), [overview.withdrawals, overview.affiliates, search]);

  const topAffiliates = useMemo(() => (
    [...approvedAffiliates]
      .sort((a, b) => Number(b.confirmed_commission || b.total_earnings || 0) - Number(a.confirmed_commission || a.total_earnings || 0))
      .slice(0, 5)
  ), [approvedAffiliates]);

  const handleApplication = async (id, status) => {
    const note = status === 'rejected' ? window.prompt('Reason for rejection?') : '';
    try {
      await updateAffiliateApplication(id, { status, admin_notes: note || null });
      toast.success(status === 'approved' ? 'Affiliate approved' : 'Application rejected');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not update application');
    }
  };

  const openEdit = (affiliate) => {
    setEditing(affiliate);
    setEditForm({
      name: affiliate.name || '',
      email: affiliate.email || '',
      phone: affiliate.phone || affiliate.affiliate_phone || '',
      affiliate_level: affiliate.affiliate_level || 'bronze',
      status: affiliate.status || 'active',
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateAffiliate(editing.id, editForm);
      toast.success('Affiliate updated');
      setEditing(null);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not update affiliate');
    }
  };

  const toggleAffiliateStatus = async (affiliate) => {
    const nextStatus = affiliate.status === 'suspended' ? 'active' : 'suspended';
    try {
      await updateAffiliateStatus(affiliate.id, nextStatus);
      toast.success(nextStatus === 'active' ? 'Affiliate reactivated' : 'Affiliate suspended');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not update status');
    }
  };

  const removeAffiliate = async (affiliate) => {
    if (!window.confirm(`Remove ${affiliate.name || 'this affiliate'} from the affiliate program?`)) return;
    try {
      await deleteAffiliate(affiliate.id);
      toast.success('Affiliate removed');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not remove affiliate');
    }
  };

  const handleWithdrawal = async (withdrawal, status) => {
    const note = status === 'rejected' ? window.prompt('Reason for rejection?') : '';
    try {
      await updateWithdrawal(withdrawal.id, { status, admin_notes: note || null });
      toast.success(status === 'paid' ? 'Withdrawal marked as paid' : `Withdrawal ${status}`);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not update withdrawal');
    }
  };

  const copyCode = async (code) => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    toast.success('Referral code copied');
  };

  const summary = overview.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Affiliates</p>
        <button
          type="button"
          onClick={loadData}
          title="Refresh"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:border-neutral-950"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard dark icon={Wallet} label="Withdrawable balance" value={formatPrice(summary.withdrawable_balance)} detail={`${summary.pending_withdrawals || 0} pending payout requests`} />
        <StatCard icon={TrendingUp} label="Affiliate sales volume" value={formatPrice(summary.total_sales_volume)} detail={`${summary.total_clicks || 0} tracked clicks`} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto rounded-full bg-white p-1 shadow-sm">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex h-11 flex-shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                tab === id ? 'bg-neutral-950 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {id === 'applications' && summary.pending_applications > 0 && <span>{summary.pending_applications}</span>}
              {id === 'withdrawals' && summary.pending_withdrawals > 0 && <span>{summary.pending_withdrawals}</span>}
            </button>
          ))}
        </div>

        <label className="relative block w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search affiliate, email, code..."
            className="h-12 w-full rounded-full border border-black/10 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-neutral-950"
          />
        </label>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 rounded-3xl bg-white shimmer-bg" />
          ))}
        </div>
      ) : (
        <>
          {tab === 'overview' && (
            <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
              <div className="rounded-3xl border border-black/10 bg-white p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Leaderboard</p>
                    <h2 className="mt-1 font-display text-3xl font-semibold">Top affiliate performance</h2>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-[var(--text-secondary)]" />
                </div>
                <div className="space-y-3">
                  {topAffiliates.map((affiliate, index) => (
                    <div key={affiliate.id} className="grid gap-4 rounded-2xl border border-black/5 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-sm font-bold text-white">{index + 1}</div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{affiliate.name || 'Affiliate'}</p>
                        <p className="truncate text-xs text-[var(--text-secondary)]">{affiliate.referral_code || affiliate.email}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <TierBadge tier={affiliate.affiliate_level} />
                          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">{affiliate.order_count || 0} delivered</span>
                          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">{affiliate.clicks || 0} clicks</span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-bold text-emerald-600">{formatPrice(affiliate.confirmed_commission || affiliate.total_earnings)}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{affiliate.conversion_rate || 0}% conversion</p>
                      </div>
                    </div>
                  ))}
                  {topAffiliates.length === 0 && <EmptyState icon={Users} title="No affiliate sales yet" note="Approved affiliate performance will appear here once orders start coming in." />}
                </div>
              </div>

              <div className="rounded-3xl border border-black/10 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Tier Mix</p>
                <h2 className="mt-1 font-display text-3xl font-semibold">Commission tiers</h2>
                <div className="mt-5 space-y-3">
                  {Object.entries(TIER_META).map(([tier, meta]) => {
                    const count = overview.tier_breakdown?.[tier]?.count || 0;
                    const total = approvedAffiliates.length || 1;
                    return (
                      <div key={tier}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-semibold">{meta.label}</span>
                          <span className="text-[var(--text-secondary)]">{count} affiliates • {meta.commission}</span>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-100">
                          <div className="h-2 rounded-full bg-neutral-950" style={{ width: `${Math.min(100, (count / total) * 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'applications' && (
            <div className="space-y-3">
              {filteredApplications.map(app => (
                <motion.div key={app.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-black/10 bg-white p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-neutral-950 text-sm font-bold text-white">{initials(app.name)}</div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{app.name || 'Applicant'}</p>
                          <StatusBadge status={app.status} approved={app.affiliate_approved} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
                          <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{app.email}</span>
                          <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{app.affiliate_phone || app.phone || 'No phone'}</span>
                          <span>Applied {formatDate(app.affiliate_requested_at)}</span>
                        </div>
                        <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">{app.affiliate_experience || 'No application note provided.'}</p>
                        <button type="button" onClick={() => copyCode(app.referral_code)} className="mt-3 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">
                          <Copy className="h-3.5 w-3.5" /> {app.referral_code || 'No code'}
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:w-64">
                      <button type="button" onClick={() => handleApplication(app.id, 'approved')} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white">
                        <Check className="h-4 w-4" /> Approve
                      </button>
                      <button type="button" onClick={() => handleApplication(app.id, 'rejected')} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black/10 px-4 text-sm font-semibold text-red-600">
                        <X className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredApplications.length === 0 && <EmptyState icon={UserCheck} title="No pending applications" note="New affiliate applications will appear here for review." />}
            </div>
          )}

          {tab === 'affiliates' && (
            <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px]">
                  <thead className="border-b border-black/10 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                    <tr>
                      <th className="px-5 py-4">Affiliate</th>
                      <th className="px-5 py-4">Tier</th>
                      <th className="px-5 py-4">Orders</th>
                      <th className="px-5 py-4">Clicks</th>
                      <th className="px-5 py-4">Pending</th>
                      <th className="px-5 py-4">Confirmed</th>
                      <th className="px-5 py-4">Withdrawable</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 text-sm">
                    {filteredAffiliates.map(affiliate => (
                      <tr key={affiliate.id} className="align-middle">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-xs font-bold text-white">{initials(affiliate.name)}</div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{affiliate.name || 'Affiliate'}</p>
                              <p className="truncate text-xs text-[var(--text-secondary)]">{affiliate.email}</p>
                              <button type="button" onClick={() => copyCode(affiliate.referral_code)} className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-neutral-500">
                                {affiliate.referral_code || 'No code'} <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4"><TierBadge tier={affiliate.affiliate_level} /></td>
                        <td className="px-5 py-4 font-semibold">{affiliate.order_count || 0}</td>
                        <td className="px-5 py-4">{affiliate.clicks || 0}</td>
                        <td className="px-5 py-4 font-semibold text-amber-600">{formatPrice(affiliate.pending_commission)}</td>
                        <td className="px-5 py-4 font-semibold text-emerald-600">{formatPrice(affiliate.confirmed_commission || affiliate.total_earnings)}</td>
                        <td className="px-5 py-4 font-semibold text-blue-600">{formatPrice(affiliate.withdrawable_balance)}</td>
                        <td className="px-5 py-4"><StatusBadge status={affiliate.status} approved={affiliate.affiliate_approved} /></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => openEdit(affiliate)} className="rounded-full p-2 text-neutral-600 transition hover:bg-neutral-100" title="Edit affiliate">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => toggleAffiliateStatus(affiliate)} className="rounded-full p-2 text-amber-600 transition hover:bg-amber-50" title="Suspend or activate">
                              <Ban className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => removeAffiliate(affiliate)} className="rounded-full p-2 text-red-600 transition hover:bg-red-50" title="Remove affiliate">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredAffiliates.length === 0 && <div className="p-6"><EmptyState icon={Users} title="No affiliates found" note="Approved affiliates matching your search will appear here." /></div>}
            </div>
          )}

          {tab === 'withdrawals' && (
            <div className="space-y-3">
              {filteredWithdrawals.map(withdrawal => {
                const affiliate = overview.affiliates.find(item => item.id === withdrawal.affiliate_id) || withdrawal.users || {};
                return (
                  <div key={withdrawal.id} className="rounded-3xl border border-black/10 bg-white p-5">
                    <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-950">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{affiliate.name || 'Affiliate'}</p>
                            <WithdrawalBadge status={withdrawal.status} />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
                            <span>{affiliate.email || 'No email'}</span>
                            <span>{withdrawal.method || 'mpesa'}: {withdrawal.account_details || 'No account'}</span>
                            <span>{formatDate(withdrawal.created_at)}</span>
                          </div>
                          {withdrawal.admin_notes && <p className="mt-2 text-sm text-[var(--text-secondary)]">{withdrawal.admin_notes}</p>}
                        </div>
                      </div>
                      <div className="text-left lg:text-right">
                        <p className="text-xl font-bold">{formatPrice(withdrawal.amount)}</p>
                        <div className="mt-3 flex flex-wrap gap-2 lg:justify-end">
                          {withdrawal.status === 'pending' && (
                            <>
                              <button type="button" onClick={() => handleWithdrawal(withdrawal, 'approved')} className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white">
                                <CheckCircle className="h-4 w-4" /> Approve
                              </button>
                              <button type="button" onClick={() => handleWithdrawal(withdrawal, 'rejected')} className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 px-4 text-sm font-semibold text-red-600">
                                <X className="h-4 w-4" /> Reject
                              </button>
                            </>
                          )}
                          {withdrawal.status === 'approved' && (
                            <button type="button" onClick={() => handleWithdrawal(withdrawal, 'paid')} className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white">
                              <ShieldCheck className="h-4 w-4" /> Mark Paid
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredWithdrawals.length === 0 && <EmptyState icon={Wallet} title="No withdrawals found" note="Affiliate payout requests will appear here." />}
            </div>
          )}
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Edit Affiliate</p>
                <h3 className="mt-1 font-display text-3xl font-semibold">{editing.name}</h3>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="rounded-full p-2 hover:bg-neutral-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3">
              <input value={editForm.name} onChange={event => setEditForm(prev => ({ ...prev, name: event.target.value }))} className="input h-12 rounded-2xl" placeholder="Name" />
              <input value={editForm.email} onChange={event => setEditForm(prev => ({ ...prev, email: event.target.value }))} className="input h-12 rounded-2xl" placeholder="Email" />
              <input value={editForm.phone} onChange={event => setEditForm(prev => ({ ...prev, phone: event.target.value }))} className="input h-12 rounded-2xl" placeholder="Phone" />
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={editForm.affiliate_level} onChange={event => setEditForm(prev => ({ ...prev, affiliate_level: event.target.value }))} className="input h-12 rounded-2xl">
                  {Object.entries(TIER_META).map(([value, meta]) => <option key={value} value={value}>{meta.label} ({meta.commission})</option>)}
                </select>
                <select value={editForm.status} onChange={event => setEditForm(prev => ({ ...prev, status: event.target.value }))} className="input h-12 rounded-2xl">
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={saveEdit} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-neutral-950 text-sm font-semibold text-white">
                <Check className="h-4 w-4" /> Save changes
              </button>
              <button type="button" onClick={() => setEditing(null)} className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 text-sm font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
