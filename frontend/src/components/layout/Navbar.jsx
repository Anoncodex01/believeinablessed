'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, Moon, Search, ShoppingBag, Sun, User, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLang } from '@/contexts/LangContext';
import { productCategories, productCategoryHref } from '@/lib/productCategories';

export default function Navbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t } = useLang();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(true);
  const [desktopProductsOpen, setDesktopProductsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const accountHref = user?.role === 'admin'
    ? '/admin'
    : user?.role === 'affiliate'
    ? '/affiliate/dashboard'
    : user?.role === 'affiliate_pending'
    ? '/affiliate/dashboard'
    : '/orders';

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

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-[90] border-b border-black/5 bg-white/92 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/90">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-8 lg:h-[76px] lg:px-12">
          <Link
            href="/"
            onClick={(event) => handleNavClick(event, '/')}
            className="flex items-center"
            aria-label="Believe in a Blessed home"
          >
            <Image
              src="/logo.png"
              alt="Believe in a Blessed"
              width={170}
              height={72}
              priority
              className="h-12 w-auto object-contain dark:brightness-0 dark:invert sm:h-14"
            />
          </Link>

          <div className="hidden items-center gap-8 text-sm text-neutral-800 lg:flex dark:text-neutral-200">
            <Link
              href="/"
              onClick={(event) => handleNavClick(event, '/')}
              className="transition hover:text-neutral-500 dark:hover:text-neutral-400"
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
                className="inline-flex items-center gap-1.5 transition hover:text-neutral-500 dark:hover:text-neutral-400"
                aria-expanded={desktopProductsOpen}
              >
                All Products
                <ChevronDown className={`h-4 w-4 transition ${desktopProductsOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {desktopProductsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10, pointerEvents: 'none' }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-1/2 top-full z-[100] mt-5 w-[360px] -translate-x-1/2 rounded-3xl border border-black/10 bg-white p-3 shadow-2xl shadow-black/10 dark:border-white/10 dark:bg-neutral-950"
                  >
                    <div className="mb-2 px-2">
                      <p className="font-display text-xl font-semibold text-neutral-950 dark:text-white">All Products</p>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Shop by product type</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {productCategories.map((label) => {
                        const href = productCategoryHref(label);

                        return (
                          <Link
                            key={label}
                            href={href}
                            onClick={(event) => handleNavClick(event, href)}
                            className="rounded-full bg-neutral-100 px-4 py-2.5 text-center text-sm font-medium text-neutral-700 transition hover:bg-neutral-950 hover:text-white dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white dark:hover:text-neutral-950"
                          >
                            {label}
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
              className="transition hover:text-neutral-500 dark:hover:text-neutral-400"
            >
              About
            </Link>

            <Link
              href="/about#contact"
              onClick={(event) => handleNavClick(event, '/about#contact')}
              className="transition hover:text-neutral-500 dark:hover:text-neutral-400"
            >
              Contact Us
            </Link>
          </div>

          <div className="flex items-center gap-2 text-neutral-950 dark:text-white">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-10 w-10 items-center justify-center rounded-full transition hover:bg-neutral-100 sm:flex dark:hover:bg-white/10"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="hidden h-10 w-10 items-center justify-center rounded-full transition hover:bg-neutral-100 sm:flex dark:hover:bg-white/10"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {user ? (
              <Link
                href={accountHref}
                onClick={(event) => handleNavClick(event, accountHref)}
                className="hidden h-10 w-10 items-center justify-center rounded-full transition hover:bg-neutral-100 sm:flex dark:hover:bg-white/10"
                aria-label="My account"
              >
                <User className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/auth/login"
                onClick={(event) => handleNavClick(event, '/auth/login')}
                className="hidden h-10 w-10 items-center justify-center rounded-full transition hover:bg-neutral-100 sm:flex dark:hover:bg-white/10"
                aria-label={t('login')}
              >
                <User className="h-4 w-4" />
              </Link>
            )}

            <Link href="/cart" onClick={(event) => handleNavClick(event, '/cart')} className="relative flex h-10 items-center gap-2 rounded-full px-3 transition hover:bg-neutral-100 dark:hover:bg-white/10">
              <span className="hidden text-sm sm:inline">Cart</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white dark:bg-white dark:text-neutral-950">
                {count > 9 ? '9+' : count}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-10 items-center gap-2 rounded-full px-3 transition hover:bg-neutral-100 dark:hover:bg-white/10"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
              <span className="hidden text-sm sm:inline">Menu</span>
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
            className="fixed inset-0 z-[70] bg-white/95 p-4 backdrop-blur-xl dark:bg-neutral-950/95"
          >
            <div className="mx-auto mt-20 max-w-2xl">
              <div className="mb-5 flex items-center justify-between">
                <p className="font-display text-2xl text-neutral-950 dark:text-white">Search the collection</p>
                <button type="button" onClick={() => setSearchOpen(false)} className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-white/10" aria-label="Close search">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={submitSearch} className="flex gap-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-12 flex-1 rounded-full border border-neutral-200 bg-white px-5 text-sm outline-none focus:border-neutral-950 dark:border-white/15 dark:bg-white/5 dark:text-white"
                  placeholder="Search dresses, shirts, denim..."
                  autoFocus
                />
                <button type="submit" className="rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white dark:bg-white dark:text-neutral-950">
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
            className="fixed inset-0 z-[60] bg-black/35"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="ml-auto h-full w-full max-w-sm bg-white p-6 shadow-2xl dark:bg-neutral-950"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-10 flex items-center justify-between">
                <p className="font-display text-2xl font-semibold">Menu</p>
                <button type="button" onClick={() => setMenuOpen(false)} className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-white/10" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  href="/"
                  onClick={(event) => handleNavClick(event, '/')}
                  className="rounded-2xl border border-neutral-100 px-4 py-4 text-lg font-medium text-neutral-950 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white dark:border-white/10 dark:text-white dark:hover:bg-white dark:hover:text-neutral-950"
                >
                  Home
                </Link>

                <div className="rounded-2xl border border-neutral-100 p-2 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setProductMenuOpen((open) => !open)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-lg font-medium text-neutral-950 transition hover:bg-neutral-100 dark:text-white dark:hover:bg-white/10"
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
                        <div className="grid grid-cols-2 gap-2 px-2 pb-2 pt-1">
                          {productCategories.map((label) => {
                            const href = productCategoryHref(label);

                            return (
                              <Link
                                key={label}
                                href={href}
                                onClick={(event) => handleNavClick(event, href)}
                                className="rounded-full bg-neutral-100 px-4 py-2.5 text-center text-sm font-medium text-neutral-700 transition hover:bg-neutral-950 hover:text-white dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white dark:hover:text-neutral-950"
                              >
                                {label}
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
                  className="rounded-2xl border border-neutral-100 px-4 py-4 text-lg font-medium text-neutral-950 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white dark:border-white/10 dark:text-white dark:hover:bg-white dark:hover:text-neutral-950"
                >
                  About
                </Link>

                <Link
                  href="/about#contact"
                  onClick={(event) => handleNavClick(event, '/about#contact')}
                  className="rounded-2xl border border-neutral-100 px-4 py-4 text-lg font-medium text-neutral-950 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white dark:border-white/10 dark:text-white dark:hover:bg-white dark:hover:text-neutral-950"
                >
                  Contact Us
                </Link>

                {user ? (
                  <>
                    <Link
                      href={accountHref}
                      onClick={(event) => handleNavClick(event, accountHref)}
                      className="rounded-2xl border border-neutral-100 px-4 py-4 text-lg font-medium text-neutral-950 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white dark:border-white/10 dark:text-white dark:hover:bg-white dark:hover:text-neutral-950"
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
                      className="rounded-2xl border border-neutral-100 px-4 py-4 text-left text-lg font-medium text-red-500 transition hover:border-red-500 hover:bg-red-500 hover:text-white dark:border-white/10"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={(event) => handleNavClick(event, '/auth/login')}
                    className="rounded-2xl border border-neutral-100 px-4 py-4 text-lg font-medium text-neutral-950 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white dark:border-white/10 dark:text-white dark:hover:bg-white dark:hover:text-neutral-950"
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
