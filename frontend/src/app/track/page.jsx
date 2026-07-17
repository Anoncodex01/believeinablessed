// app/track/page.jsx
'use client';
import { useState, Suspense, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import { useLang } from '@/contexts/LangContext';
import { trackOrder } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Search, CheckCircle, Truck, Clock, XCircle,
  User, Phone, MapPin, Calendar, RefreshCw, Radio,
  Bell, BellOff, Wifi, WifiOff
} from 'lucide-react';
import toast from 'react-hot-toast';

function formatPrice(n) {
  return new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n || 0);
}

function formatAddress(value) {
  if (!value) return 'No address provided';
  if (typeof value === 'string') return value;
  return [value.city, value.address].filter(Boolean).join(', ') || 'No address provided';
}

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_ICONS = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const STATUS_COLORS = {
  pending: 'text-yellow-500 bg-yellow-500/10',
  confirmed: 'text-blue-500 bg-blue-500/10',
  processing: 'text-purple-500 bg-purple-500/10',
  shipped: 'text-orange-500 bg-orange-500/10',
  delivered: 'text-green-500 bg-green-500/10',
  cancelled: 'text-red-500 bg-red-500/10',
};

const STATUS_MESSAGES = {
  pending: 'Looking for a delivery partner...',
  confirmed: 'Order confirmed! Preparing your items...',
  processing: 'Packaging your order...',
  shipped: 'On the way! Driver is coming...',
  delivered: 'Delivered! Thank you for shopping with B I B',
  cancelled: 'Order cancelled',
};

