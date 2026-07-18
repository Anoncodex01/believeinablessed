'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Banknote } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/contexts/CartContext';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const order = searchParams.get('order');
  const isCod = searchParams.get('cod') === '1';
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    if (order) {
      const t = setTimeout(() => {
        router.push(`/track?order=${encodeURIComponent(order)}`);
      }, 2200);
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
            {isCod ? (
              <Banknote className="w-10 h-10 text-neutral-950" />
            ) : (
              <CheckCircle className="w-10 h-10 text-neutral-950" />
            )}
          </div>

          <h1 className="text-3xl font-bold text-[var(--text)] mb-3">
            {isCod ? 'Order Placed!' : 'Payment Successful!'}
          </h1>

          <p className="text-[var(--text-secondary)] mb-6">
            {isCod
              ? 'Thank you for shopping with B I B. Pay with cash when your order is delivered.'
              : 'Thank you for shopping with B I B'}
          </p>
          {order && (
            <p className="text-xs text-[var(--text-secondary)] -mt-4 mb-6">
              Taking you to live tracking...
            </p>
          )}

          {order && (
            <div className="mb-6 rounded-lg bg-[var(--bg-secondary)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Order Number</p>
              <p className="font-semibold text-[var(--text)] break-all">{order}</p>
              {isCod && (
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  Cash on Delivery
                </p>
              )}
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
