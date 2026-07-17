'use client';
import { useState, useEffect } from 'react';
import { getAdminUsers, updateUser } from '@/lib/api';
import { motion } from 'framer-motion';
import { Search, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_TONES = {
  admin: 'border-teal-700/25 bg-teal-700/10 text-teal-800 dark:text-teal-300',
  affiliate: 'border-amber-600/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
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

  const handleUpdate = async (id, updates) => {
    try { await updateUser(id, updates); toast.success('Updated!'); load(); }
    catch { toast.error('Failed'); }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-6 sm:px-6">
        <p className="section-kicker">Accounts</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
          Users
        </h2>
        <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
          View registered customers, affiliates, and admins.
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
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              <tr>
                {['User', 'Role', 'Status', 'Joined', 'Phone'].map(h => (
                  <th key={h} className="px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="h-8 shimmer-bg" /></td></tr>
              )) : filtered.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="align-middle transition hover:bg-[var(--bg-secondary)]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-neutral-950 text-xs font-bold text-white dark:bg-white dark:text-neutral-950">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text)]">{u.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex border px-2.5 py-1 text-[11px] font-semibold uppercase ${ROLE_TONES[u.role] || ROLE_TONES.customer}`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-4">
                    <select value={u.status} onChange={e => handleUpdate(u.id, { status: e.target.value })}
                      className={`h-9 border bg-[var(--bg-card)] px-2 text-xs font-semibold uppercase outline-none ${
                        u.status === 'active' ? 'border-emerald-600/25 text-emerald-700 dark:text-emerald-400' : 'border-red-600/25 text-red-700 dark:text-red-400'
                      }`}>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--text-secondary)]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--text-secondary)]">
                    {u.phone || '—'}
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
