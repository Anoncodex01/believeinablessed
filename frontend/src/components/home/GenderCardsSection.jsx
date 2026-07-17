'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { productCategoryHref } from '@/lib/productCategories';

const cards = [
  {
    label: 'Trouser',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&h=640&fit=crop&auto=format',
    align: 'object-[center_35%]',
  },
  {
    label: 'Tshirts',
    image:
      'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=900&h=640&fit=crop&auto=format',
    align: 'object-[center_35%]',
  },
  {
    label: 'Hoodie',
    image:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&h=640&fit=crop&auto=format',
    align: 'object-[center_40%]',
  },
  {
    label: 'Shorts',
    image:
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=900&h=640&fit=crop&auto=format',
    align: 'object-[center_45%]',
  },
];

export default function GenderCardsSection() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--surface-warm)] py-16 sm:py-20 lg:py-24">
      <div className="home-shell">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex items-end justify-between gap-6 sm:mb-12"
        >
          <div>
            <p className="section-kicker">Shop the edit</p>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl lg:text-[3.5rem]">
              Categories
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Find your next everyday essential by silhouette.
            </p>
          </div>
          <Link href="/products" className="section-link hidden sm:inline-flex">
            All products <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {cards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.5,
                delay: index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link
                href={productCategoryHref(card.label)}
                className="group relative block min-h-[280px] overflow-hidden sm:min-h-[360px]"
              >
                <Image
                  src={card.image}
                  alt={`${card.label} collection`}
                  fill
                  className={`object-cover transition duration-700 ease-out group-hover:scale-105 ${card.align}`}
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent transition duration-500 group-hover:from-black/80" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 sm:p-6">
                  <span className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {card.label}
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-white text-neutral-950 transition duration-300 group-hover:bg-teal-700 group-hover:text-white">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
