// components/home/TrendingSection.jsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getProducts } from '@/lib/api';
import { homeProductFallbacks } from '@/lib/homeProductFallbacks';
import ProductCard from '@/components/product/ProductCard';
import ProductsGrid from '@/components/product/ProductsGrid';
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
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(15,118,110,0.07),_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(45,212,191,0.08),_transparent_55%)]" />

      <div className="home-shell relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex items-end justify-between gap-6 sm:mb-12"
        >
          <div>
            <p className="section-kicker">Just dropped</p>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl lg:text-[3.5rem]">
              New & Trending
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Fresh pieces people are wearing right now — clean cuts, everyday fits.
            </p>
          </div>
          <Link
            href={`/products?trending=true${refCode ? `&ref=${refCode}` : ''}`}
            className="section-link hidden sm:inline-flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <ProductsGrid>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="min-w-0 overflow-hidden">
                  <div className="aspect-[3/4] shimmer-bg" />
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-3/4 shimmer-bg" />
                    <div className="h-3 w-1/2 shimmer-bg" />
                  </div>
                </div>
              ))
            : products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} affiliateCode={refCode} />
              ))}
        </ProductsGrid>

        <div className="mt-10 text-center sm:hidden">
          <Link
            href={`/products?trending=true${refCode ? `&ref=${refCode}` : ''}`}
            className="section-link"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
