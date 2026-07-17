// app/admin/layout.jsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import NotificationBell from '@/components/admin/NotificationBell';
import {
  LayoutDashboard, ShoppingBag, Package, Users, Award, DollarSign,
  Tag, Zap, Image, Settings, LogOut, Menu, X, Sun, Moon, Trophy, Star, Bell, Home,
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
  }, [user, loading, router]);

  const activeNav = NAV.find(n => pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href)));
  const ActiveIcon = activeNav?.icon || LayoutDashboard;

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-8 w-8 animate-spin border-2 border-neutral-950 border-t-transparent dark:border-white dark:border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--border)] bg-[var(--bg-card)] transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-neutral-950 text-sm font-bold text-white dark:bg-white dark:text-neutral-950">
              B
            </div>
            <div>
              <p className="font-display text-sm font-semibold tracking-tight text-[var(--text)]">BelieveinaBlessed</p>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-teal-700 uppercase">Admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text)] lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`admin-nav-item ${active ? 'active' : ''}`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border)] p-3">
          <div className="mb-2 flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center bg-teal-700/15 text-xs font-bold text-teal-700">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[var(--text)]">Admin</p>
              <p className="truncate text-[10px] text-[var(--text-secondary)]">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center gap-1 p-2 text-xs text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              Theme
            </button>
            <button
              type="button"
              onClick={() => { logout(); router.push('/'); }}
              className="flex items-center justify-center gap-1 p-2 text-xs text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
          <Link
            href="/"
            className="mt-2 flex items-center justify-center gap-1 py-1 text-xs text-[var(--text-secondary)] transition hover:text-[var(--text)]"
          >
            <Home className="h-3.5 w-3.5" />
            Back to Store
          </Link>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="min-h-screen lg:ml-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-card)] px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 transition hover:bg-[var(--bg-secondary)] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="hidden h-10 w-10 items-center justify-center bg-[var(--bg-secondary)] sm:flex">
                <ActiveIcon className="h-5 w-5 text-[var(--text)]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--text-secondary)] uppercase">Admin</p>
                <h1 className="font-display text-sm font-semibold tracking-tight text-[var(--text)] sm:text-base">
                  {activeNav?.label || 'Admin'}
                </h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="hidden text-xs font-medium text-[var(--text-secondary)] sm:block">Admin Portal</span>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
