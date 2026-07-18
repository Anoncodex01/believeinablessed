'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Loader2, Smartphone, CreditCard, CheckCircle, AlertCircle, X } from 'lucide-react';
import { createSnippePayment, getSnippePaymentStatus } from '@/lib/api';

const MOBILE_PAYMENT_LOGOS = [
  { src: '/payments/mpesa.jpg', alt: 'M-Pesa' },
  { src: '/payments/airtel-money.png', alt: 'Airtel Money' },
  { src: '/payments/mixx_logo.jpg', alt: 'Mixx by Yas' },
  { src: '/payments/halopesa.png', alt: 'Halopesa' },
];

/**
 * Snippe checkout panel
 * - mobile: USSD push + poll until paid/failed
 * - card: redirect to Snippe payment_url
 */
export default function SnippePayment({
  orderId,
  orderNumber,
  amount,
  paymentType = 'mobile',
  customerName,
  customerEmail,
  customerPhone,
  address,
  city,
  onPaid,
  onError,
  onClose,
}) {
  const [phase, setPhase] = useState('starting'); // starting | waiting | redirecting | paid | failed
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(90);
  const startedRef = useRef(false);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (id) => {
      setPhase('waiting');
      setSecondsLeft(90);

      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            stopPolling();
            setPhase('failed');
            setError('Payment timed out. Please try again.');
            onError?.(new Error('Payment timed out'));
            return 0;
          }
          return s - 1;
        });
      }, 1000);

      pollRef.current = setInterval(async () => {
        try {
          const res = await getSnippePaymentStatus(id);
          const status = res.data?.payment_status;
          if (status === 'paid') {
            stopPolling();
            setPhase('paid');
            onPaid?.({ orderNumber: res.data.order_number || orderNumber });
          } else if (status === 'failed') {
            stopPolling();
            setPhase('failed');
            const msg = res.data?.failure_reason || 'Payment failed. Please try again.';
            setError(msg);
            onError?.(new Error(msg));
          }
        } catch (err) {
          console.warn('Snippe poll error:', err.message);
        }
      }, 2500);
    },
    [onError, onPaid, orderNumber, stopPolling]
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        setPhase('starting');
        const res = await createSnippePayment({
          order_id: orderId,
          payment_type: paymentType,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          address,
          city,
        });

        const data = res.data;

        if (data.already_paid || data.status === 'completed' || data.payment_status === 'paid') {
          setPhase('paid');
          onPaid?.({ orderNumber: data.order_number || orderNumber });
          return;
        }

        if (paymentType === 'card') {
          if (!data.payment_url) {
            throw new Error('No payment URL returned for card payment');
          }
          setPhase('redirecting');
          window.location.href = data.payment_url;
          return;
        }

        // Mobile: wait for USSD confirmation
        startPolling(orderId);
      } catch (err) {
        const msg =
          err.response?.data?.error || err.message || 'Failed to start Snippe payment';
        setError(msg);
        setPhase('failed');
        onError?.(new Error(msg));
      }
    })();

    return () => stopPolling();
  }, [
    address,
    city,
    customerEmail,
    customerName,
    customerPhone,
    onError,
    onPaid,
    orderId,
    orderNumber,
    paymentType,
    startPolling,
    stopPolling,
  ]);

  const formatAmount = (n) =>
    new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0,
    }).format(n || 0);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[var(--bg-secondary)] p-4 text-center">
        <p className="text-sm text-[var(--text-secondary)]">Amount due</p>
        <p className="text-2xl font-bold text-[var(--text)]">{formatAmount(amount)}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Order {orderNumber}</p>
      </div>

      {phase === 'starting' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--text)]" />
          <p className="text-sm text-[var(--text-secondary)]">Starting Snippe payment...</p>
        </div>
      )}

      {phase === 'redirecting' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <CreditCard className="w-8 h-8 text-[var(--text)]" />
          <Loader2 className="w-5 h-5 animate-spin text-[var(--text-secondary)]" />
          <p className="text-sm text-[var(--text-secondary)]">Redirecting to secure card payment...</p>
        </div>
      )}

      {phase === 'waiting' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
            <Smartphone className="w-7 h-7 text-neutral-950" />
          </div>
          <p className="font-semibold text-[var(--text)] text-center">
            Check your phone
          </p>
          <p className="text-sm text-[var(--text-secondary)] text-center max-w-xs">
            Enter your PIN on the USSD prompt to complete payment with Snippe.
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            {MOBILE_PAYMENT_LOGOS.map((logo) => (
              <span
                key={logo.alt}
                className="inline-flex h-8 items-center justify-center border border-[var(--border)] bg-white px-2"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={64}
                  height={24}
                  className="h-6 w-auto max-w-[64px] object-contain"
                />
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Waiting for confirmation… {secondsLeft}s
          </div>
        </div>
      )}

      {phase === 'paid' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <CheckCircle className="w-10 h-10 text-neutral-950" />
          <p className="font-semibold text-[var(--text)]">Payment confirmed</p>
        </div>
      )}

      {phase === 'failed' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <AlertCircle className="w-10 h-10 text-neutral-950" />
          <p className="font-semibold text-[var(--text)]">Payment unsuccessful</p>
          {error && <p className="text-sm text-neutral-950 text-center">{error}</p>}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="mt-2 inline-flex items-center gap-2 btn-secondary text-sm px-4 py-2"
            >
              <X className="w-4 h-4" /> Close
            </button>
          )}
        </div>
      )}
    </div>
  );
}
