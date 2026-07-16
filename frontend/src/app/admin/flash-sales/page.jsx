'use client';
import { useState, useEffect } from 'react';
import { getProducts, setFlashSale, removeFlashSale } from '@/lib/api';
import { Zap, X } from 'lucide-react';
import toast from 'react-hot-toast';

function formatPrice(n) {
  return new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n || 0);
}

export default function AdminFlashSales() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getProducts({ limit: 100 }).then(({ data }) => setProducts(data.products || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const flashProducts = products.filter(p => p.is_flash_sale);
  const nonFlash = products.filter(p => !p.is_flash_sale);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSetFlashSale = async () => {
    if (!selected.length) return toast.error('Select at least one product');
    if (!endDate) return toast.error('Set an end date');
    setSaving(true);
    try {
      await setFlashSale({ product_ids: selected, flash_sale_end_date: new Date(endDate).toISOString() });
      toast.success('Flash sale set!');
      setSelected([]);
      load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const handleRemove = async (id) => {
    try {
      await removeFlashSale({ product_ids: [id] });
      toast.success('Removed from flash sale');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Flash Sales</p>
      </div>

      {flashProducts.length > 0 && (
        <div className="rounded-3xl border border-black/10 bg-white p-5">
          <p className="mb-4 flex items-center gap-2 font-semibold text-neutral-950">
            <Zap className="h-4 w-4" /> Active Flash Sales ({flashProducts.length})
          </p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {flashProducts.map(p => {
              const img = p.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&h=100&fit=crop';
              const ends = p.flash_sale_end_date ? new Date(p.flash_sale_end_date) : null;
              const expired = ends && ends < new Date();
              return (
                <div key={p.id} className={`rounded-2xl border border-black/10 bg-white p-3 flex items-center gap-3 ${expired ? 'opacity-60' : ''}`}>
                  <img src={img} alt={p.name} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-950 truncate">{p.name}</p>
                    <p className="text-xs font-bold text-neutral-950">{formatPrice(p.sale_price || p.price)}</p>
                    {ends && (
                      <p className={`text-xs ${expired ? 'text-red-600' : 'text-[var(--text-secondary)]'}`}>
                        {expired ? 'Expired' : `Ends ${ends.toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(p.id)}
                    className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-black/10 text-red-600 transition hover:border-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-black/10 bg-white p-5">
        <p className="mb-4 font-semibold text-neutral-950">Add Products to Flash Sale</p>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Flash Sale End Date &amp; Time *</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </div>
          <div className="sm:self-end">
            <button
              onClick={handleSetFlashSale}
              disabled={saving || !selected.length}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              {saving ? 'Setting...' : `Set Flash Sale (${selected.length} selected)`}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 shimmer-bg rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 max-h-96 overflow-y-auto">
            {nonFlash.map(p => {
              const img = p.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&h=100&fit=crop';
              const isSelected = selected.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => toggleSelect(p.id)}
                  className={`rounded-2xl border border-black/10 bg-white p-3 flex items-center gap-3 cursor-pointer transition-all ${isSelected ? 'border-neutral-950 bg-neutral-50' : 'hover:border-neutral-400'}`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={img} alt={p.name} className="h-12 w-12 rounded-xl object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 rounded-xl bg-neutral-950/30 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-950 truncate">{p.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{formatPrice(p.price)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