function TrackContent() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const [orderNum, setOrderNum] = useState(searchParams.get('order') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoTracking, setAutoTracking] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [previousStatus, setPreviousStatus] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null); // { message, payment_status, order_number } while unpaid
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Load saved order from sessionStorage on mount
  useEffect(() => {
    const savedOrder = sessionStorage.getItem('trackedOrder');
    const urlOrder = searchParams.get('order');
    const savedAutoTracking = localStorage.getItem('autoTracking') === 'true';
    
    if (urlOrder && !order) {
      setOrderNum(urlOrder);
      handleTrackFromUrl(urlOrder);
    } else if (savedOrder && !order && !urlOrder) {
      setOrder(JSON.parse(savedOrder));
    }
    
    setAutoTracking(savedAutoTracking);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Create audio element for notifications
    audioRef.current = new Audio('/notification.mp3'); // Add a notification sound file
    audioRef.current.volume = 0.5;
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // While a payment is pending confirmation (Snippe mobile USSD / card redirect)
  // code awaiting admin verification), poll a bit faster so the customer
  // sees the moment it flips to paid without needing to refresh manually.
  useEffect(() => {
    if (!pendingPayment?.order_number) return;
    const id = setInterval(() => {
      fetchOrder(pendingPayment.order_number, { silent: true });
    }, 10000);
    return () => clearInterval(id);
  }, [pendingPayment?.order_number]);

  // Auto tracking effect
  useEffect(() => {
    if (autoTracking && order?.order_number && order.status !== 'delivered' && order.status !== 'cancelled') {
      // Start auto refresh every 30 seconds (like Uber)
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        refreshOrderStatus(true);
      }, 30000); // 30 seconds for faster updates
      
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else if (!autoTracking && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [autoTracking, order?.order_number, order?.status]);

  const showNotification = (orderData, oldStatus, newStatus) => {
    if (!notificationEnabled && Notification.permission !== 'granted') return;
    
    const statusMessages = {
      confirmed: '✅ Your order has been confirmed!',
      processing: '📦 Your order is being prepared',
      shipped: '🚚 Your order is on the way!',
      delivered: '🎉 Your order has been delivered!',
      cancelled: '❌ Your order has been cancelled',
    };
    
    const message = statusMessages[newStatus];
    if (message && oldStatus !== newStatus) {
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('Believe in a Blessed - Order Update', {
          body: message,
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [200, 100, 200],
        });
      }
      
      // Play sound
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
      
      // Show toast
      toast.success(message, {
        duration: 5000,
        icon: newStatus === 'delivered' ? '🎉' : '📦',
      });
    }
  };

  // Single place that talks to the tracking API and applies whatever comes
  // back - either a full order (payment confirmed) or a "payment pending"
  // state (Snippe payment still processing). Used by every entry point below so behaviour stays
  // consistent.
  const applyTrackResult = (data) => {
    if (data.paymentPending) {
      setOrder(null);
      setPendingPayment({
        message: data.message,
        payment_status: data.payment_status,
        payment_method: data.payment_method,
        order_number: data.order_number,
      });
      setLastUpdated(new Date());
      return;
    }
    setPendingPayment(null);
    setOrder(data.order);
    sessionStorage.setItem('trackedOrder', JSON.stringify(data.order));
    setLastUpdated(new Date());
  };

  const fetchOrder = async (orderNumber, { silent = false } = {}) => {
    if (!orderNumber) return;
    if (!silent) setLoading(true);
    try {
      const { data } = await trackOrder(orderNumber);
      const oldStatus = order?.status;
      applyTrackResult(data);
      setConnectionStatus(true);

      if (!data.paymentPending) {
        if (oldStatus && oldStatus !== data.order.status) {
          showNotification(data.order, oldStatus, data.order.status);
          if (data.order.status === 'delivered' || data.order.status === 'shipped') {
            audioRef.current?.play().catch(() => {});
          }
        }
        // Auto-enable live tracking once the order is confirmed paid
        if (data.order.status !== 'delivered' && data.order.status !== 'cancelled') {
          setAutoTracking(true);
          localStorage.setItem('autoTracking', 'true');
        }
      }
      if (!silent) toast.success(data.paymentPending ? 'Checking payment status...' : 'Order found!');
    } catch (error) {
      setConnectionStatus(false);
      if (!silent) {
        toast.error('Order not found');
        setOrder(null);
        setPendingPayment(null);
        sessionStorage.removeItem('trackedOrder');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const refreshOrderStatus = async (silent = false) => {
    const num = order?.order_number || pendingPayment?.order_number || orderNum;
    if (!num) return;
    if (!silent) setRefreshing(true);
    await fetchOrder(num, { silent: true });
    if (!silent) {
      toast.success('Order status updated');
      setRefreshing(false);
    }
  };

  const handleTrackFromUrl = (orderNumber) => fetchOrder(orderNumber);
  const handleTrack = () => {
    if (!orderNum.trim()) {
      toast.error('Enter your order number');
      return;
    }
    fetchOrder(orderNum.trim());
  };

  const toggleAutoTracking = () => {
    const newState = !autoTracking;
    setAutoTracking(newState);
    localStorage.setItem('autoTracking', newState);
    
    if (newState) {
      toast.success('Live tracking enabled - updates every 30 seconds');
      refreshOrderStatus(true);
    } else {
      toast('Live tracking disabled', { icon: '⏸️' });
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const enableNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationEnabled(permission === 'granted');
      if (permission === 'granted') {
        toast.success('Notifications enabled');
      } else {
        toast.error('Notification permission denied');
      }
    } else {
      toast.error('Notifications not supported');
    }
  };

  const stepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const StatusIcon = order ? STATUS_ICONS[order.status] || Package : Package;
  const isDelivered = order?.status === 'delivered';
  const isCancelled = order?.status === 'cancelled';

  return (
    <main className="min-h-screen bg-neutral-50 pt-16 pb-24 md:pb-0">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-950">
            <Package className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-neutral-950 sm:text-3xl">{t('track_order')}</h1>
          <p className="mt-1.5 text-sm text-neutral-500">Enter your order number to track your delivery</p>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 mb-8">
          <input
            value={orderNum}
            onChange={e => setOrderNum(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTrack()}
            placeholder="e.g. BIB1234567890"
            className="h-12 flex-1 rounded-full border border-black/10 bg-white px-5 font-mono text-sm outline-none transition focus:border-neutral-950"
            disabled={loading || autoTracking}
          />
          <button
            onClick={handleTrack}
            disabled={loading || autoTracking}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {loading ? '...' : 'Track'}
          </button>
        </div>

        {/* Live tracking status bar */}
        {order && !isCancelled && (
          <div className="mb-4 overflow-hidden rounded-2xl border border-black/10 bg-white px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {autoTracking ? (
                  <>
                    <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
                    <span className="text-sm font-semibold text-emerald-600">Live tracking active</span>
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-600">Manual tracking</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                {lastUpdated && (
                  <span className="text-xs text-neutral-400">
                    Updated: {lastUpdated.toLocaleTimeString()}
                    {!connectionStatus && <WifiOff className="ml-1 inline h-3 w-3 text-red-500" />}
                  </span>
                )}
                {!isDelivered && (
                  <button
                    onClick={toggleAutoTracking}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/10 px-3 text-xs font-semibold transition hover:border-neutral-950"
                  >
                    {autoTracking ? 'Disable Live' : 'Enable Live'}
                  </button>
                )}
              </div>
            </div>
            {autoTracking && !isDelivered && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <motion.div
                    className="h-full rounded-full bg-neutral-950"
                    animate={{ x: ['-100%', '0%'] }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '100%' }}
                  />
                </div>
                <span className="text-xs text-neutral-400">auto-refresh 30s</span>
              </div>
            )}
          </div>
        )}

        {order && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Order card */}
            <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
              <div className="flex items-start justify-between gap-3 border-b border-black/5 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Order Number</p>
                  <p className="mt-0.5 font-mono text-lg font-bold text-neutral-950">{order.order_number}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {order.status}
                </span>
              </div>

              <div className="px-5 py-4">
                <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700">
                  {STATUS_MESSAGES[order.status] || 'Processing your order'}
                  {autoTracking && order.status === 'shipped' && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-500">
                      <Truck className="h-3 w-3 animate-pulse" />
                      Driver is on the way to your location
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {[
                    { Icon: User, label: 'Customer', value: order.customer_name },
                    { Icon: Phone, label: 'Phone', value: order.customer_phone },
                    { Icon: MapPin, label: 'Delivery Address', value: formatAddress(order.shipping_address), full: true },
                    { Icon: Calendar, label: 'Order Date', value: new Date(order.created_at).toLocaleDateString() },
                  ].map(({ Icon, label, value, full }) => (
                    <div key={label} className={`flex items-start gap-2.5 ${full ? 'col-span-2 sm:col-span-1' : ''}`}>
                      <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100">
                        <Icon className="h-3.5 w-3.5 text-neutral-500" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-neutral-400">{label}</p>
                        <p className="font-semibold text-neutral-950 truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-black/5 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Total Amount</p>
                <p className="text-xl font-bold text-neutral-950">{formatPrice(order.total)}</p>
              </div>

              <div className="flex gap-2 border-t border-black/5 px-5 py-3">
                <button
                  onClick={() => refreshOrderStatus(false)}
                  disabled={refreshing}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-black/10 text-xs font-semibold transition hover:border-neutral-950 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh Now'}
                </button>
                <button
                  onClick={enableNotifications}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-black/10 text-xs font-semibold transition hover:border-neutral-950"
                >
                  {notificationEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                  {notificationEnabled ? 'Alerts On' : 'Enable Alerts'}
                </button>
              </div>
            </div>

            {/* Progress */}
            {!isCancelled && (
              <div className="rounded-3xl border border-black/10 bg-white p-5">
                <p className="mb-6 text-xs font-semibold uppercase tracking-wide text-neutral-400">Delivery Progress</p>
                <div className="relative">
                  <div className="flex justify-between">
                    {STATUS_STEPS.map((step, i) => {
                      const done = i <= stepIndex;
                      const current = i === stepIndex;
                      const Icon = STATUS_ICONS[step];
                      return (
                        <div key={step} className="flex flex-col items-center gap-2" style={{ width: `${100 / STATUS_STEPS.length}%` }}>
                          <motion.div
                            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                              done ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-400'
                            } ${current ? 'ring-4 ring-neutral-950/10 scale-110' : ''}`}
                            animate={current && autoTracking ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Icon className="h-4 w-4" />
                          </motion.div>
                          <p className={`text-[10px] font-semibold capitalize text-center leading-tight ${done ? 'text-neutral-950' : 'text-neutral-400'}`}>
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="absolute top-[18px] left-5 right-5 h-px bg-neutral-100 -z-10">
                    <motion.div
                      className="h-full bg-neutral-950"
                      initial={{ width: '0%' }}
                      animate={{ width: stepIndex >= 0 ? `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Items */}
            {Array.isArray(order.items) && order.items.length > 0 && (
              <div className="rounded-3xl border border-black/10 bg-white p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">Items ({order.items.length})</p>
                <div className="divide-y divide-black/5">
                  {order.items.map((item, i) => {
                    const size = item.size || item.selected_size || null;
                    const color = item.color || item.selected_color || null;
                    return (
                      <div key={i} className="flex items-start justify-between gap-3 py-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-semibold text-neutral-950 truncate">{item.product_name || 'Item'}</p>
                          <p className="mt-1 text-xs text-neutral-400">Qty: {item.quantity}</p>
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
                            <span>Size: <strong className="font-semibold text-neutral-950">{size || '—'}</strong></span>
                            <span>Color: <strong className="font-semibold text-neutral-950">{color || '—'}</strong></span>
                          </div>
                        </div>
                        <span className="font-bold text-neutral-950 whitespace-nowrap">{formatPrice((item.unit_price || item.price || 0) * item.quantity)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Shipped banner */}
            {order.status === 'shipped' && (
              <div className="flex items-center gap-4 rounded-3xl border border-black/10 bg-white p-5">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-neutral-950">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-950">On the way</p>
                  <p className="text-sm text-neutral-500">Estimated delivery within 1–3 days depending on your location.</p>
                </div>
              </div>
            )}

            {/* Delivered */}
            {order.status === 'delivered' && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center"
              >
                <CheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
                <p className="font-bold text-emerald-800">Order Delivered!</p>
                <p className="mt-1 text-sm text-emerald-700">Thank you for shopping with B I B</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Payment pending */}
        {pendingPayment && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-black/10 bg-white p-8 text-center">
            {pendingPayment.payment_status === 'failed' ? (
              <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            ) : (
              <div className="relative mx-auto mb-4 h-12 w-12">
                <div className="absolute inset-0 rounded-full border-4 border-neutral-100" />
                <div className="absolute inset-0 rounded-full border-4 border-neutral-950 border-t-transparent animate-spin" />
              </div>
            )}
            <p className="font-bold text-neutral-950">
              {pendingPayment.payment_status === 'failed' ? 'Payment Failed' : 'Confirming Your Payment'}
            </p>
            <p className="mt-2 text-sm text-neutral-500 max-w-xs mx-auto">{pendingPayment.message}</p>
            <p className="mt-3 font-mono text-xs text-neutral-400">Order: {pendingPayment.order_number}</p>
            {pendingPayment.payment_status !== 'failed' && (
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
                <Radio className="h-3 w-3 animate-pulse" />
                Checking automatically every 10 seconds
              </p>
            )}
            <button
              onClick={() => fetchOrder(pendingPayment.order_number)}
              className="mt-5 inline-flex h-10 items-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white"
            >
              Check now
            </button>
          </motion.div>
        )}

        {/* Not found */}
        {!order && !pendingPayment && !loading && orderNum && (
          <div className="rounded-3xl border border-black/10 bg-white p-10 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
            <p className="font-semibold text-neutral-950">No order found</p>
            <p className="mt-1 text-sm text-neutral-400">No order with number <span className="font-mono">{orderNum}</span>. Please check and try again.</p>
          </div>
        )}

        {/* Empty state tips */}
        {!order && !pendingPayment && !loading && !orderNum && (
          <div className="rounded-3xl border border-black/10 bg-white p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Where to find your order number</p>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-neutral-950 flex-shrink-0" />Check your order confirmation email</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-neutral-950 flex-shrink-0" />Look for an SMS notification from us</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-neutral-950 flex-shrink-0" />Your order number starts with <span className="font-mono font-semibold">BIB</span></li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-neutral-950 flex-shrink-0" />Example: <span className="font-mono font-semibold">BIB1234567890</span></li>
            </ul>
          </div>
        )}
      </div>
      <Footer />
      <BottomNav />
    </main>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg)] pt-16 flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}