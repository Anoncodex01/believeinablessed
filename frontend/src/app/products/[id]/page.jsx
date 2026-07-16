// app/products/[id]/page.jsx - Full updated file with affiliate tracking
'use client';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import { useLang } from '@/contexts/LangContext';
import { useCart } from '@/contexts/CartContext';
import { useAffiliate } from '@/contexts/AffiliateContext'; // ✅ Import affiliate context
import { getProduct, trackClick, getProducts } from '@/lib/api';
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

// Color mapping for common color names to hex codes
const colorMap = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#EAB308',
  purple: '#A855F7',
  pink: '#EC4899',
  black: '#1F2937',
  white: '#F9FAFB',
  gray: '#6B7280',
  navy: '#1E3A8A',
  maroon: '#BE123C',
  brown: '#78350F',
  orange: '#F97316',
  teal: '#14B8A6',
  cyan: '#06B6D4',
  indigo: '#6366F1',
  lime: '#84CC16',
  emerald: '#10B981',
  amber: '#F59E0B',
  violet: '#8B5CF6',
  rose: '#F43F5E',
  slate: '#64748B',
  zinc: '#71717A',
  neutral: '#737373',
  stone: '#78716C',
};

const getColorHex = (color) => {
  const lowerColor = color?.toLowerCase() || '';
  if (lowerColor.startsWith('#')) return lowerColor;
  if (lowerColor.startsWith('rgb')) return lowerColor;
  return colorMap[lowerColor] || '#CBD5E1';
};

// Check if a color is light (for text contrast)
const isLightColor = (color) => {
  const hex = getColorHex(color);
  const lightColors = ['white', 'yellow', 'lime', 'amber', 'orange', 'pink', 'rose'];
  if (lightColors.includes(color?.toLowerCase())) return true;
  
  if (hex.startsWith('#')) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  }
  return false;
};

