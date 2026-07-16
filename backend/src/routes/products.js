// routes/products.js
import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { uploadProduct } from '../config/cloudinary.js';

const router = express.Router();

// Helper function to parse array fields
const parseArrayField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    // Handle comma-separated strings like "s,m,l" or "red,blue"
    if (value.includes(',')) {
      return value.split(',').map(item => item.trim()).filter(item => item);
    }
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
};

// Helper to clean undefined values
const cleanUndefined = (obj) => {
  Object.keys(obj).forEach(key => {
    if (obj[key] === undefined || obj[key] === 'undefined') {
      delete obj[key];
    }
  });
  return obj;
};

// GET /api/products - list all active products
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search, trending, flash_sale, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (category) query = query.eq('category_id', category);
    if (trending === 'true') query = query.eq('is_trending', true);
    if (flash_sale === 'true') query = query.eq('is_flash_sale', true);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ products: data, total: count });
  } catch (err) {
    console.error('GET products error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('id', req.params.id)
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Track view
    try {
      await supabase.rpc('increment_product_views', { product_id: req.params.id });
    } catch (rpcError) {
      console.warn('RPC error (non-critical):', rpcError.message);
    }

    res.json({ product });
  } catch (err) {
    console.error('GET product by ID error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products - admin only
router.post('/', authenticate, requireAdmin, uploadProduct.array('images', 6), async (req, res) => {
  try {
    console.log('Creating product with body:', req.body);
    console.log('Files:', req.files?.length || 0);
    
    const {
      name, name_sw, description, description_sw,
      price, sale_price, category_id, stock,
      sizes, colors, is_trending, is_flash_sale,
      commission_rate, flash_sale_end_date,
    } = req.body;

    const images = req.files?.map(f => f.path) || [];

    // Parse sizes and colors properly
    const parsedSizes = parseArrayField(sizes);
    const parsedColors = parseArrayField(colors);

    const productData = {
      name,
      name_sw: name_sw || name,
      description,
      description_sw: description_sw || description,
      price: Number(price),
      sale_price: sale_price ? Number(sale_price) : null,
      category_id,
      stock: Number(stock) || 0,
      sizes: parsedSizes,
      colors: parsedColors,
      images,
      is_trending: is_trending === 'true' || is_trending === true,
      is_flash_sale: is_flash_sale === 'true' || is_flash_sale === true,
      flash_sale_end_date: flash_sale_end_date || null,
      commission_rate: Number(commission_rate) || Number(process.env.DEFAULT_AFFILIATE_COMMISSION) || 10,
      status: 'active',
      views: 0,
      sold_count: 0,
    };

    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ product: data });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id - admin only (FIXED VERSION)
router.put('/:id', authenticate, requireAdmin, uploadProduct.array('images', 6), async (req, res) => {
  try {
    console.log('Updating product ID:', req.params.id);
    console.log('Update body:', req.body);
    
    // First, check if product exists
    const { data: existingProduct, error: findError } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (findError || !existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Start with existing product data
    const updates = { ...existingProduct };
    
    // Override with new values from request body
    const {
      name,
      name_sw,
      description,
      description_sw,
      price,
      sale_price,
      category_id,
      stock,
      sizes,
      colors,
      is_trending,
      is_flash_sale,
      commission_rate,
      flash_sale_end_date,
      status
    } = req.body;
    
    // Update text fields
    if (name !== undefined) updates.name = name;
    if (name_sw !== undefined) updates.name_sw = name_sw;
    if (description !== undefined) updates.description = description;
    if (description_sw !== undefined) updates.description_sw = description_sw;
    if (category_id !== undefined) updates.category_id = category_id;
    if (status !== undefined) updates.status = status;
    
    // Update numeric fields
    if (price !== undefined && price !== '') updates.price = Number(price);
    if (sale_price !== undefined && sale_price !== '') updates.sale_price = Number(sale_price);
    if (stock !== undefined && stock !== '') updates.stock = Number(stock);
    if (commission_rate !== undefined && commission_rate !== '') updates.commission_rate = Number(commission_rate);
    
    // Update array fields
    if (sizes !== undefined) updates.sizes = parseArrayField(sizes);
    if (colors !== undefined) updates.colors = parseArrayField(colors);
    
    // Update image array (append new images to existing)
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => f.path);
      updates.images = [...(updates.images || []), ...newImages];
    }
    
    // Update boolean fields
    if (is_trending !== undefined) {
      updates.is_trending = is_trending === 'true' || is_trending === true;
    }
    if (is_flash_sale !== undefined) {
      updates.is_flash_sale = is_flash_sale === 'true' || is_flash_sale === true;
    }
    
    // Update flash sale end date
    if (flash_sale_end_date !== undefined) {
      updates.flash_sale_end_date = flash_sale_end_date || null;
    }
    
    // Add updated timestamp
    updates.updated_at = new Date().toISOString();
    
    // Remove any undefined values
    cleanUndefined(updates);
    
    console.log('Final updates to save:', updates);
    
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    
    console.log('Product updated successfully:', data.id);
    res.json({ product: data, message: 'Product updated successfully' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id - admin only
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ status: 'deleted' })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;