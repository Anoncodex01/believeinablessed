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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-[var(--text)]">Coupons</h2>
          <p className="text-sm text-[var(--text-secondary)]">{coupons.length} coupons</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 shimmer-bg rounded-2xl" />)
          : coupons.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`card p-4 border-dashed ${c.is_active ? 'border-brand-500/40' : 'opacity-60'}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-500" />
                <span className="font-mono font-bold text-[var(--text)]">{c.code}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-1 hover:bg-blue-500/10 rounded text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(c.id)} className="p-1 hover:bg-red-500/10 rounded text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <p className="text-lg font-bold text-brand-500">
              {c.type === 'percent' ? `${c.value}% OFF` : `TZS ${c.value?.toLocaleString()} OFF`}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">Min order: TZS {(c.min_order || 0).toLocaleString()}</p>
            {c.expires_at && <p className="text-xs text-[var(--text-secondary)]">Expires: {new Date(c.expires_at).toLocaleDateString()}</p>}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[var(--text-secondary)]">Used: {c.used_count || 0}{c.max_uses ? `/${c.max_uses}` : ''}</span>
              <button onClick={() => handleToggle(c)}
                className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                  c.is_active ? 'bg-green-500/10 text-green-500 hover:bg-red-500/10 hover:text-red-500' : 'bg-gray-500/10 text-gray-400 hover:bg-green-500/10 hover:text-green-500'
                }`}>
                {c.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                <h3 className="font-bold text-[var(--text)]">{editing ? 'Edit Coupon' : 'New Coupon'}</h3>
                <button onClick={() => setModal(false)} className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Coupon Code *</label>
                  <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} className="input font-mono" placeholder="SAVE20" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Type</label>
                    <select value={form.type} onChange={e => set('type', e.target.value)} className="input">
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (TZS)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Value *</label>
                    <input type="number" value={form.value} onChange={e => set('value', e.target.value)} className="input" placeholder={form.type === 'percent' ? '20' : '5000'} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Min Order (TZS)</label>
                    <input type="number" value={form.min_order} onChange={e => set('min_order', e.target.value)} className="input" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Max Uses</label>
                    <input type="number" value={form.max_uses} onChange={e => set('max_uses', e.target.value)} className="input" placeholder="Unlimited" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Expiry Date</label>
                  <input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} className="input" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setModal(false)} className="flex-1 btn-secondary">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary disabled:opacity-50">
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
