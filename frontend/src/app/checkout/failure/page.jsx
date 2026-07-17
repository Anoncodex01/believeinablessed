'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

function FailureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const order = searchParams.get('order');
  const error = searchParams.get('error');

  const errorMessages = {
    missing_tracking_id: "We couldn't find your payment reference.",
    callback_failed: 'Something went wrong while confirming your payment.',
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] pt-16 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full card p-8 text-center">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-neutral-950" />
          </div>

          <h1 className="text-3xl font-bold text-[var(--text)] mb-3">Payment Not Completed</h1>

          <p className="text-[var(--text-secondary)] mb-6">
            {errorMessages[error] || 'Your payment could not be completed. No money has been deducted for a failed transaction. You can try again or choose a different payment method.'}
          </p>

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
            <button onClick={() => router.push('/checkout')} className="btn-primary w-full">
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-xl border-2 border-[var(--border)] text-[var(--text)] font-semibold hover:border-neutral-950 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default function FailurePage() {
  return (
    <Suspense fallback={null}>
      <FailureContent />
    </Suspense>
  );
}
