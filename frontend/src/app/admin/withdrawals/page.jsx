'use client';
import { useState, useEffect, useMemo } from 'react';
import { getAdminWithdrawals, updateWithdrawal } from '@/lib/api';
import { CheckCircle, Clock, DollarSign, RefreshCw, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

function formatPrice(n) {
  return new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n || 0);
}

function statusTone(status) {
  if (status === 'paid') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'approved') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'rejected') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function StatCard({ icon: Icon, label, value, dark = false }) {
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
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Withdrawals</p>
        <button onClick={load} title="Refresh" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:border-neutral-950">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard dark icon={Clock} label="Pending requests" value={stats.pending} />
        <StatCard icon={DollarSign} label="Pending amount" value={formatPrice(stats.pendingAmount)} />
        <StatCard icon={CheckCircle} label="Awaiting payment" value={stats.approved} />
        <StatCard icon={Wallet} label="Total paid out" value={formatPrice(stats.paid)} />
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-4">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="h-12 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold outline-none"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="border-b border-black/10 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              <tr>
                {['Affiliate', 'Amount', 'Method', 'Account', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-sm">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-10 rounded-xl shimmer-bg" /></td></tr>
              )) : filtered.map(w => (
                <tr key={w.id} className="align-middle">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-neutral-950">{w.users?.name || 'Affiliate'}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{w.users?.email}</p>
                    {w.users?.phone && <p className="text-xs text-[var(--text-secondary)]">{w.users.phone}</p>}
                  </td>
                  <td className="px-5 py-4 font-bold text-neutral-950">{formatPrice(w.amount)}</td>
                  <td className="px-5 py-4 capitalize text-[var(--text-secondary)]">{w.method}</td>
                  <td className="px-5 py-4 text-[var(--text-secondary)]">{w.account_details || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusTone(w.status)}`}>
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
                          className="inline-flex h-8 items-center rounded-full bg-neutral-950 px-3 text-xs font-semibold text-white"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handle(w.id, 'rejected')}
                          className="inline-flex h-8 items-center rounded-full border border-black/10 px-3 text-xs font-semibold text-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {w.status === 'approved' && (
                      <button
                        onClick={() => handle(w.id, 'paid')}
                        className="inline-flex h-8 items-center rounded-full bg-neutral-950 px-3 text-xs font-semibold text-white"
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
