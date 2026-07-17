// lib/api.js
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from './config';

export { API_URL } from './config';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = Cookies.get('bib_token') || localStorage.getItem('bib_token');
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        console.log('[API Request] Token exists:', !!token);
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (config.url?.includes('/admin/')) {
        console.warn(`[API Warning] No token for admin route: ${config.url}`);
      }
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, config, data } = error.response;
      
      console.error(`[API Error] ${config.url} - ${status}`);
      console.error('[API Error] Details:', data);
      
      if (status === 401) {
        Cookies.remove('bib_token', { path: '/' });
        Cookies.remove('bib_user', { path: '/' });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('bib_token');
          localStorage.removeItem('bib_user');
        }
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/auth/login?session=expired';
        }
      } else if (status === 403) {
        console.error('[API Error] Access denied for:', config.url);
        if (config.url?.includes('/admin/')) {
          if (typeof window !== 'undefined') {
            window.location.href = '/?error=admin_access_denied';
          }
        }
      } else if (status === 404) {
        console.error('[API Error] Endpoint not found:', config.url);
      }
    } else if (error.request) {
      console.error('[API Error] No response received:', error.request);
    } else {
      console.error('[API Error] Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// ==================== PUBLIC ROUTES ====================

// Products
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);

// Categories
export const getCategories = () => api.get('/categories');

// Slides
export const getSlides = () => api.get('/slides');

// Flash Sales
export const getFlashSales = () => api.get('/flash-sales');

// Affiliates
export const getLeaderboard = (limit) => api.get('/affiliates/leaderboard', { params: limit ? { limit } : {} });
export const getAffiliateStats = () => api.get('/affiliates/stats');

// Competitions
export const getCompetition = () => api.get('/competitions');
export const getCompetitionLeaderboard = () => api.get('/competitions/leaderboard');

// Orders (Public)
export const createOrder = (data) => api.post('/orders', data);
export const trackOrder = (orderNumber) => api.get(`/orders/track/${orderNumber}`);
export const getMyOrders = () => api.get('/orders/my-orders');

// ==================== SNIPPE PAYMENTS ====================
export const createSnippePayment = (data) => api.post('/snippe/create-payment', data);
export const getSnippePaymentStatus = (orderId) => api.get(`/snippe/status/${orderId}`);

// ==================== AFFILIATE ROUTES ====================

export const trackClick = (data) => api.post('/affiliates/track-click', data);
export const generateLink = (product_id) => api.post('/affiliates/generate-link', { product_id });
export const getAffiliateDashboard = () => api.get('/affiliates/dashboard');
export const requestWithdrawal = (data) => api.post('/affiliates/withdraw', data);
export const getWithdrawals = () => api.get('/affiliates/withdrawals');

// ==================== ADMIN ROUTES ====================

// Dashboard
export const getAdminDashboard = () => api.get('/admin/dashboard');

// Orders Management
export const getAdminOrders = (params) => api.get('/orders/admin/all', { params });
export const updateOrder = (id, data) => api.put(`/orders/admin/${id}`, data);

// Users Management
export const getAdminUsers = () => api.get('/admin/users');
export const getAdminUser = (id) => api.get(`/admin/users/${id}`);
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);

// Affiliates Management
export const getAdminAffiliateOverview = () => api.get('/affiliates/admin/overview');
export const updateAffiliateApplication = (id, data) => api.put(`/affiliates/applications/${id}`, data);
export const getAdminAffiliates = () => api.get('/affiliates/all');
export const getAdminWithdrawals = () => api.get('/affiliates/admin/withdrawals');
export const updateWithdrawal = (id, data) => api.put(`/affiliates/admin/withdrawals/${id}`, data);
export const updateAffiliate = (id, data) => api.put(`/affiliates/admin/${id}/update`, data);
export const updateAffiliateStatus = (id, status) => api.put(`/affiliates/admin/${id}/status`, { status });
export const deleteAffiliate = (id) => api.delete(`/affiliates/admin/${id}`);

// Coupons Management
export const getAdminCoupons = () => api.get('/admin/coupons');
export const createCoupon = (data) => api.post('/admin/coupons', data);
export const updateCoupon = (id, data) => api.put(`/admin/coupons/${id}`, data);
export const deleteCoupon = (id) => api.delete(`/admin/coupons/${id}`);

