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

const STATUS_TONES = {
  active: 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  upcoming: 'border-sky-600/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  ended: 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
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
    <div className="space-y-6">
      <div className="border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Affiliate program</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              Competitions
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
              Run monthly affiliate competitions to drive engagement.
            </p>
          </div>
          <button onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300">
            <Plus className="h-4 w-4" /> New Competition
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-32 shimmer-bg" />)}</div>
      ) : competitions.length === 0 ? (
        <div className="border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-12 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-[var(--text-secondary)]" />
          <p className="mb-4 text-sm text-[var(--text-secondary)]">No competitions yet</p>
          <button onClick={openCreate} className="inline-flex h-11 items-center justify-center bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300">Create First Competition</button>
        </div>
      ) : (
        <div className="space-y-4">
          {competitions.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center bg-teal-700/10 text-teal-700">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text)]">{c.title}</p>
                    {c.title_sw && <p className="text-sm text-[var(--text-secondary)]">{c.title_sw}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex border px-2.5 py-1 text-[11px] font-semibold uppercase ${STATUS_TONES[c.status] || STATUS_TONES.ended}`}>{c.status}</span>
                  <button onClick={() => openEdit(c)} className="p-1.5 text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]">
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><p className="text-xs text-[var(--text-secondary)]">Prize</p><p className="font-semibold text-teal-700">{c.prize || '—'}</p></div>
                <div><p className="text-xs text-[var(--text-secondary)]">Starts</p><p className="font-medium text-[var(--text)]">{c.start_date ? new Date(c.start_date).toLocaleDateString() : '—'}</p></div>
                <div><p className="text-xs text-[var(--text-secondary)]">Ends</p><p className="font-medium text-[var(--text)]">{c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'}</p></div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-card)] p-5">
                <h3 className="font-display text-xl font-semibold tracking-tight text-[var(--text)]">{editing ? 'Edit Competition' : 'New Competition'}</h3>
                <button onClick={() => setModal(false)} className="p-2 transition hover:bg-[var(--bg-secondary)]"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Title (EN) *</label>
                    <input value={form.title} onChange={e => set('title', e.target.value)} className="input h-12" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Title (SW)</label>
                    <input value={form.title_sw} onChange={e => set('title_sw', e.target.value)} className="input h-12" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Prize (EN)</label>
                    <input value={form.prize} onChange={e => set('prize', e.target.value)} className="input h-12" placeholder="TZS 500,000 cash" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Prize (SW)</label>
                    <input value={form.prize_sw} onChange={e => set('prize_sw', e.target.value)} className="input h-12" placeholder="TZS 500,000 taslimu" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Start Date</label>
                    <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="input h-12" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">End Date</label>
                    <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className="input h-12" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Description (EN)</label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)} className="input resize-none" rows={3} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Description (SW)</label>
                    <textarea value={form.description_sw} onChange={e => set('description_sw', e.target.value)} className="input resize-none" rows={3} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Rules (EN)</label>
                    <textarea value={form.rules} onChange={e => set('rules', e.target.value)} className="input resize-none" rows={4} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Rules (SW)</label>
                    <textarea value={form.rules_sw} onChange={e => set('rules_sw', e.target.value)} className="input resize-none" rows={4} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} className="input h-12">
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="ended">Ended</option>
                  </select>
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
