// app/affiliate/leaderboard/page.jsx
'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import LeaderboardSection from '@/components/home/LeaderboardSection';

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg)] pb-20 pt-16 md:pb-0">
      <Navbar />

      <div className="home-shell py-12 sm:py-16">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-10 overflow-hidden border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-10 sm:px-8 sm:py-12 lg:px-12"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(15,118,110,0.08),_transparent_55%)]" />
          <div className="relative max-w-2xl">
            <p className="section-kicker">Affiliate program</p>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
              Leaderboard
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Top earning BelieveinaBlessed affiliates — ranked by confirmed commissions.
            </p>
          </div>
        </motion.section>

        <LeaderboardSection limit={50} showViewAllLink={false} />
      </div>

      <Footer />
      <BottomNav />
    </main>
  );
}
