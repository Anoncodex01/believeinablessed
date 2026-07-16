import { supabase } from './supabase.js';

export async function getProductReviews(productId, options = {}) {
  const { page = 1, limit = 10, sort = 'newest', rating, status = 'approved' } = options;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase
    .from('reviews')
    .select(`
      *,
      user:user_id (
        id,
        name,
        avatar_url
      )
    `, { count: 'exact' })
    .eq('product_id', productId)
    .eq('status', status);

  if (rating) {
    query = query.eq('rating', parseInt(rating));
  }

  switch (sort) {
    case 'highest':
      query = query.order('rating', { ascending: false });
      break;
    case 'lowest':
      query = query.order('rating', { ascending: true });
      break;
    case 'helpful':
      query = query.order('helpful_count', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data: reviews, error, count } = await query
    .range(offset, offset + parseInt(limit) - 1);

  if (error) throw error;

  return {
    reviews: reviews.map(review => ({
      id: review.id,
      user_id: review.user_id,
      user_name: review.user?.name || 'Anonymous',
      user_avatar: review.user?.avatar_url || null,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images || [],
      verified_purchase: review.verified_purchase || false,
      helpful_count: review.helpful_count || 0,
      created_at: review.created_at,
      updated_at: review.updated_at,
      status: review.status,
      replies: review.replies || [],
    })),
    total: count,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(count / parseInt(limit)),
  };
}

export async function getReviewStats(productId) {
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('rating, verified_purchase, images, helpful_count')
    .eq('product_id', productId)
    .eq('status', 'approved');

  if (error) throw error;

  const totalReviews = reviews.length;
  
  if (totalReviews === 0) {
    return {
      average_rating: 0,
      total_reviews: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verified_purchases: 0,
      with_images: 0,
      helpful_votes: 0,
    };
  }

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / totalReviews;

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => {
    ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
  });

  return {
    average_rating: averageRating,
    total_reviews: totalReviews,
    rating_distribution: ratingDistribution,
    verified_purchases: reviews.filter(r => r.verified_purchase).length,
    with_images: reviews.filter(r => r.images && r.images.length > 0).length,
    helpful_votes: reviews.reduce((sum, r) => sum + (r.helpful_count || 0), 0),
  };
}

export async function updateProductRating(productId) {
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('status', 'approved');

  if (error) throw error;

  const totalReviews = reviews.length;
  let averageRating = 0;

  if (totalReviews > 0) {
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    averageRating = total / totalReviews;
  }

  const { error: updateError } = await supabase
    .from('products')
    .update({
      rating: averageRating,
      review_count: totalReviews,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (updateError) throw updateError;

  return { averageRating, totalReviews };
}