'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Check,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { createProduct, deleteProduct, getCategories, getProducts, updateProduct } from '@/lib/api';

const BLANK = {
  name: '',
  name_sw: '',
  description: '',
  description_sw: '',
  price: '',
  sale_price: '',
  category_id: '',
  stock: '',
  sizes: '',
  colors: '',
  commission_rate: '10',
  is_trending: false,
  is_flash_sale: false,
  flash_sale_end_date: '',
};

function formatPrice(value) {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function productImage(product) {
  return product.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=240&h=240&fit=crop';
}

function stockTone(stock) {
  const value = Number(stock || 0);
  if (value <= 0) return 'border-red-600/25 bg-red-500/10 text-red-700 dark:text-red-400';
  if (value < 5) return 'border-amber-600/25 bg-amber-500/10 text-amber-700 dark:text-amber-400';
  return 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
}

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

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts({ limit: 200 }),
        getCategories(),
      ]);
      setProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data.categories || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(BLANK);
    setFiles([]);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name || '',
      name_sw: product.name_sw || '',
      description: product.description || '',
      description_sw: product.description_sw || '',
      price: product.price || '',
      sale_price: product.sale_price || '',
      category_id: product.category_id || '',
      stock: product.stock ?? '',
      sizes: (product.sizes || []).join(', '),
      colors: (product.colors || []).join(', '),
      commission_rate: product.commission_rate || '10',
      is_trending: Boolean(product.is_trending),
      is_flash_sale: Boolean(product.is_flash_sale),
      flash_sale_end_date: product.flash_sale_end_date ? product.flash_sale_end_date.split('T')[0] : '',
    });
    setFiles([]);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, value));
      files.forEach(file => fd.append('images', file));

      if (editing) {
        await updateProduct(editing.id, fd);
        toast.success('Product updated');
      } else {
        await createProduct(fd);
        toast.success('Product created');
      }
      setModalOpen(false);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try {
      await deleteProduct(product.id);
      toast.success('Product deleted');
      await load();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products.filter(product => {
      const matchesSearch = !search ||
        product.name?.toLowerCase().includes(search) ||
        product.name_sw?.toLowerCase().includes(search);
      const matchesCategory = categoryFilter ? product.category_id === categoryFilter : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, query, categoryFilter]);

  const stats = useMemo(() => ({
    total: products.length,
    lowStock: products.filter(product => Number(product.stock || 0) > 0 && Number(product.stock || 0) < 5).length,
    outStock: products.filter(product => Number(product.stock || 0) <= 0).length,
    trending: products.filter(product => product.is_trending).length,
  }), [products]);

  return (
    <div className="space-y-6">
      <div className="border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Catalog</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              Products
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
              Manage inventory, pricing, and flash sale eligibility.
            </p>
          </div>
          <button onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300">
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard dark icon={Package} label="Total products" value={stats.total} />
        <StatCard icon={Sparkles} label="Trending" value={stats.trending} />
        <StatCard icon={Tag} label="Low stock" value={stats.lowStock} />
        <StatCard icon={Zap} label="Out of stock" value={stats.outStock} />
      </div>

      <div className="border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search product..."
              className="input h-12 pl-11"
            />
          </label>
          <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className="input h-12 px-4 text-sm font-semibold">
            <option value="">All categories</option>
            {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          {(query || categoryFilter) && (
            <button onClick={() => { setQuery(''); setCategoryFilter(''); }} className="h-12 border border-[var(--border)] px-5 text-sm font-semibold transition hover:border-teal-700">Clear</button>
          )}
          <button onClick={load} title="Refresh" className="inline-flex h-12 w-12 items-center justify-center border border-[var(--border)] bg-[var(--bg-card)] transition hover:border-teal-700">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Commission</th>
                <th className="px-5 py-4">Tags</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {loading ? Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}><td colSpan={7} className="px-5 py-4"><div className="h-12 shimmer-bg" /></td></tr>
              )) : filtered.map(product => {
                const category = categories.find(item => item.id === product.category_id);
                return (
                  <tr key={product.id} className="align-middle">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img src={productImage(product)} alt={product.name} className="h-14 w-14 object-cover" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--text)]">{product.name}</p>
                          {product.name_sw && <p className="truncate text-xs text-[var(--text-secondary)]">{product.name_sw}</p>}
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">{product.sold_count || 0} sold</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {product.sale_price ? (
                        <div>
                          <p className="font-bold text-[var(--text)]">{formatPrice(product.sale_price)}</p>
                          <p className="text-xs text-[var(--text-secondary)] line-through">{formatPrice(product.price)}</p>
                        </div>
                      ) : <p className="font-bold text-[var(--text)]">{formatPrice(product.price)}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex border px-2.5 py-1 text-[11px] font-semibold uppercase ${stockTone(product.stock)}`}>
                        {Number(product.stock || 0) <= 0 ? 'Out' : `${product.stock} left`}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[var(--text-secondary)]">{category?.name || 'Unassigned'}</td>
                    <td className="px-5 py-4 font-semibold text-[var(--text)]">{product.commission_rate || 10}%</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {product.is_trending && <span className="border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1 text-[11px] font-semibold uppercase text-[var(--text)]">Trending</span>}
                        {product.is_flash_sale && <span className="border border-neutral-900 bg-neutral-950 px-2.5 py-1 text-[11px] font-semibold uppercase text-white dark:border-white dark:bg-white dark:text-neutral-950">Flash sale</span>}
                        {!product.is_trending && !product.is_flash_sale && <span className="text-xs text-[var(--text-secondary)]">Standard</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <RowMenu onEdit={() => openEdit(product)} onDelete={() => remove(product)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && <div className="p-10 text-center text-sm text-[var(--text-secondary)]">No products found.</div>}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-card)] p-5">
              <div>
                <p className="section-kicker">{editing ? 'Edit Product' : 'New Product'}</p>
                <h3 className="mt-1 font-display text-3xl font-semibold text-[var(--text)]">{editing ? editing.name : 'Create catalog item'}</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 transition hover:bg-[var(--bg-secondary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_300px]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name" required>
                    <input value={form.name} onChange={event => set('name', event.target.value)} className="input h-12" placeholder="Product name" />
                  </Field>
                  <Field label="Swahili name">
                    <input value={form.name_sw} onChange={event => set('name_sw', event.target.value)} className="input h-12" placeholder="Jina la bidhaa" />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Description">
                    <textarea value={form.description} onChange={event => set('description', event.target.value)} className="input min-h-28 resize-none" />
                  </Field>
                  <Field label="Swahili description">
                    <textarea value={form.description_sw} onChange={event => set('description_sw', event.target.value)} className="input min-h-28 resize-none" />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Price" required>
                    <input type="number" value={form.price} onChange={event => set('price', event.target.value)} className="input h-12" />
                  </Field>
                  <Field label="Sale price">
                    <input type="number" value={form.sale_price} onChange={event => set('sale_price', event.target.value)} className="input h-12" />
                  </Field>
                  <Field label="Stock">
                    <input type="number" value={form.stock} onChange={event => set('stock', event.target.value)} className="input h-12" />
                  </Field>
                  <Field label="Commission">
                    <input type="number" value={form.commission_rate} onChange={event => set('commission_rate', event.target.value)} className="input h-12" />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Category">
                    <select value={form.category_id} onChange={event => set('category_id', event.target.value)} className="input h-12">
                      <option value="">Select category</option>
                      {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Sizes">
                    <input value={form.sizes} onChange={event => set('sizes', event.target.value)} className="input h-12" placeholder="S, M, L, XL" />
                  </Field>
                  <Field label="Colors">
                    <input value={form.colors} onChange={event => set('colors', event.target.value)} className="input h-12" placeholder="Black, White" />
                  </Field>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="border border-[var(--border)] p-4">
                  <p className="mb-3 font-semibold text-[var(--text)]">Visibility</p>
                  <label className="mb-2 flex cursor-pointer items-center justify-between border border-[var(--border)] bg-[var(--bg-secondary)] p-3 text-sm font-semibold text-[var(--text)]">
                    Trending
                    <input type="checkbox" checked={form.is_trending} onChange={event => set('is_trending', event.target.checked)} className="h-4 w-4 accent-teal-700" />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between border border-[var(--border)] bg-[var(--bg-secondary)] p-3 text-sm font-semibold text-[var(--text)]">
                    Flash sale
                    <input type="checkbox" checked={form.is_flash_sale} onChange={event => set('is_flash_sale', event.target.checked)} className="h-4 w-4 accent-teal-700" />
                  </label>
                  {form.is_flash_sale && (
                    <input type="date" value={form.flash_sale_end_date} onChange={event => set('flash_sale_end_date', event.target.value)} className="input mt-3 h-12" />
                  )}
                </div>

                <div className="border border-[var(--border)] p-4">
                  <p className="mb-3 font-semibold text-[var(--text)]">Images</p>
                  <label className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-[var(--border)] p-6 text-center transition hover:border-teal-700">
                    <Upload className="mb-2 h-6 w-6 text-[var(--text-secondary)]" />
                    <span className="text-sm font-semibold text-[var(--text)]">Upload images</span>
                    <span className="mt-1 text-xs text-[var(--text-secondary)]">Up to 6 files</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={event => setFiles(Array.from(event.target.files || []))} />
                  </label>
                  {files.length > 0 && <p className="mt-2 text-xs font-semibold text-emerald-600">{files.length} file(s) selected</p>}
                  {editing?.images?.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {editing.images.map((image, index) => <img key={index} src={image} alt="" className="h-14 w-full object-cover" />)}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <button onClick={save} disabled={saving} className="inline-flex h-12 items-center justify-center gap-2 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300">
                    <Check className="h-4 w-4" />
                    {saving ? 'Saving...' : editing ? 'Save changes' : 'Create product'}
                  </button>
                  <button onClick={() => setModalOpen(false)} className="h-12 border border-[var(--border)] text-sm font-semibold text-[var(--text)] transition hover:border-teal-700">Cancel</button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
        {label}{required ? ' *' : ''}
      </span>
      {children}
    </label>
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
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="inline-flex h-10 w-10 items-center justify-center border border-[var(--border)] transition hover:border-teal-700"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-20 min-w-[140px] border border-[var(--border)] bg-[var(--bg-card)] shadow-lg">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--bg-secondary)]"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <div className="mx-4 border-t border-[var(--border)]" />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
