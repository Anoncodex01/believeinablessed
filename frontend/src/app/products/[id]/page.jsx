// app/products/[id]/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import { useLang } from '@/contexts/LangContext';
import { useCart } from '@/contexts/CartContext';
import { useAffiliate } from '@/contexts/AffiliateContext';
import { getProduct, getProducts } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/product/ProductCard';
import ReviewSection from '@/components/review/ReviewSection';
import toast from 'react-hot-toast';
import {
  ShoppingBag, ZoomIn, ChevronLeft, ChevronRight,
  Star, Truck, RotateCcw, Shield, Eye, ChevronDown, ChevronUp
} from 'lucide-react';

function formatPrice(n) {
  return new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n);
}

const colorMap = {
  red: '#EF4444', blue: '#3B82F6', green: '#22C55E', yellow: '#EAB308',
  purple: '#A855F7', pink: '#EC4899', black: '#1F2937', white: '#F9FAFB',
  gray: '#6B7280', navy: '#1E3A8A', maroon: '#BE123C', brown: '#78350F',
  orange: '#F97316', teal: '#14B8A6', cyan: '#06B6D4', indigo: '#6366F1',
  lime: '#84CC16', emerald: '#10B981', amber: '#F59E0B', violet: '#8B5CF6',
  rose: '#F43F5E', slate: '#64748B', zinc: '#71717A', neutral: '#737373',
  stone: '#78716C',
};

const getColorHex = (color) => {
  const lowerColor = color?.toLowerCase() || '';
  if (lowerColor.startsWith('#')) return lowerColor;
  if (lowerColor.startsWith('rgb')) return lowerColor;
  return colorMap[lowerColor] || '#CBD5E1';
};

