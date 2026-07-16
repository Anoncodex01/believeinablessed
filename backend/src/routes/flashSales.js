import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_flash_sale', true)
      .eq('status', 'active')
      .gt('flash_sale_end_date', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ products: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/set', authenticate, requireAdmin, async (req, res) => {
  try {
    const { product_ids, flash_sale_end_date, flash_price } = req.body;
    for (const id of product_ids) {
      const updates = { is_flash_sale: true, flash_sale_end_date };
      if (flash_price) updates.sale_price = Number(flash_price);
      await supabase.from('products').update(updates).eq('id', id);
    }
    res.json({ message: 'Flash sale set' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/remove', authenticate, requireAdmin, async (req, res) => {
  try {
    const { product_ids } = req.body;
    await supabase.from('products')
      .update({ is_flash_sale: false, flash_sale_end_date: null })
      .in('id', product_ids);
    res.json({ message: 'Flash sale removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
