// components/home/LeaderboardSection.jsx - Complete updated version

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLang } from '@/contexts/LangContext';
import { getLeaderboard } from '@/lib/api';
import { Crown, Medal, Award, ArrowRight, Users, TrendingUp, DollarSign, Clock } from 'lucide-react';

// Tier configuration matching the system with new withdrawal requirements
const TIER_CONFIG = {
  bronze: { 
    icon: '🥉', 
    color: 'text-orange-500', 
    bgColor: 'bg-orange-500/10',
    label: 'Bronze',
    commission: '5%',
    withdrawRequirement: '19 orders',  // 19 orders to withdraw
    payoutTime: '2 Weeks'
  },
  silver: { 
    icon: '🥈', 
    color: 'text-gray-400', 
    bgColor: 'bg-gray-500/10',
    label: 'Silver',
    commission: '6%',
    withdrawRequirement: '10 orders',  // 10 orders to withdraw (was 20)
    payoutTime: '1 Week'
  },
  gold: { 
    icon: '🥇', 
    color: 'text-yellow-500', 
    bgColor: 'bg-yellow-500/10',
    label: 'Gold',
    commission: '7%',
    withdrawRequirement: '5 orders',   // 5 orders to withdraw (was 100)
    payoutTime: '3 Days'
  },
  platinum: { 
    icon: '💎', 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/10',
    label: 'Platinum',
    commission: '8%',
    withdrawRequirement: '3 orders',   // 3 orders to withdraw (was 200)
    payoutTime: 'Instant'
  },
  vip: { 
    icon: '👑', 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/10',
    label: 'VIP',
    commission: '9-10%',
    withdrawRequirement: 'Instant',    // 0 orders to withdraw - instant (was 301)
    payoutTime: 'Instant'
  }
};

const RANK_ICONS = [
  <Crown key={1} className="w-5 h-5 text-yellow-400" />,
  <Medal key={2} className="w-5 h-5 text-gray-400" />,
  <Award key={3} className="w-5 h-5 text-orange-500" />,
];

function getTierInfo(level) {
  return TIER_CONFIG[level] || TIER_CONFIG.bronze;
}

function formatPrice(n) {
  return new Intl.NumberFormat('sw-TZ', { 
    style: 'currency', 
    currency: 'TZS', 
    maximumFractionDigits: 0 
  }).format(n || 0);
}

