// components/admin/NotificationBell.jsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, ShoppingBag, Users, DollarSign, Star, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/config';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'order':
      return <ShoppingBag className="h-4 w-4 text-sky-600" />;
    case 'affiliate':
      return <Users className="h-4 w-4 text-teal-700" />;
    case 'withdrawal':
      return <DollarSign className="h-4 w-4 text-amber-600" />;
    case 'review':
      return <Star className="h-4 w-4 text-emerald-600" />;
    case 'product':
      return <Package className="h-4 w-4 text-orange-600" />;
    default:
      return <Bell className="h-4 w-4 text-[var(--text-secondary)]" />;
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

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Get token from cookies (same as your API interceptor)
  const getToken = () => {
    // Try to get from cookies first (your API uses this)
    const token = Cookies.get('bib_token');
    if (token) return token;

    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bib_token');
    }
    return null;
  };

  const fetchNotifications = async (unreadOnly = false) => {
    const token = getToken();
    if (!token) {
      console.log('No token found, skipping notification fetch');
      return;
    }

    try {
      const params = new URLSearchParams({
        limit: 10,
        ...(unreadOnly && { unread_only: 'true' })
      });

      const response = await fetch(`${API_URL}/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // If unauthorized, redirect to login
      if (response.status === 401) {
        Cookies.remove('bib_token');
        if (typeof window !== 'undefined') {
          router.push('/auth/login?session=expired');
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Poll every 15 seconds
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 15000);

    // Click outside to close
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    const token = getToken();
    if (!token) {
      toast.error('Please login again');
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        Cookies.remove('bib_token');
        router.push('/auth/login?session=expired');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        toast.success('Marked as read');
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = getToken();
    if (!token) {
      toast.error('Please login again');
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        Cookies.remove('bib_token');
        router.push('/auth/login?session=expired');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    const token = getToken();
    if (!token) {
      toast.error('Please login again');
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        Cookies.remove('bib_token');
        router.push('/auth/login?session=expired');
        return;
      }

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
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center border border-[var(--bg-card)] bg-red-600 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 max-h-[80vh] w-[420px] overflow-hidden border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[var(--text)]" />
                <span className="font-semibold text-[var(--text)]">Notifications</span>
                {unreadCount > 0 && (
                  <span className="border border-red-600/25 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-400">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="mx-auto mb-3 h-12 w-12 text-[var(--text-secondary)] opacity-30" />
                  <p className="text-[var(--text-secondary)]">No notifications</p>
                  <p className="text-xs text-[var(--text-secondary)] opacity-60">You&apos;re all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 transition-colors hover:bg-[var(--bg-secondary)] ${
                        !notification.read ? 'border-l-2 border-teal-700 bg-teal-700/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`text-sm ${!notification.read ? 'font-semibold text-[var(--text)]' : 'text-[var(--text)]'}`}>
                                {notification.title}
                              </p>
                              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                {notification.message}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-[10px] text-[var(--text-secondary)]">
                                  {getTimeAgo(notification.created_at)}
                                </span>
                                {notification.link && (
                                  <Link
                                    href={notification.link}
                                    className="text-xs text-teal-700 hover:underline"
                                    onClick={() => {
                                      if (!notification.read) {
                                        handleMarkAsRead(notification.id);
                                      }
                                      setIsOpen(false);
                                    }}
                                  >
                                    View →
                                  </Link>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-1">
                              {!notification.read && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="p-1 text-teal-700 transition-colors hover:bg-teal-700/10"
                                  title="Mark as read"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notification.id)}
                                className="p-1 text-red-600 transition-colors hover:bg-red-500/10"
                                title="Delete"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[var(--border)] p-3 text-center">
              <Link
                href="/admin/notifications"
                className="text-xs font-medium text-teal-700 hover:text-teal-800"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
