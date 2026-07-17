'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/contexts/CartContext';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const order = searchParams.get('order');
  const { clearCart } = useCart();

  useEffect(() => {
    // Payment gateways (Snippe) only reach this page once payment is
    // confirmed, so it's safe to clear the cart here.
    clearCart();
    // Move straight into live tracking - don't make the customer click
    // through an extra screen to see their order status.
    if (order) {
      const t = setTimeout(() => {
        router.push(`/track?order=${encodeURIComponent(order)}`);
      }, 1800);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  return (
    <main className="min-h-screen bg-[var(--bg)] pt-16 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full card p-8 text-center">
          <div className="w-20 h-20 bg-neutral-950/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-neutral-950" />
          </div>

          <h1 className="text-3xl font-bold text-[var(--text)] mb-3">
            Payment Successful! 🎉
          </h1>

          <p className="text-[var(--text-secondary)] mb-6">
            Thank you for shopping with B I B
          </p>
          {order && (
            <p className="text-xs text-[var(--text-secondary)] -mt-4 mb-6">Taking you to live tracking...</p>
          )}

          {order && (
            <div className="mb-6 rounded-lg bg-[var(--bg-secondary)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Order Number</p>
              <p className="font-semibold text-[var(--text)] break-all">{order}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {order && (
              <button
                onClick={() => router.push(`/track?order=${encodeURIComponent(order)}`)}
                className="w-full py-3 rounded-xl border-2 border-[var(--border)] text-[var(--text)] font-semibold hover:border-neutral-950 transition-colors"
              >
                Track My Order
              </button>
            )}
            <button onClick={() => router.push('/')} className="btn-primary w-full">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
