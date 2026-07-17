'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAdminUsers } from '@/lib/api';
import { motion } from 'framer-motion';
import { Eye, Search, Users } from 'lucide-react';

const ROLE_TONES = {
  admin: 'border-teal-700/25 bg-teal-700/10 text-teal-800 dark:text-teal-300',
  affiliate: 'border-amber-600/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  affiliate_pending: 'border-amber-600/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  customer: 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
};

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

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    getAdminUsers().then(({ data }) => setUsers(data.users || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.referral_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-6 sm:px-6">
        <p className="section-kicker">Accounts</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
          Users
        </h2>
        <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
          Open any user to view orders, affiliate activity, ban or edit their account.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard dark icon={Users} label="Registered users" value={users.length} />
      </div>

      <div className="border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <label className="relative block sm:w-72">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="input h-12 pl-11" />
        </label>
      </div>

      <div className="overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              <tr>
                {['User', 'Role', 'Status', 'Joined', 'Phone', 'Action'].map(h => (
                  <th key={h} className="px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-8 shimmer-bg" /></td></tr>
              )) : filtered.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="align-middle transition hover:bg-[var(--bg-secondary)]">
                  <td className="px-5 py-4">
                    <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 group">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-neutral-950 text-xs font-bold text-white dark:bg-white dark:text-neutral-950">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text)] group-hover:text-teal-700 dark:group-hover:text-teal-300">{u.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{u.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex border px-2.5 py-1 text-[11px] font-semibold uppercase ${ROLE_TONES[u.role] || ROLE_TONES.customer}`}>
                      {u.role === 'affiliate_pending' ? 'affiliate (pending)' : u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex border px-2.5 py-1 text-[11px] font-semibold uppercase ${
                      u.status === 'active'
                        ? 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'border-red-600/25 bg-red-500/10 text-red-700 dark:text-red-400'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--text-secondary)]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--text-secondary)]">
                    {u.phone || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="inline-flex h-9 w-9 items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] transition hover:border-teal-700/40 hover:text-teal-700"
                      title="View user"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-[var(--text-secondary)]">No users found</div>
          )}
        </div>
      </div>
    </div>
  );
}
