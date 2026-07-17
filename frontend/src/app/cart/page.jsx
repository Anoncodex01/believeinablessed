// app/cart/page.jsx
'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import { useCart } from '@/contexts/CartContext';
import { useLang } from '@/contexts/LangContext';
import { useAffiliate } from '@/contexts/AffiliateContext'; // ✅ Import
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';

function formatPrice(n) {
  return new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n);
}

// ✅ Separate component that uses useSearchParams
function CartContent() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const { t, lang } = useLang();
  const searchParams = useSearchParams();
  const { refCode, addRefToUrl } = useAffiliate(); // ✅ Get from context

  // ✅ Get ref from URL or context/cookie
  const ref = searchParams.get('ref') || refCode || '';

  if (items.length === 0) return (
    <main className="min-h-screen bg-[var(--bg)] pt-16">
      <Navbar />
      <div className="mx-auto max-w-[900px] px-4 py-24 text-center sm:px-8">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f6f4f0] text-neutral-950">
          <ShoppingBag className="h-9 w-9" />
        </div>
        <h2 className="font-display text-4xl font-semibold text-[var(--text)]">{t('empty_cart')}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)]">Add your favourite pieces and they will appear here before checkout.</p>
        <Link href={addRefToUrl('/products')} className="mt-8 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-950">
          {t('start_shopping')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <Footer />
      <BottomNav />
    </main>
  );

  return (
    <main className="min-h-screen bg-[var(--bg)] pt-16 pb-24 md:pb-0">
      <Navbar />
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
        <div className="mb-8 rounded-[28px] bg-[#f6f4f0] px-5 py-8 sm:px-8 lg:px-10 dark:bg-white/5">
          <p className="mb-3 text-xs font-semibold uppercase text-[var(--text-secondary)]">Shopping Bag</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-5xl font-semibold leading-none text-[var(--text)]">{t('your_cart')}</h1>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{items.length} {items.length === 1 ? 'item' : 'items'} ready for checkout.</p>
            </div>
            <button onClick={clearCart} className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-neutral-950 shadow-sm transition hover:bg-neutral-950 hover:text-white dark:bg-white/10 dark:text-white">
              <Trash2 className="h-4 w-4" />
              Clear Bag
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <AnimatePresence>
              {items.map(item => {
                const name = lang === 'sw' && item.name_sw ? item.name_sw : item.name;
                const image = item.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&h=200&fit=crop';
                const price = item.sale_price || item.price;
                
                // ✅ Build product link with ref
                const productLink = addRefToUrl(`/products/${item.id}`);
                
                return (
                  <motion.div
                    key={item.cartKey}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="rounded-[22px] border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex gap-4">
                      <Link href={productLink} className="relative h-28 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-[#f7f6f4] sm:h-32 sm:w-28">
                        <Image src={image} alt={name} fill className="object-contain p-3" sizes="120px" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link href={productLink}>
                              <p className="line-clamp-2 text-base font-medium text-[var(--text)] transition hover:text-neutral-500">{name}</p>
                            </Link>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                              {item.size ? (
                                <span className="border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1">{t('size')}: {item.size}</span>
                              ) : item.sizes?.length > 0 ? (
                                <Link href={productLink} className="border border-amber-600/30 bg-amber-500/10 px-3 py-1 text-amber-700">
                                  Select size
                                </Link>
                              ) : null}
                              {item.color ? (
                                <span className="border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1">{t('color')}: {item.color}</span>
                              ) : item.colors?.length > 0 ? (
                                <Link href={productLink} className="border border-amber-600/30 bg-amber-500/10 px-3 py-1 text-amber-700">
                                  Select color
                                </Link>
                              ) : null}
                            </div>
                          </div>
                          <p className="shrink-0 text-base font-semibold text-[var(--text)]">{formatPrice(price * item.quantity)}</p>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center rounded-full border border-black/10 bg-[#f7f6f4] p-1 dark:border-white/10 dark:bg-white/5">
                            <button onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white dark:hover:bg-white/10">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white dark:hover:bg-white/10">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button onClick={() => removeItem(item.cartKey)} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-red-500 transition hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="h-fit rounded-[24px] border border-black/10 bg-white p-6 shadow-sm lg:sticky lg:top-24 dark:border-white/10 dark:bg-white/5">
            <h2 className="font-display text-2xl font-semibold text-[var(--text)]">Order Summary</h2>
            <div className="mt-5 space-y-3">
              {items.map(item => {
                const name = lang === 'sw' && item.name_sw ? item.name_sw : item.name;
                return (
                  <div key={item.cartKey} className="flex justify-between gap-4 text-sm">
                    <span className="max-w-[65%] truncate text-[var(--text-secondary)]">{name} x {item.quantity}</span>
                    <span className="font-medium text-[var(--text)]">{formatPrice((item.sale_price || item.price) * item.quantity)}</span>
                  </div>
                );
              })}
            </div>
            <div className="my-5 border-t border-black/10 dark:border-white/10" />
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                <span>{t('subtotal')}</span><span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                <span>Shipping</span><span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between pt-3 text-lg font-semibold text-[var(--text)]">
                <span>{t('total')}</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Link href={addRefToUrl('/checkout')}>
              <motion.button whileTap={{ scale: 0.97 }} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-950">
                {t('checkout')} <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>

            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#f7f6f4] p-4 text-xs text-[var(--text-secondary)] dark:bg-white/5">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              Secure checkout and WhatsApp order confirmation.
            </div>

            <Link href={addRefToUrl('/products')} className="mt-4 block text-center text-sm text-[var(--text-secondary)] transition hover:text-neutral-950 dark:hover:text-white">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
      <Footer />
      <BottomNav />
    </main>
  );
}

// ✅ Main export with Suspense boundary
export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg)] pt-16 flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    }>
      <CartContent />
    </Suspense>
  );
}