export default function ProductPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { t, lang } = useLang();
  const { addItem } = useCart();
  const { refCode, addRefToUrl, clearRef } = useAffiliate(); // ✅ Get affiliate context

  // ✅ Get ref from URL or context (cookie)
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

    // ✅ Track affiliate click if ref exists
    if (ref) {
      trackClick({ referral_code: ref, product_id: id }).catch(() => {});
    }
  }, [id, ref]);

  if (loading) return (
    <main className="min-h-screen bg-[var(--bg)] pt-16">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8">
        <div className="aspect-square shimmer-bg rounded-2xl" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-6 shimmer-bg rounded" />)}
        </div>
      </div>
    </main>
  );

  if (!product) return (
    <main className="min-h-screen bg-[var(--bg)] pt-16 flex items-center justify-center">
      <Navbar />
      <p className="text-[var(--text-secondary)]">Product not found</p>
    </main>
  );

  const name = lang === 'sw' && product.name_sw ? product.name_sw : product.name;
  const desc = lang === 'sw' && product.description_sw ? product.description_sw : product.description;
  const images = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&h=800&fit=crop'];
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const displayPrice = product.sale_price || product.price;

  const handleAddToCart = () => {
    addItem(product, qty, selectedSize, selectedColor);
    toast.success(`${name} added to cart!`);
  };

  // ✅ Function to add ref to any URL
  const getAffiliateUrl = (path) => {
    return addRefToUrl(path);
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] pt-16 pb-24 md:pb-0">
      <Navbar />

      {/* ✅ Show affiliate tracking indicator */}
      

      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
        {/* Breadcrumb - ✅ with ref preserved */}
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-6">
          <Link href={getAffiliateUrl('/')} className="hover:text-blue-500">{t('home')}</Link>
          <span>/</span>
          <Link href={getAffiliateUrl('/products')} className="hover:text-blue-500">{t('all_products')}</Link>
          <span>/</span>
          <span className="text-[var(--text)] truncate max-w-[200px]">{name}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:gap-14">
          {/* Images */}
          <div className="space-y-4">
            <div
              className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-[28px] border border-black/10 bg-white dark:border-white/10 dark:bg-white/5"
              onClick={() => setZoom(true)}
            >
              <Image
                src={images[selectedImage]}
                alt={name}
                fill
                className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.02] sm:p-8"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {hasDiscount && (
                <div className="absolute top-3 left-3">
                  <span className="badge bg-blue-500 text-white">
                    -{Math.round(((product.price - product.sale_price) / product.price) * 100)}% OFF
                  </span>
                </div>
              )}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-2 bg-black/40 backdrop-blur-sm rounded-lg text-white">
                  <ZoomIn className="w-4 h-4" />
                </div>
              </div>
              {images.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedImage(i => Math.max(0, i - 1)); }}
                    className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-950 transition hover:bg-neutral-950 hover:text-white">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedImage(i => Math.min(images.length - 1, i + 1)); }}
                    className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-950 transition hover:bg-neutral-950 hover:text-white">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border transition-all ${
                      selectedImage === i ? 'border-neutral-950 opacity-100 dark:border-white' : 'border-black/10 opacity-60 hover:opacity-100 dark:border-white/10'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-contain p-2" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="mb-3 font-display text-4xl font-semibold leading-tight text-[var(--text)] sm:text-5xl">{name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
                <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{product.views || 0} {t('views')}</span>
                <span>•</span>
                <span>{product.sold_count || 0} {t('sold')}</span>
                {product.stock > 0 ? (
                  <span className="text-green-500 font-medium">{t('in_stock')}</span>
                ) : (
                  <span className="text-red-500 font-medium">{t('out_of_stock')}</span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3">
              <span className="text-4xl font-semibold text-[var(--text)]">{formatPrice(displayPrice)}</span>
              {hasDiscount && <span className="text-lg text-[var(--text-secondary)] line-through">{formatPrice(product.price)}</span>}
            </div>

            {/* Rating Stars */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(product.rating || 0) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-[var(--text-secondary)]">
                ({product.review_count || 0} reviews)
              </span>
            </div>

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[var(--text)] mb-2">
                  {t('size')}: <span className="font-normal text-[var(--text-secondary)] capitalize">{selectedSize || 'Select a size'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => {
                    const isAvailable = (product.stock ?? 1) > 0;
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedSize(selectedSize === size ? null : size);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`relative min-w-14 rounded-2xl border px-5 py-3 text-sm font-medium transition-all ${
                          isSelected
                            ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950'
                            : isAvailable
                            ? 'border-[var(--border)] hover:border-neutral-950 dark:hover:border-white'
                            : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[var(--text)] mb-2">
                  {t('color')}: <span className="font-normal text-[var(--text-secondary)] capitalize">{selectedColor || 'Select a color'}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map(color => {
                    const colorHex = getColorHex(color);
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(selectedColor === color ? null : color)}
                        className="relative group"
                        title={color}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl transition-all duration-200 ${
                            isSelected 
                              ? 'ring-2 ring-neutral-950 ring-offset-2 ring-offset-[var(--bg)] scale-110 dark:ring-white' 
                              : 'hover:scale-105'
                          }`}
                          style={{
                            backgroundColor: colorHex,
                            backgroundImage: color.toLowerCase() === 'white' 
                              ? 'repeating-linear-gradient(45deg, #ddd 0px, #ddd 2px, transparent 2px, transparent 8px)' 
                              : 'none',
                            border: color.toLowerCase() === 'white' || colorHex === '#F9FAFB'
                              ? '1px solid var(--border)' 
                              : 'none',
                          }}
                        />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-neutral-950 rounded-full flex items-center justify-center text-white text-xs dark:bg-white dark:text-neutral-950">
                            ✓
                          </div>
                        )}
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--bg-card)] text-[var(--text)] text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-[var(--border)] pointer-events-none">
                          {color}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-sm font-semibold text-[var(--text)] mb-2">{t('quantity')}</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] text-lg font-bold transition-all hover:border-neutral-950 dark:hover:border-white">−</button>
                <span className="w-12 text-center font-bold text-[var(--text)]">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] text-lg font-bold transition-all hover:border-neutral-950 dark:hover:border-white">+</button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="sticky-cart-btn flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-neutral-950 px-4 py-4 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base dark:bg-white dark:text-neutral-950"
              >
                <ShoppingBag className="w-5 h-5" />
                {t('add_to_cart')}
              </motion.button>

              {/* ✅ Buy Now - WITH REF PRESERVED */}
              <Link href={getAffiliateUrl('/checkout')} className="block">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { addItem(product, qty, selectedSize, selectedColor); }}
                  className="min-h-[56px] w-full rounded-full border border-neutral-950 px-4 py-4 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-950 hover:text-white sm:text-base dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-neutral-950"
                >
                  {t('buy_now')}
                </motion.button>
              </Link>
            </div>

            {/* Delivery info */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Free Delivery', sub: 'Orders 200k+' },
                { icon: RotateCcw, label: '7 Day Return', sub: 'Easy returns' },
                { icon: Shield, label: 'Authentic', sub: '100% genuine' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="rounded-2xl border border-black/10 p-4 text-center dark:border-white/10">
                  <Icon className="mx-auto mb-2 h-5 w-5 text-neutral-950 dark:text-white" />
                  <p className="text-xs font-semibold text-[var(--text)]">{label}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{sub}</p>
                </div>
              ))}
            </div>

            {false && (
            <div className="card p-4 border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-blue-500" />
                <p className="font-semibold text-[var(--text)]">{t('earn_commission')}</p>
                {ref && (
                  <span className="ml-auto text-xs bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded-full">
                    🔗 {ref}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                {t('your_commission')}: <span className="font-bold text-green-500">{product.commission_rate || 10}%</span>
              </p>

              {user?.role === 'affiliate' || user?.role === 'admin' ? (
                <div className="space-y-2">
                  {!affLink ? (
                    <button onClick={handleGenerateLink} disabled={genLoading}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-blue-500/25 text-sm py-2">
                      {genLoading ? t('loading') : 'Generate Affiliate Link'}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input readOnly value={affLink} className="input text-xs flex-1 py-2" />
                      <button onClick={handleCopyLink} className="p-2 rounded-xl bg-blue-500 text-white">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                  {affLink && (
                    <div className="flex gap-2">
                      <button onClick={shareWhatsApp} className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp
                      </button>
                      <button onClick={shareTikTok} className="flex-1 flex items-center justify-center gap-2 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 0 006.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
                        TikTok
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href={getAffiliateUrl('/auth/login')} className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-blue-500/25 text-sm py-2">
                  Login as Affiliate to Earn
                </Link>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Description */}
        {desc && (
          <div className="mt-12 card p-6">
            <h2 className="font-display font-bold text-xl text-[var(--text)] mb-4">{t('description')}</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{desc}</p>
          </div>
        )}

        {/* Shipping and Returns */}
        <div className="mt-8 space-y-4">
          {/* Shipping Dropdown */}
          <div className="overflow-hidden rounded-3xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <button
              onClick={() => setShippingExpanded(!shippingExpanded)}
              className="flex w-full items-center justify-between rounded-2xl p-1 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-[var(--text)]">Shipping Information</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Fast local and international delivery options</p>
                </div>
              </div>
              {shippingExpanded ? <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" /> : <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />}
            </button>
            <AnimatePresence>
              {shippingExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 pt-5"
                >
                  <div className="rounded-2xl bg-neutral-50 p-5 dark:bg-white/[0.04]">
                    <p className="font-semibold text-[var(--text)]">Shipping calculated at checkout</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                      Delivery options are shown clearly before payment, with local, East Africa, and international services available.
                    </p>
                  </div>
                  
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
                      <p className="text-sm font-semibold text-[var(--text)]">Dar es Salaam</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Same-day delivery where available.</p>
                    </div>
                    <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
                      <p className="text-sm font-semibold text-[var(--text)]">East Africa</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">2-4 business days via trusted courier.</p>
                    </div>
                    <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
                      <p className="text-sm font-semibold text-[var(--text)]">International</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">DHL Express or DPD, usually 3-7 business days.</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200/70 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-400/10">
                    <p className="text-sm leading-6 text-amber-800 dark:text-amber-200">
                      International customers may be responsible for customs duties or import taxes charged by their country.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Returns & Refund Dropdown */}
          <div className="overflow-hidden rounded-3xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <button
              onClick={() => setReturnsExpanded(!returnsExpanded)}
              className="flex w-full items-center justify-between rounded-2xl p-1 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-[var(--text)]">Returns & Refund Policy</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Simple return steps and clear refund timing</p>
                </div>
              </div>
              {returnsExpanded ? <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" /> : <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />}
            </button>
            <AnimatePresence>
              {returnsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 pt-5"
                >
                  <div className="rounded-2xl bg-neutral-50 p-5 dark:bg-white/[0.04]">
                    <p className="font-semibold text-[var(--text)]">Returns within 14 days</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                      Items must be unworn, unwashed, and returned with original tags attached.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[var(--text)]">Return process</p>
                    <ul className="text-sm text-[var(--text-secondary)] space-y-1 pl-4 list-disc">
                      <li>Request a return through the aftercare portal in your confirmation email</li>
                      <li>Contact us directly to request a refund</li>
                      <li>Items must be unworn, unwashed, and with original tags attached</li>
                      <li>Refunds will be processed within 5-7 business days after receiving the return</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[var(--text)]">Important notes</p>
                    <ul className="text-sm text-[var(--text-secondary)] space-y-1 pl-4 list-disc">
                      <li>Free return shipping is provided for all orders</li>
                      <li>Original shipping fees are non-refundable (except for defective items)</li>
                      <li>Customs duties and taxes paid are non-refundable</li>
                      <li>Sale items may be eligible for store credit only</li>
                    </ul>
                  </div>

                  <Link href={getAffiliateUrl('/returns')} className="text-sm text-blue-500 hover:text-blue-600 font-medium inline-flex items-center gap-1">
                    View full return policy →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Related products - ✅ with ref preserved */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="section-title mb-6">{t('related_products')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {related.slice(0, 5).map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} affiliateCode={ref} />
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-12">
          <ReviewSection
            type="product"
            id={id}
            title={`Reviews for ${name}`}
            subtitle={`${product.rating || 0} average • ${product.review_count || 0} reviews`}
          />
        </div>
      </div>

      {/* Zoom modal */}
      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setZoom(false)}
          >
            <div className="relative w-full max-w-2xl aspect-square">
              <Image src={images[selectedImage]} alt={name} fill className="object-contain" sizes="800px" />
            </div>
            <button className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
      <BottomNav />
    </main>
  );
}
