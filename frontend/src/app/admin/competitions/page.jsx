'use client';
import { useState, useEffect } from 'react';
import { getAllCompetitions, createCompetition, updateCompetition } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Pencil, Trophy, X } from 'lucide-react';
import toast from 'react-hot-toast';

const BLANK = {
  title: '', title_sw: '', description: '', description_sw: '',
  prize: '', prize_sw: '', rules: '', rules_sw: '',
  start_date: '', end_date: '', status: 'active',
};

export default function AdminCompetitions() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getAllCompetitions().then(({ data }) => setCompetitions(data.competitions || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => { setEditing(null); setForm(BLANK); setModal(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      title: c.title || '', title_sw: c.title_sw || '',
      description: c.description || '', description_sw: c.description_sw || '',
      prize: c.prize || '', prize_sw: c.prize_sw || '',
      rules: c.rules || '', rules_sw: c.rules_sw || '',
      start_date: c.start_date?.split('T')[0] || '',
      end_date: c.end_date?.split('T')[0] || '',
      status: c.status || 'active',
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.title) return toast.error('Title is required');
    setSaving(true);
    try {
      if (editing) { await updateCompetition(editing.id, form); toast.success('Competition updated!'); }
      else { await createCompetition(form); toast.success('Competition created!'); }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-[var(--text)]">Competitions</h2>
          <p className="text-sm text-[var(--text-secondary)]">Monthly affiliate competitions</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Competition
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-32 shimmer-bg rounded-2xl" />)}</div>
      ) : competitions.length === 0 ? (
        <div className="card p-12 text-center">
          <Trophy className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-3" />
          <p className="text-[var(--text-secondary)] mb-4">No competitions yet</p>
          <button onClick={openCreate} className="btn-primary">Create First Competition</button>
        </div>
      ) : (
        <div className="space-y-4">
          {competitions.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-bold text-[var(--text)]">{c.title}</p>
                    {c.title_sw && <p className="text-sm text-[var(--text-secondary)]">{c.title_sw}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    c.status === 'active' ? 'bg-green-500/10 text-green-500'
                    : c.status === 'upcoming' ? 'bg-blue-500/10 text-blue-500'
                    : 'bg-gray-500/10 text-gray-400'
                  }`}>{c.status}</span>
                  <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-blue-500/10 rounded-lg text-blue-500">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><p className="text-[var(--text-secondary)] text-xs">Prize</p><p className="font-semibold text-yellow-500">{c.prize || '—'}</p></div>
                <div><p className="text-[var(--text-secondary)] text-xs">Starts</p><p className="font-medium">{c.start_date ? new Date(c.start_date).toLocaleDateString() : '—'}</p></div>
                <div><p className="text-[var(--text-secondary)] text-xs">Ends</p><p className="font-medium">{c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'}</p></div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-card)]">
                <h3 className="font-bold text-[var(--text)]">{editing ? 'Edit Competition' : 'New Competition'}</h3>
                <button onClick={() => setModal(false)} className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Title (EN) *</label>
                    <input value={form.title} onChange={e => set('title', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Title (SW)</label>
                    <input value={form.title_sw} onChange={e => set('title_sw', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Prize (EN)</label>
                    <input value={form.prize} onChange={e => set('prize', e.target.value)} className="input" placeholder="TZS 500,000 cash" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Prize (SW)</label>
                    <input value={form.prize_sw} onChange={e => set('prize_sw', e.target.value)} className="input" placeholder="TZS 500,000 taslimu" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Start Date</label>
                    <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">End Date</label>
                    <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className="input" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Description (EN)</label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)} className="input resize-none" rows={3} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Description (SW)</label>
                    <textarea value={form.description_sw} onChange={e => set('description_sw', e.target.value)} className="input resize-none" rows={3} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Rules (EN)</label>
                    <textarea value={form.rules} onChange={e => set('rules', e.target.value)} className="input resize-none" rows={4} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Rules (SW)</label>
                    <textarea value={form.rules_sw} onChange={e => set('rules_sw', e.target.value)} className="input resize-none" rows={4} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="ended">Ended</option>
                  </select>
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
