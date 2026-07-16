// components/home/TrendingSection.jsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getProducts } from '@/lib/api';
import { homeProductFallbacks } from '@/lib/homeProductFallbacks';
import ProductCard from '@/components/product/ProductCard';
import { ArrowRight } from 'lucide-react';

export default function TrendingSection({ refCode = '' }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts({ trending: 'true', limit: 8 })
      .then(({ data }) => {
        const apiProducts = data.products || [];
        setProducts(apiProducts.length ? apiProducts : homeProductFallbacks.slice(0, 4));
      })
      .catch(() => setProducts(homeProductFallbacks.slice(0, 4)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-10 sm:px-8 sm:py-14 lg:px-12">
      <div className="mx-auto max-w-[1500px]">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl font-semibold leading-none text-[var(--text)] sm:text-5xl">
            New & <span className="italic">Trending</span>
          </h2>
        </div>
        <Link href={`/products?trending=true${refCode ? `&ref=${refCode}` : ''}`} className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[var(--text)] transition hover:opacity-60">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="aspect-[3/4] shimmer-bg" />
                <div className="p-3 space-y-2">
                  <div className="h-3 shimmer-bg rounded w-3/4" />
                  <div className="h-3 shimmer-bg rounded w-1/2" />
                </div>
              </div>
            ))
          : products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} affiliateCode={refCode} />
            ))
        }
      </div>
      </div>
    </section>
  );
}
