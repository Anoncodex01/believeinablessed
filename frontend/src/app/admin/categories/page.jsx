'use client';
import { useState, useEffect, useRef } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/api';
import { Plus, Pencil, Trash2, X, MoreVertical, RefreshCw, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const BLANK = { name: '', name_sw: '', slug: '', icon: '👕', sort_order: 0 };

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

export default function AdminCategories() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getCategories();
      setCats(data.categories || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories. Please check your connection.');
      toast.error('Network error: Unable to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setFormField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...BLANK, sort_order: cats.length });
    setModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name,
      name_sw: c.name_sw || '',
      slug: c.slug,
      icon: c.icon || '👕',
      sort_order: c.sort_order || 0,
    });
    setModal(true);
  };

  const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      toast.error('Name and slug required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateCategory(editing.id, form);
        toast.success('Category updated!');
      } else {
        await createCategory(form);
        toast.success('Category created!');
      }
      setModal(false);
      await load();
    } catch (err) {
      console.error('Save error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to save category';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await deleteCategory(id);
      toast.success('Category deleted');
      await load();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Catalog</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              Categories
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
              Organize the storefront navigation and product groupings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} title="Refresh" className="inline-flex h-11 w-11 items-center justify-center border border-[var(--border)] bg-[var(--bg-card)] transition hover:border-teal-700">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300">
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard dark icon={Tag} label="Total categories" value={cats.length} />
      </div>

      {error && (
        <div className="border border-red-600/25 bg-red-500/10 p-4 text-center">
          <p className="mb-2 text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={load} className="text-sm font-semibold text-[var(--text)] underline">
            Try Again
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {loading ? Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 shimmer-bg" />
        )) : cats.length === 0 ? (
          <div className="col-span-full p-10 text-center text-sm text-[var(--text-secondary)]">
            No categories yet. Click &quot;Add Category&quot; to create one.
          </div>
        ) : cats.map((c) => (
          <div key={c.id} className="flex items-center gap-3 border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <span className="text-3xl">{c.icon || '👕'}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-[var(--text)]">{c.name}</p>
              {c.name_sw && <p className="truncate text-xs text-[var(--text-secondary)]">{c.name_sw}</p>}
              <p className="font-mono text-xs text-[var(--text-secondary)]">{c.slug}</p>
            </div>
            <RowMenu onEdit={() => openEdit(c)} onDelete={() => handleDelete(c.id)} />
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
              <div>
                <p className="section-kicker">{editing ? 'Edit Category' : 'New Category'}</p>
                <h3 className="mt-1 font-display text-2xl font-semibold text-[var(--text)]">
                  {editing ? editing.name : 'Create category'}
                </h3>
              </div>
              <button onClick={() => setModal(false)} className="p-2 transition hover:bg-[var(--bg-secondary)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Name (EN) *</span>
                  <input
                    value={form.name}
                    onChange={e => {
                      setFormField('name', e.target.value);
                      if (!editing) setFormField('slug', autoSlug(e.target.value));
                    }}
                    className="input h-12"
                    placeholder="Women's Clothing"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Name (SW)</span>
                  <input
                    value={form.name_sw}
                    onChange={e => setFormField('name_sw', e.target.value)}
                    className="input h-12"
                    placeholder="Nguo za Wanawake"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Slug *</span>
                  <input
                    value={form.slug}
                    onChange={e => setFormField('slug', e.target.value)}
                    className="input h-12"
                    placeholder="womens"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Icon (emoji)</span>
                  <input
                    value={form.icon}
                    onChange={e => setFormField('icon', e.target.value)}
                    className="input h-12"
                    placeholder="👕"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Sort Order</span>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setFormField('sort_order', parseInt(e.target.value) || 0)}
                  className="input h-12"
                />
              </label>
              {error && (
                <div className="border border-red-600/25 bg-red-500/10 p-3 text-center">
                  <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}
              <div className="grid gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex h-12 items-center justify-center gap-2 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300"
                >
                  {saving ? 'Saving...' : editing ? 'Save changes' : 'Create category'}
                </button>
                <button
                  onClick={() => setModal(false)}
                  className="h-12 border border-[var(--border)] text-sm font-semibold text-[var(--text)] transition hover:border-teal-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RowMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(p => !p)} className="inline-flex h-9 w-9 items-center justify-center border border-[var(--border)] transition hover:border-teal-700">
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-20 min-w-[130px] border border-[var(--border)] bg-[var(--bg-card)] shadow-lg">
          <button onClick={() => { setOpen(false); onEdit(); }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--bg-secondary)]">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <div className="mx-4 border-t border-[var(--border)]" />
          <button onClick={() => { setOpen(false); onDelete(); }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-500/10">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
