// app/admin/notifications/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, ShoppingBag, Users, DollarSign, Star, Package, Filter, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'order': return <ShoppingBag className="w-5 h-5 text-blue-500" />;
    case 'affiliate': return <Users className="w-5 h-5 text-purple-500" />;
    case 'withdrawal': return <DollarSign className="w-5 h-5 text-yellow-500" />;
    case 'review': return <Star className="w-5 h-5 text-green-500" />;
    case 'product': return <Package className="w-5 h-5 text-orange-500" />;
    default: return <Bell className="w-5 h-5 text-gray-500" />;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--text)]">Notifications</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filters */}
          <div className="flex gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg">
            {['all', 'unread', 'read'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filter === f ? 'bg-[var(--bg-card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear read
          </button>
          <button
            onClick={() => fetchNotifications(true)}
            className="px-3 py-1.5 bg-[var(--bg-secondary)] rounded-lg text-xs font-medium hover:bg-[var(--bg-secondary)]/80 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">{notifications.length}</div>
          <div className="text-xs text-[var(--text-secondary)]">Total</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-500">{unreadCount}</div>
          <div className="text-xs text-[var(--text-secondary)]">Unread</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{notifications.filter(n => n.read).length}</div>
          <div className="text-xs text-[var(--text-secondary)]">Read</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">
            {notifications.filter(n => {
              const days = Math.floor((new Date() - new Date(n.created_at)) / (1000 * 60 * 60 * 24));
              return days < 1;
            }).length}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">Today</div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 text-[var(--text-secondary)] mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-semibold text-[var(--text)]">No notifications</h3>
            <p className="text-sm text-[var(--text-secondary)]">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 hover:bg-[var(--bg-secondary)] transition-colors ${
                  !notification.read ? 'bg-blue-500/5 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      !notification.read ? 'bg-blue-500/10' : 'bg-[var(--bg-secondary)]'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-[var(--text)]' : 'text-[var(--text)]'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-[var(--text-secondary)]">
                            {getTimeAgo(notification.created_at)}
                          </span>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              className="text-xs text-blue-500 hover:underline font-medium"
                              onClick={() => {
                                if (!notification.read) handleMarkAsRead(notification.id);
                              }}
                            >
                              View details →
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                          title="Delete"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
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
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  setPage(p => p + 1);
                  fetchNotifications(false);
                }}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clear Read Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] w-full max-w-md p-6"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🗑️</div>
                <h3 className="font-semibold text-[var(--text)] text-lg mb-2">Clear Read Notifications</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  This will permanently delete all read notifications. Are you sure?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearRead}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
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