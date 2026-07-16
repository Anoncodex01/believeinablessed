// app/affiliate/dashboard/page.jsx - Complete updated file with real-time updates
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';
import { useAffiliate } from '@/contexts/AffiliateContext';
import { useTheme } from 'next-themes';
import { getAffiliateDashboard, requestWithdrawal, getWithdrawals, getProducts, generateLink, getLeaderboard } from '@/lib/api';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  DollarSign, MousePointer, ShoppingBag, TrendingUp, Copy, Check,
  Zap, Crown, ArrowUpRight, Clock, CheckCircle, Users, Share2,
  Award, AlertCircle, Package, XCircle, Eye, Filter, Truck, RefreshCw,
  Menu, X, Sun, Moon, LogOut, Home
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Cookies from 'js-cookie';

function formatPrice(n) {
  return new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n || 0);
}

// In app/affiliate/dashboard/page.jsx - Update the withdrawal section

// Update the TIER_CONFIG at the top of the file
const TIER_CONFIG = {
  bronze: {
    icon: '🥉',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    label: 'Bronze',
    commission: '5%',
    payout: '2 Weeks',
    minOrders: 0,
    maxOrders: 19,
    withdrawRequirement: 19, // 19 orders to withdraw
    level: 1
  },
  silver: {
    icon: '🥈',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    label: 'Silver',
    commission: '6%',
    payout: '1 Week',
    minOrders: 20,
    maxOrders: 99,
    withdrawRequirement: 10, // 10 orders to withdraw
    level: 2
  },
  gold: {
    icon: '🥇',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    label: 'Gold',
    commission: '7%',
    payout: '3 Days',
    minOrders: 100,
    maxOrders: 199,
    withdrawRequirement: 5, // 5 orders to withdraw
    level: 3
  },
  platinum: {
    icon: '💎',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    label: 'Platinum',
    commission: '8%',
    payout: 'Instant',
    minOrders: 200,
    maxOrders: 300,
    withdrawRequirement: 3, // 3 orders to withdraw
    level: 4
  },
  vip: {
    icon: '👑',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    label: 'VIP',
    commission: '9-10%',
    payout: 'Instant',
    minOrders: 301,
    maxOrders: '∞',
    withdrawRequirement: 0, // 0 orders to withdraw - instant
    level: 5
  }
};

const LEVEL_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'vip'];

function getTierInfo(level) {
  return TIER_CONFIG[level] || TIER_CONFIG.bronze;
}

function getTierByOrderCount(orderCount) {
  if (orderCount <= 19) return 'bronze';
  if (orderCount <= 99) return 'silver';
  if (orderCount <= 199) return 'gold';
  if (orderCount <= 300) return 'platinum';
  return 'vip';
}

function getNextTier(currentLevel) {
  const idx = LEVEL_ORDER.indexOf(currentLevel);
  if (idx < LEVEL_ORDER.length - 1) {
    return LEVEL_ORDER[idx + 1];
  }
  return null;
}

// Function to calculate tier-based earnings breakdown - only for delivered/confirmed orders
function getTierEarningsBreakdown(orders) {
  const breakdown = {
    bronze: { count: 0, earnings: 0, orders: [] },
    silver: { count: 0, earnings: 0, orders: [] },
    gold: { count: 0, earnings: 0, orders: [] },
    platinum: { count: 0, earnings: 0, orders: [] },
    vip: { count: 0, earnings: 0, orders: [] }
  };

  orders?.forEach(order => {
    // Only count orders that are delivered or confirmed (earned commission)
    const isEarned = order.status === 'confirmed' || order.status === 'delivered';

    if (isEarned && order.tier_at_time) {
      const tier = order.tier_at_time.toLowerCase();
      if (breakdown[tier]) {
        breakdown[tier].count++;
        breakdown[tier].earnings += order.commission || 0;
        breakdown[tier].orders.push(order);
      }
    }
  });

  return breakdown;
}

// Always prefer the real browser origin for share links - this way, even if
// NEXT_PUBLIC_SITE_URL is ever misconfigured (e.g. pointed at the backend),
// affiliates never share a broken/wrong-domain link.
const SITE_URL = typeof window !== 'undefined' && window.location?.origin
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.believeinablessed.com');

