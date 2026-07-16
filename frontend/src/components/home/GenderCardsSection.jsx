'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { productCategoryHref } from '@/lib/productCategories';

const cards = [
  {
    label: 'Trouser',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&h=640&fit=crop&auto=format',
    align: 'object-[center_35%]',
  },
  {
    label: 'Tshirts',
    image: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=900&h=640&fit=crop&auto=format',
    align: 'object-[center_35%]',
  },
  {
    label: 'Hoodie',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&h=640&fit=crop&auto=format',
    align: 'object-[center_40%]',
  },
  {
    label: 'Shorts',
    image: 'https://images.unsplash.com/photo-1506629905607-d9d297dca5f9?w=900&h=640&fit=crop&auto=format',
    align: 'object-[center_45%]',
  },
];

export default function GenderCardsSection() {
  return (
    <section className="mx-auto max-w-[1500px] px-4 py-10 sm:px-8 sm:py-14 lg:px-12">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-[var(--text-secondary)]">Shop by category</p>
          <h2 className="font-display text-4xl font-semibold text-[var(--text)] sm:text-5xl">
            Category <span className="italic">Edit</span>
          </h2>
        </div>
        <Link href="/products" className="hidden items-center gap-2 text-sm font-medium text-[var(--text)] transition hover:opacity-60 sm:inline-flex">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={productCategoryHref(card.label)}
            className="group relative min-h-[230px] overflow-hidden rounded-[24px] bg-neutral-200 sm:min-h-[300px]"
          >
            <Image
              src={card.image}
              alt={`${card.label} collection`}
              fill
              className={`object-cover transition duration-700 group-hover:scale-105 ${card.align}`}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
            <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-3 text-white">
              <span className="font-display text-4xl italic leading-none sm:text-5xl">{card.label}</span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-950 transition group-hover:bg-neutral-950 group-hover:text-white">
                <ArrowRight className="h-5 w-5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
