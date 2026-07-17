// components/home/AllProductsSection.jsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getProducts } from '@/lib/api';
import { homeProductFallbacks } from '@/lib/homeProductFallbacks';
import ProductCard from '@/components/product/ProductCard';
import ProductsGrid from '@/components/product/ProductsGrid';
import { productCategories, productCategoryHref } from '@/lib/productCategories';
import { ArrowRight } from 'lucide-react';

export default function AllProductsSection({ refCode = '' }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts({ limit: 12 })
      .then(({ data }) => {
        const apiProducts = data.products || [];
        setProducts(apiProducts.length ? apiProducts : homeProductFallbacks.slice(4, 10));
      })
      .catch(() => setProducts(homeProductFallbacks.slice(4, 10)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="relative py-16 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,var(--bg-secondary),transparent)]" />

      <div className="home-shell relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 max-w-2xl sm:mb-12"
        >
          <p className="section-kicker">The full edit</p>
          <h2 className="font-display text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl lg:text-[3.5rem]">
            Our Collections
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            Curated looks for every day — browse by category or explore everything.
          </p>
        </motion.div>

        <div className="mb-10 flex flex-col gap-5 border-b border-[var(--border)] pb-8 sm:mb-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-x-1 gap-y-2">
            {productCategories.map((label, index) => (
              <Link
                key={label}
                href={productCategoryHref(label)}
                className={`px-3 py-1.5 text-sm tracking-tight transition ${
                  index === 0
                    ? 'font-semibold text-[var(--text)] underline decoration-neutral-950 decoration-2 underline-offset-8'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <Link
            href={`/products${refCode ? `?ref=${refCode}` : ''}`}
            className="section-link"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ProductsGrid>
          {loading
            ? Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="min-w-0 overflow-hidden">
                  <div className="aspect-[3/4] shimmer-bg" />
                  <div className="mt-3 space-y-2">
                    <div className="h-3 shimmer-bg" />
                    <div className="h-3 w-2/3 shimmer-bg" />
                  </div>
                </div>
              ))
            : products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} affiliateCode={refCode} />
              ))}
        </ProductsGrid>

        <div className="mt-14 text-center">
          <Link href={`/products${refCode ? `?ref=${refCode}` : ''}`}>
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 bg-neutral-950 px-8 py-4 text-sm font-semibold tracking-tight text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              Explore full collection <ArrowRight className="h-4 w-4" />
            </motion.span>
          </Link>
        </div>
      </div>
    </section>
  );
}
