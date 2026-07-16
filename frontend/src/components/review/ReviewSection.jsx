// components/review/ReviewSection.jsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Star, ThumbsUp, Flag, User, Calendar, X, Check, 
  AlertCircle, Edit2, Trash2, CheckCircle, Clock, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';
import { 
  getProductReviews, createReview, updateReview, deleteReview,
  markReviewHelpful, reportReview, getReviewStats, getAllReviews,
  approveReview, rejectReview
} from '@/lib/api';
import toast from 'react-hot-toast';

const STARS = [1, 2, 3, 4, 5];

export default function ReviewSection({
  type = 'product',
  id = '',
  title = 'Customer Reviews',
  subtitle = 'What our customers say',
  showAffiliateBadge = false,
  adminMode = false,
}) {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [comment, setComment] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState({});
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingReview, setReportingReview] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [error, setError] = useState(null);

  const isAffiliate = type === 'affiliate';
  const canModerate = user?.role === 'admin' || user?.role === 'moderator';

  // Load reviews
  const loadReviews = async (reset = false) => {
    if (reset) {
      setPage(1);
      setReviews([]);
      setHasMore(true);
      setError(null);
    }

    const currentPage = reset ? 1 : page;
    setLoading(reset);
    setLoadingMore(!reset);

    try {
      const params = { 
        page: currentPage, 
        limit: 10, 
        sort: sortBy,
      };
      if (filterRating) params.rating = filterRating;
      if (adminMode && filterStatus !== 'all') params.status = filterStatus;

      let res;
      if (adminMode) {
        const { data } = await getAllReviews(params);
        res = data;
      } else if (isAffiliate) {
        const { data } = await getAffiliateReviews(id, params);
        res = data;
      } else {
        const { data } = await getProductReviews(id, params);
        res = data;
      }

      const newReviews = res?.reviews || [];
      
      if (reset) {
        setReviews(newReviews);
        if (res?.stats) setStats(res.stats);
        setError(null);
      } else {
        setReviews(prev => [...prev, ...newReviews]);
      }
      setHasMore(newReviews.length === 10);
    } catch (error) {
      console.error('Error loading reviews:', error);
      if (error.response?.status === 404) {
        setError('No reviews found for this product');
      } else if (error.response?.status !== 404) {
        toast.error('Failed to load reviews');
        setError('Failed to load reviews');
      }
      setReviews([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    if (adminMode) return;
    try {
      const { data } = await getReviewStats(id);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    loadReviews(true);
    if (!adminMode && id) loadStats();
  }, [sortBy, filterRating, filterStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error('Please select a rating');
      return;
    }
    if (!user && !guestName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!user && !/^\S+@\S+\.\S+$/.test(guestEmail.trim())) {
      toast.error('Please enter a valid email');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please write a review');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('rating', rating.toString());
      if (!user) {
        fd.append('guest_name', guestName.trim());
        fd.append('guest_email', guestEmail.trim());
      }
      if (titleInput) fd.append('title', titleInput);
      fd.append('comment', comment);

      let res;
      if (editingReview) {
        res = await updateReview(editingReview.id, fd);
        toast.success('Review updated successfully!');
      } else if (isAffiliate) {
        res = await createAffiliateReview(id, fd);
        toast.success('Review submitted for approval!');
      } else {
        res = await createReview(id, fd);
        toast.success('Review submitted successfully!');
      }

      setShowForm(false);
      setEditingReview(null);
      resetForm();
      loadReviews(true);
      if (!adminMode) loadStats();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to submit review';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setRating(review.rating);
    setTitleInput(review.title || '');
    setComment(review.comment);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      toast.success('Review deleted successfully');
      setShowDeleteConfirm(null);
      loadReviews(true);
      if (!adminMode) loadStats();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      await approveReview(reviewId);
      toast.success('Review approved');
      loadReviews(true);
    } catch (error) {
      toast.error('Failed to approve review');
    }
  };

  const handleReject = async (reviewId) => {
    try {
      await rejectReview(reviewId);
      toast.success('Review rejected');
      loadReviews(true);
    } catch (error) {
      toast.error('Failed to reject review');
    }
  };

  const resetForm = () => {
    setRating(0);
    setGuestName('');
    setGuestEmail('');
    setTitleInput('');
    setComment('');
    setEditingReview(null);
  };

  const handleHelpful = async (reviewId) => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }
    if (helpfulVotes[reviewId]) return;
    
    try {
      await markReviewHelpful(reviewId);
      setHelpfulVotes(prev => ({ ...prev, [reviewId]: true }));
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, helpful_count: (r.helpful_count || 0) + 1 } : r
      ));
      toast.success('Thanks for your feedback!');
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    try {
      await reportReview(reportingReview, { reason: reportReason });
      toast.success('Review reported. We\'ll review it shortly.');
      setShowReportModal(false);
      setReportReason('');
      setReportingReview(null);
    } catch (error) {
      toast.error('Failed to report review');
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating, size = 16, interactive = false) => {
    return (
      <div className="flex gap-0.5">
        {STARS.map(star => (
          <Star
            key={star}
            className={`${interactive ? 'cursor-pointer' : ''} transition-colors`}
            size={size}
            fill={star <= (interactive ? hoverRating || rating : rating) ? '#F59E0B' : 'none'}
            color={star <= (interactive ? hoverRating || rating : rating) ? '#F59E0B' : '#D1D5DB'}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && setRating(star)}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-500/10 text-yellow-500', icon: Clock, label: 'Pending' },
      approved: { color: 'bg-green-500/10 text-green-500', icon: CheckCircle, label: 'Approved' },
      rejected: { color: 'bg-red-500/10 text-red-500', icon: AlertCircle, label: 'Rejected' },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const handleWriteReview = () => {
    setShowForm(true);
    resetForm();
    setTimeout(() => {
      document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="space-y-6" id="reviews">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-[var(--text)]">
            {adminMode ? 'Manage Reviews' : (isAffiliate ? 'Affiliate Reviews' : title)}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {adminMode ? 'Approve, reject, or manage all reviews' : subtitle}
            {stats && stats.total_reviews > 0 && ` • ${stats.total_reviews} reviews`}
          </p>
        </div>
        {!adminMode && (
          <button
            onClick={handleWriteReview}
            className="btn-primary px-6 py-2 text-sm bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}
      </div>

      {/* Stats Summary - Only show if there are reviews */}
      {stats && stats.total_reviews > 0 && !adminMode && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-[var(--text)]">{stats.average_rating?.toFixed(1) || '0.0'}</div>
            <div className="flex justify-center mt-1">{renderStars(Math.round(stats.average_rating || 0), 14)}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">{stats.total_reviews || 0} reviews</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.verified_purchases || 0}</div>
            <div className="text-xs text-[var(--text-secondary)]">Verified Purchases</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.with_images || 0}</div>
            <div className="text-xs text-[var(--text-secondary)]">With Photos</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">{stats.helpful_votes || 0}</div>
            <div className="text-xs text-[var(--text-secondary)]">Helpful Votes</div>
          </div>
        </div>
      )}

      {/* Rating Distribution - Only show if there are reviews */}
      {stats && stats.total_reviews > 0 && !adminMode && (
        <div className="card p-4">
          <div className="space-y-1 max-w-sm">
            {[5, 4, 3, 2, 1].map(num => {
              const count = stats.rating_distribution?.[num] || 0;
              const pct = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
              return (
                <button
                  key={num}
                  onClick={() => setFilterRating(filterRating === num ? null : num)}
                  className="flex items-center gap-3 w-full hover:bg-[var(--bg-secondary)] rounded px-2 py-1 transition-colors"
                >
                  <span className="text-sm font-medium w-6">{num}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] w-12 text-right">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Filters */}
      {adminMode && (
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input py-1 text-sm w-auto"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      {/* Review Form - Without Image Upload */}
      <AnimatePresence>
        {showForm && !adminMode && (
          <motion.div
            id="review-form"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/5"
          >
            <h3 className="font-semibold text-[var(--text)] mb-4">
              {editingReview ? 'Edit Your Review' : 'Write Your Review'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[var(--text)] block mb-2">
                  Rating *
                </label>
                <div className="flex items-center gap-2">
                  {renderStars(rating, 28, true)}
                  <span className="text-sm text-[var(--text-secondary)] ml-2">
                    {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select rating'}
                  </span>
                </div>
              </div>

              {!user && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-[var(--text)] block mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="input"
                      placeholder="Your name"
                      maxLength={80}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--text)] block mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="input"
                      placeholder="you@example.com"
                      maxLength={120}
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-[var(--text)] block mb-2">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="input"
                  placeholder="Summarize your experience"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--text)] block mb-2">
                  Review *
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input resize-none"
                  rows={4}
                  placeholder="Share your experience..."
                  required
                  maxLength={5000}
                />
                <div className="text-xs text-[var(--text-secondary)] text-right mt-1">
                  {comment.length}/5000
                </div>
              </div>

              {isAffiliate && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="affiliateRecommend" className="w-4 h-4 rounded accent-blue-500" />
                  <label htmlFor="affiliateRecommend" className="text-sm text-[var(--text-secondary)]">
                    I recommend this affiliate
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-full bg-neutral-950 px-6 py-3 font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-950"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : (editingReview ? 'Update Review' : 'Submit Review')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters - Only show if there are reviews */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input py-1 text-sm w-auto"
            >
              <option value="newest">Newest</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
          {filterRating && (
            <button
              onClick={() => setFilterRating(null)}
              className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs"
            >
              {filterRating}★ <X className="w-3 h-3" />
            </button>
          )}
          <span className="text-xs text-[var(--text-secondary)] ml-auto">
            {reviews.length} reviews
          </span>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full shimmer-bg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 shimmer-bg rounded w-1/3" />
                    <div className="h-3 shimmer-bg rounded w-1/4" />
                    <div className="h-3 shimmer-bg rounded w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <>
            {reviews.map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card p-4 hover:border-[var(--border)] transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {review.user_avatar ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-secondary)]">
                        <img src={review.user_avatar} alt={review.user_name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                        {review.user_name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-[var(--text)]">{review.user_name}</span>
                      {review.verified_purchase && (
                        <span className="flex items-center gap-0.5 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Verified
                        </span>
                      )}
                      {review.affiliate_recommendation && isAffiliate && (
                        <span className="text-xs text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                      {adminMode && getStatusBadge(review.status)}
                      {review.is_owner && (
                        <span className="text-xs text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                          Your Review
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      {renderStars(review.rating, 14)}
                      <span className="text-xs text-[var(--text-secondary)]">
                        {formatDate(review.created_at)}
                      </span>
                      {review.updated_at && review.updated_at !== review.created_at && (
                        <span className="text-xs text-[var(--text-secondary)]">(edited)</span>
                      )}
                    </div>

                    {review.title && (
                      <h4 className="font-semibold text-[var(--text)]">{review.title}</h4>
                    )}
                    <p className="text-[var(--text-secondary)] text-sm mt-1">{review.comment}</p>

                    {/* Images - Display only, no upload */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {review.images.map((img, i) => (
                          <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)]">
                            <img src={img} alt={`Review ${i + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      {!adminMode && (
                        <>
                          <button
                            onClick={() => handleHelpful(review.id)}
                            className={`flex items-center gap-1 text-xs transition-colors ${
                              helpfulVotes[review.id] ? 'text-blue-500' : 'text-[var(--text-secondary)] hover:text-blue-500'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            Helpful ({review.helpful_count || 0})
                          </button>
                          <button
                            onClick={() => {
                              setReportingReview(review.id);
                              setShowReportModal(true);
                            }}
                            className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                          >
                            <Flag className="w-3 h-3" />
                            Report
                          </button>
                        </>
                      )}
                      
                      {/* Edit/Delete */}
                      {(review.is_owner || canModerate) && (
                        <>
                          {review.status !== 'rejected' && !adminMode && (
                            <button
                              onClick={() => handleEdit(review)}
                              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => setShowDeleteConfirm(review.id)}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </>
                      )}

                      {/* Admin moderation */}
                      {adminMode && review.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="flex items-center gap-1 text-xs text-green-500 hover:text-green-600 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(review.id)}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>

                    {/* Replies */}
                    {review.replies && review.replies.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-blue-500/20">
                        {review.replies.map((reply) => (
                          <div key={reply.id} className="mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-blue-500">{reply.user_name}</span>
                              <span className="text-xs text-[var(--text-secondary)]">{formatDate(reply.created_at)}</span>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)]">{reply.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setPage(p => p + 1);
                    loadReviews(false);
                  }}
                  disabled={loadingMore}
                  className="btn-secondary text-sm px-8"
                >
                  {loadingMore ? 'Loading...' : 'Load More Reviews'}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Empty State - No Reviews */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-2xl font-semibold text-[var(--text)] mb-2">No Reviews Yet</h3>
            <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
              {isAffiliate 
                ? 'Be the first to share your experience with this affiliate' 
                : 'Be the first to share your experience with this product'}
            </p>
            {user ? (
              <button
                onClick={handleWriteReview}
                className="btn-primary bg-blue-600 hover:bg-blue-700 px-8 py-3 text-base"
              >
                Write a Review
              </button>
            ) : (
              <Link 
                href="/auth/login" 
                className="btn-primary bg-blue-600 hover:bg-blue-700 px-8 py-3 text-base inline-block"
              >
                Login to Write a Review
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] w-full max-w-md p-6"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="font-semibold text-[var(--text)] text-lg mb-2">Delete Review</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  Are you sure you want to delete this review? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--text)]">Report Review</h3>
                <button onClick={() => setShowReportModal(false)} className="p-1 hover:bg-[var(--bg-secondary)] rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Please explain why you're reporting this review. Our team will review it.
              </p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="input resize-none w-full"
                rows={4}
                placeholder="Reason for reporting..."
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  Submit Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