// Settings
export const getSettings = () => api.get('/admin/settings');
export const updateSettings = (data) => api.put('/admin/settings', data);

// Analytics
export const getTopProducts = () => api.get('/admin/analytics/top-products');

// Products Management (Admin)
export const createProduct = (formData) => api.post('/products', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateProduct = (id, formData) => api.put(`/products/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Categories Management (Admin)
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Slides Management (Admin)
export const createSlide = (formData) => api.post('/slides', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateSlide = (id, formData) => api.put(`/slides/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteSlide = (id) => api.delete(`/slides/${id}`);

// Flash Sales Management (Admin)
export const setFlashSale = (data) => api.post('/flash-sales/set', data);
export const removeFlashSale = (data) => api.post('/flash-sales/remove', data);

// Competitions Management (Admin)
export const createCompetition = (data) => api.post('/competitions', data);
export const updateCompetition = (id, data) => api.put(`/competitions/${id}`, data);
export const getAllCompetitions = () => api.get('/competitions/all');

// ==================== REVIEW ROUTES ====================

// Get reviews for a product
export const getProductReviews = (productId, params) => {
  console.log('📝 Fetching reviews for product:', productId);
  return api.get(`/products/${productId}/reviews`, { params });
};

// Create a review for a product
export const createReview = (productId, data) => {
  console.log('✍️ Creating review for product:', productId);
  return api.post(`/products/${productId}/reviews`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Update a review
export const updateReview = (reviewId, data) => {
  console.log('📝 Updating review:', reviewId);
  return api.put(`/reviews/${reviewId}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Delete a review
export const deleteReview = (reviewId) => {
  console.log('🗑️ Deleting review:', reviewId);
  return api.delete(`/reviews/${reviewId}`);
};

// Get reviews for an affiliate
export const getAffiliateReviews = (affiliateId, params) => {
  console.log('📝 Fetching affiliate reviews:', affiliateId);
  return api.get(`/affiliates/${affiliateId}/reviews`, { params });
};

// Create a review for an affiliate
export const createAffiliateReview = (affiliateId, data) => {
  console.log('✍️ Creating affiliate review:', affiliateId);
  return api.post(`/affiliates/${affiliateId}/reviews`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Get review statistics for a product
export const getReviewStats = (productId) => {
  console.log('📊 Fetching review stats for product:', productId);
  return api.get(`/products/${productId}/reviews/stats`);
};

// Mark a review as helpful
export const markReviewHelpful = (reviewId) => {
  console.log('👍 Marking review as helpful:', reviewId);
  return api.post(`/reviews/${reviewId}/helpful`);
};

// Report a review
export const reportReview = (reviewId, data) => {
  console.log('🚩 Reporting review:', reviewId);
  return api.post(`/reviews/${reviewId}/report`, data);
};

// Get all reviews (admin)
export const getAllReviews = (params) => {
  console.log('📝 Fetching all reviews for admin');
  return api.get('/admin/reviews', { params });
};

// Approve a review (admin)
export const approveReview = (reviewId) => {
  console.log('✅ Approving review:', reviewId);
  return api.put(`/admin/reviews/${reviewId}/approve`);
};

// Reject a review (admin)
export const rejectReview = (reviewId) => {
  console.log('❌ Rejecting review:', reviewId);
  return api.put(`/admin/reviews/${reviewId}/reject`);
};

// ==================== AUTH HELPER ====================

// Get current user info (useful for debugging)
export const getCurrentUser = () => api.get('/auth/me');

// Logout helper
export const logout = () => {
  Cookies.remove('bib_token', { path: '/' });
  Cookies.remove('bib_user', { path: '/' });
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bib_token');
    localStorage.removeItem('bib_user');
    window.location.href = '/auth/login';
  }
};

// Check if user is admin (client-side helper)
export const isAdmin = async () => {
  try {
    const response = await getCurrentUser();
    return response.data.user?.is_admin === true;
  } catch (error) {
    return false;
  }
};

// ==================== DEFAULT EXPORT ====================

export default api;
