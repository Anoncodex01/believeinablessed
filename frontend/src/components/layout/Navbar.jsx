'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, ChevronDown, Menu, Moon, Search, ShoppingBag, Sun, User, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLang } from '@/contexts/LangContext';
import { productCategories, productCategoryHref } from '@/lib/productCategories';

const categoryVisuals = {
  Trousers: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop&auto=format',
  'T-Shirts': 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=400&h=500&fit=crop&auto=format',
  'Full trucks': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop&auto=format',
  Vests: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop&auto=format',
  Shorts: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=500&fit=crop&auto=format',
  Socks: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&h=500&fit=crop&auto=format',
  Hoodie: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop&auto=format',
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { t } = useLang();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(true);
  const [desktopProductsOpen, setDesktopProductsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === '/';
  const overHero = isHome && !scrolled;

  const accountHref = user?.role === 'admin'
    ? '/admin'
    : user?.role === 'affiliate'
    ? '/affiliate/dashboard'
    : user?.role === 'affiliate_pending'
    ? '/affiliate/dashboard'
    : '/orders';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navigateTo = (href) => {
    setMenuOpen(false);
    setSearchOpen(false);
    setDesktopProductsOpen(false);
    router.push(href);
  };

  const handleNavClick = (event, href) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    navigateTo(href);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    if (value) navigateTo(`/products?search=${encodeURIComponent(value)}`);
  };

  const linkActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navLinkClass = (href) =>
    `text-[13px] font-medium tracking-tight transition ${
      overHero
        ? linkActive(href)
          ? 'text-white'
          : 'text-white/75 hover:text-white'
        : linkActive(href)
        ? 'text-[var(--text)]'
        : 'text-[var(--text-secondary)] hover:text-neutral-950'
    }`;

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-[90] transition-all duration-300 ${
          overHero
            ? 'border-b border-white/10 bg-black/25 backdrop-blur-md'
            : 'border-b border-[var(--border)] bg-[var(--bg)] shadow-[0_1px_0_rgba(0,0,0,0.04)]'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8 lg:h-[72px] lg:px-12">
          <Link
            href="/"
            onClick={(event) => handleNavClick(event, '/')}
            className="relative z-10 flex shrink-0 items-center"
            aria-label="Believe in a Blessed home"
          >
            <Image
              src="/logo.png"
              alt="Believe in a Blessed"
              width={170}
              height={72}
              priority
              className={`h-11 w-auto object-contain sm:h-12 ${
                overHero ? 'brightness-0 invert' : 'dark:brightness-0 dark:invert'
              }`}
            />
          </Link>

          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 lg:flex">
            <Link
              href="/"
              onClick={(event) => handleNavClick(event, '/')}
              className={navLinkClass('/')}
            >
              Home
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setDesktopProductsOpen(true)}
              onMouseLeave={() => setDesktopProductsOpen(false)}
            >
              <button
                type="button"
                onClick={() => setDesktopProductsOpen((open) => !open)}
                className={`inline-flex items-center gap-1.5 text-[13px] font-medium tracking-tight transition ${
                  overHero
                    ? desktopProductsOpen || pathname.startsWith('/products')
                      ? 'text-white'
                      : 'text-white/75 hover:text-white'
                    : desktopProductsOpen || pathname.startsWith('/products')
                    ? 'text-neutral-950'
                    : 'text-[var(--text-secondary)] hover:text-neutral-950'
                }`}
                aria-expanded={desktopProductsOpen}
              >
                All Products
                <ChevronDown className={`h-3.5 w-3.5 transition ${desktopProductsOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {desktopProductsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6, pointerEvents: 'none' }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-1/2 top-full z-[100] mt-5 w-[540px] -translate-x-1/2 border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-2xl shadow-black/15"
                  >
                    <div className="mb-4 flex items-end justify-between gap-4 border-b border-[var(--border)] px-1 pb-4">
                      <div>
                        <p className="font-display text-lg font-semibold tracking-tight text-[var(--text)]">
                          Shop by category
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          Browse the full BelieveinaBlessed edit
                        </p>
                      </div>
                      <Link
                        href="/products"
                        onClick={(event) => handleNavClick(event, '/products')}
                        className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold tracking-tight text-neutral-950 transition hover:opacity-70"
                      >
                        View all <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {productCategories.map((label) => {
                        const href = productCategoryHref(label);
                        const image = categoryVisuals[label];

                        return (
                          <Link
                            key={label}
                            href={href}
                            onClick={(event) => handleNavClick(event, href)}
                            className="group flex items-center gap-3 p-2 transition hover:bg-[var(--bg-secondary)]"
                          >
                            <span className="relative h-12 w-10 shrink-0 overflow-hidden bg-[var(--bg-secondary)]">
                              {image && (
                                <Image
                                  src={image}
                                  alt={label}
                                  fill
                                  className="object-cover transition duration-500 group-hover:scale-105"
                                  sizes="40px"
                                />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-display text-sm font-semibold tracking-tight text-[var(--text)]">
                                {label}
                              </span>
                              <span className="mt-0.5 block text-[11px] text-[var(--text-secondary)]">
                                Shop now
                              </span>
                            </span>
                            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)] opacity-0 transition group-hover:opacity-100" />
                          </Link>
                        );
                      })}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-3">
                      <Link
                        href="/products?trending=true"
                        onClick={(event) => handleNavClick(event, '/products?trending=true')}
                        className="border border-[var(--border)] px-3 py-2.5 text-center text-xs font-semibold tracking-tight text-[var(--text)] transition hover:border-neutral-950 hover:text-neutral-950"
                      >
                        Trending
                      </Link>
                      <Link
                        href="/affiliate"
                        onClick={(event) => handleNavClick(event, '/affiliate')}
                        className="bg-neutral-950 px-3 py-2.5 text-center text-xs font-semibold tracking-tight text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                      >
                        Become Affiliate
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/about"
              onClick={(event) => handleNavClick(event, '/about')}
              className={navLinkClass('/about')}
            >
              About
            </Link>

            <Link
              href="/contact"
              onClick={(event) => handleNavClick(event, '/contact')}
              className={navLinkClass('/contact')}
            >
              Contact Us
            </Link>
          </div>

          <div
            className={`relative z-10 flex items-center gap-0.5 sm:gap-1 ${
              overHero ? 'text-white' : 'text-[var(--text)]'
            }`}
          >
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={`hidden h-10 w-10 items-center justify-center transition sm:flex ${
                overHero ? 'hover:bg-white/10' : 'hover:bg-[var(--bg-secondary)]'
              }`}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`hidden h-10 w-10 items-center justify-center transition sm:flex ${
                overHero ? 'hover:bg-white/10' : 'hover:bg-[var(--bg-secondary)]'
              }`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {user ? (
              <Link
                href={accountHref}
                onClick={(event) => handleNavClick(event, accountHref)}
                className={`hidden h-10 w-10 items-center justify-center transition sm:flex ${
                  overHero ? 'hover:bg-white/10' : 'hover:bg-[var(--bg-secondary)]'
                }`}
                aria-label="My account"
              >
                <User className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/auth/login"
                onClick={(event) => handleNavClick(event, '/auth/login')}
                className={`hidden h-10 w-10 items-center justify-center transition sm:flex ${
                  overHero ? 'hover:bg-white/10' : 'hover:bg-[var(--bg-secondary)]'
                }`}
                aria-label={t('login')}
              >
                <User className="h-4 w-4" />
              </Link>
            )}

            <Link
              href="/cart"
              onClick={(event) => handleNavClick(event, '/cart')}
              className={`relative flex h-10 items-center gap-2 px-2.5 transition sm:px-3 ${
                overHero ? 'hover:bg-white/10' : 'hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <ShoppingBag className="h-4 w-4 sm:hidden" />
              <span className="hidden text-[13px] font-medium sm:inline">Cart</span>
              <span
                className={`flex h-5 min-w-5 items-center justify-center px-1.5 text-[11px] font-semibold ${
                  overHero
                    ? 'bg-white text-neutral-950'
                    : 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                }`}
              >
                {count > 9 ? '9+' : count}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={`flex h-10 items-center gap-2 px-2.5 transition lg:hidden ${
                overHero ? 'hover:bg-white/10' : 'hover:bg-[var(--bg-secondary)]'
              }`}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: 'none' }}
            className="fixed inset-0 z-[100] bg-[var(--bg)]/96 p-4 backdrop-blur-xl"
          >
            <div className="mx-auto mt-20 max-w-2xl">
              <div className="mb-5 flex items-center justify-between">
                <p className="font-display text-2xl font-semibold tracking-tight text-[var(--text)]">
                  Search the collection
                </p>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="p-2 transition hover:bg-[var(--bg-secondary)]"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={submitSearch} className="flex gap-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-12 flex-1 border border-[var(--border)] bg-[var(--bg-card)] px-5 text-sm outline-none focus:border-neutral-950"
                  placeholder="Search trousers, hoodies, tees..."
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-neutral-950 px-6 text-sm font-semibold tracking-tight text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
                >
                  Search
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: 'none' }}
            className="fixed inset-0 z-[100] bg-black/40"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="ml-auto h-full w-full max-w-sm overflow-y-auto border-l border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-8 flex items-center justify-between">
                <p className="font-display text-2xl font-semibold tracking-tight">Menu</p>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="p-2 transition hover:bg-[var(--bg-secondary)]"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href="/"
                  onClick={(event) => handleNavClick(event, '/')}
                  className="border border-[var(--border)] px-4 py-3.5 text-base font-medium tracking-tight transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-neutral-950"
                >
                  Home
                </Link>

                <div className="border border-[var(--border)] p-2">
                  <button
                    type="button"
                    onClick={() => setProductMenuOpen((open) => !open)}
                    className="flex w-full items-center justify-between px-3 py-3 text-left text-base font-medium tracking-tight transition hover:bg-[var(--bg-secondary)]"
                    aria-expanded={productMenuOpen}
                  >
                    <span>All Products</span>
                    <ChevronDown className={`h-5 w-5 transition ${productMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {productMenuOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 px-1 pb-2 pt-1">
                          <Link
                            href="/products"
                            onClick={(event) => handleNavClick(event, '/products')}
                            className="flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-[var(--bg-secondary)]"
                          >
                            View all products <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                          {productCategories.map((label) => {
                            const href = productCategoryHref(label);
                            return (
                              <Link
                                key={label}
                                href={href}
                                onClick={(event) => handleNavClick(event, href)}
                                className="flex items-center justify-between px-3 py-2.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
                              >
                                {label}
                                <ArrowUpRight className="h-3.5 w-3.5 opacity-40" />
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  href="/about"
                  onClick={(event) => handleNavClick(event, '/about')}
                  className="border border-[var(--border)] px-4 py-3.5 text-base font-medium tracking-tight transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-neutral-950"
                >
                  About
                </Link>

                <Link
                  href="/contact"
                  onClick={(event) => handleNavClick(event, '/contact')}
                  className="border border-[var(--border)] px-4 py-3.5 text-base font-medium tracking-tight transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-neutral-950"
                >
                  Contact Us
                </Link>

                {user ? (
                  <>
                    <Link
                      href={accountHref}
                      onClick={(event) => handleNavClick(event, accountHref)}
                      className="border border-[var(--border)] px-4 py-3.5 text-base font-medium tracking-tight transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-neutral-950"
                    >
                      My Account
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                        router.push('/');
                      }}
                      className="border border-[var(--border)] px-4 py-3.5 text-left text-base font-medium text-neutral-950 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={(event) => handleNavClick(event, '/auth/login')}
                    className="border border-[var(--border)] px-4 py-3.5 text-base font-medium tracking-tight transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-neutral-950"
                  >
                    Login
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
