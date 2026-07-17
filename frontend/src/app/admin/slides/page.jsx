'use client';
import { useState, useEffect } from 'react';
import { getSlides, createSlide, updateSlide, deleteSlide } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSlides() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [form, setForm] = useState({
    title: '', title_sw: '', subtitle: '', subtitle_sw: '',
    button_text: 'Shop Now', button_text_sw: 'Nunua Sasa',
    link: '/products', sort_order: 0,
  });

  const load = () => {
    setLoading(true);
    getSlides().then(({ data }) => setSlides(data.slides || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Reset form completely
  const resetForm = () => {
    setForm({
      title: '', title_sw: '', subtitle: '', subtitle_sw: '',
      button_text: 'Shop Now', button_text_sw: 'Nunua Sasa',
      link: '/products', sort_order: slides.length,
    });
    setFile(null);
    setPreview('');
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      title: s.title || '', title_sw: s.title_sw || '',
      subtitle: s.subtitle || '', subtitle_sw: s.subtitle_sw || '',
      button_text: s.button_text || 'Shop Now',
      button_text_sw: s.button_text_sw || 'Nunua Sasa',
      link: s.link || '/products',
      sort_order: s.sort_order || 0,
    });
    setFile(null);
    setPreview(s.image_url || '');
    setModal(true);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // Clean up previous preview URL to prevent memory leaks
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!form.title) return toast.error('Title is required');
    if (!editing && !file) return toast.error('Please upload a slide image');

    setSaving(true);
    try {
      const fd = new FormData();
      // Append all form fields
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          fd.append(k, String(v));
        }
      });
      if (file) fd.append('image', file);

      if (editing) {
        await updateSlide(editing.id, fd);
        toast.success('Slide updated!');
      } else {
        await createSlide(fd);
        toast.success('Slide created!');
      }

      // Close modal and reset everything
      setModal(false);
      resetForm();

      // Reload the list
      await load();

    } catch (err) {
      console.error('Save error:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this slide?')) return;
    try {
      await deleteSlide(id);
      toast.success('Deleted');
      load();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete');
    }
  };

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <div className="space-y-6">
      <div className="border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Homepage</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              Slides
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
              Manage hero carousel images and text.
            </p>
          </div>
          <button onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300">
            <Plus className="h-4 w-4" /> Add Slide
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-48 shimmer-bg" />)}
        </div>
      ) : slides.length === 0 ? (
        <div className="border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-12 text-center">
          <ImageIcon className="mx-auto mb-4 h-10 w-10 text-[var(--text-secondary)]" />
          <p className="mb-4 text-sm text-[var(--text-secondary)]">No slides yet. Add your first hero slide!</p>
          <button onClick={openCreate} className="inline-flex h-11 items-center justify-center bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300">Add Slide</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {slides.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="group overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]">
              <div className="relative aspect-video bg-[var(--bg-secondary)]">
                {s.image_url && (
                  <img src={s.image_url} alt={s.title} className="h-full w-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="line-clamp-1 text-sm font-bold text-white">{s.title}</p>
                  {s.subtitle && <p className="line-clamp-1 text-xs text-white/70">{s.subtitle}</p>}
                </div>
                <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openEdit(s)} className="border border-white/30 bg-black/40 p-1.5 text-white transition hover:bg-black/60">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="border border-white/30 bg-red-500/70 p-1.5 text-white transition hover:bg-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="absolute left-2 top-2">
                  <span className="border border-white/30 bg-black/40 px-2 py-1 text-[11px] font-semibold uppercase text-white">Order: {s.sort_order}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 text-xs text-[var(--text-secondary)]">
                <span>EN: {s.button_text}</span>
                <span>SW: {s.button_text_sw}</span>
                <span className="col-span-2">Link: {s.link}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-xl overflow-y-auto border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl"
            >
              <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-card)] p-5">
                <h3 className="font-display text-xl font-semibold tracking-tight text-[var(--text)]">{editing ? 'Edit Slide' : 'New Slide'}</h3>
                <button
                  onClick={() => {
                    setModal(false);
                    resetForm();
                  }}
                  className="p-2 transition hover:bg-[var(--bg-secondary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4 p-5">
                {/* Image upload */}
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Slide Image {!editing && '*'}</label>
                  <label className="block cursor-pointer">
                    {preview ? (
                      <div className="relative aspect-video overflow-hidden border border-[var(--border)]">
                        <img src={preview} alt="preview" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                          <span className="text-sm font-medium text-white">Change Image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center border border-dashed border-[var(--border)] p-8 text-center transition hover:border-teal-700">
                        <Upload className="mb-2 h-6 w-6 text-[var(--text-secondary)]" />
                        <span className="text-sm text-[var(--text-secondary)]">Upload slide image (1920×800 recommended)</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                      key={editing ? 'edit' + editing.id : 'create'} // Force re-render
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Title (English) *</label>
                    <input
                      value={form.title}
                      onChange={e => set('title', e.target.value)}
                      className="input h-12"
                      placeholder="Discover Fashion"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Title (Swahili)</label>
                    <input
                      value={form.title_sw}
                      onChange={e => set('title_sw', e.target.value)}
                      className="input h-12"
                      placeholder="Gundua Mitindo"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Subtitle (EN)</label>
                    <input
                      value={form.subtitle}
                      onChange={e => set('subtitle', e.target.value)}
                      className="input h-12"
                      placeholder="Subtitle text"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Subtitle (SW)</label>
                    <input
                      value={form.subtitle_sw}
                      onChange={e => set('subtitle_sw', e.target.value)}
                      className="input h-12"
                      placeholder="Maandishi ya chini"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Button Text (EN)</label>
                    <input
                      value={form.button_text}
                      onChange={e => set('button_text', e.target.value)}
                      className="input h-12"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Button Text (SW)</label>
                    <input
                      value={form.button_text_sw}
                      onChange={e => set('button_text_sw', e.target.value)}
                      className="input h-12"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Link URL</label>
                    <input
                      value={form.link}
                      onChange={e => set('link', e.target.value)}
                      className="input h-12"
                      placeholder="/products"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Sort Order</label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={e => set('sort_order', parseInt(e.target.value) || 0)}
                      className="input h-12"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setModal(false);
                      resetForm();
                    }}
                    className="h-12 flex-1 border border-[var(--border)] text-sm font-semibold text-[var(--text)] transition hover:border-teal-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-12 flex-1 bg-neutral-950 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300"
                  >
                    {saving ? 'Saving...' : editing ? 'Update Slide' : 'Create Slide'}
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
