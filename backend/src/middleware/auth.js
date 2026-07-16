// middleware/auth.js
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's admin (special admin user)
    if (decoded.id === 'admin-001') {
      req.user = {
        id: 'admin-001',
        name: 'Admin',
        email: process.env.ADMIN_EMAIL,
        role: 'admin'
      };
      return next();
    }

    // Fetch full user data from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token - user not found' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, error: 'Account is not active' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    console.error('Auth error:', error);
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized - please login' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

export const requireAffiliate = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized - please login' });
  }
  if (!['affiliate', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Affiliate access required' });
  }
  next();
};

export const requireApprovedAffiliate = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized - please login' });
  }
  
  // Admin bypass
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role !== 'affiliate') {
    return res.status(403).json({ success: false, error: 'Affiliate access required' });
  }

  // Check if affiliate is approved
  if (!req.user.affiliate_approved || req.user.status !== 'active') {
    return res.status(403).json({ 
      success: false, 
      error: 'Your affiliate account is pending approval. Please wait for admin approval.' 
    });
  }

  next();
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.id === 'admin-001') {
        req.user = {
          id: 'admin-001',
          name: 'Admin',
          email: process.env.ADMIN_EMAIL,
          role: 'admin'
        };
      } else {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.id)
          .single();
        
        if (user && user.status === 'active') {
          req.user = user;
        }
      }
    }
  } catch (_) {
    // Ignore errors for optional auth
  }
  next();
};