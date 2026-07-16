'use client';
import { useState, useEffect } from 'react';
import { getAdminUsers, updateUser } from '@/lib/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-[var(--text)]">Users</h2>
          <p className="text-sm text-[var(--text-secondary)]">{users.length} registered users</p>
        </div>
        <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="input py-2 w-48" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[var(--border)]">
              <tr>
                {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-8 shimmer-bg rounded" /></td></tr>
              )) : filtered.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text)]">{u.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                      u.role === 'admin' ? 'bg-brand-500/10 text-brand-500'
                      : u.role === 'affiliate' ? 'bg-purple-500/10 text-purple-500'
                      : 'bg-gray-500/10 text-gray-400'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={u.status} onChange={e => handleUpdate(u.id, { status: e.target.value })}
                      className={`text-xs font-semibold px-2 py-1.5 rounded-lg border-0 cursor-pointer bg-transparent ${
                        u.status === 'active' ? 'text-green-500' : 'text-red-500'
                      }`}>
                      <option value="active" className="bg-[var(--bg-card)] text-[var(--text)]">Active</option>
                      <option value="suspended" className="bg-[var(--bg-card)] text-[var(--text)]">Suspended</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    {u.phone || '—'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-[var(--text-secondary)]">No users found</div>
          )}
        </div>
      </div>
    </div>
  );
}
