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

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addItem(product, 1);
    toast.success(`${name} added to cart`);
  };

  const handleBuyNow = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addItem(product, 1);
    router.push('/checkout');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group overflow-hidden"
    >
      <div className="block">
        <div className="relative aspect-[0.92] overflow-hidden rounded-lg border border-black/10 bg-transparent transition duration-300 group-hover:-translate-y-1 dark:border-white/10">
          <Link href={href} className="absolute inset-0">
            {!imageLoaded && (
              <div className="absolute inset-0 shimmer-bg" />
            )}

            <Image
              src={image}
              alt={name}
              fill
              className={`object-contain p-3 transition duration-500 sm:p-4 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              } group-hover:scale-[1.015]`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              quality={75}
              priority={index < 4}
              onLoadingComplete={() => setImageLoaded(true)}
            />
          </Link>

          <div className="absolute inset-x-4 bottom-4 flex translate-y-3 gap-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={handleAddToCart}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-neutral-950 shadow-lg transition hover:bg-neutral-100"
            >
              <ShoppingBag className="h-4 w-4" />
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-neutral-950 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-neutral-700"
            >
              <CreditCard className="h-4 w-4" />
              Buy Now
            </button>
          </div>
        </div>

        <Link href={href} className="block pt-4">
          <div className="flex items-start justify-between gap-4">
            <h3 className="line-clamp-1 text-base font-medium leading-5 text-[var(--text)] transition group-hover:text-neutral-500">
              {name}
            </h3>
            <div className="shrink-0 text-right">
              {hasDiscount ? (
                <>
                  <p className="text-base font-semibold leading-5 text-[var(--text)]">{formatPrice(product.sale_price)}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)] line-through">{formatPrice(product.price)}</p>
                </>
              ) : (
                <p className="text-base font-semibold leading-5 text-[var(--text)]">{formatPrice(product.price)}</p>
              )}
            </div>
          </div>

          <div className="mt-2 text-xs font-medium text-[var(--text-secondary)]">
            {soldCount} sold
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
