// backend/routes/reviews.js
import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/reviews');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  }
});

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('status', 'approved');

    if (error) throw error;

    const totalReviews = reviews?.length || 0;
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

    console.log(`Updated product ${productId} rating: ${averageRating} (${totalReviews} reviews)`);
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}

// ==================== REVIEW ROUTES ====================

// GET /api/products/:productId/reviews - Get reviews for a product
router.get('/products/:productId/reviews', async (req, res) => {
  console.log('🔍 Fetching reviews for product:', req.params.productId);
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'newest', rating } = req.query;

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
      .eq('status', 'approved');

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

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    const formattedReviews = reviews?.map(review => ({
      id: review.id,
      user_id: review.user_id,
      user_name: review.user?.name || review.guest_name || 'Anonymous',
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
      affiliate_recommendation: review.affiliate_recommendation || false,
    })) || [];

    res.json({
      success: true,
      reviews: formattedReviews,
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: count ? Math.ceil(count / parseInt(limit)) : 0,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/products/:productId/reviews/stats - Get review statistics
router.get('/products/:productId/reviews/stats', async (req, res) => {
  console.log('📊 Fetching review stats for product:', req.params.productId);
  try {
    const { productId } = req.params;

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating, verified_purchase, images, helpful_count')
      .eq('product_id', productId)
      .eq('status', 'approved');

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    const totalReviews = reviews?.length || 0;
    
    if (totalReviews === 0) {
      return res.json({
        success: true,
        data: {
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          verified_purchases: 0,
          with_images: 0,
          helpful_votes: 0,
        }
      });
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / totalReviews;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        average_rating: averageRating,
        total_reviews: totalReviews,
        rating_distribution: ratingDistribution,
        verified_purchases: reviews.filter(r => r.verified_purchase).length,
        with_images: reviews.filter(r => r.images && r.images.length > 0).length,
        helpful_votes: reviews.reduce((sum, r) => sum + (r.helpful_count || 0), 0),
      }
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/products/:productId/reviews - Create a review (AUTO-APPROVED - NO APPROVAL NEEDED)
router.post('/products/:productId/reviews', optionalAuth, upload.array('images', 5), async (req, res) => {
  console.log('✍️ Creating review for product:', req.params.productId);
  try {
    const { productId } = req.params;
    const { rating, title, comment, affiliate_recommendation, guest_name, guest_email } = req.body;
    const userId = req.user?.id || null;
    const guestName = String(guest_name || '').trim();
    const guestEmail = String(guest_email || '').trim().toLowerCase();

    if (!rating || !comment) {
      return res.status(400).json({ success: false, error: 'Rating and comment are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
    }

    if (!userId) {
      if (!guestName) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }
      if (!/^\S+@\S+\.\S+$/.test(guestEmail)) {
        return res.status(400).json({ success: false, error: 'A valid email is required' });
      }
    }

    if (userId) {
      // Check if user already reviewed this product
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingReview) {
        return res.status(400).json({ success: false, error: 'You have already reviewed this product' });
      }
    }

    // Check if user purchased this product
    let verifiedPurchase = false;
    if (userId) {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, items')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (orders && orders.length > 0) {
        for (const order of orders) {
          if (order.items && Array.isArray(order.items)) {
            const found = order.items.some(item => item.product_id === productId);
            if (found) {
              verifiedPurchase = true;
              break;
            }
          }
        }
      }
    }

    // Save images
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        imageUrls.push(`/uploads/reviews/${file.filename}`);
      });
    }

    const reviewPayload = {
        product_id: productId,
        user_id: userId,
        rating: parseInt(rating),
        title: title || null,
        comment,
        images: imageUrls,
        verified_purchase: verifiedPurchase,
        affiliate_recommendation: affiliate_recommendation === 'true' || false,
        status: 'approved', // AUTO-APPROVED - Review shows immediately
        helpful_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    if (!userId) {
      reviewPayload.guest_name = guestName;
      reviewPayload.guest_email = guestEmail;
    }

    // Create review - AUTO-APPROVED (status: 'approved') - NO APPROVAL NEEDED
    let { data: review, error } = await supabase
      .from('reviews')
      .insert(reviewPayload)
      .select()
      .single();

    if (error && !userId && ['42703', 'PGRST204'].includes(error.code)) {
      delete reviewPayload.guest_name;
      delete reviewPayload.guest_email;
      const retry = await supabase
        .from('reviews')
        .insert(reviewPayload)
        .select()
        .single();
      review = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Update product rating immediately
    await updateProductRating(productId);

    // Return the created review with user info
    const { data: reviewWithUser } = await supabase
      .from('reviews')
      .select(`
        *,
        user:user_id (
          id,
          name,
          avatar_url
        )
      `)
      .eq('id', review.id)
      .single();

    const formattedReview = {
      id: reviewWithUser.id,
      user_id: reviewWithUser.user_id,
      user_name: reviewWithUser.user?.name || reviewWithUser.guest_name || 'Anonymous',
      user_avatar: reviewWithUser.user?.avatar_url || null,
      rating: reviewWithUser.rating,
      title: reviewWithUser.title,
      comment: reviewWithUser.comment,
      images: reviewWithUser.images || [],
      verified_purchase: reviewWithUser.verified_purchase || false,
      helpful_count: reviewWithUser.helpful_count || 0,
      created_at: reviewWithUser.created_at,
      updated_at: reviewWithUser.updated_at,
      status: reviewWithUser.status,
      replies: reviewWithUser.replies || [],
      affiliate_recommendation: reviewWithUser.affiliate_recommendation || false,
    };

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review: formattedReview,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/reviews/:reviewId - Update a review
router.put('/reviews/:reviewId', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;

    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (fetchError || !existingReview) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    // Allow users to edit their own reviews or admins to edit any
    if (existingReview.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const imageUrls = existingReview.images || [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        imageUrls.push(`/uploads/reviews/${file.filename}`);
      });
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .update({
        rating: parseInt(rating) || existingReview.rating,
        title: title !== undefined ? title : existingReview.title,
        comment: comment || existingReview.comment,
        images: imageUrls,
        updated_at: new Date().toISOString(),
        status: 'approved', // Keep approved after edit
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;

    await updateProductRating(existingReview.product_id);

    res.json({
      success: true,
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/reviews/:reviewId - Delete a review
router.delete('/reviews/:reviewId', authenticate, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (fetchError || !existingReview) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    // Allow users to delete their own reviews or admins to delete any
    if (existingReview.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;

    await updateProductRating(existingReview.product_id);

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/reviews/:reviewId/helpful - Mark review as helpful
router.post('/reviews/:reviewId/helpful', authenticate, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const { data: existing } = await supabase
      .from('review_helpful')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, error: 'You already marked this review as helpful' });
    }

    const { error: insertError } = await supabase
      .from('review_helpful')
      .insert({
        review_id: reviewId,
        user_id: userId,
        created_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    const { data: review } = await supabase
      .from('reviews')
      .select('helpful_count')
      .eq('id', reviewId)
      .single();

    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        helpful_count: (review?.helpful_count || 0) + 1,
      })
      .eq('id', reviewId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Marked as helpful',
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/reviews/:reviewId/report - Report a review
router.post('/reviews/:reviewId/report', authenticate, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    if (!reason) {
      return res.status(400).json({ success: false, error: 'Reason is required' });
    }

    const { error } = await supabase
      .from('review_reports')
      .insert({
        review_id: reviewId,
        user_id: userId,
        reason,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    res.json({
      success: true,
      message: 'Review reported successfully',
    });
  } catch (error) {
    console.error('Error reporting review:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// GET /api/admin/reviews - Get all reviews (admin)
router.get('/admin/reviews', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 100, sort = 'newest', rating, status } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('reviews')
      .select(`
        *,
        user:user_id (
          id,
          name,
          avatar_url
        ),
        product:product_id (
          id,
          name,
          images
        )
      `, { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

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

    const formattedReviews = reviews?.map(review => ({
      id: review.id,
      user_id: review.user_id,
      user_name: review.user?.name || review.guest_name || 'Anonymous',
      user_avatar: review.user?.avatar_url || null,
      product_id: review.product_id,
      product_name: review.product?.name || 'Unknown Product',
      product_image: review.product?.images?.[0] || null,
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
      affiliate_recommendation: review.affiliate_recommendation || false,
    })) || [];

    res.json({
      success: true,
      reviews: formattedReviews,
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: count ? Math.ceil(count / parseInt(limit)) : 0,
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/admin/reviews/:reviewId/approve - Approve a review (admin)
router.put('/admin/reviews/:reviewId/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const { data: review, error } = await supabase
      .from('reviews')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;

    await updateProductRating(review.product_id);

    res.json({
      success: true,
      message: 'Review approved successfully',
      review,
    });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/admin/reviews/:reviewId/reject - Reject a review (admin)
router.put('/admin/reviews/:reviewId/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const { data: review, error } = await supabase
      .from('reviews')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Review rejected successfully',
      review,
    });
  } catch (error) {
    console.error('Error rejecting review:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
