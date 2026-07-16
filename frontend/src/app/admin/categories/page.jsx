'use client';
import { useState, useEffect, useRef } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/api';
import { Plus, Pencil, Trash2, X, MoreVertical, RefreshCw, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const BLANK = { name: '', name_sw: '', slug: '', icon: '👕', sort_order: 0 };

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
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Categories</p>
        <div className="flex items-center gap-2">
          <button onClick={load} title="Refresh" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white transition hover:border-neutral-950">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard dark icon={Tag} label="Total categories" value={cats.length} />
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button onClick={load} className="text-sm font-semibold text-neutral-950 underline">
            Try Again
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {loading ? Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 shimmer-bg rounded-3xl" />
        )) : cats.length === 0 ? (
          <div className="col-span-full p-10 text-center text-sm text-[var(--text-secondary)]">
            No categories yet. Click &quot;Add Category&quot; to create one.
          </div>
        ) : cats.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-3xl border border-black/10 bg-white p-4">
            <span className="text-3xl">{c.icon || '👕'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-neutral-950 truncate">{c.name}</p>
              {c.name_sw && <p className="text-xs text-[var(--text-secondary)] truncate">{c.name_sw}</p>}
              <p className="text-xs text-[var(--text-secondary)] font-mono">{c.slug}</p>
            </div>
            <RowMenu onEdit={() => openEdit(c)} onDelete={() => handleDelete(c.id)} />
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-black/10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{editing ? 'Edit Category' : 'New Category'}</p>
                <h3 className="mt-1 font-display text-2xl font-semibold text-neutral-950">
                  {editing ? editing.name : 'Create category'}
                </h3>
              </div>
              <button onClick={() => setModal(false)} className="rounded-full p-2 hover:bg-neutral-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Name (EN) *</span>
                  <input
                    value={form.name}
                    onChange={e => {
                      setFormField('name', e.target.value);
                      if (!editing) setFormField('slug', autoSlug(e.target.value));
                    }}
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    placeholder="Women's Clothing"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Name (SW)</span>
                  <input
                    value={form.name_sw}
                    onChange={e => setFormField('name_sw', e.target.value)}
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    placeholder="Nguo za Wanawake"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Slug *</span>
                  <input
                    value={form.slug}
                    onChange={e => setFormField('slug', e.target.value)}
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    placeholder="womens"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Icon (emoji)</span>
                  <input
                    value={form.icon}
                    onChange={e => setFormField('icon', e.target.value)}
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    placeholder="👕"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Sort Order</span>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setFormField('sort_order', parseInt(e.target.value) || 0)}
                  className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                />
              </label>
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-center">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
              <div className="grid gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editing ? 'Save changes' : 'Create category'}
                </button>
                <button
                  onClick={() => setModal(false)}
                  className="h-12 rounded-full border border-black/10 text-sm font-semibold"
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
      <button onClick={() => setOpen(p => !p)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 transition hover:border-neutral-950">
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-20 min-w-[130px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg">
          <button onClick={() => { setOpen(false); onEdit(); }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-50">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <div className="mx-4 border-t border-black/5" />
          <button onClick={() => { setOpen(false); onDelete(); }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
