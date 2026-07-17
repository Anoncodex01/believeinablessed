'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Search, LayoutGrid, ShoppingBag, User } from 'lucide-react';

function BottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLang();
  const { count } = useCart();
  const { user } = useAuth();

  const accountHref = user?.role === 'admin'
    ? '/admin'
    : user?.role === 'affiliate'
    ? '/affiliate/dashboard'
    : user?.role === 'affiliate_pending'
    ? '/affiliate/dashboard'
    : user
    ? '/orders'
    : '/auth/login';

  const onProducts = pathname.startsWith('/products');
  const isTrending = onProducts && searchParams.get('trending') === 'true';

  const navItems = [
    {
      href: '/',
      icon: Home,
      label: t('home'),
      isActive: pathname === '/',
    },
    {
      href: '/products?trending=true',
      icon: Search,
      label: t('search'),
      isActive: isTrending,
    },
    {
      href: '/products',
      icon: LayoutGrid,
      label: t('categories'),
      isActive: onProducts && !isTrending,
    },
    {
      href: '/cart',
      icon: ShoppingBag,
      label: t('cart'),
      badge: count,
      isActive: pathname.startsWith('/cart'),
    },
    {
      href: accountHref,
      icon: User,
      label: t('profile'),
      isActive:
        pathname.startsWith('/orders') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/affiliate'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5">
        {navItems.map(({ href, icon: Icon, label, badge, isActive }) => (
          <Link
            key={`${href}-${label}`}
            href={href}
            className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 transition ${
              isActive
                ? 'text-teal-700 dark:text-teal-300'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <span className="relative">
              <Icon className={`h-[22px] w-[22px] ${isActive ? 'stroke-[1.75]' : 'stroke-[1.5]'}`} />
              {badge > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-teal-700 px-1 text-[9px] font-bold text-white dark:bg-teal-400 dark:text-neutral-950">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </span>
            <span
              className={`max-w-full truncate text-[10px] tracking-tight ${
                isActive ? 'font-semibold' : 'font-medium'
              }`}
            >
              {label}
            </span>
            {isActive && (
              <span className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 bg-teal-700 dark:bg-teal-300" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function BottomNav() {
  return (
    <Suspense
      fallback={
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--bg-card)] md:hidden">
          <div className="h-14" />
        </nav>
      }
    >
      <BottomNavInner />
    </Suspense>
  );
}
