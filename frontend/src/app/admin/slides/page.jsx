'use client';
import { useState, useEffect } from 'react';
import { getSlides, createSlide, updateSlide, deleteSlide } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Upload, GripVertical } from 'lucide-react';
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-[var(--text)]">Homepage Slides</h2>
          <p className="text-sm text-[var(--text-secondary)]">Manage hero carousel images and text</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Slide
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-48 shimmer-bg rounded-2xl" />)}
        </div>
      ) : slides.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-[var(--text-secondary)] mb-4">No slides yet. Add your first hero slide!</p>
          <button onClick={openCreate} className="btn-primary">Add Slide</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {slides.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="card overflow-hidden group">
              <div className="relative aspect-video bg-[var(--bg-secondary)]">
                {s.image_url && (
                  <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-bold text-sm line-clamp-1">{s.title}</p>
                  {s.subtitle && <p className="text-white/70 text-xs line-clamp-1">{s.subtitle}</p>}
                </div>
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(s)} className="p-1.5 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-lg text-white transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 bg-red-500/70 hover:bg-red-500 rounded-lg text-white transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="text-xs bg-black/40 text-white px-2 py-1 rounded-full">Order: {s.sort_order}</span>
                </div>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-card)]">
                <h3 className="font-bold text-[var(--text)]">{editing ? 'Edit Slide' : 'New Slide'}</h3>
                <button 
                  onClick={() => {
                    setModal(false);
                    resetForm();
                  }} 
                  className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {/* Image upload */}
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] mb-2 block">Slide Image {!editing && '*'}</label>
                  <label className="block cursor-pointer">
                    {preview ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden">
                        <img src={preview} alt="preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-sm font-medium">Change Image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-[var(--border)] hover:border-brand-500 rounded-xl p-8 flex flex-col items-center transition-colors">
                        <Upload className="w-8 h-8 text-[var(--text-secondary)] mb-2" />
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

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Title (English) *</label>
                    <input 
                      value={form.title} 
                      onChange={e => set('title', e.target.value)} 
                      className="input" 
                      placeholder="Discover Fashion" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Title (Swahili)</label>
                    <input 
                      value={form.title_sw} 
                      onChange={e => set('title_sw', e.target.value)} 
                      className="input" 
                      placeholder="Gundua Mitindo" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Subtitle (EN)</label>
                    <input 
                      value={form.subtitle} 
                      onChange={e => set('subtitle', e.target.value)} 
                      className="input" 
                      placeholder="Subtitle text" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Subtitle (SW)</label>
                    <input 
                      value={form.subtitle_sw} 
                      onChange={e => set('subtitle_sw', e.target.value)} 
                      className="input" 
                      placeholder="Maandishi ya chini" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Button Text (EN)</label>
                    <input 
                      value={form.button_text} 
                      onChange={e => set('button_text', e.target.value)} 
                      className="input" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Button Text (SW)</label>
                    <input 
                      value={form.button_text_sw} 
                      onChange={e => set('button_text_sw', e.target.value)} 
                      className="input" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Link URL</label>
                    <input 
                      value={form.link} 
                      onChange={e => set('link', e.target.value)} 
                      className="input" 
                      placeholder="/products" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Sort Order</label>
                    <input 
                      type="number" 
                      value={form.sort_order} 
                      onChange={e => set('sort_order', parseInt(e.target.value) || 0)} 
                      className="input" 
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => {
                      setModal(false);
                      resetForm();
                    }} 
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave} 
                    disabled={saving} 
                    className="flex-1 btn-primary disabled:opacity-50"
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