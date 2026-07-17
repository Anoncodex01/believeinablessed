'use client';
import { useState, useEffect, useMemo } from 'react';
import { getAdminWithdrawals, updateWithdrawal } from '@/lib/api';
import { CheckCircle, Clock, DollarSign, RefreshCw, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

function formatPrice(n) {
  return new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n || 0);
}

function statusTone(status) {
  if (status === 'paid') return 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  if (status === 'approved') return 'border-sky-600/25 bg-sky-500/10 text-sky-700 dark:text-sky-300';
  if (status === 'rejected') return 'border-red-600/25 bg-red-500/10 text-red-700 dark:text-red-400';
  return 'border-amber-600/25 bg-amber-500/10 text-amber-700 dark:text-amber-400';
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

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const load = () => {
    setLoading(true);
    getAdminWithdrawals().then(({ data }) => setWithdrawals(data.withdrawals || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handle = async (id, status) => {
    try {
      await updateWithdrawal(id, { status });
      toast.success(`Withdrawal ${status}!`);
      load();
    } catch { toast.error('Failed'); }
  };

  const filtered = filter ? withdrawals.filter(w => w.status === filter) : withdrawals;

  const stats = useMemo(() => ({
    pending: withdrawals.filter(w => w.status === 'pending').length,
    pendingAmount: withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + Number(w.amount || 0), 0),
    approved: withdrawals.filter(w => w.status === 'approved').length,
    paid: withdrawals.filter(w => w.status === 'paid').reduce((s, w) => s + Number(w.amount || 0), 0),
  }), [withdrawals]);

  return (
    <div className="space-y-6">
      <div className="border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Payouts</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              Withdrawals
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
              Review and process affiliate withdrawal requests.
            </p>
          </div>
          <button onClick={load} title="Refresh" className="inline-flex h-11 w-11 items-center justify-center border border-[var(--border)] bg-[var(--bg-card)] transition hover:border-teal-700">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard dark icon={Clock} label="Pending requests" value={stats.pending} />
        <StatCard icon={DollarSign} label="Pending amount" value={formatPrice(stats.pendingAmount)} />
        <StatCard icon={CheckCircle} label="Awaiting payment" value={stats.approved} />
        <StatCard icon={Wallet} label="Total paid out" value={formatPrice(stats.paid)} />
      </div>

      <div className="border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="input h-12 px-4 text-sm font-semibold"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              <tr>
                {['Affiliate', 'Amount', 'Method', 'Account', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-10 shimmer-bg" /></td></tr>
              )) : filtered.map(w => (
                <tr key={w.id} className="align-middle">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[var(--text)]">{w.users?.name || 'Affiliate'}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{w.users?.email}</p>
                    {w.users?.phone && <p className="text-xs text-[var(--text-secondary)]">{w.users.phone}</p>}
                  </td>
                  <td className="px-5 py-4 font-bold text-[var(--text)]">{formatPrice(w.amount)}</td>
                  <td className="px-5 py-4 capitalize text-[var(--text-secondary)]">{w.method}</td>
                  <td className="px-5 py-4 text-[var(--text-secondary)]">{w.account_details || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex border px-2.5 py-1 text-[11px] font-semibold uppercase ${statusTone(w.status)}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--text-secondary)]">
                    {new Date(w.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    {w.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handle(w.id, 'approved')}
                          className="inline-flex h-8 items-center bg-neutral-950 px-3 text-xs font-semibold text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handle(w.id, 'rejected')}
                          className="inline-flex h-8 items-center border border-[var(--border)] px-3 text-xs font-semibold text-red-600 transition hover:border-red-500"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {w.status === 'approved' && (
                      <button
                        onClick={() => handle(w.id, 'paid')}
                        className="inline-flex h-8 items-center bg-neutral-950 px-3 text-xs font-semibold text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <p className="p-10 text-center text-sm text-[var(--text-secondary)]">No withdrawal requests.</p>
          )}
        </div>
      </div>
    </div>
  );
}
