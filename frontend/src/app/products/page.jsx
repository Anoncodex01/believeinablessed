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
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg)] pb-20 pt-16 md:pb-0">
      <Navbar />

      <div className="home-shell py-10 sm:py-14 lg:py-16">
        <section className="relative mb-12 overflow-hidden border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(15,118,110,0.08),_transparent_55%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_400px] lg:items-end">
            <div>
              <p className="section-kicker">Shop the edit</p>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl lg:text-[3.5rem]">
                {pageTitle}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                Clean essentials and everyday fits — browse by category or search what you need.
              </p>
            </div>

            <form
              onSubmit={submitSearch}
              className="flex items-center gap-2 border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5"
            >
              <Search className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search trousers, hoodies, tees..."
                className="min-w-0 flex-1 bg-transparent text-sm tracking-tight text-[var(--text)] outline-none placeholder:text-[var(--text-secondary)]"
              />
              <button
                type="submit"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-neutral-950 text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>

        <div className="mb-10 flex flex-col gap-5 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-[var(--text)]">
              {products.length} products
            </p>
            <p className="mt-0.5 text-xs tracking-[0.08em] text-[var(--text-secondary)] uppercase">
              Curated collection
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
            <span className="inline-flex items-center gap-2 pr-3 text-[11px] font-semibold tracking-[0.18em] text-[var(--text-secondary)] uppercase">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
            </span>
            <button
              onClick={() => setFilter('category', '')}
              className={`px-3 py-1.5 text-sm tracking-tight transition ${
                !categoryId
                  ? 'font-semibold text-[var(--text)] underline decoration-teal-700 decoration-2 underline-offset-8'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
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
                  className={`px-3 py-1.5 text-sm tracking-tight transition ${
                    categoryId === cat.id
                      ? 'font-semibold text-[var(--text)] underline decoration-teal-700 decoration-2 underline-offset-8'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                  }`}
                >
                  {name}
                </button>
              );
            })}

            {(search || categoryId || trending || flashSale) && (
              <button
                onClick={clearFilters}
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 transition hover:text-orange-700"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              <div className="mt-14 text-center">
                <button
                  onClick={() => loadProducts()}
                  disabled={loading}
                  className="inline-flex min-w-[160px] items-center justify-center border border-neutral-950 px-8 py-3.5 text-sm font-semibold tracking-tight text-neutral-950 transition hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-neutral-950"
                >
                  {loading ? t('loading') : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[3/4] border border-[var(--border)] shimmer-bg" />
                <div className="space-y-2 pt-4">
                  <div className="h-3 shimmer-bg rounded" />
                  <div className="h-3 w-2/3 shimmer-bg rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-[var(--border)] bg-[var(--surface-warm)] px-6 py-20 text-center">
            <p className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              No products found
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">{t('no_products')}</p>
            <button
              onClick={clearFilters}
              className="mt-8 bg-neutral-950 px-6 py-3 text-sm font-semibold tracking-tight text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300"
            >
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
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] pt-16">
        <div className="font-display text-sm tracking-[0.2em] text-[var(--text-secondary)] uppercase">
          Loading
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
