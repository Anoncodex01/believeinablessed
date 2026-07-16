import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/competitions - get current/active competition
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ competition: data || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/competitions/all - admin
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ competitions: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/competitions/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { data: competition } = await supabase
      .from('competitions')
      .select('id')
      .eq('status', 'active')
      .single();

    if (!competition) return res.json({ leaderboard: [] });

    const { data, error } = await supabase
      .from('competition_entries')
      .select('*, users(name, avatar_url, affiliate_level)')
      .eq('competition_id', competition.id)
      .order('total_sales', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ leaderboard: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/competitions - admin create
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, title_sw, description, description_sw, prize, prize_sw, start_date, end_date, rules, rules_sw } = req.body;
    const { data, error } = await supabase
      .from('competitions')
      .insert({ title, title_sw: title_sw || title, description, description_sw: description_sw || description, prize, prize_sw: prize_sw || prize, start_date, end_date, rules, rules_sw: rules_sw || rules, status: 'active' })
      .select().single();
    if (error) throw error;
    res.status(201).json({ competition: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/competitions/:id
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('competitions')
      .update(req.body)
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json({ competition: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
