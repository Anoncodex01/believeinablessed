// app/affiliate/leaderboard/page.jsx
'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import LeaderboardSection from '@/components/home/LeaderboardSection';
import { Crown } from 'lucide-react';

// Remove the metadata export - it can't be used with 'use client'

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] pt-16 pb-24 md:pb-0">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-sm font-semibold mb-4">
              <Crown className="w-4 h-4" />
              Leaderboard
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[var(--text)] mb-3">
              🏆 Top Affiliates
            </h1>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              Meet Tanzania's top earning fashion affiliates. See who's leading the way!
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <LeaderboardSection limit={50} showViewAllLink={false} />
      </div>
      
      <Footer />
      <BottomNav />
    </main>
  );
}