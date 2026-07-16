// components/home/TrackOrderButton.jsx
'use client';
import { useState } from 'react';
import { Package, Search, X } from 'lucide-react';  // Add X to imports
import { trackOrder } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function TrackOrderButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [orderNum, setOrderNum] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleTrack = async () => {
    if (!orderNum.trim()) {
      toast.error('Enter your order number');
      return;
    }
    setLoading(true);
    try {
      const { data } = await trackOrder(orderNum.trim());
      if (data.order) {
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-4 z-40 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-105 md:bottom-4 flex items-center gap-2"
      >
        <Package className="w-5 h-5" />
        <span className="hidden sm:inline text-sm">Track Order</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--bg)] rounded-2xl max-w-md w-full shadow-xl border border-[var(--border)]">
            <div className="flex justify-between items-center p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-[var(--text)]">Track Your Order</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-[var(--bg-secondary)] rounded-lg">
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}