// app/admin/notifications/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, ShoppingBag, Users, DollarSign, Star, Package, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/config';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'order': return <ShoppingBag className="h-5 w-5 text-sky-600" />;
    case 'affiliate': return <Users className="h-5 w-5 text-teal-700" />;
    case 'withdrawal': return <DollarSign className="h-5 w-5 text-amber-600" />;
    case 'review': return <Star className="h-5 w-5 text-emerald-600" />;
    case 'product': return <Package className="h-5 w-5 text-orange-600" />;
    default: return <Bell className="h-5 w-5 text-[var(--text-secondary)]" />;
  }
};

const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';
  return Math.floor(seconds) + 's ago';
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const router = useRouter();
  const getToken = () => Cookies.get('bib_token') || null;

  const fetchNotifications = async (resetPage = true) => {
    const token = getToken();
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: 20,
        offset: (resetPage ? 0 : (page - 1) * 20),
        ...(filter !== 'all' && { unread_only: filter === 'unread' ? 'true' : 'false' })
      });

      const response = await fetch(`${API_URL}/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
        setTotalPages(data.totalPages || 1);
        if (resetPage) setPage(1);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);
  }, [filter]);

  const handleMarkAsRead = async (id) => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        toast.success('Marked as read');
      }
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        const deleted = notifications.find(n => n.id === id);
        if (deleted && !deleted.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast.success('Notification deleted');
      }
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleClearRead = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setNotifications(prev => prev.filter(n => !n.read));
        toast.success('Cleared read notifications');
        setShowClearConfirm(false);
      }
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Activity</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">Notifications</h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 border border-[var(--border)] bg-[var(--bg-card)] p-1">
              {['all', 'unread', 'read'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all ${
                    filter === f ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1 border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-teal-700"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            )}
            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1 border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-500"
            >
              <Trash2 className="h-4 w-4" />
              Clear read
            </button>
            <button
              onClick={() => fetchNotifications(true)}
              className="border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-teal-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center">
          <div className="font-display text-2xl font-semibold tracking-tight text-[var(--text)]">{notifications.length}</div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Total</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center">
          <div className="font-display text-2xl font-semibold tracking-tight text-amber-600">{unreadCount}</div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Unread</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center">
          <div className="font-display text-2xl font-semibold tracking-tight text-emerald-600">{notifications.filter(n => n.read).length}</div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Read</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center">
          <div className="font-display text-2xl font-semibold tracking-tight text-teal-700">
            {notifications.filter(n => {
              const days = Math.floor((new Date() - new Date(n.created_at)) / (1000 * 60 * 60 * 24));
              return days < 1;
            }).length}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Today</div>
        </div>
      </div>

      <div className="overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin border-2 border-neutral-950 border-t-transparent dark:border-white dark:border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center">
            <Bell className="mx-auto mb-4 h-16 w-16 text-[var(--text-secondary)] opacity-30" />
            <h3 className="font-display text-lg font-semibold text-[var(--text)]">No notifications</h3>
            <p className="text-sm text-[var(--text-secondary)]">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 transition-colors hover:bg-[var(--bg-secondary)] ${
                  !notification.read ? 'border-l-4 border-teal-700 bg-teal-700/5' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0">
                    <div className={`flex h-10 w-10 items-center justify-center ${
                      !notification.read ? 'bg-teal-700/10' : 'bg-[var(--bg-secondary)]'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-[var(--text)]' : 'text-[var(--text)]'}`}>
                          {notification.title}
                        </p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-xs text-[var(--text-secondary)]">
                            {getTimeAgo(notification.created_at)}
                          </span>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              className="text-xs font-medium text-teal-700 hover:underline"
                              onClick={() => {
                                if (!notification.read) handleMarkAsRead(notification.id);
                              }}
                            >
                              View details →
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1.5 text-teal-700 transition-colors hover:bg-teal-700/10"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-1.5 text-red-600 transition-colors hover:bg-red-500/10"
                          title="Delete"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] p-4">
            <div className="text-xs text-[var(--text-secondary)]">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setPage(p => p - 1);
                  fetchNotifications(false);
                }}
                disabled={page <= 1}
                className="border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  setPage(p => p + 1);
                  fetchNotifications(false);
                }}
                disabled={page >= totalPages}
                className="border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md border border-[var(--border)] bg-[var(--bg-card)] p-6"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-red-500/10 text-red-600">
                  <Trash2 className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-[var(--text)]">Clear Read Notifications</h3>
                <p className="mb-6 text-sm text-[var(--text-secondary)]">
                  This will permanently delete all read notifications. Are you sure?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="h-11 flex-1 border border-[var(--border)] text-sm font-semibold text-[var(--text)] transition hover:border-teal-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearRead}
                    className="h-11 flex-1 bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
