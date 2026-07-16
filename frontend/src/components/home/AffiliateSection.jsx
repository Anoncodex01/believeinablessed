'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useLang } from '@/contexts/LangContext';
import { Zap, TrendingUp, DollarSign, Share2, Award, ArrowRight, Users, Wallet, Crown } from 'lucide-react';
import { getAffiliateStats } from '@/lib/api';

export default function AffiliateSection() {
  const { t, lang } = useLang();
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    totalPaidOut: 0,
    monthlyCommissions: 0,
    topAffiliates: [],
    commissionRate: '5-10'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAffiliateStats();
  }, []);

  const fetchAffiliateStats = async () => {
    try {
      const response = await getAffiliateStats();
      const affiliateData = response.data?.data || response.data;

      setStats({
        totalAffiliates: affiliateData.totalAffiliates || 0,
        totalPaidOut: affiliateData.totalPaidOut || 0,
        monthlyCommissions: affiliateData.monthlyCommissions || 0,
        topAffiliates: affiliateData.topAffiliates || [],
        commissionRate: affiliateData.commissionRate || '5-10'
      });
    } catch (error) {
      console.error('Failed to fetch affiliate stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { 
      icon: Share2, 
      title: 'Share Products', 
      title_sw: 'Shiriki Bidhaa', 
      desc: 'Share unique links for any product', 
      desc_sw: 'Shiriki viungo vya kipekee vya bidhaa yoyote', 
      color: 'text-blue-500 bg-blue-500/10' 
    },
    { 
      icon: DollarSign, 
      title: 'Earn Commission', 
      title_sw: 'Pata Kamisheni', 
      desc: `Get ${stats.commissionRate}% commission for every sale through your link`, 
      desc_sw: `Pata asilimia ${stats.commissionRate} kwa kila mauzo kupitia kiungo chako`, 
      color: 'text-green-500 bg-green-500/10' 
    },
    { 
      icon: TrendingUp, 
      title: 'Track Analytics', 
      title_sw: 'Fuatilia Takwimu', 
      desc: 'See clicks, conversions and earnings live', 
      desc_sw: 'Ona mibonyezo, mabadiliko na mapato kwa wakati halisi', 
      color: 'text-orange-500 bg-orange-500/10' 
    },
    { 
      icon: Award, 
      title: 'Level Up', 
      title_sw: 'Panda Kiwango', 
      desc: 'Bronze → Silver → Gold → Diamond → VIP', 
      desc_sw: 'Shaba → Fedha → Dhahabu → Almasi → VIP', 
      color: 'text-purple-500 bg-purple-500/10' 
    },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('sw-TZ', { 
      style: 'currency', 
      currency: 'TZS', 
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K+`;
    return num.toString();
  };

  return (
    <section className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
          <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
              className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--brand-light)] px-3 py-1.5 text-sm font-semibold text-[var(--brand)]"
          >
              <Zap className="h-4 w-4" />
            Affiliate Program
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
              className="mb-4 text-3xl font-bold leading-tight text-[var(--text)] sm:text-4xl md:text-5xl"
          >
            {t('earn_commission')}<br />
            <span className="gradient-text">Promoting Fashion</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
              className="max-w-xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg"
          >
            Join thousands of creators in Tanzania earning real money by sharing fashion links. No investment needed — just your social media presence.
          </motion.p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/affiliate">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary flex w-full items-center justify-center gap-2 sm:w-auto"
                >
                  {t('become_affiliate')} <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
              <Link href="/auth/login">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-secondary flex w-full items-center justify-center gap-2 sm:w-auto"
                >
                  Affiliate Login
                </motion.button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {features.map((f, i) => {
            const title = lang === 'sw' ? f.title_sw : f.title;
            const desc = lang === 'sw' ? f.desc_sw : f.desc;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4 transition hover:border-[var(--brand)]"
              >
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${f.color}`}>
                    <f.icon className="h-5 w-5" />
                </div>
                  <h3 className="mb-1 font-semibold text-[var(--text)]">{title}</h3>
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">{desc}</p>
              </motion.div>
            );
          })}
          </div>
        </div>

        <div className="grid grid-cols-1 border-t border-[var(--border)] sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="border-b border-[var(--border)] p-5 text-center sm:border-b-0 sm:border-r"
          >
            <div>
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-300">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-3xl font-bold text-[var(--brand)] sm:text-4xl">
                {loading ? '...' : formatNumber(stats.totalAffiliates)}
              </p>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-medium">
                {lang === 'sw' ? 'Washirika' : 'Total Affiliates'}
              </p>
              {!loading && stats.totalAffiliates > 0 && (
                <p className="text-[10px] text-[var(--text-secondary)] mt-2">
                  Active affiliates earning daily
                </p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="border-b border-[var(--border)] p-5 text-center sm:border-b-0 sm:border-r"
          >
            <div>
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                <Wallet className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 sm:text-3xl">
                {loading ? '...' : formatCurrency(stats.totalPaidOut)}
              </p>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-medium">
                {lang === 'sw' ? 'Jumla Iliyolipwa' : 'Total Paid Out'}
              </p>
              {!loading && stats.monthlyCommissions > 0 && (
                <p className="text-[10px] text-green-500 mt-2">
                  +{formatCurrency(stats.monthlyCommissions)} this month
                </p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="p-5 text-center"
          >
            <div>
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300">
                <Crown className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-orange-600 sm:text-3xl">
                {stats.commissionRate}%
              </p>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-medium">
                {lang === 'sw' ? 'Kiwango cha Kamisheni' : 'Commission Rate'}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-2">
                Up to 15% for VIP affiliates
              </p>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
