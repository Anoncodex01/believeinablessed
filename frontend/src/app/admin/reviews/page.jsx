'use client';
import { useState, useEffect } from 'react';
import { getAllReviews, approveReview, rejectReview, deleteReview } from '@/lib/api';
import { Star, Trash2, Check, X, Eye, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusTone(status) {
  if (status === 'approved') return 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  if (status === 'rejected') return 'border-red-600/25 bg-red-500/10 text-red-700 dark:text-red-400';
  return 'border-amber-600/25 bg-amber-500/10 text-amber-700 dark:text-amber-400';
}

function StatCard({ icon: Icon, label, value, dark = false }) {
  return (
    <div className={`border p-5 ${dark ? 'border-neutral-900 bg-neutral-950 text-white' : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]'}`}>
      <div className={`mb-4 flex h-10 w-10 items-center justify-center ${dark ? 'bg-white/10' : 'bg-teal-700/10 text-teal-700'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-display text-2xl font-semibold tracking-tight">{value}</p>
      <p className={`mt-1 text-[11px] font-semibold tracking-[0.14em] uppercase ${dark ? 'text-white/55' : 'text-[var(--text-secondary)]'}`}>{label}</p>
    </div>
  );
}

function renderStars(rating) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
        />
      ))}
      <span className="ml-1 text-xs text-[var(--text-secondary)]">({rating})</span>
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    loadReviews();
  }, [filter, sort]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filter !== 'all') params.status = filter;
      if (sort) params.sort = sort;
      const { data } = await getAllReviews(params);
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      await approveReview(reviewId);
      toast.success('Review approved!');
      loadReviews();
    } catch (error) {
      toast.error('Failed to approve review');
    }
  };

  const handleReject = async (reviewId) => {
    try {
      await rejectReview(reviewId);
      toast.success('Review rejected');
      loadReviews();
    } catch (error) {
      toast.error('Failed to reject review');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteReview(reviewId);
      toast.success('Review deleted');
      loadReviews();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const pendingCount = reviews.filter(r => r.status === 'pending').length;
  const approvedCount = reviews.filter(r => r.status === 'approved').length;
  const rejectedCount = reviews.filter(r => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      <div className="border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Moderation</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              Reviews
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
              Approve, reject, or remove customer product reviews.
            </p>
          </div>
          <button onClick={loadReviews} title="Refresh" className="inline-flex h-11 w-11 items-center justify-center border border-[var(--border)] bg-[var(--bg-card)] transition hover:border-teal-700">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard dark icon={Star} label="Total Reviews" value={reviews.length} />
        <StatCard icon={Clock} label="Pending" value={pendingCount} />
        <StatCard icon={Check} label="Approved" value={approvedCount} />
        <StatCard icon={X} label="Rejected" value={rejectedCount} />
      </div>

      <div className="border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input h-12 px-4 text-sm font-semibold"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input h-12 px-4 text-sm font-semibold"
          >
            <option value="newest">Newest</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Rating</th>
                <th className="px-5 py-4">Comment</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {loading ? Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}><td colSpan={7} className="px-5 py-4"><div className="h-12 shimmer-bg" /></td></tr>
              )) : reviews.map(review => (
                <tr key={review.id} className="align-middle">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {review.user_avatar ? (
                        <img src={review.user_avatar} alt={review.user_name} className="h-9 w-9 object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center bg-teal-700/10 text-sm font-semibold text-teal-700">
                          {review.user_name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <p className="max-w-[120px] truncate font-semibold text-[var(--text)]">{review.user_name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/products/${review.product_id}`} target="_blank" className="block max-w-[140px] truncate font-semibold text-[var(--text)] hover:text-teal-700">
                      {review.product_name || 'Unknown Product'}
                    </Link>
                  </td>
                  <td className="px-5 py-4">{renderStars(review.rating)}</td>
                  <td className="max-w-[200px] px-5 py-4">
                    {review.title && <p className="truncate font-semibold text-[var(--text)]">{review.title}</p>}
                    <p className="truncate text-[var(--text-secondary)]">{review.comment}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex border px-2.5 py-1 text-[11px] font-semibold uppercase ${statusTone(review.status)}`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--text-secondary)]">{formatDate(review.created_at)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {review.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="inline-flex h-8 items-center gap-1 bg-neutral-950 px-3 text-xs font-semibold text-white transition hover:bg-teal-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-teal-300"
                          >
                            <Check className="h-3 w-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(review.id)}
                            className="inline-flex h-8 items-center gap-1 border border-[var(--border)] px-3 text-xs font-semibold text-red-600 transition hover:border-red-500"
                          >
                            <X className="h-3 w-3" /> Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="inline-flex h-8 items-center gap-1 border border-[var(--border)] px-3 text-xs font-semibold text-red-600 transition hover:border-red-500"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                      <Link
                        href={`/products/${review.product_id}`}
                        target="_blank"
                        className="inline-flex h-8 w-8 items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] transition hover:border-teal-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && reviews.length === 0 && (
          <p className="p-10 text-center text-sm text-[var(--text-secondary)]">No reviews found.</p>
        )}
      </div>
    </div>
  );
}