export default function ProductPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { t, lang } = useLang();
  const { addItem } = useCart();
  const { refCode, addRefToUrl, trackProductClick } = useAffiliate();
  const router = useRouter();

  const ref = searchParams.get('ref') || refCode || '';

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [shippingExpanded, setShippingExpanded] = useState(false);
  const [returnsExpanded, setReturnsExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProduct(id)
      .then(({ data }) => {
        setProduct(data.product);
        if (data.product?.category_id) {
          getProducts({ category: data.product.category_id, limit: 8 })
            .then(r => setRelated((r.data.products || []).filter(p => p.id !== id)))
            .catch(() => setRelated([]));
        }
      })
      .catch(() => {
        setProduct(null);
        toast.error('Product not found');
      })
      .finally(() => setLoading(false));

    // Track product view for affiliate (URL ref or saved cookie)
    if (ref) {
      trackProductClick(id);
    }
  }, [id, ref, trackProductClick]);

  if (loading) return (
    <main className="min-h-screen bg-[var(--bg)] pt-16">
      <Navbar />
      <div className="home-shell grid gap-10 py-12 md:grid-cols-2">
        <div className="aspect-[3/4] border border-[var(--border)] shimmer-bg" />
        <div className="space-y-4 pt-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-6 shimmer-bg rounded" />)}
        </div>
      </div>
    </main>
  );

  if (!product) return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] pt-16">
      <Navbar />
      <p className="font-display text-sm tracking-[0.15em] text-[var(--text-secondary)] uppercase">
        Product not found
      </p>
    </main>
  );

  const name = lang === 'sw' && product.name_sw ? product.name_sw : product.name;
  const desc = lang === 'sw' && product.description_sw ? product.description_sw : product.description;
  const images = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&h=800&fit=crop'];
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const displayPrice = product.sale_price || product.price;

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error(lang === 'sw' ? 'Chagua saizi' : 'Please select a size');
      return;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      toast.error(lang === 'sw' ? 'Chagua rangi' : 'Please select a color');
      return;
    }
    addItem(product, qty, selectedSize, selectedColor);
    toast.success(`${name} added to cart!`);
  };

  const handleBuyNow = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error(lang === 'sw' ? 'Chagua saizi' : 'Please select a size');
      return;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      toast.error(lang === 'sw' ? 'Chagua rangi' : 'Please select a color');
      return;
    }
    addItem(product, qty, selectedSize, selectedColor);
    router.push(getAffiliateUrl('/checkout'));
  };

  const getAffiliateUrl = (path) => addRefToUrl(path);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg)] pb-24 pt-16 md:pb-0">
      <Navbar />

      <div className="home-shell py-8 sm:py-12 lg:py-14">
        <nav className="mb-8 flex items-center gap-2 text-xs tracking-[0.06em] text-[var(--text-secondary)] sm:text-sm">
          <Link href={getAffiliateUrl('/')} className="transition hover:text-neutral-950">{t('home')}</Link>
          <span>/</span>
          <Link href={getAffiliateUrl('/products')} className="transition hover:text-neutral-950">{t('all_products')}</Link>
          <span>/</span>
          <span className="max-w-[200px] truncate text-[var(--text)]">{name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(400px,0.95fr)] lg:gap-16">
          {/* Images */}
          <div className="space-y-3">
            <div
              className="group relative aspect-[3/4] cursor-zoom-in overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)]"
              onClick={() => setZoom(true)}
            >
              <Image
                src={images[selectedImage]}
                alt={name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {hasDiscount && (
                <div className="absolute left-4 top-4">
                  <span className="bg-neutral-950 px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-white uppercase">
                    -{Math.round(((product.price - product.sale_price) / product.price) * 100)}% off
                  </span>
                </div>
              )}
              <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="bg-black/50 p-2 text-white backdrop-blur-sm">
                  <ZoomIn className="h-4 w-4" />
                </div>
              </div>
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(i => Math.max(0, i - 1)); }}
                    className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/30 bg-white/90 text-neutral-950 transition hover:bg-neutral-950 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(i => Math.min(images.length - 1, i + 1)); }}
                    className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/30 bg-white/90 text-neutral-950 transition hover:bg-neutral-950 hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative h-20 w-16 flex-shrink-0 overflow-hidden border transition-all sm:h-24 sm:w-20 ${
                      selectedImage === i
                        ? 'border-neutral-950 opacity-100 dark:border-white'
                        : 'border-[var(--border)] opacity-55 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-7">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                {name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  {product.views || 0} {t('views')}
                </span>
                <span className="text-[var(--border)]">·</span>
                <span>{product.sold_count || 0} {t('sold')}</span>
                <span className="text-[var(--border)]">·</span>
                {product.stock > 0 ? (
                  <span className="font-medium text-neutral-950 dark:text-white">{t('in_stock')}</span>
                ) : (
                  <span className="font-medium text-neutral-950">{t('out_of_stock')}</span>
                )}
              </div>
            </div>

            <div className="flex items-end gap-3 border-b border-[var(--border)] pb-7">
              <span className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
                {formatPrice(displayPrice)}
              </span>
              {hasDiscount && (
                <span className="pb-1 text-base text-[var(--text-secondary)] line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(product.rating || 0)
                        ? 'fill-current text-neutral-950'
                        : 'text-[var(--border)]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-[var(--text-secondary)]">
                ({product.review_count || 0} reviews)
              </span>
            </div>

            {product.sizes?.length > 0 && (
              <div>
                <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-[var(--text-secondary)] uppercase">
                  {t('size')} — <span className="normal-case tracking-normal text-[var(--text)]">{selectedSize || 'Select'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => {
                    const isAvailable = (product.stock ?? 1) > 0;
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => { if (isAvailable) setSelectedSize(selectedSize === size ? null : size); }}
                        disabled={!isAvailable}
                        className={`min-w-12 border px-4 py-2.5 text-sm font-medium tracking-tight transition ${
                          isSelected
                            ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950'
                            : isAvailable
                            ? 'border-[var(--border)] hover:border-neutral-950 dark:hover:border-white'
                            : 'cursor-not-allowed border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] opacity-50'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.colors?.length > 0 && (
              <div>
                <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-[var(--text-secondary)] uppercase">
                  {t('color')} — <span className="normal-case tracking-normal text-[var(--text)]">{selectedColor || 'Select'}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map(color => {
                    const colorHex = getColorHex(color);
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(selectedColor === color ? null : color)}
                        className="group relative"
                        title={color}
                      >
                        <div
                          className={`h-9 w-9 transition duration-200 ${
                            isSelected
                              ? 'ring-2 ring-neutral-950 ring-offset-2 ring-offset-[var(--bg)] dark:ring-white'
                              : 'hover:scale-105'
                          }`}
                          style={{
                            backgroundColor: colorHex,
                            border: color.toLowerCase() === 'white' || colorHex === '#F9FAFB'
                              ? '1px solid var(--border)'
                              : 'none',
                          }}
                        />
                        <span className="pointer-events-none absolute -bottom-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-xs text-[var(--text)] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                          {color}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-[var(--text-secondary)] uppercase">
                {t('quantity')}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="flex h-11 w-11 items-center justify-center border border-[var(--border)] text-lg font-medium transition hover:border-neutral-950 dark:hover:border-white"
                >
                  −
                </button>
                <span className="w-10 text-center font-semibold tracking-tight text-[var(--text)]">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))}
                  className="flex h-11 w-11 items-center justify-center border border-[var(--border)] text-lg font-medium transition hover:border-neutral-950 dark:hover:border-white"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex min-h-[52px] items-center justify-center gap-2 bg-neutral-950 px-4 py-3.5 text-sm font-semibold tracking-tight text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                <ShoppingBag className="h-4 w-4" />
                {t('add_to_cart')}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="min-h-[52px] w-full border border-neutral-950 px-4 py-3.5 text-sm font-semibold tracking-tight text-neutral-950 transition hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-neutral-950"
              >
                {t('buy_now')}
              </motion.button>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-7">
              {[
                { icon: Truck, label: 'Free Delivery', sub: 'Orders 200k+' },
                { icon: RotateCcw, label: '7 Day Return', sub: 'Easy returns' },
                { icon: Shield, label: 'Authentic', sub: '100% genuine' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="border border-[var(--border)] p-3.5 text-center sm:p-4">
                  <Icon className="mx-auto mb-2 h-4 w-4 text-neutral-950 dark:text-white" />
                  <p className="text-xs font-semibold tracking-tight text-[var(--text)]">{label}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--text-secondary)]">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {desc && (
          <div className="mt-14 border-t border-[var(--border)] pt-10">
            <p className="section-kicker">Details</p>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
              {t('description')}
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-relaxed whitespace-pre-line text-[var(--text-secondary)] sm:text-base">
              {desc}
            </p>
          </div>
        )}

        <div className="mt-10 space-y-3">
          <div className="overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]">
            <button
              onClick={() => setShippingExpanded(!shippingExpanded)}
              className="flex w-full items-center justify-between px-5 py-5 text-left transition hover:bg-[var(--bg-secondary)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold tracking-tight text-[var(--text)]">
                    Shipping Information
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">7 days delivery · Local and international</p>
                </div>
              </div>
              {shippingExpanded ? <ChevronUp className="h-4 w-4 text-[var(--text-secondary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />}
            </button>
            <AnimatePresence>
              {shippingExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 border-t border-[var(--border)] px-5 pb-5 pt-5"
                >
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                    Delivery options are shown clearly before payment, with local, East Africa, and international services available.
                  </p>
                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      ['Dar es Salaam', 'Same-day delivery where available.'],
                      ['East Africa', '2–4 business days via trusted courier.'],
                      ['International', 'DHL Express or DPD, usually 3–7 business days.'],
                    ].map(([title, copy]) => (
                      <div key={title} className="border border-[var(--border)] p-4">
                        <p className="text-sm font-semibold tracking-tight text-[var(--text)]">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{copy}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]">
            <button
              onClick={() => setReturnsExpanded(!returnsExpanded)}
              className="flex w-full items-center justify-between px-5 py-5 text-left transition hover:bg-[var(--bg-secondary)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold tracking-tight text-[var(--text)]">
                    Returns & Refund Policy
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">Clear steps and refund timing</p>
                </div>
              </div>
              {returnsExpanded ? <ChevronUp className="h-4 w-4 text-[var(--text-secondary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />}
            </button>
            <AnimatePresence>
              {returnsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 border-t border-[var(--border)] px-5 pb-5 pt-5"
                >
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                    Returns within 14 days. Items must be unworn, unwashed, and returned with original tags attached.
                  </p>
                  <ul className="list-disc space-y-1.5 pl-4 text-sm text-[var(--text-secondary)]">
                    <li>Request a return through your confirmation email</li>
                    <li>Refunds processed within 5–7 business days after we receive the return</li>
                    <li>Free return shipping for eligible orders</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16 border-t border-[var(--border)] pt-12">
            <p className="section-kicker">You may also like</p>
            <h2 className="mb-8 font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              {t('related_products')}
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {related.slice(0, 5).map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} affiliateCode={ref} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 border-t border-[var(--border)] pt-12">
          <ReviewSection
            type="product"
            id={id}
            title={`Reviews for ${name}`}
            subtitle={`${product.rating || 0} average • ${product.review_count || 0} reviews`}
          />
        </div>
      </div>

      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setZoom(false)}
          >
            <div className="relative aspect-square w-full max-w-2xl">
              <Image src={images[selectedImage]} alt={name} fill className="object-contain" sizes="800px" />
            </div>
            <button className="absolute right-4 top-4 text-3xl text-white/70 hover:text-white">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
      <BottomNav />
    </main>
  );
}
