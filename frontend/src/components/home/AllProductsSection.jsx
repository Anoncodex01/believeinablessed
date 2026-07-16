// components/home/AllProductsSection.jsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getProducts } from '@/lib/api';
import { homeProductFallbacks } from '@/lib/homeProductFallbacks';
import ProductCard from '@/components/product/ProductCard';
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
    <section className="mx-auto max-w-[1500px] px-4 py-10 sm:px-8 sm:py-14 lg:px-12">
      <div className="mx-auto max-w-[1500px]">
      <div className="mb-8 text-center">
        <p className="mb-3 text-xs font-medium uppercase text-[var(--text-secondary)]">Curated for every day</p>
        <h2 className="font-display text-4xl font-semibold text-[var(--text)] sm:text-5xl">
          Our <span className="italic">Collections</span>
        </h2>
      </div>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {productCategories.map((label, index) => (
            <Link
              key={label}
              href={productCategoryHref(label)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                index === 0
                  ? 'bg-neutral-950 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-950'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-950 hover:text-white dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-neutral-950'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <Link href={`/products${refCode ? `?ref=${refCode}` : ''}`} className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[var(--text)] transition hover:opacity-60">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="aspect-[3/4] shimmer-bg" />
                <div className="p-3 space-y-2">
                  <div className="h-3 shimmer-bg rounded" />
                  <div className="h-3 shimmer-bg rounded w-2/3" />
                </div>
              </div>
            ))
          : products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} affiliateCode={refCode} />
            ))
        }
      </div>

      <div className="mt-12 text-center">
        <Link href={`/products${refCode ? `?ref=${refCode}` : ''}`}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-950 px-6 py-3 text-sm font-medium text-neutral-950 transition hover:bg-neutral-950 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-neutral-950"
          >
            View Full Collection <ArrowRight className="h-4 w-4" />
          </motion.button>
        </Link>
      </div>
      </div>
    </section>
  );
}
