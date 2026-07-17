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
      <div className="border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-6 sm:px-6">
        <p className="section-kicker">Promotions</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
          Flash Sales
        </h2>
        <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
          Add time-limited discounts to selected products.
        </p>
      </div>

      {flashProducts.length > 0 && (
        <div className="border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <p className="mb-4 flex items-center gap-2 font-semibold text-[var(--text)]">
            <Zap className="h-4 w-4 text-teal-700" /> Active Flash Sales ({flashProducts.length})
          </p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {flashProducts.map(p => {
              const img = p.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&h=100&fit=crop';
              const ends = p.flash_sale_end_date ? new Date(p.flash_sale_end_date) : null;
              const expired = ends && ends < new Date();
              return (
                <div key={p.id} className={`flex items-center gap-3 border border-[var(--border)] bg-[var(--bg-card)] p-3 ${expired ? 'opacity-60' : ''}`}>
                  <img src={img} alt={p.name} className="h-12 w-12 flex-shrink-0 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text)]">{p.name}</p>
                    <p className="text-xs font-bold text-[var(--text)]">{formatPrice(p.sale_price || p.price)}</p>
                    {ends && (
                      <p className={`text-xs ${expired ? 'text-red-600' : 'text-[var(--text-secondary)]'}`}>
                        {expired ? 'Expired' : `Ends ${ends.toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(p.id)}
                    className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center border border-[var(--border)] text-red-600 transition hover:border-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <p className="mb-4 font-semibold text-[var(--text)]">Add Products to Flash Sale</p>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Flash Sale End Date &amp; Time *</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input h-12"
            />
          </div>
          <div className="sm:self-end">
            <button
              onClick={handleSetFlashSale}
              disabled={saving || !selected.length}
              className="inline-flex h-11 items-center justify-center gap-2 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300"
            >
              <Zap className="h-4 w-4" />
              {saving ? 'Setting...' : `Set Flash Sale (${selected.length} selected)`}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 shimmer-bg" />
            ))}
          </div>
        ) : (
          <div className="grid max-h-96 gap-3 overflow-y-auto sm:grid-cols-2 md:grid-cols-3">
            {nonFlash.map(p => {
              const img = p.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&h=100&fit=crop';
              const isSelected = selected.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => toggleSelect(p.id)}
                  className={`flex cursor-pointer items-center gap-3 border p-3 transition-all ${isSelected ? 'border-teal-700 bg-teal-700/10' : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-teal-700/50'}`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={img} alt={p.name} className="h-12 w-12 object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/40">
                        <span className="text-sm font-bold text-white">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text)]">{p.name}</p>
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
