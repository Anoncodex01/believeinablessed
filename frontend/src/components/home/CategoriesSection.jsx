'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLang } from '@/contexts/LangContext';
import { getCategories } from '@/lib/api';

export default function CategoriesSection() {
  const { t, lang } = useLang();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  if (categories.length === 0) return null;

  // Default icon mapping without emojis
  const defaultIcons = {
    'Women': 'W',
    'Men': 'M',
    'Kids': 'K',
    'Accessories': 'A',
    'Shoes': 'S',
    'Dresses': 'D',
    'T-Shirts': 'T',
    'Jackets': 'J',
  };

  // Function to get display text (first letter or custom)
  const getDisplayText = (category) => {
    const icon = category.icon;
    // If icon is an emoji (contains special characters), use first letter of name
    if (icon && /[\u{1F600}-\u{1F6FF}]/u.test(icon)) {
      const name = lang === 'sw' && category.name_sw ? category.name_sw : category.name;
      return name.charAt(0).toUpperCase();
    }
    // If icon is a letter or word, use it
    if (icon && !icon.includes('👕') && !icon.includes('👗') && !icon.includes('👔')) {
      return icon;
    }
    // Fallback to default mapping or first letter
    const name = lang === 'sw' && category.name_sw ? category.name_sw : category.name;
    return defaultIcons[name] || name.charAt(0).toUpperCase();
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--brand)]">Shop by edit</p>
          <h2 className="section-title mb-0">{t('categories')}</h2>
        </div>
        <Link href="/products" className="hidden text-sm font-semibold text-[var(--brand)] hover:opacity-80 sm:inline">
          {t('see_all')}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-8">
        {categories.map((cat, i) => {
          const name = lang === 'sw' && cat.name_sw ? cat.name_sw : cat.name;
          const displayText = getDisplayText(cat);
          
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                href={`/products?category=${cat.id}`}
                className="group flex min-h-28 flex-col justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-light)] text-lg font-bold text-[var(--brand)] transition group-hover:bg-[var(--brand)] group-hover:text-white">
                  {displayText}
                </span>
                <span className="text-left text-xs font-semibold leading-tight text-[var(--text)] transition group-hover:text-[var(--brand)]">
                  {name}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
