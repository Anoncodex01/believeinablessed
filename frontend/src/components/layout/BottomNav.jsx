'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '@/contexts/LangContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Search, Grid3X3, ShoppingBag, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
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

  const links = [
    { href: '/', icon: Home, label: t('home') },
    { href: '/products?search=', icon: Search, label: t('search') },
    { href: '/products', icon: Grid3X3, label: t('categories') },
    { href: '/cart', icon: ShoppingBag, label: t('cart'), badge: count },
    { href: accountHref, icon: User, label: t('profile') },
  ];

  return (
    <nav className="bottom-nav safe-bottom">
      {links.map(({ href, icon: Icon, label, badge }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href.split('?')[0]));
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-0 ${
              active ? 'text-blue-500' : 'text-[var(--text-secondary)]'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium truncate">{label}</span>
            {active && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
