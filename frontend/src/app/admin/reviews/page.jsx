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
  if (status === 'approved') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'rejected') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function StatCard({ icon: Icon, label, value, dark = false }) {
  return (
    <div className={`rounded-3xl border p-5 ${dark ? 'border-neutral-900 bg-neutral-950 text-white' : 'border-black/10 bg-white text-neutral-950'}`}>
      <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-full ${dark ? 'bg-white/10' : 'bg-neutral-100'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className={`mt-1 text-sm ${dark ? 'text-white/60' : 'text-[var(--text-secondary)]'}`}>{label}</p>
    </div>
  );
}

function renderStars(rating) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-neutral-200'}`}
        />
      ))}
      <span className="text-xs text-[var(--text-secondary)] ml-1">({rating})</span>
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
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Reviews</p>
        <button onClick={loadReviews} title="Refresh" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white transition hover:border-neutral-950">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard dark icon={Star} label="Total Reviews" value={reviews.length} />
        <StatCard icon={Clock} label="Pending" value={pendingCount} />
        <StatCard icon={Check} label="Approved" value={approvedCount} />
        <StatCard icon={X} label="Rejected" value={rejectedCount} />
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-12 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold outline-none"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-12 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold outline-none"
          >
            <option value="newest">Newest</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-black/10 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
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
            <tbody className="divide-y divide-black/5 text-sm">
              {loading ? Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}><td colSpan={7} className="px-5 py-4"><div className="h-12 rounded-xl shimmer-bg" /></td></tr>
              )) : reviews.map(review => (
                <tr key={review.id} className="align-middle">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {review.user_avatar ? (
                        <img src={review.user_avatar} alt={review.user_name} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-950">
                          {review.user_name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <p className="font-semibold text-neutral-950 truncate max-w-[120px]">{review.user_name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/products/${review.product_id}`} target="_blank" className="font-semibold text-neutral-950 hover:underline truncate max-w-[140px] block">
                      {review.product_name || 'Unknown Product'}
                    </Link>
                  </td>
                  <td className="px-5 py-4">{renderStars(review.rating)}</td>
                  <td className="px-5 py-4 max-w-[200px]">
                    {review.title && <p className="font-semibold text-neutral-950 truncate">{review.title}</p>}
                    <p className="text-[var(--text-secondary)] truncate">{review.comment}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusTone(review.status)}`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--text-secondary)]">{formatDate(review.created_at)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {review.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="inline-flex h-8 items-center gap-1 rounded-full bg-neutral-950 px-3 text-xs font-semibold text-white"
                          >
                            <Check className="h-3 w-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(review.id)}
                            className="inline-flex h-8 items-center gap-1 rounded-full border border-black/10 px-3 text-xs font-semibold text-red-600"
                          >
                            <X className="h-3 w-3" /> Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="inline-flex h-8 items-center gap-1 rounded-full border border-black/10 px-3 text-xs font-semibold text-red-600"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                      <Link
                        href={`/products/${review.product_id}`}
                        target="_blank"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-[var(--text-secondary)] hover:border-neutral-950"
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
