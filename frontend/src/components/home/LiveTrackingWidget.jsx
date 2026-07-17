// components/home/LiveTrackingWidget.jsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Truck, Clock, CheckCircle, XCircle, 
  Bell, BellOff, X, ChevronRight, Radio, 
  RefreshCw, Minimize2, Maximize2, MapPin, User, Phone, ChevronDown 
} from 'lucide-react';
import { trackOrder } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

const STATUS_ICONS = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const STATUS_COLORS = {
  pending: 'text-neutral-950',
  confirmed: 'text-blue-500',
  processing: 'text-purple-500',
  shipped: 'text-neutral-950',
  delivered: 'text-neutral-950',
  cancelled: 'text-neutral-950',
};

const STATUS_BG_COLORS = {
  pending: 'bg-neutral-100',
  confirmed: 'bg-blue-500/10',
  processing: 'bg-purple-500/10',
  shipped: 'bg-neutral-100',
  delivered: 'bg-neutral-950/10',
  cancelled: 'bg-neutral-100',
};

export default function LiveTrackingWidget() {
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [autoTracking, setAutoTracking] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef(null);
  const [showNotification, setShowNotification] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load saved order
  useEffect(() => {
    const savedOrder = sessionStorage.getItem('trackedOrder');
    const savedAutoTracking = localStorage.getItem('autoTracking') === 'true';
    
    if (savedOrder) {
      setTrackedOrder(JSON.parse(savedOrder));
      setAutoTracking(savedAutoTracking);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (autoTracking && trackedOrder?.order_number && 
        trackedOrder.status !== 'delivered' && 
        trackedOrder.status !== 'cancelled') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        refreshOrderStatus(true);
      }, 30000);
      
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [autoTracking, trackedOrder?.order_number, trackedOrder?.status]);

  const refreshOrderStatus = async (silent = false) => {
    if (!trackedOrder?.order_number) return;
    
    setIsRefreshing(true);
    try {
      const { data } = await trackOrder(trackedOrder.order_number);
      const oldStatus = trackedOrder.status;
      
      if (oldStatus !== data.order.status) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
        
        toast.success(`Order ${data.order.status}!`, {
          duration: 4000,
          icon: data.order.status === 'delivered' ? '🎉' : '📦',
        });
      }
      
      setTrackedOrder(data.order);
      sessionStorage.setItem('trackedOrder', JSON.stringify(data.order));
      setLastUpdated(new Date());
      setConnectionStatus(true);
      
      if (!silent) {
        toast.success('Order status updated');
      }
    } catch (error) {
      setConnectionStatus(false);
      if (!silent) {
        toast.error('Failed to refresh order status');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearOrder = () => {
    setTrackedOrder(null);
    sessionStorage.removeItem('trackedOrder');
    setIsOpen(false);
    toast.success('Tracking cleared');
  };

  const toggleAutoTracking = () => {
    const newState = !autoTracking;
    setAutoTracking(newState);
    localStorage.setItem('autoTracking', newState);
    
    if (newState) {
      toast.success('Live tracking enabled - updates every 30 seconds');
    } else {
      toast.info('Live tracking disabled');
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  if (!trackedOrder) return null;

  const StatusIcon = STATUS_ICONS[trackedOrder.status] || Package;
  const statusColor = STATUS_COLORS[trackedOrder.status] || 'text-blue-500';
  const statusBg = STATUS_BG_COLORS[trackedOrder.status] || 'bg-blue-500/10';
  const isDelivered = trackedOrder.status === 'delivered';
  const isCancelled = trackedOrder.status === 'cancelled';

  // Status progress percentage
  const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentStep = statusSteps.indexOf(trackedOrder.status);
  const progress = ((currentStep + 1) / statusSteps.length) * 100;

  return (
    <>
      {/* Dropdown Button - Always visible when order is tracked */}
      <div className="fixed bottom-20 left-0 right-0 z-40 px-4 md:bottom-4 md:left-4 md:right-auto md:px-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full md:w-auto flex items-center justify-between gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg p-3 transition-all duration-300 hover:shadow-xl ${
            isOpen ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColor} ${statusBg} flex-shrink-0`}>
              <StatusIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs text-[var(--text-secondary)]">Tracking Order</p>
              <p className="text-xs font-mono font-bold text-blue-500 truncate">
                {trackedOrder.order_number}
              </p>
            </div>
            {autoTracking && !isDelivered && !isCancelled && (
              <div className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-neutral-950 animate-pulse" />
                <span className="text-[10px] text-neutral-950 hidden sm:inline">Live</span>
              </div>
            )}
            {showNotification && (
              <div className="w-2 h-2 bg-neutral-950 rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-[10px] text-[var(--text-secondary)] hidden sm:block">
                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
            </motion.div>
          </div>
        </button>
      </div>

      {/* Dropdown Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed z-30 bg-[var(--bg-card)] border border-[var(--border)] shadow-xl overflow-hidden
              ${isMobile 
                ? 'bottom-36 left-4 right-4 rounded-xl' 
                : 'bottom-20 left-4 w-96 rounded-xl'
              }`}
          >
            <div className="max-h-[70vh] overflow-y-auto">
              {/* Header with actions */}
              <div className="p-3 border-b border-[var(--border)] bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold capitalize flex items-center gap-1 ${statusColor} ${statusBg}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{trackedOrder.status}</span>
                    </div>
                    {!connectionStatus && (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-neutral-950 rounded-full animate-pulse" />
                        <span className="text-[10px] text-neutral-950">Offline</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleClearOrder}
                    className="text-xs text-neutral-950 hover:text-neutral-950 px-2 py-1 rounded-lg hover:bg-neutral-100 transition"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 space-y-3">
                {/* Refresh and Auto-track controls */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={toggleAutoTracking}
                    className={`flex-1 text-xs py-2 rounded-lg border transition active:scale-95 ${
                      autoTracking && !isDelivered && !isCancelled
                        ? 'border-neutral-950 text-neutral-950 bg-neutral-100'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    {autoTracking && !isDelivered && !isCancelled ? '🔴 Live Tracking ON' : '⚫ Live Tracking OFF'}
                  </button>
                  <button
                    onClick={() => refreshOrderStatus(false)}
                    disabled={isRefreshing}
                    className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)] transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="text-xs">Refresh</span>
                  </button>
                </div>

                {/* Last updated time */}
                {lastUpdated && (
                  <div className="text-center">
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                  </div>
                )}

                {/* Progress Bar */}
                {!isCancelled && (
                  <div className="space-y-1">
                    <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] sm:text-[10px] text-[var(--text-secondary)]">
                      <span className={currentStep >= 0 ? 'text-blue-500 font-medium' : ''}>Pending</span>
                      <span className={currentStep >= 1 ? 'text-blue-500 font-medium' : ''}>Confirm</span>
                      <span className={currentStep >= 2 ? 'text-blue-500 font-medium' : ''}>Process</span>
                      <span className={currentStep >= 3 ? 'text-blue-500 font-medium' : ''}>Ship</span>
                      <span className={currentStep >= 4 ? 'text-blue-500 font-medium' : ''}>Deliver</span>
                    </div>
                  </div>
                )}

                {/* Status Message */}
                <div className={`p-2 rounded-lg text-center text-xs ${statusBg}`}>
                  <p className={`font-medium ${statusColor}`}>
                    {trackedOrder.status === 'pending' && '⏳ Waiting for order confirmation...'}
                    {trackedOrder.status === 'confirmed' && '✅ Order confirmed! Preparing your items...'}
                    {trackedOrder.status === 'processing' && '📦 Packaging your order...'}
                    {trackedOrder.status === 'shipped' && '🚚 On the way! Driver is coming...'}
                    {trackedOrder.status === 'delivered' && '🎉 Delivered! Thank you for shopping with us!'}
                    {trackedOrder.status === 'cancelled' && '❌ Order cancelled'}
                  </p>
                </div>

                {/* Customer Info */}
                <div className="space-y-2 text-xs bg-[var(--bg-secondary)] p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    <span className="text-[var(--text)]">{trackedOrder.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    <span className="text-[var(--text)]">{trackedOrder.customer_phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[var(--text-secondary)] mt-0.5" />
                    <span className="text-[var(--text)] break-words">
                      {trackedOrder.address}, {trackedOrder.city}
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                {trackedOrder.items && trackedOrder.items.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[var(--text)]">Items ({trackedOrder.items.length})</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {trackedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs py-1 border-b border-[var(--border)] last:border-0">
                          <span className="text-[var(--text)] truncate flex-1">
                            {item.quantity}x {item.product_name}
                          </span>
                          <span className="text-[var(--text-secondary)] ml-2">
                            {formatPrice(item.unit_price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs pt-1 font-semibold">
                      <span>Total</span>
                      <span className="text-blue-500">{formatPrice(trackedOrder.total)}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    href={`/track?order=${trackedOrder.order_number}`}
                    onClick={() => setIsOpen(false)}
                    className="text-center text-xs py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition active:scale-95"
                  >
                    View Full Details
                  </Link>
                  <button
                    onClick={() => {
                      refreshOrderStatus(false);
                    }}
                    disabled={isRefreshing}
                    className="text-center text-xs py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)] transition active:scale-95"
                  >
                    Refresh Status
                  </button>
                </div>

                {/* Auto-refresh indicator */}
                {autoTracking && !isDelivered && !isCancelled && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-950/10 text-neutral-950 text-[9px]">
                      <div className="w-1.5 h-1.5 bg-neutral-950 rounded-full animate-pulse" />
                      Auto-refreshing every 30 seconds
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Helper function for formatting price
function formatPrice(n) {
  return new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n || 0);
}