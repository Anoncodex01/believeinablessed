// app/products/page.jsx
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import ProductCard from '@/components/product/ProductCard';
import { useLang } from '@/contexts/LangContext';
import { useAffiliate } from '@/contexts/AffiliateContext';
import { getProducts, getCategories } from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react';

function ProductsContent() {
  const { t, lang } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refCode } = useAffiliate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const ref = searchParams.get('ref') || refCode || '';
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';
  const trending = searchParams.get('trending') || '';
  const flashSale = searchParams.get('flash_sale') || '';

  const loadProducts = async (reset = false) => {
    setLoading(true);
    try {
      const offset = reset ? 0 : page * 24;
      const { data } = await getProducts({
        search, category: categoryId, trending, flash_sale: flashSale,
        limit: 24, offset,
      });
      const newProds = data.products || [];
      if (reset) setProducts(newProds);
      else setProducts(prev => [...prev, ...newProds]);
      setHasMore(newProds.length === 24);
      if (!reset) setPage(p => p + 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    setSearchInput(search);
    loadProducts(true);
    getCategories().then(({ data }) => setCategories(data.categories || []));
  }, [search, categoryId, trending, flashSale]);

  const setFilter = (key, val) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set(key, val);
    else params.delete(key);
    if (ref) params.set('ref', ref);
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(ref ? `/products?ref=${ref}` : '/products');
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setFilter('search', searchInput.trim());
  };

  const pageTitle = trending ? t('trending')
    : flashSale ? t('flash_sale')
    : search ? `"${search}"`
    : t('all_products');

  return (
    <main className="min-h-screen bg-[var(--bg)] pt-16">
      <Navbar />

      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
        <section className="mb-10 overflow-hidden rounded-[28px] bg-[#f6f4f0] px-5 py-8 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase text-[var(--text-secondary)]">Shop the edit</p>
              <h1 className="font-display text-5xl font-semibold leading-none text-[var(--text)] sm:text-6xl">
                {pageTitle}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                Explore clean essentials, confident statement pieces, and everyday fashion made to move with you.
              </p>
            </div>

            <div>
              <form onSubmit={submitSearch} className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 dark:border-white/10 dark:bg-neutral-950">
                <Search className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search shirts, shoes, suits..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-secondary)]"
                />
                <button type="submit" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-950">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </section>

        <div className="mb-8 flex flex-col gap-4 border-y border-black/10 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
          <div>
            <p className="text-sm font-medium text-[var(--text)]">{products.length} products</p>
            <p className="text-xs text-[var(--text-secondary)]">Curated collection</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 pr-2 text-xs font-medium uppercase text-[var(--text-secondary)]">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
            </span>
            <button
              onClick={() => setFilter('category', '')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                !categoryId ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-white/10 dark:text-white'
              }`}
            >
              All
            </button>

            {categories.map(cat => {
              const name = lang === 'sw' && cat.name_sw ? cat.name_sw : cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilter('category', cat.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    categoryId === cat.id ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-white/10 dark:text-white'
                  }`}
                >
                  {name}
                </button>
              );
            })}

            {(search || categoryId || trending || flashSale) && (
              <button onClick={clearFilters} className="flex items-center gap-1 rounded-full bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-500/20">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-x-6 gap-y-11 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  index={i % 24} 
                  affiliateCode={ref}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => loadProducts()}
                  disabled={loading}
                  className="inline-flex min-w-[160px] items-center justify-center rounded-full border border-neutral-950 px-6 py-3 text-sm font-medium text-neutral-950 transition hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-neutral-950"
                >
                  {loading ? t('loading') : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-11 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[0.92] rounded-lg shimmer-bg" />
                <div className="space-y-2 pt-4">
                  <div className="h-3 shimmer-bg rounded" />
                  <div className="h-3 shimmer-bg rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] bg-[#f6f4f0] px-6 py-20 text-center dark:bg-white/5">
            <p className="font-display text-4xl font-semibold text-[var(--text)]">No products found</p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">{t('no_products')}</p>
            <button onClick={clearFilters} className="mt-6 rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-950">
              Reset filters
            </button>
          </div>
        )}
      </div>

      <Footer />
      <BottomNav />
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg)] pt-16 flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
