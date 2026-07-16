'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import { useLang } from '@/contexts/LangContext';
import { getCompetition, getCompetitionLeaderboard } from '@/lib/api';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Award, Clock, Gift, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className="flex items-center gap-3 justify-center">
      {[
        { val: timeLeft.d, label: t('days') },
        { val: timeLeft.h, label: t('hours') },
        { val: timeLeft.m, label: t('minutes') },
        { val: timeLeft.s, label: t('seconds') },
      ].map(({ val, label }, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--bg-card)] border-2 border-brand-500/30 rounded-2xl flex items-center justify-center font-display font-bold text-2xl sm:text-3xl text-[var(--text)] shadow-lg">
            {String(val).padStart(2, '0')}
          </div>
          <span className="text-xs text-[var(--text-secondary)] mt-2 font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function CompetitionPage() {
  const { t, lang } = useLang();
  const [competition, setCompetition] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCompetition(), getCompetitionLeaderboard()])
      .then(([c, l]) => {
        setCompetition(c.data.competition);
        setLeaderboard(l.data.leaderboard || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const title = lang === 'sw' && competition?.title_sw ? competition.title_sw : competition?.title;
  const description = lang === 'sw' && competition?.description_sw ? competition.description_sw : competition?.description;
  const prize = lang === 'sw' && competition?.prize_sw ? competition.prize_sw : competition?.prize;
  const rules = lang === 'sw' && competition?.rules_sw ? competition.rules_sw : competition?.rules;

  const RANK_ICONS = [
    <Crown key={1} className="w-6 h-6 text-yellow-400" />,
    <Medal key={2} className="w-6 h-6 text-gray-400" />,
    <Award key={3} className="w-6 h-6 text-orange-500" />,
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)] pt-16 pb-24 md:pb-0">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-yellow-500/10" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-sm font-semibold mb-6">
            <Trophy className="w-4 h-4" />
            {t('monthly_competition')}
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-[var(--text)] mb-4">
            {title || t('monthly_competition')}
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
            {description || t('competition_desc')}
          </motion.p>

          {/* Prize */}
          {prize && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
              className="inline-block card px-8 py-4 mb-8 border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-center gap-3">
                <Gift className="w-6 h-6 text-yellow-500" />
                <div className="text-left">
                  <p className="text-xs text-[var(--text-secondary)] font-medium">{t('current_prize')}</p>
                  <p className="text-xl font-display font-bold text-yellow-500">{prize}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Countdown */}
          {competition?.end_date && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <p className="text-sm text-[var(--text-secondary)] mb-4 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" /> {t('ends_in')}:
              </p>
              <Countdown endDate={competition.end_date} />
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-4 justify-center mt-10">
            <Link href="/auth/register" className="btn-primary flex items-center gap-2 px-8 py-4 text-base">
              {t('join_now')} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/affiliate/dashboard" className="btn-secondary px-8 py-4 text-base">
              My Dashboard
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-display font-bold text-center text-[var(--text)] mb-8">
          🏆 Competition Leaderboard
        </h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 shimmer-bg rounded-2xl" />
            ))}
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((entry, i) => (
              <motion.div key={entry.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`card p-4 flex items-center gap-4 ${i === 0 ? 'border-yellow-500/40 bg-yellow-500/5' : i === 1 ? 'border-gray-400/30' : ''}`}>
                <div className="w-10 flex items-center justify-center">
                  {i < 3 ? RANK_ICONS[i] : <span className="text-lg font-bold text-[var(--text-secondary)]">#{i + 1}</span>}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-orange-500 flex items-center justify-center text-white font-bold">
                  {entry.users?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--text)]">{entry.users?.name || 'Affiliate'}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{entry.total_sales || 0} sales</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-500">
                    {new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(entry.total_revenue || 0)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 card">
            <Trophy className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-3" />
            <p className="text-[var(--text-secondary)]">Be the first to join this competition!</p>
            <Link href="/auth/register" className="btn-primary mt-4 inline-block text-sm">Join Now</Link>
          </div>
        )}
      </div>

      {/* Rules */}
      {rules && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="card p-6">
            <h3 className="font-display font-bold text-xl text-[var(--text)] mb-4">{t('rules')}</h3>
            <p className="text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">{rules}</p>
          </div>
        </div>
      )}

      <Footer />
      <BottomNav />
    </main>
  );
}
