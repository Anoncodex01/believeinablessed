// components/product/ProductCard.jsx
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useLang } from '@/contexts/LangContext';
import { useAffiliate } from '@/contexts/AffiliateContext';
import { useCart } from '@/contexts/CartContext';
import { CreditCard, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

function formatPrice(price) {
  return new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(price);
}

export default function ProductCard({ product, index = 0, affiliateCode = null }) {
  const { lang } = useLang();
  const { refCode } = useAffiliate();
  const { addItem } = useCart();
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);

  const name = lang === 'sw' && product.name_sw ? product.name_sw : product.name;
  const image = product.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=400&fit=crop';
  const hasDiscount = product.sale_price && product.sale_price < product.price;

  const effectiveRef = affiliateCode || refCode;
  
  const href = effectiveRef 
    ? `/products/${product.id}?ref=${effectiveRef}`
    : `/products/${product.id}`;

  const soldCount = 40 + ((Number(product.id) || index + 1) * 7) % 80;
  const needsVariant = (product.sizes?.length > 0) || (product.colors?.length > 0);

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (needsVariant) {
      toast.error(lang === 'sw' ? 'Chagua saizi na rangi kwenye ukurasa wa bidhaa' : 'Select size and color on the product page');
      router.push(href);
      return;
    }
    addItem(product, 1);
    toast.success(`${name} added to cart`);
  };

  const handleBuyNow = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (needsVariant) {
      toast.error(lang === 'sw' ? 'Chagua saizi na rangi kwenye ukurasa wa bidhaa' : 'Select size and color on the product page');
      router.push(href);
      return;
    }
    addItem(product, 1);
    router.push(effectiveRef ? `/checkout?ref=${effectiveRef}` : '/checkout');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group min-w-0 w-full overflow-hidden"
    >
      <div className="block w-full min-w-0">
        <div className="relative aspect-[3/4] overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)] transition duration-500 group-hover:-translate-y-1 group-hover:border-neutral-400 dark:group-hover:border-neutral-500">
          <Link href={href} className="absolute inset-0">
            {!imageLoaded && (
              <div className="absolute inset-0 shimmer-bg" />
            )}

            <Image
              src={image}
              alt={name}
              fill
              className={`object-cover transition duration-700 ease-out ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              } group-hover:scale-[1.04]`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              quality={80}
              priority={index < 4}
              onLoadingComplete={() => setImageLoaded(true)}
            />
          </Link>

          <div className="absolute inset-x-2 bottom-2 hidden translate-y-3 gap-1.5 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:inset-x-3 sm:bottom-3 sm:flex sm:gap-2">
            <button
              onClick={handleAddToCart}
              className="inline-flex flex-1 items-center justify-center gap-1.5 bg-white px-2 py-2 text-xs font-semibold tracking-tight text-neutral-950 transition hover:bg-neutral-100 sm:px-3 sm:py-2.5 sm:text-sm"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="inline-flex flex-1 items-center justify-center gap-1.5 bg-neutral-950 px-2 py-2 text-xs font-semibold tracking-tight text-white transition hover:bg-neutral-800 sm:px-3 sm:py-2.5 sm:text-sm"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Buy
            </button>
          </div>
        </div>

        <Link href={href} className="block pt-3 sm:pt-4">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <h3 className="line-clamp-2 min-w-0 font-display text-[13px] font-medium leading-snug tracking-tight text-[var(--text)] transition group-hover:text-neutral-950 dark:group-hover:text-white sm:text-[15px]">
              {name}
            </h3>
            <div className="shrink-0 text-right">
              {hasDiscount ? (
                <>
                  <p className="text-xs font-semibold leading-5 tracking-tight text-[var(--text)] sm:text-sm">{formatPrice(product.sale_price)}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--text-secondary)] line-through sm:text-xs">{formatPrice(product.price)}</p>
                </>
              ) : (
                <p className="text-xs font-semibold leading-5 tracking-tight text-[var(--text)] sm:text-sm">{formatPrice(product.price)}</p>
              )}
            </div>
          </div>

          <div className="mt-1.5 text-[10px] font-medium tracking-[0.08em] text-[var(--text-secondary)] uppercase sm:mt-2 sm:text-[11px]">
            {soldCount} sold
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
