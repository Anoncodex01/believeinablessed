'use client';
import { useState, useEffect } from 'react';
import { getAdminCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const BLANK = { code: '', type: 'percent', value: '', min_order: '0', expires_at: '', max_uses: '' };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getAdminCoupons().then(({ data }) => setCoupons(data.coupons || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => { setEditing(null); setForm(BLANK); setModal(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ code: c.code, type: c.type, value: c.value, min_order: c.min_order || 0, expires_at: c.expires_at?.split('T')[0] || '', max_uses: c.max_uses || '' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.value) return toast.error('Code and value required');
    setSaving(true);
    try {
      if (editing) { await updateCoupon(editing.id, form); toast.success('Coupon updated!'); }
      else { await createCoupon(form); toast.success('Coupon created!'); }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try { await deleteCoupon(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const handleToggle = async (coupon) => {
    try { await updateCoupon(coupon.id, { is_active: !coupon.is_active }); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Promotions</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              Coupons
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">{coupons.length} coupons</p>
          </div>
          <button onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300">
            <Plus className="h-4 w-4" /> Add Coupon
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 shimmer-bg" />)
          : coupons.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-4 ${c.is_active ? '' : 'opacity-60'}`}>
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-teal-700" />
                <span className="font-mono font-bold text-[var(--text)]">{c.code}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-1 text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => handleDelete(c.id)} className="p-1 text-red-600 transition hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <p className="font-display text-lg font-bold text-[var(--text)]">
              {c.type === 'percent' ? `${c.value}% OFF` : `TZS ${c.value?.toLocaleString()} OFF`}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">Min order: TZS {(c.min_order || 0).toLocaleString()}</p>
            {c.expires_at && <p className="text-xs text-[var(--text-secondary)]">Expires: {new Date(c.expires_at).toLocaleDateString()}</p>}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">Used: {c.used_count || 0}{c.max_uses ? `/${c.max_uses}` : ''}</span>
              <button onClick={() => handleToggle(c)}
                className={`border px-2 py-1 text-[11px] font-semibold uppercase transition ${
                  c.is_active ? 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700 hover:border-red-500 hover:text-red-600 dark:text-emerald-400' : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-emerald-600 hover:text-emerald-700'
                }`}>
                {c.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
                <h3 className="font-display text-xl font-semibold tracking-tight text-[var(--text)]">{editing ? 'Edit Coupon' : 'New Coupon'}</h3>
                <button onClick={() => setModal(false)} className="p-2 transition hover:bg-[var(--bg-secondary)]"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-3 p-5">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Coupon Code *</label>
                  <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} className="input h-12 font-mono" placeholder="SAVE20" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Type</label>
                    <select value={form.type} onChange={e => set('type', e.target.value)} className="input h-12">
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (TZS)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Value *</label>
                    <input type="number" value={form.value} onChange={e => set('value', e.target.value)} className="input h-12" placeholder={form.type === 'percent' ? '20' : '5000'} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Min Order (TZS)</label>
                    <input type="number" value={form.min_order} onChange={e => set('min_order', e.target.value)} className="input h-12" placeholder="0" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Max Uses</label>
                    <input type="number" value={form.max_uses} onChange={e => set('max_uses', e.target.value)} className="input h-12" placeholder="Unlimited" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Expiry Date</label>
                  <input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} className="input h-12" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setModal(false)} className="h-12 flex-1 border border-[var(--border)] text-sm font-semibold text-[var(--text)] transition hover:border-teal-700">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="h-12 flex-1 bg-neutral-950 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300">
                    {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
