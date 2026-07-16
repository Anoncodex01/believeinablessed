import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    res.json({ categories: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/categories - admin
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, name_sw, slug, icon, sort_order } = req.body;
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, name_sw: name_sw || name, slug, icon, sort_order: Number(sort_order) || 0, is_active: true })
      .select().single();
    if (error) throw error;
    res.status(201).json({ category: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/categories/:id
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(req.body)
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json({ category: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await supabase.from('categories').update({ is_active: false }).eq('id', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
