// components/TrackOrderOverlay.jsx
'use client';
import { useState, useEffect } from 'react';
import { Package, X, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { trackOrder } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TrackOrderOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [orderNum, setOrderNum] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  // Check localStorage for dismissed state
  useEffect(() => {
    const dismissed = localStorage.getItem('trackOverlayDismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('trackOverlayDismissed', 'true');
  };

  const handleTrack = async () => {
    if (!orderNum.trim()) {
      toast.error('Enter your order number');
      return;
    }
    setLoading(true);
    try {
      const { data } = await trackOrder(orderNum.trim());
      if (data.order) {
        // Store order in sessionStorage for persistence across pages
        sessionStorage.setItem('trackedOrder', JSON.stringify(data.order));
        router.push(`/track?order=${orderNum.trim()}`);
        setIsOpen(false);
      }
    } catch {
      toast.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Button - Always visible on bottom left */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-4 z-40 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-105 md:bottom-4"
        aria-label="Track Order"
      >
        <Package className="w-5 h-5" />
      </button>

      {/* Overlay Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--bg)] rounded-2xl max-w-md w-full shadow-xl border border-[var(--border)] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-[var(--text)]">Track Your Order</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[var(--bg-secondary)] rounded-lg transition"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Enter your order number to see real-time delivery status
              </p>
              
              <div className="flex gap-2">
                <input
                  value={orderNum}
                  onChange={(e) => setOrderNum(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                  placeholder="e.g. BIB1234567890"
                  className="input flex-1 font-mono"
                  autoFocus
                />
                <button
                  onClick={handleTrack}
                  disabled={loading}
                  className="btn-primary px-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="w-4 h-4" />
                  {loading ? '...' : 'Track'}
                </button>
              </div>

              {/* Example hint */}
              <p className="text-xs text-[var(--text-secondary)] text-center">
                Don't have an order number? Check your confirmation email or SMS
              </p>
            </div>

            {/* Footer with dismiss option */}
            <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center">
              <button
                onClick={handleDismiss}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text)] transition"
              >
                Don't show this again
              </button>
              <button
                onClick={() => {
                  router.push('/track');
                  setIsOpen(false);
                }}
                className="text-xs text-blue-500 hover:text-blue-600 transition"
              >
                Go to Track Page →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}