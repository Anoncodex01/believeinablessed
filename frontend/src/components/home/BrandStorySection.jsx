'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function BrandStorySection() {
  return (
    <section className="border-y border-[var(--border)] bg-white py-16 sm:py-20 lg:py-24">
      <div className="home-shell">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[4/5] overflow-hidden sm:aspect-[5/4] lg:aspect-[4/5]"
          >
            <Image
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=1400&fit=crop&auto=format"
              alt="BelieveinaBlessed brand story"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="section-kicker">BelieveinaBlessed</p>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl lg:text-[3.25rem]">
              Fashion with purpose
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              More than clothes — a reminder to believe in the blessings already within you.
              Clean cuts, confident everyday style, made for Tanzania and beyond.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 bg-neutral-950 px-6 py-3.5 text-sm font-semibold tracking-tight text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                Our story <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-neutral-950 px-6 py-3.5 text-sm font-semibold tracking-tight text-neutral-950 transition hover:bg-neutral-950 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-neutral-950"
              >
                Contact us
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
