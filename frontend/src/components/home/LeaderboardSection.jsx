// components/home/LeaderboardSection.jsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLang } from '@/contexts/LangContext';
import { getLeaderboard } from '@/lib/api';
import { ArrowRight, Users } from 'lucide-react';

const TIER_CONFIG = {
  bronze: {
    color: 'text-neutral-950 dark:text-white',
    bgColor: 'bg-neutral-100',
    label: 'Bronze',
    commission: '5%',
    withdrawRequirement: '19 orders',
    payoutTime: '2 Weeks',
  },
  silver: {
    color: 'text-neutral-500',
    bgColor: 'bg-neutral-500/10',
    label: 'Silver',
    commission: '6%',
    withdrawRequirement: '10 orders',
    payoutTime: '1 Week',
  },
  gold: {
    color: 'text-neutral-950 dark:text-white',
    bgColor: 'bg-neutral-100',
    label: 'Gold',
    commission: '7%',
    withdrawRequirement: '5 orders',
    payoutTime: '3 Days',
  },
  platinum: {
    color: 'text-neutral-950 dark:text-white',
    bgColor: 'bg-neutral-950/10',
    label: 'Platinum',
    commission: '8%',
    withdrawRequirement: '3 orders',
    payoutTime: 'Instant',
  },
  vip: {
    color: 'text-violet-600 dark:text-violet-300',
    bgColor: 'bg-violet-500/10',
    label: 'VIP',
    commission: '9-10%',
    withdrawRequirement: 'Instant',
    payoutTime: 'Instant',
  },
};

function getTierInfo(level) {
  return TIER_CONFIG[level] || TIER_CONFIG.bronze;
}

function formatPrice(n) {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function LeaderboardSection({ limit = 6, showViewAllLink = true }) {
  const { t } = useLang();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const { data } = await getLeaderboard(limit);
      setLeaders(data.leaderboard || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings = leaders.reduce((sum, leader) => sum + (leader.total_earnings || 0), 0);

  return (
    <section>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          {!showViewAllLink ? null : <p className="section-kicker">Rankings</p>}
          {showViewAllLink && (
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              {t('leaderboard')}
            </h2>
          )}
          {showViewAllLink && (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Top earning affiliates</p>
          )}
        </div>
        {showViewAllLink && (
          <Link href="/affiliate/leaderboard" className="section-link">
            {t('see_all')} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {!loading && leaders.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-3 border border-[var(--border)] bg-[var(--bg-card)] sm:grid-cols-3">
          <div className="border-b border-[var(--border)] p-4 sm:border-b-0 sm:border-r">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--text-secondary)] uppercase">
              Affiliates
            </p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--text)]">
              {leaders.length}
            </p>
          </div>
          <div className="border-b border-[var(--border)] p-4 sm:border-b-0 sm:border-r">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--text-secondary)] uppercase">
              Total earned
            </p>
            <p className="mt-1 font-display text-lg font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-xl">
              {formatPrice(totalEarnings)}
            </p>
          </div>
          <div className="col-span-2 p-4 sm:col-span-1">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--text-secondary)] uppercase">
              Leader
            </p>
            <p className="mt-1 truncate font-display text-lg font-semibold tracking-tight text-[var(--text)]">
              {leaders[0]?.name || '—'}
            </p>
          </div>
        </div>
      )}

      <div className="overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]">
        {loading ? (
          <div className="space-y-0 divide-y divide-[var(--border)]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 shimmer-bg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 shimmer-bg rounded" />
                  <div className="h-3 w-1/4 shimmer-bg rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : leaders.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {leaders.slice(0, limit).map((leader, i) => {
              const tierInfo = getTierInfo(leader.affiliate_level || 'bronze');
              return (
                <motion.div
                  key={leader.id || leader.referral_code || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 p-4 transition hover:bg-[var(--bg-secondary)]"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center text-sm font-bold ${
                      i === 0
                        ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                        : i < 3
                        ? 'bg-[var(--surface-warm)] text-[var(--text)]'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {i + 1}
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-neutral-950 text-sm font-bold text-white">
                    {leader.name?.[0]?.toUpperCase() || '?'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold tracking-tight text-[var(--text)]">
                      {leader.name || 'Anonymous'}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-semibold ${tierInfo.color}`}>
                        {tierInfo.label}
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        {tierInfo.commission} · {leader.sales || 0} sales
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tracking-tight text-neutral-950 dark:text-white">
                      {formatPrice(leader.total_earnings || 0)}
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)]">{tierInfo.payoutTime}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-[var(--text-secondary)]" />
            <p className="font-display text-lg font-semibold text-[var(--text)]">No rankings yet</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Be the first affiliate on the board.
            </p>
          </div>
        )}
      </div>

      {!loading && leaders.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--border)] pt-5 text-[11px] text-[var(--text-secondary)]">
          <span>Bronze: 19 orders</span>
          <span>Silver: 10 orders</span>
          <span>Gold: 5 orders</span>
          <span>Platinum: 3 orders</span>
          <span>VIP: Instant</span>
        </div>
      )}
    </section>
  );
}
