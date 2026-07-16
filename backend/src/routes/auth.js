// routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, referral_code } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const myReferralCode = `BIB${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password: hashed,
        phone: phone || null,
        role: 'user',
        referral_code: myReferralCode,
        referred_by: referral_code || null,
        status: 'active',
        affiliate_level: null,
        affiliate_approved: false,
        affiliate_requested_at: null,
        total_earnings: 0,
        pending_earnings: 0,
        withdrawable_balance: 0,
      })
      .select()
      .single();

    if (error) throw error;

    const token = signToken(user);
    const { password: _, ...safeUser } = user;
    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Admin check first
    if (email === process.env.ADMIN_EMAIL) {
      if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const adminUser = {
        id: 'admin-001',
        name: 'Admin',
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
      };
      const token = signToken(adminUser);
      return res.json({ token, user: adminUser });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.status !== 'active') return res.status(403).json({ error: 'Account suspended' });

    const token = signToken(user);
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin') return res.json({ user: req.user });

    const { data: user, error } = await supabase
      .from('users')
      .select('id,name,email,phone,role,referral_code,affiliate_level,total_earnings,pending_earnings,withdrawable_balance,avatar_url,status,created_at,affiliate_approved,affiliate_requested_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json({ user });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== AFFILIATE REQUEST ROUTES ====================

// POST /api/auth/request-affiliate - User requests to become an affiliate
router.post('/request-affiliate', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone } = req.body;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, affiliate_approved, affiliate_requested_at, status')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    if (user.role === 'affiliate' && user.affiliate_approved) {
      return res.status(400).json({ 
        success: false, 
        error: 'You are already an approved affiliate' 
      });
    }

    if (user.affiliate_requested_at && user.role === 'affiliate' && !user.affiliate_approved) {
      return res.status(400).json({ 
        success: false, 
        error: 'You have already requested to become an affiliate. Please wait for admin approval.' 
      });
    }

    const referralCode = `BIB${userId.substring(0, 6).toUpperCase()}`;

    const { data, error } = await supabase
      .from('users')
      .update({
        role: 'affiliate',
        affiliate_approved: false,
        affiliate_requested_at: new Date().toISOString(),
        phone: phone || user.phone,
        status: 'pending',
        referral_code: referralCode,
        affiliate_level: 'bronze',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    console.log(`📝 Affiliate request submitted by ${user.email} (${userId})`);

    res.json({
      success: true,
      message: 'Affiliate request submitted successfully. Please wait for admin approval.',
      data: { 
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        affiliate_approved: data.affiliate_approved,
        status: data.status,
        referral_code: data.referral_code
      }
    });
  } catch (error) {
    console.error('Error requesting affiliate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/affiliate-status - Check affiliate request status
router.get('/affiliate-status', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, affiliate_approved, affiliate_requested_at, status, referral_code')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        isAffiliate: data.role === 'affiliate',
        isApproved: data.affiliate_approved || false,
        requestedAt: data.affiliate_requested_at,
        status: data.status,
        isPending: data.role === 'affiliate' && !data.affiliate_approved,
        referralCode: data.referral_code
      }
    });
  } catch (error) {
    console.error('Error checking affiliate status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ADMIN ROUTES FOR AFFILIATE APPROVAL ====================

// GET /api/auth/admin/pending-affiliates - Get pending affiliate requests
router.get('/admin/pending-affiliates', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, affiliate_requested_at, created_at, referral_code, status')
      .eq('role', 'affiliate')
      .eq('affiliate_approved', false)
      .eq('status', 'pending')
      .order('affiliate_requested_at', { ascending: true });

    if (error) throw error;

    res.json({ 
      success: true, 
      pending: data || [] 
    });
  } catch (error) {
    console.error('Error fetching pending affiliates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/auth/admin/approve-affiliate/:id - Approve an affiliate
router.put('/admin/approve-affiliate/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { id } = req.params;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, affiliate_approved, email, name')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role !== 'affiliate') {
      return res.status(400).json({ success: false, error: 'User is not an affiliate' });
    }

    if (user.affiliate_approved) {
      return res.status(400).json({ success: false, error: 'Affiliate already approved' });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', id)
      .single();

    let referralCode = userData?.referral_code;
    if (!referralCode) {
      referralCode = `BIB${id.substring(0, 6).toUpperCase()}`;
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        affiliate_approved: true,
        status: 'active',
        referral_code: referralCode,
        affiliate_level: 'bronze',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Affiliate approved: ${user.email} (${id}) by admin ${req.user.email}`);

    res.json({
      success: true,
      message: 'Affiliate approved successfully',
      affiliate: {
        id: data.id,
        name: data.name,
        email: data.email,
        referral_code: data.referral_code,
        affiliate_level: data.affiliate_level,
        status: data.status
      }
    });
  } catch (error) {
    console.error('Error approving affiliate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/auth/admin/reject-affiliate/:id - Reject an affiliate
router.put('/admin/reject-affiliate/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, affiliate_approved, email')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role !== 'affiliate') {
      return res.status(400).json({ success: false, error: 'User is not an affiliate' });
    }

    if (user.affiliate_approved) {
      return res.status(400).json({ success: false, error: 'Affiliate already approved' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        role: 'user',
        affiliate_approved: false,
        status: 'active',
        affiliate_requested_at: null,
        affiliate_level: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log(`❌ Affiliate rejected: ${user.email} (${id}) by admin ${req.user.email}. Reason: ${reason || 'No reason provided'}`);

    res.json({
      success: true,
      message: 'Affiliate request rejected',
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status
      }
    });
  } catch (error) {
    console.error('Error rejecting affiliate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;