export default function LeaderboardSection({ limit = 6, showViewAllLink = true }) {
  const { t } = useLang();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

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

  // Calculate total earnings from leaders
  const totalEarnings = leaders.reduce((sum, leader) => sum + (leader.total_earnings || 0), 0);
  const totalAffiliates = leaders.length;

  // Count affiliates by tier
  const tierCounts = leaders.reduce((acc, leader) => {
    const tier = leader.affiliate_level || 'bronze';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});

  return (
    <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="section-title">{t('leaderboard')}</h2>
          <p className="text-sm text-[var(--text-secondary)]">Top earning affiliates</p>
        </div>
        {showViewAllLink && (
          <Link href="/affiliate/leaderboard" className="flex items-center gap-1 text-blue-500 text-sm font-semibold hover:text-blue-600 transition-colors">
            {t('see_all')} <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Stats Summary */}
      {!loading && leaders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-3 text-center">
            <div className="text-lg font-bold text-blue-500">{totalAffiliates}</div>
            <div className="text-[10px] text-[var(--text-secondary)]">Affiliates</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-lg font-bold text-green-500">{formatPrice(totalEarnings)}</div>
            <div className="text-[10px] text-[var(--text-secondary)]">Total Earnings</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-lg font-bold text-purple-500">
              {leaders.filter(l => l.affiliate_level === 'vip' || l.affiliate_level === 'platinum').length}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">Top Tier</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-lg font-bold text-orange-500 truncate max-w-[80px] mx-auto">
              {leaders[0]?.name || '—'}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">Current Leader</div>
          </div>
        </div>
      )}

      {/* Tier Distribution */}
      {!loading && leaders.length > 0 && Object.keys(tierCounts).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(tierCounts).map(([tier, count]) => {
            const tierInfo = getTierInfo(tier);
            return (
              <div key={tier} className="card px-3 py-1.5 text-center min-w-[60px]">
                <span className="text-sm">{tierInfo.icon}</span>
                <span className="text-xs font-medium text-[var(--text)] ml-1">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full shimmer-bg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 shimmer-bg rounded w-2/3" />
                  <div className="h-3 shimmer-bg rounded w-1/3" />
                </div>
              </div>
            ))
          : leaders.slice(0, limit).map((leader, i) => {
              const tierInfo = getTierInfo(leader.affiliate_level || 'bronze');
              const isTop3 = i < 3;
              
              return (
                <motion.div
                  key={leader.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`card p-4 flex flex-col xs:flex-row sm:flex-row items-start sm:items-center gap-3 sm:gap-4 hover:border-blue-500/30 transition-all ${
                    isTop3 ? 'bg-gradient-to-r from-yellow-500/5 to-transparent border-yellow-500/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    {/* Rank */}
                    <div className="w-8 flex items-center justify-center flex-shrink-0">
                      {i < 3 ? RANK_ICONS[i] : (
                        <span className="text-sm font-bold text-[var(--text-secondary)]">#{i + 1}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {leader.name?.[0]?.toUpperCase() || '?'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 sm:hidden">
                      <p className="font-semibold text-sm text-[var(--text)] truncate">
                        {leader.name || 'Anonymous'}
                      </p>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${tierInfo.bgColor} ${tierInfo.color}`}>
                        {tierInfo.icon} {tierInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Info (desktop/tablet) */}
                  <div className="hidden sm:block flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[var(--text)] truncate">
                      {leader.name || 'Anonymous'}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tierInfo.bgColor} ${tierInfo.color}`}>
                        {tierInfo.icon} {tierInfo.label}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        {tierInfo.commission}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
                      <span className="text-[9px] text-[var(--text-secondary)]">
                        Withdraw: {tierInfo.withdrawRequirement}
                      </span>
                    </div>
                    {leader.referral_code && (
                      <p className="text-[9px] font-mono text-[var(--text-secondary)] truncate">
                        Code: {leader.referral_code}
                      </p>
                    )}
                  </div>

                  {/* Earnings */}
                  <div className="w-full sm:w-auto flex sm:block items-center justify-between sm:text-right flex-shrink-0 pl-11 sm:pl-0 border-t sm:border-t-0 border-[var(--border)] pt-2 sm:pt-0 mt-1 sm:mt-0">
                    <span className="text-[9px] text-[var(--text-secondary)] sm:hidden">{tierInfo.commission} • {tierInfo.payoutTime}</span>
                    <div className="text-right">
                      <p className="font-bold text-sm text-green-500">
                        {formatPrice(leader.total_earnings || 0)}
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        {leader.sales || 0} sales
                      </p>
                      <p className="text-[8px] text-[var(--text-secondary)] hidden sm:block">
                        {tierInfo.payoutTime}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })
        }
      </div>

      {!loading && leaders.length === 0 && (
        <div className="card p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-4" />
          <p className="text-[var(--text-secondary)]">No affiliates on the leaderboard yet</p>
          <p className="text-xs text-[var(--text-secondary)]">Be the first to join!</p>
        </div>
      )}

      {!loading && leaders.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-[var(--text-secondary)]">
            🏆 Top earners in the affiliate program
          </p>
          {/* ADD: Withdrawal requirements summary */}
          <div className="mt-2 flex flex-wrap justify-center gap-2 text-[9px] text-[var(--text-secondary)]">
            <span className="px-2 py-0.5 bg-orange-500/5 rounded">🥉 Bronze: 19 orders</span>
            <span className="px-2 py-0.5 bg-gray-500/5 rounded">🥈 Silver: 10 orders</span>
            <span className="px-2 py-0.5 bg-yellow-500/5 rounded">🥇 Gold: 5 orders</span>
            <span className="px-2 py-0.5 bg-cyan-500/5 rounded">💎 Platinum: 3 orders</span>
            <span className="px-2 py-0.5 bg-purple-500/5 rounded">👑 VIP: Instant</span>
          </div>
        </div>
      )}
    </section>
  );
}