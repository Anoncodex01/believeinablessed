// components/home/FlashSaleSection.jsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLang } from '@/contexts/LangContext';
import { getFlashSales } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { Zap, ArrowRight } from 'lucide-react';

function Countdown({ endDate }) {
  const { t } = useLang();
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate) - new Date();
      if (diff <= 0) return setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endDate]);

  const Box = ({ val, label }) => (
    <div className="flex flex-col items-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-lg font-bold text-white shadow-sm backdrop-blur sm:h-12 sm:w-12 sm:text-xl">
        {String(val).padStart(2, '0')}
      </div>
      <span className="mt-1 text-[10px] font-medium text-white/65">{label}</span>
    </div>
  );

  return (
    <div className="flex items-end gap-1.5">
      <Box val={timeLeft.d} label={t('days')} />
      <span className="mb-4 text-xl font-bold text-white/45">:</span>
      <Box val={timeLeft.h} label={t('hours')} />
      <span className="mb-4 text-xl font-bold text-white/45">:</span>
      <Box val={timeLeft.m} label={t('minutes')} />
      <span className="mb-4 text-xl font-bold text-white/45">:</span>
      <Box val={timeLeft.s} label={t('seconds')} />
    </div>
  );
}

export default function FlashSaleSection({ refCode = '' }) {
  const { t } = useLang();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFlashSales()
      .then(({ data }) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && products.length === 0) return null;

  const endDate = products[0]?.flash_sale_end_date || new Date(Date.now() + 86400000 * 2).toISOString();

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="overflow-hidden rounded-lg bg-neutral-950">
        <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-950 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="mb-0 text-2xl font-bold text-white sm:text-3xl">{t('flash_sale')}</h2>
              <p className="text-sm text-white/65">{t('ends_in')}</p>
            </div>
          </div>
          <Countdown endDate={endDate} />
          <Link href={`/products?flash_sale=true${refCode ? `&ref=${refCode}` : ''}`} className="inline-flex items-center gap-1 self-start rounded-lg bg-white px-4 py-2 text-sm font-bold text-neutral-950 transition hover:bg-neutral-100 sm:self-auto">
            {t('see_all')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-white/10 bg-[var(--bg)] p-3 sm:grid-cols-3 sm:p-4 md:grid-cols-4 lg:grid-cols-5">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="aspect-[3/4] shimmer-bg" />
                  <div className="space-y-2 p-3">
                    <div className="h-3 shimmer-bg rounded" />
                    <div className="h-3 w-2/3 shimmer-bg rounded" />
                  </div>
                </div>
              ))
            : products.slice(0, 5).map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} affiliateCode={refCode} />
              ))
          }
        </div>
      </div>
    </section>
  );
}
