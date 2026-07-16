'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Check,
  ImagePlus,
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
  if (value <= 0) return 'border-red-200 bg-red-50 text-red-700';
  if (value < 5) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

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
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Products</p>
        <button onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard dark icon={Package} label="Total products" value={stats.total} />
        <StatCard icon={Sparkles} label="Trending" value={stats.trending} />
        <StatCard icon={Tag} label="Low stock" value={stats.lowStock} />
        <StatCard icon={Zap} label="Out of stock" value={stats.outStock} />
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search product..."
              className="h-12 w-full rounded-full border border-black/10 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </label>
          <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className="h-12 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold outline-none">
            <option value="">All categories</option>
            {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          {(query || categoryFilter) && (
            <button onClick={() => { setQuery(''); setCategoryFilter(''); }} className="h-12 rounded-full bg-neutral-100 px-5 text-sm font-semibold">Clear</button>
          )}
          <button onClick={load} title="Refresh" className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white transition hover:border-neutral-950">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="border-b border-black/10 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
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
            <tbody className="divide-y divide-black/5 text-sm">
              {loading ? Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}><td colSpan={7} className="px-5 py-4"><div className="h-12 rounded-xl shimmer-bg" /></td></tr>
              )) : filtered.map(product => {
                const category = categories.find(item => item.id === product.category_id);
                return (
                  <tr key={product.id} className="align-middle">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img src={productImage(product)} alt={product.name} className="h-14 w-14 rounded-2xl object-cover" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-neutral-950">{product.name}</p>
                          {product.name_sw && <p className="truncate text-xs text-[var(--text-secondary)]">{product.name_sw}</p>}
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">{product.sold_count || 0} sold</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {product.sale_price ? (
                        <div>
                          <p className="font-bold text-neutral-950">{formatPrice(product.sale_price)}</p>
                          <p className="text-xs text-[var(--text-secondary)] line-through">{formatPrice(product.price)}</p>
                        </div>
                      ) : <p className="font-bold text-neutral-950">{formatPrice(product.price)}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${stockTone(product.stock)}`}>
                        {Number(product.stock || 0) <= 0 ? 'Out' : `${product.stock} left`}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[var(--text-secondary)]">{category?.name || 'Unassigned'}</td>
                    <td className="px-5 py-4 font-semibold">{product.commission_rate || 10}%</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {product.is_trending && <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">Trending</span>}
                        {product.is_flash_sale && <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-semibold text-white">Flash sale</span>}
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
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{editing ? 'Edit Product' : 'New Product'}</p>
                <h3 className="mt-1 font-display text-3xl font-semibold">{editing ? editing.name : 'Create catalog item'}</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="rounded-full p-2 hover:bg-neutral-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_300px]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name" required>
                    <input value={form.name} onChange={event => set('name', event.target.value)} className="input h-12 rounded-2xl" placeholder="Product name" />
                  </Field>
                  <Field label="Swahili name">
                    <input value={form.name_sw} onChange={event => set('name_sw', event.target.value)} className="input h-12 rounded-2xl" placeholder="Jina la bidhaa" />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Description">
                    <textarea value={form.description} onChange={event => set('description', event.target.value)} className="input min-h-28 resize-none rounded-2xl" />
                  </Field>
                  <Field label="Swahili description">
                    <textarea value={form.description_sw} onChange={event => set('description_sw', event.target.value)} className="input min-h-28 resize-none rounded-2xl" />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Price" required>
                    <input type="number" value={form.price} onChange={event => set('price', event.target.value)} className="input h-12 rounded-2xl" />
                  </Field>
                  <Field label="Sale price">
                    <input type="number" value={form.sale_price} onChange={event => set('sale_price', event.target.value)} className="input h-12 rounded-2xl" />
                  </Field>
                  <Field label="Stock">
                    <input type="number" value={form.stock} onChange={event => set('stock', event.target.value)} className="input h-12 rounded-2xl" />
                  </Field>
                  <Field label="Commission">
                    <input type="number" value={form.commission_rate} onChange={event => set('commission_rate', event.target.value)} className="input h-12 rounded-2xl" />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Category">
                    <select value={form.category_id} onChange={event => set('category_id', event.target.value)} className="input h-12 rounded-2xl">
                      <option value="">Select category</option>
                      {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Sizes">
                    <input value={form.sizes} onChange={event => set('sizes', event.target.value)} className="input h-12 rounded-2xl" placeholder="S, M, L, XL" />
                  </Field>
                  <Field label="Colors">
                    <input value={form.colors} onChange={event => set('colors', event.target.value)} className="input h-12 rounded-2xl" placeholder="Black, White" />
                  </Field>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-3xl border border-black/10 p-4">
                  <p className="mb-3 font-semibold">Visibility</p>
                  <label className="mb-2 flex cursor-pointer items-center justify-between rounded-2xl bg-neutral-50 p-3 text-sm font-semibold">
                    Trending
                    <input type="checkbox" checked={form.is_trending} onChange={event => set('is_trending', event.target.checked)} className="h-4 w-4 accent-neutral-950" />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-neutral-50 p-3 text-sm font-semibold">
                    Flash sale
                    <input type="checkbox" checked={form.is_flash_sale} onChange={event => set('is_flash_sale', event.target.checked)} className="h-4 w-4 accent-neutral-950" />
                  </label>
                  {form.is_flash_sale && (
                    <input type="date" value={form.flash_sale_end_date} onChange={event => set('flash_sale_end_date', event.target.value)} className="input mt-3 h-12 rounded-2xl" />
                  )}
                </div>

                <div className="rounded-3xl border border-black/10 p-4">
                  <p className="mb-3 font-semibold">Images</p>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/20 p-6 text-center transition hover:border-neutral-950">
                    <Upload className="mb-2 h-6 w-6 text-[var(--text-secondary)]" />
                    <span className="text-sm font-semibold">Upload images</span>
                    <span className="mt-1 text-xs text-[var(--text-secondary)]">Up to 6 files</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={event => setFiles(Array.from(event.target.files || []))} />
                  </label>
                  {files.length > 0 && <p className="mt-2 text-xs font-semibold text-emerald-600">{files.length} file(s) selected</p>}
                  {editing?.images?.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {editing.images.map((image, index) => <img key={index} src={image} alt="" className="h-14 w-full rounded-xl object-cover" />)}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <button onClick={save} disabled={saving} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white disabled:opacity-50">
                    <Check className="h-4 w-4" />
                    {saving ? 'Saving...' : editing ? 'Save changes' : 'Create product'}
                  </button>
                  <button onClick={() => setModalOpen(false)} className="h-12 rounded-full border border-black/10 text-sm font-semibold">Cancel</button>
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
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
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
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 transition hover:border-neutral-950"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-20 min-w-[140px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <div className="mx-4 border-t border-black/5" />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