export default function AffiliateDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const { t } = useLang();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { refCode, setRefCode, clearRef, addRefToUrl } = useAffiliate();

  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [products, setProducts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('mpesa');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [links, setLinks] = useState({});
  const [copied, setCopied] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
    if (!authLoading && user && !['affiliate', 'affiliate_pending', 'admin'].includes(user.role)) router.push('/');
  }, [user, authLoading]);

  // Load data function - can be called manually or on interval
  const loadData = useCallback(async (showLoading = true) => {
    if (!user) return;

    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [dashboardRes, withdrawalsRes, productsRes, leaderboardRes] = await Promise.all([
        getAffiliateDashboard(),
        getWithdrawals(),
        getProducts({ limit: 20 }),
        getLeaderboard(10),
      ]);

      setData(dashboardRes.data);
      setWithdrawals(withdrawalsRes.data.withdrawals || []);
      setProducts(productsRes.data.products || []);
      setLeaderboard(leaderboardRes.data.leaderboard || []);
      setLastUpdated(new Date());

      // Log for debugging
      const orders = dashboardRes.data?.orders || [];
      const delivered = orders.filter(o => o.status === 'delivered').length;
      const pending = orders.filter(o => o.status === 'pending').length;
      const cancelled = orders.filter(o => o.status === 'cancelled').length;
      console.log(`📊 Dashboard updated: ${delivered} delivered, ${pending} pending, ${cancelled} cancelled`);

    } catch (error) {
      console.error('Error loading affiliate data:', error);
      if (!showLoading) {
        toast.error('Failed to refresh data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    if (!user) return;
    loadData(true);
  }, [user, loadData]);

  // Set up real-time refresh every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing affiliate dashboard...');
      loadData(false);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user, loadData]);

  // Manual refresh
  const handleRefresh = () => {
    loadData(false);
    toast.success('Refreshing dashboard...');
  };

  const handleGenerateLink = async (productId) => {
    try {
      const { data: res } = await generateLink(productId);
      setLinks(prev => ({ ...prev, [productId]: res.link }));
    } catch { toast.error('Failed to generate link'); }
  };

  const handleCopy = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success(t('copied'));
    setTimeout(() => setCopied(''), 2000);
  };

  const handleWithdraw = async () => {
    if (!isApprovedAffiliate) {
      return toast.error('Your affiliate account must be approved before withdrawals.');
    }

    const amt = Number(withdrawAmount);
    if (!amt || amt < 1000) return toast.error('Minimum withdrawal is TZS 1,000');
    if (!withdrawAccount) return toast.error('Enter your M-Pesa number');

    const totalOrders = stats?.total_orders || 0;
    const currentTier = getTierByOrderCount(totalOrders);
    const tierInfo = getTierInfo(currentTier);

    if (totalOrders < tierInfo.withdrawRequirement) {
      return toast.error(`You need ${tierInfo.withdrawRequirement} confirmed orders to withdraw. You currently have ${totalOrders}.`);
    }

    try {
      await requestWithdrawal({ amount: amt, method: withdrawMethod, account_details: withdrawAccount });
      toast.success('Withdrawal request submitted!');
      setWithdrawAmount('');
      setWithdrawAccount('');
      // Refresh data after withdrawal
      loadData(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed');
    }
  };

  const generateFullLink = (path) => {
    return `${SITE_URL}${path}${path.includes('?') ? '&' : '?'}ref=${stats.referral_code || ''}`;
  };

  const shareOnWhatsApp = (url, message) => {
    const fullMessage = `${message} ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank');
  };

  const shareOnTikTok = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied! Paste it in your TikTok video description or bio.');
  };

  const copyToClipboard = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(''), 2000);
  };

  if (authLoading || loading) return (
    <main className="min-h-screen bg-[#f5f4f1] p-4 dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl rounded-[28px] border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-neutral-950 dark:bg-white" />
          <div>
            <div className="h-4 w-36 rounded bg-neutral-200 dark:bg-white/10" />
            <div className="mt-2 h-3 w-24 rounded bg-neutral-100 dark:bg-white/5" />
          </div>
        </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 shimmer-bg rounded-2xl" />)}
      </div>
      </div>
    </main>
  );

  const stats = data?.stats || {};
  const isApprovedAffiliate = data?.is_approved !== false;
  const chartData = data?.chart_data || [];
  const orders = data?.orders || [];

  // Calculate order counts based on actual order data
  const deliveredOrders = orders.filter(o => o.status === 'delivered' || o.status === 'confirmed');
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  const totalOrders = deliveredOrders.length; // Only delivered/confirmed count for tier

  const currentTier = getTierByOrderCount(totalOrders);
  const currentTierInfo = getTierInfo(currentTier);
  const nextTier = getNextTier(currentTier);

  let progressToNext = 100;
  let ordersToNext = 0;
  let nextTierInfo = null;

  if (nextTier) {
    const nextTierData = getTierInfo(nextTier);
    nextTierInfo = nextTierData;
    const currentMin = currentTierInfo.minOrders;
    const nextMin = nextTierData.minOrders;
    const range = nextMin - currentMin;
    const achieved = totalOrders - currentMin;
    progressToNext = Math.min(100, Math.max(0, (achieved / range) * 100));
    ordersToNext = Math.max(0, nextMin - totalOrders);
  }

  const isEligibleForWithdraw = totalOrders >= currentTierInfo.withdrawRequirement;
  const tierBreakdown = getTierEarningsBreakdown(orders);

  // Filter orders by status
  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'all') return true;
    if (orderFilter === 'delivered') return order.status === 'delivered' || order.status === 'confirmed';
    if (orderFilter === 'pending') return order.status === 'pending';
    if (orderFilter === 'cancelled') return order.status === 'cancelled';
    return order.status === orderFilter;
  });

  // Calculate earnings from delivered orders only
  const earningsFromDelivered = deliveredOrders.reduce((sum, o) => sum + (o.commission || 0), 0);
  const pendingEarnings = pendingOrders.reduce((sum, o) => sum + (o.commission || 0), 0);

  const statCards = [
    { label: 'Total Earnings', val: formatPrice(stats.total_earnings || earningsFromDelivered), icon: DollarSign, color: 'text-green-500 bg-green-500/10' },
    { label: 'Pending Earnings', val: formatPrice(stats.pending_earnings || pendingEarnings), icon: Clock, color: 'text-yellow-500 bg-yellow-500/10' },
    { label: 'Withdrawable', val: formatPrice(stats.withdrawable_balance || 0), icon: ArrowUpRight, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Total Clicks', val: stats.total_clicks || 0, icon: MousePointer, color: 'text-purple-500 bg-purple-500/10' },
    { label: 'Delivered Orders', val: deliveredOrders.length || 0, icon: Truck, color: 'text-green-500 bg-green-500/10' },
    { label: 'Pending Orders', val: pendingOrders.length || 0, icon: Clock, color: 'text-yellow-500 bg-yellow-500/10' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp, note: 'Performance' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Crown, note: 'Top sellers' },
    { id: 'links', label: t('my_links'), icon: Zap, note: 'Products' },
    { id: 'earnings', label: 'Earnings', icon: DollarSign, note: 'Commissions' },
    { id: 'withdraw', label: t('withdraw'), icon: ArrowUpRight, note: 'Payouts' },
    { id: 'share', label: 'Share', icon: Share2, note: 'Promotion' },
  ];

  const registrationLink = generateFullLink('/auth/register');
  const productReferralLink = generateFullLink('/products');
  const homeLink = generateFullLink('/');
  const activeTab = tabs.find(item => item.id === tab) || tabs[0];
  const ActiveTabIcon = activeTab.icon;
  const affiliateInitial = (user?.name || 'A').charAt(0).toUpperCase();

  // Status badge for orders
  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { color: 'bg-yellow-500/10 text-yellow-500', icon: <Clock className="w-3 h-3" />, label: 'Pending Delivery' },
      'confirmed': { color: 'bg-blue-500/10 text-blue-500', icon: <CheckCircle className="w-3 h-3" />, label: 'Confirmed' },
      'delivered': { color: 'bg-green-500/10 text-green-500', icon: <Truck className="w-3 h-3" />, label: 'Delivered ✓' },
      'cancelled': { color: 'bg-red-500/10 text-red-500', icon: <XCircle className="w-3 h-3" />, label: 'Cancelled' },
      'paid': { color: 'bg-blue-500/10 text-blue-500', icon: <DollarSign className="w-3 h-3" />, label: 'Paid' }
    };
    return statusMap[status] || statusMap.pending;
  };

  return (
    <div className="min-h-screen bg-[#f5f4f1] text-neutral-950 dark:bg-neutral-950 dark:text-white">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-black/10 bg-white shadow-2xl shadow-black/5 transition-transform duration-300 dark:border-white/10 dark:bg-neutral-950 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="border-b border-black/10 p-5 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-sm font-bold text-white dark:bg-white dark:text-neutral-950">
              B
            </div>
            <div>
              <p className="font-display text-sm font-bold text-neutral-950 dark:text-white">BelieveinaBlessed</p>
              <p className="text-xs text-neutral-500">Affiliate Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {tabs.map((tabItem) => {
            const Icon = tabItem.icon;
            const selected = tab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => {
                  setTab(tabItem.id);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                  selected
                    ? 'bg-neutral-950 text-white shadow-sm dark:bg-white dark:text-neutral-950'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 dark:hover:bg-white/10 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{tabItem.label}</span>
                  <span className={`block text-[11px] ${selected ? 'text-white/60 dark:text-black/55' : 'text-neutral-500'}`}>
                    {tabItem.note}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-black/10 p-3 dark:border-white/10">
          <div className="mb-3 rounded-2xl bg-neutral-100 p-3 dark:bg-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Referral Code</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="truncate font-mono text-sm font-bold text-neutral-950 dark:text-white">{stats.referral_code || 'Pending'}</p>
              <button
                type="button"
                onClick={() => copyToClipboard(stats.referral_code || '', 'sidebar-code')}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-neutral-950 dark:bg-neutral-950 dark:text-white"
                aria-label="Copy referral code"
              >
                {copied === 'sidebar-code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-neutral-950 to-neutral-700 text-xs font-bold text-white">
              {affiliateInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-neutral-950 dark:text-white">{user?.name || 'Affiliate'}</p>
              <p className="truncate text-[10px] text-neutral-500">{user?.email}</p>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 px-2">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center gap-1 rounded-lg p-2 text-xs text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-white/10"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              Theme
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="flex items-center justify-center gap-1 rounded-lg p-2 text-xs text-red-500 transition hover:bg-red-500/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
          <Link href="/" className="mt-2 flex items-center justify-center gap-1 py-1 text-xs text-neutral-500 transition hover:text-neutral-950 dark:hover:text-white">
            <Home className="h-3.5 w-3.5" />
            Back to Store
          </Link>
        </div>
      </aside>

      {sidebarOpen && <button type="button" aria-label="Close menu" className="fixed inset-0 z-40 bg-black/45 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="min-h-screen lg:ml-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-black/10 bg-white/90 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/90 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 transition hover:bg-neutral-100 dark:hover:bg-white/10 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-white/10 sm:flex">
                <ActiveTabIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Affiliate / {activeTab.label}</p>
                <h1 className="text-sm font-semibold text-neutral-950 dark:text-white sm:text-base">{activeTab.label}</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="hidden h-10 items-center gap-2 rounded-xl border border-black/10 px-3 text-sm font-medium transition hover:border-neutral-950 dark:border-white/10 dark:hover:border-white sm:flex"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Updating' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(productReferralLink, 'product')}
              className="flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-3 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-950"
            >
              {copied === 'product' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="hidden sm:inline">Share Store</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">

        <div className="mb-6 overflow-hidden rounded-[28px] bg-neutral-950 p-6 text-white dark:bg-white dark:text-neutral-950 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/55 dark:text-black/50">Affiliate Dashboard</p>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">Grow your referrals.</h2>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/70 dark:text-black/60">
                <span>{currentTierInfo.icon} {currentTierInfo.label} Affiliate</span>
                <span>•</span>
                <span>Code: <strong>{stats.referral_code || 'Pending'}</strong></span>
                {lastUpdated && <span>• Updated {lastUpdated.toLocaleTimeString()}</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(productReferralLink, 'product-hero')}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-neutral-950 dark:bg-neutral-950 dark:text-white"
              >
                {copied === 'product-hero' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Share Store
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(registrationLink, 'reg')}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white dark:border-black/20 dark:text-neutral-950"
              >
                {copied === 'reg' ? <Check className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                Recruit Affiliates
              </button>
            </div>
          </div>
        </div>

        {tab === 'overview' && (
          <>
          {!isApprovedAffiliate && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-950">Affiliate account pending approval</h3>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    You can explore the dashboard, copy your referral code, and prepare links now. Commissions, click tracking, and withdrawals activate after admin approval.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-white/70 px-4 py-3 text-center dark:bg-white/10">
                <p className="text-xs text-neutral-500">Referral code</p>
                <p className="font-mono text-lg font-bold text-neutral-950 dark:text-white">{stats.referral_code || 'Pending'}</p>
              </div>
            </div>
          </div>
          )}

        {/* Tier card + withdraw notice merged */}
        <div className="rounded-3xl border border-black/10 bg-white mb-6 overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentTierInfo.icon}</span>
              <div>
                <h3 className="font-bold text-neutral-950 dark:text-white">{currentTierInfo.label} Tier</h3>
                <p className="text-sm text-neutral-500">{currentTierInfo.commission} commission · {currentTierInfo.payout} payout</p>
              </div>
            </div>
            {nextTierInfo ? (
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-neutral-950 dark:text-white">{ordersToNext} to {nextTierInfo.label}</p>
                <p className="text-xs text-neutral-500">{nextTierInfo.commission} · {nextTierInfo.payout}</p>
              </div>
            ) : (
              <span className="inline-flex items-center rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">MAX LEVEL</span>
            )}
          </div>

          {nextTierInfo && (
            <div className="px-6 pb-4">
              <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
                <span>Progress to {nextTierInfo.label}</span>
                <span>{Math.round(progressToNext)}%</span>
              </div>
              <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <motion.div
                  key={totalOrders}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-neutral-950 rounded-full"
                />
              </div>
            </div>
          )}

          {!isEligibleForWithdraw && (
            <div className="mx-6 mb-5 flex items-center gap-2.5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800">Need {currentTierInfo.withdrawRequirement - totalOrders} more delivered orders to unlock withdrawals</p>
            </div>
          )}
        </div>

        {/* Performance summary — single flat card */}
        <div className="rounded-3xl border border-black/10 bg-white mb-6 overflow-hidden">
          {/* Top dark row: total earnings */}
          <div className="flex items-center justify-between px-6 py-5 bg-neutral-950 text-white">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium text-white/70">Total Earnings</p>
            </div>
            <p className="text-xl font-bold">{formatPrice(stats.total_earnings || earningsFromDelivered)}</p>
          </div>
          {/* Pending earnings */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-neutral-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-950 dark:text-white">Pending Earnings</p>
                <p className="text-xs text-amber-500">Awaiting delivery</p>
              </div>
            </div>
            <p className="text-base font-bold text-neutral-950 dark:text-white">{formatPrice(stats.pending_earnings || pendingEarnings)}</p>
          </div>
          {/* Withdrawable */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                <ArrowUpRight className="h-4 w-4 text-neutral-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-950 dark:text-white">Withdrawable</p>
                <p className="text-xs text-emerald-500">Ready to withdraw</p>
              </div>
            </div>
            <p className="text-base font-bold text-neutral-950 dark:text-white">{formatPrice(stats.withdrawable_balance || 0)}</p>
          </div>
          {/* Orders + clicks footer */}
          <div className="grid grid-cols-4 divide-x divide-black/5">
            <div className="px-4 py-4 text-center">
              <p className="text-lg font-bold text-neutral-950 dark:text-white">{stats.total_clicks || 0}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Clicks</p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-lg font-bold text-emerald-600">{deliveredOrders.length}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Delivered</p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-lg font-bold text-amber-500">{pendingOrders.length}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Pending</p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-lg font-bold text-red-500">{cancelledOrders.length}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Cancelled</p>
            </div>
          </div>
        </div>
          </>
        )}

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <h3 className="font-semibold text-neutral-950 dark:text-white mb-4">Earnings — Last 30 Days</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="affGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#171717" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v) => formatPrice(v)} labelFormatter={l => `Date: ${l}`} />
                    <Area type="monotone" dataKey="earnings" stroke="#171717" fill="url(#affGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Orders with Status */}
            {orders.length > 0 && (
              <div className="rounded-3xl border border-black/10 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-neutral-950 dark:text-white">Order History</h3>
                  <div className="flex gap-1">
                    {['all', 'pending', 'delivered', 'cancelled'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setOrderFilter(filter)}
                        className={`text-xs px-2 py-1 rounded-lg transition-all capitalize ${
                          orderFilter === filter
                            ? 'bg-neutral-950 text-white'
                            : 'bg-neutral-100 dark:bg-white/10 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-white/20'
                        }`}
                      >
                        {filter === 'all' ? 'All' : filter}
                        {filter === 'delivered' && ` (${deliveredOrders.length})`}
                        {filter === 'pending' && ` (${pendingOrders.length})`}
                        {filter === 'cancelled' && ` (${cancelledOrders.length})`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {filteredOrders.slice(0, 10).map(order => {
                    const statusBadge = getStatusBadge(order.status);
                    const tierInfo = getTierInfo(order.tier_at_time || 'bronze');
                    const isDelivered = order.status === 'delivered' || order.status === 'confirmed';
                    const isCancelled = order.status === 'cancelled';
                    const isPending = order.status === 'pending';

                    return (
                      <div key={order.id} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-neutral-950 dark:text-white">Order #{order.order_id?.slice(-8)}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color} flex items-center gap-0.5`}>
                              {statusBadge.icon} {statusBadge.label}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500">{new Date(order.created_at).toLocaleDateString()}</p>
                          <span className="text-[10px] flex items-center gap-1 text-neutral-500">
                            {tierInfo.icon} {tierInfo.label} • {order.commission_rate}% commission
                          </span>
                        </div>
                        <div className="text-right">
                          {isDelivered ? (
                            <div>
                              <p className="text-sm font-bold text-green-500">+{formatPrice(order.commission)}</p>
                              <p className="text-[10px] text-green-500">Earned ✓</p>
                            </div>
                          ) : isCancelled ? (
                            <div>
                              <p className="text-sm font-bold text-red-500">Cancelled</p>
                              <p className="text-[10px] text-red-500">No commission</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-bold text-yellow-500">Pending</p>
                              <p className="text-[10px] text-yellow-500">Awaiting delivery</p>
                            </div>
                          )}
                          <p className="text-xs text-neutral-500">{formatPrice(order.order_amount)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {filteredOrders.length === 0 && (
                  <div className="text-center py-4 text-neutral-500 text-sm">
                    No {orderFilter !== 'all' ? orderFilter : ''} orders found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
            <div className="border-b border-black/5 p-5">
              <h3 className="font-semibold text-neutral-950 dark:text-white">Affiliate Leaderboard</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Top approved affiliates ranked by earnings. Your profile will appear here after approval and sales activity.
              </p>
            </div>
            {leaderboard.length > 0 ? (
              <div className="divide-y divide-black/5">
                {leaderboard.map((affiliate, index) => (
                  <div key={affiliate.id || affiliate.referral_code || index} className="flex items-center justify-between gap-4 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500/15 text-yellow-600' :
                        index === 1 ? 'bg-slate-400/15 text-slate-600' :
                        index === 2 ? 'bg-orange-500/15 text-orange-600' :
                        'bg-neutral-100 dark:bg-white/10 text-neutral-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-neutral-950 dark:text-white">{affiliate.name || 'Affiliate'}</p>
                        <p className="text-xs text-neutral-500">
                          {affiliate.tier_icon} {affiliate.tier_badge || affiliate.affiliate_level || 'Bronze'} • {affiliate.sales || 0} sales
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-500">{formatPrice(affiliate.total_earnings || 0)}</p>
                      <p className="text-xs text-neutral-500">earned</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-neutral-500">
                No leaderboard data yet.
              </div>
            )}
          </div>
        )}

        {/* LINKS TAB */}
        {tab === 'links' && (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="rounded-[28px] border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Product Links</p>
                <h3 className="mt-2 font-display text-3xl font-semibold text-neutral-950 dark:text-white">Create share-ready affiliate links.</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
                  Pick a product, generate your unique URL, then share it directly with customers. Commission starts from your current tier rate.
                </p>
              </div>
              <div className="rounded-[28px] bg-neutral-950 p-6 text-white dark:bg-white dark:text-neutral-950">
                <p className="text-xs uppercase tracking-wide opacity-60">Current Rate</p>
                <p className="mt-3 text-4xl font-bold">{currentTierInfo.commission}</p>
                <p className="mt-2 text-sm opacity-65">{currentTierInfo.label} tier commission per successful sale.</p>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-black/10 bg-white p-10 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-white/[0.04]">
                No products available for link generation yet.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {products.map(product => {
                  const myLink = links[product.id];
                  const img = product.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=500&fit=crop';
                  const price = product.sale_price || product.price;
                  const commissionRate = currentTierInfo.commission === '9-10%' ? 10 : parseInt(currentTierInfo.commission);
                  const commission = (price * commissionRate) / 100;
                  const shareableLink = myLink || `${SITE_URL}/products/${product.id}?ref=${stats.referral_code || ''}`;

                  return (
                    <article key={product.id} className="overflow-hidden rounded-[28px] border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-white/10">
                        <img src={img} alt={product.name} className="h-full w-full object-contain p-6" />
                        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-950 shadow-sm">
                          {formatPrice(price)}
                        </div>
                        <div className="absolute right-4 top-4 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
                          {formatPrice(commission)}
                        </div>
                      </div>

                      <div className="space-y-4 p-4">
                        <div>
                          <p className="truncate text-base font-semibold text-neutral-950 dark:text-white">{product.name}</p>
                          <p className="mt-1 text-sm text-green-500">
                            Earn {formatPrice(commission)} per sale
                          </p>
                        </div>

                        <div className="rounded-2xl bg-neutral-100 p-3 dark:bg-white/10">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            Your link
                          </p>
                          <div className="flex gap-2">
                            <input readOnly value={shareableLink} className="min-w-0 flex-1 bg-transparent text-xs text-neutral-500 outline-none" />
                            <button
                              type="button"
                              onClick={() => copyToClipboard(shareableLink, `copy-${product.id}`)}
                              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                              aria-label="Copy affiliate link"
                            >
                              {copied === `copy-${product.id}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {myLink ? (
                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(`Check this out: ${product.name} ${shareableLink}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-11 items-center justify-center rounded-full bg-green-500 text-sm font-semibold text-white transition hover:bg-green-600"
                            >
                              WhatsApp
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(shareableLink, `tiktok-${product.id}`)}
                              className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-700"
                            >
                              TikTok
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleGenerateLink(product.id)}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-950"
                          >
                            <Zap className="h-4 w-4" />
                            Generate Link
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* EARNINGS TAB */}
        {tab === 'earnings' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="rounded-3xl bg-neutral-950 text-white p-5 text-center">
                <p className="text-2xl font-bold text-white">{formatPrice(stats.total_earnings || earningsFromDelivered)}</p>
                <p className="text-xs text-white/70 mt-1">All-Time Earned</p>
                <p className="text-[10px] text-white/60">✓ From delivered orders</p>
              </div>
              <div className="rounded-3xl border border-black/10 bg-white p-5 text-center">
                <p className="text-2xl font-bold text-yellow-500">{formatPrice(stats.pending_earnings || pendingEarnings)}</p>
                <p className="text-xs text-neutral-500 mt-1">Pending</p>
                <p className="text-[10px] text-yellow-500">⏳ Awaiting delivery</p>
              </div>
              <div className="rounded-3xl border border-black/10 bg-white p-5 text-center">
                <p className="text-2xl font-bold text-blue-500">{formatPrice(stats.withdrawable_balance || 0)}</p>
                <p className="text-xs text-neutral-500 mt-1">Available</p>
                <p className="text-[10px] text-blue-500">💰 Ready to withdraw</p>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <h3 className="font-semibold text-neutral-950 dark:text-white mb-4">📊 Earnings by Tier</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Object.entries(tierBreakdown).map(([tier, data]) => {
                  const tierInfo = getTierInfo(tier);
                  return (
                    <div key={tier} className="text-center p-3 bg-neutral-100 dark:bg-white/10 rounded-xl">
                      <div className="text-2xl">{tierInfo.icon}</div>
                      <div className="text-xs font-semibold text-neutral-950 dark:text-white">{tierInfo.label}</div>
                      <div className="text-sm font-bold text-green-500">{formatPrice(data.earnings)}</div>
                      <div className="text-[10px] text-neutral-500">{data.count} delivered orders</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
              <div className="p-4 border-b border-black/5 flex items-center justify-between">
                <h3 className="font-semibold text-neutral-950 dark:text-white">Commission History</h3>
                <div className="flex gap-1">
                  {['all', 'delivered', 'pending', 'cancelled'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setOrderFilter(filter)}
                      className={`text-[10px] px-2 py-1 rounded-lg transition-all capitalize ${
                        orderFilter === filter
                          ? 'bg-neutral-950 text-white'
                          : 'bg-neutral-100 dark:bg-white/10 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-white/20'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              {filteredOrders.length > 0 ? (
                <div className="divide-y divide-black/5">
                  {filteredOrders.map(order => {
                    const statusBadge = getStatusBadge(order.status);
                    const tierInfo = getTierInfo(order.tier_at_time || 'bronze');
                    const isDelivered = order.status === 'delivered' || order.status === 'confirmed';
                    const isCancelled = order.status === 'cancelled';

                    return (
                      <div key={order.id} className="flex items-center justify-between p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-neutral-950 dark:text-white">Order #{order.order_id?.slice(-8)}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color} flex items-center gap-0.5`}>
                              {statusBadge.icon} {statusBadge.label}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500">{new Date(order.created_at).toLocaleDateString('sw-TZ')}</p>
                          <p className="text-xs text-neutral-500">Sale: {formatPrice(order.order_amount)}</p>
                          <span className="text-[10px] flex items-center gap-1 text-neutral-500">
                            {tierInfo.icon} {tierInfo.label} • {order.commission_rate}% commission
                          </span>
                        </div>
                        <div className="text-right">
                          {isDelivered ? (
                            <p className="font-bold text-green-500">+{formatPrice(order.commission)} ✓</p>
                          ) : isCancelled ? (
                            <p className="font-bold text-red-500">Cancelled</p>
                          ) : (
                            <p className="font-bold text-yellow-500">Pending</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-neutral-500">No earnings yet. Start sharing links!</div>
              )}
            </div>
          </div>
        )}

        {/* WITHDRAW TAB - Same as before */}
        {tab === 'withdraw' && (
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <h3 className="font-semibold text-neutral-950 dark:text-white mb-4">{t('withdraw')}</h3>

              <div className="rounded-2xl bg-neutral-50 border border-black/5 p-4 mb-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Current Tier:</span>
                  <span className={`font-semibold ${currentTierInfo.color}`}>{currentTierInfo.icon} {currentTierInfo.label}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-neutral-500">Delivered Orders:</span>
                  <span className="font-semibold">{totalOrders} / {currentTierInfo.withdrawRequirement} required</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-neutral-500">Payout Schedule:</span>
                  <span className="font-semibold">{currentTierInfo.payout}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-neutral-500">Withdrawable:</span>
                  <span className={`font-semibold ${isEligibleForWithdraw ? 'text-green-500' : 'text-yellow-500'}`}>
                    {isEligibleForWithdraw ? '✅ Eligible' : `⏳ ${currentTierInfo.withdrawRequirement - totalOrders} more orders needed`}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-neutral-950 text-white p-4 mb-4 text-sm">
                Available: <strong>{formatPrice(stats.withdrawable_balance || 0)}</strong>
              </div>

              {!isEligibleForWithdraw && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 mb-4 text-sm">
                  ⚠️ You need {currentTierInfo.withdrawRequirement} delivered orders to withdraw. You currently have {totalOrders}.
                </div>
              )}

              <div className="space-y-3">
                <input type="number" placeholder="Amount (min TZS 1,000)" value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  className="h-11 w-full rounded-full border border-black/10 bg-white px-5 text-sm outline-none transition focus:border-neutral-950 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  disabled={!isEligibleForWithdraw} />
                <select value={withdrawMethod} onChange={e => setWithdrawMethod(e.target.value)}
                  className="h-11 w-full rounded-full border border-black/10 bg-white px-5 text-sm outline-none transition focus:border-neutral-950 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  disabled={!isEligibleForWithdraw}>
                  <option value="mpesa">M-Pesa</option>
                  <option value="tigopesa">Tigo Pesa</option>
                  <option value="airtelmoney">Airtel Money</option>
                </select>
                <input placeholder="Phone number (e.g. 0712345678)" value={withdrawAccount}
                  onChange={e => setWithdrawAccount(e.target.value)}
                  className="h-11 w-full rounded-full border border-black/10 bg-white px-5 text-sm outline-none transition focus:border-neutral-950 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  disabled={!isEligibleForWithdraw} />
                <button onClick={handleWithdraw}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-950"
                  disabled={!isEligibleForWithdraw}>
                  {isEligibleForWithdraw ? 'Request Withdrawal' : `Need ${currentTierInfo.withdrawRequirement - totalOrders} More Orders`}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <h3 className="font-semibold text-neutral-950 dark:text-white mb-4">Withdrawal History</h3>
              {withdrawals.length > 0 ? (
                <div className="space-y-3">
                  {withdrawals.map(w => (
                    <div key={w.id} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-neutral-950 dark:text-white">{formatPrice(w.amount)}</p>
                        <p className="text-xs text-neutral-500">{w.method} • {new Date(w.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        w.status === 'paid' ? 'bg-green-500/10 text-green-500'
                        : w.status === 'approved' ? 'bg-blue-500/10 text-blue-500'
                        : w.status === 'rejected' ? 'bg-red-500/10 text-red-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                      }`}>{w.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-sm">No withdrawals yet</p>
              )}
            </div>
          </div>
        )}

        {/* SHARE TAB - Same as before */}
        {tab === 'share' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-black/10 bg-white p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-950">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-950 dark:text-white">Share Store</h3>
                    <p className="text-xs text-neutral-500">Share the entire store with your audience</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input readOnly value={productReferralLink}
                      className="h-11 w-full rounded-full border border-black/10 bg-white px-5 text-sm outline-none transition focus:border-neutral-950 dark:border-white/10 dark:bg-white/5 dark:text-white flex-1 py-2" />
                    <button onClick={() => copyToClipboard(productReferralLink, 'store-share')}
                      className="p-2 bg-neutral-950 text-white rounded-xl hover:bg-neutral-800 transition-colors">
                      {copied === 'store-share' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => shareOnWhatsApp(productReferralLink, 'Check out BelieveinaBlessed Fashion Store!')}
                      className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors">
                      WhatsApp
                    </button>
                    <button onClick={() => shareOnTikTok(productReferralLink)}
                      className="flex-1 py-2 bg-black hover:bg-gray-900 text-white rounded-xl text-sm font-semibold transition-colors">
                      TikTok
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-black/10 bg-white p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-950">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-950 dark:text-white">Recruit Affiliates</h3>
                    <p className="text-xs text-neutral-500">Invite others to join the affiliate program</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input readOnly value={registrationLink}
                      className="h-11 w-full rounded-full border border-black/10 bg-white px-5 text-sm outline-none transition focus:border-neutral-950 dark:border-white/10 dark:bg-white/5 dark:text-white flex-1 py-2" />
                    <button onClick={() => copyToClipboard(registrationLink, 'recruit-share')}
                      className="p-2 bg-neutral-950 text-white rounded-xl hover:bg-neutral-800 transition-colors">
                      {copied === 'recruit-share' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => shareOnWhatsApp(registrationLink, 'Join the BelieveinaBlessed Affiliate Program and earn money!')}
                      className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors">
                      WhatsApp
                    </button>
                    <button onClick={() => shareOnTikTok(registrationLink)}
                      className="flex-1 py-2 bg-black hover:bg-gray-900 text-white rounded-xl text-sm font-semibold transition-colors">
                      TikTok
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-6 text-center">
              <h3 className="font-semibold text-neutral-950 dark:text-white mb-2">Your Referral Code</h3>
              <div className="flex items-center justify-center gap-3">
                <div className="text-2xl font-mono font-bold text-neutral-950 bg-neutral-100 px-6 py-3 rounded-xl">
                  {stats.referral_code || 'N/A'}
                </div>
                <button onClick={() => copyToClipboard(stats.referral_code || '', 'code')}
                  className="p-3 bg-neutral-950 text-white rounded-xl hover:bg-neutral-800 transition-colors">
                  {copied === 'code' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-neutral-500 mt-3">
                Share this code with your audience. They can enter it at checkout or use it in the URL.
              </p>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <h3 className="font-semibold text-neutral-950 dark:text-white mb-3">Quick Share</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => shareOnWhatsApp(homeLink, 'Shop with me on BelieveinaBlessed! Use my code:')}
                  className="flex-1 min-w-[120px] py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </button>
                <button onClick={() => shareOnTikTok(homeLink)}
                  className="flex-1 min-w-[120px] py-3 bg-black hover:bg-gray-900 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 0 006.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
                  TikTok
                </button>
                <button onClick={() => copyToClipboard(homeLink, 'home')}
                  className="flex-1 min-w-[120px] py-3 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  {copied === 'home' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  Copy Link
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-3xl border border-black/10 bg-white p-5 text-center">
                <p className="text-2xl font-bold text-blue-500">{stats.total_clicks || 0}</p>
                <p className="text-xs text-neutral-500">Total Clicks</p>
              </div>
              <div className="rounded-3xl border border-black/10 bg-white p-5 text-center">
                <p className="text-2xl font-bold text-green-500">{deliveredOrders.length || 0}</p>
                <p className="text-xs text-neutral-500">Delivered Orders</p>
              </div>
              <div className="rounded-3xl border border-black/10 bg-white p-5 text-center">
                <p className="text-2xl font-bold text-orange-500">{stats.conversion_rate || 0}%</p>
                <p className="text-xs text-neutral-500">Conversion Rate</p>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
