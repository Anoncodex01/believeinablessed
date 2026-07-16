// app/admin/layout.jsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { useLang } from '@/contexts/LangContext';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from '@/components/admin/NotificationBell';
import {
  LayoutDashboard, ShoppingBag, Package, Users, Award, DollarSign,
  Tag, Zap, Image, Settings, LogOut, Menu, X, Sun, Moon, Trophy, Star, Bell
} from 'lucide-react';

const NAV = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/categories', icon: Tag, label: 'Categories' },
  { href: '/admin/reviews', icon: Star, label: 'Reviews' },
  { href: '/admin/affiliates', icon: Award, label: 'Affiliates' },
  { href: '/admin/withdrawals', icon: DollarSign, label: 'Withdrawals' },
  { href: '/admin/flash-sales', icon: Zap, label: 'Flash Sales' },
  { href: '/admin/slides', icon: Image, label: 'Slides' },
  { href: '/admin/coupons', icon: Tag, label: 'Coupons' },
  { href: '/admin/competitions', icon: Trophy, label: 'Competitions' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
  { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
];

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    if (!loading && user && user.role !== 'admin') router.push('/');
  }, [user, loading]);

  if (loading || !user) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-card)] border-r border-[var(--border)] flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <div>
              <p className="font-display font-bold text-sm text-[var(--text)]">BelieveinaBlessed</p>
              <p className="text-xs text-brand-500">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                className={`admin-nav-item ${active ? 'active' : ''}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)] space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">A</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--text)] truncate">Admin</p>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2 px-3">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex-1 flex items-center justify-center gap-1 p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs transition-colors">
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button onClick={() => { logout(); router.push('/'); }}
              className="flex-1 flex items-center justify-center gap-1 p-2 rounded-lg hover:bg-red-500/10 text-red-400 text-xs transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
          <Link href="/" className="flex items-center justify-center text-xs text-[var(--text-secondary)] hover:text-brand-500 py-1 transition-colors">
            ← Back to Store
          </Link>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[var(--bg-card)]/95 backdrop-blur-lg border-b border-[var(--border)] px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-[var(--text)]">
              {NAV.find(n => pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href)))?.label || 'Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="text-xs text-[var(--text-secondary)] hidden sm:block">Admin Portal</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}