// components/admin/NotificationBell.jsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, ShoppingBag, Users, DollarSign, Star, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'order':
      return <ShoppingBag className="w-4 h-4 text-blue-500" />;
    case 'affiliate':
      return <Users className="w-4 h-4 text-purple-500" />;
    case 'withdrawal':
      return <DollarSign className="w-4 h-4 text-yellow-500" />;
    case 'review':
      return <Star className="w-4 h-4 text-green-500" />;
    case 'product':
      return <Package className="w-4 h-4 text-orange-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
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
        className="relative p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-[var(--text-secondary)] hover:text-[var(--text)]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[420px] max-h-[80vh] bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-2xl overflow-hidden z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[var(--text)]" />
                <span className="font-semibold text-[var(--text)]">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3 opacity-30" />
                  <p className="text-[var(--text-secondary)]">No notifications</p>
                  <p className="text-xs text-[var(--text-secondary)] opacity-60">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-[var(--bg-secondary)] transition-colors ${
                        !notification.read ? 'bg-blue-500/5 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`text-sm ${!notification.read ? 'font-semibold text-[var(--text)]' : 'text-[var(--text)]'}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)] mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] text-[var(--text-secondary)]">
                                  {getTimeAgo(notification.created_at)}
                                </span>
                                {notification.link && (
                                  <Link
                                    href={notification.link}
                                    className="text-xs text-blue-500 hover:underline"
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
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.read && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="p-1 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notification.id)}
                                className="p-1 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                                title="Delete"
                              >
                                <X className="w-3.5 h-3.5" />
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

            <div className="p-3 border-t border-[var(--border)] text-center">
              <Link
                href="/admin/notifications"
                className="text-xs text-blue-500 hover:text-blue-600 font-medium"
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