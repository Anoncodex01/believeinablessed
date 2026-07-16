// routes/slides.js
import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadSlide } from '../config/cloudinary.js';

const router = express.Router();

// Helper function to optimize Cloudinary URLs
const optimizeImageUrl = (url, width = 1920, height = 800) => {
  if (!url) return url;
  
  // Check if it's a Cloudinary URL
  if (url.includes('cloudinary.com')) {
    // Add transformation parameters for optimal display
    // c_limit = Maintain aspect ratio without cropping
    // q_auto = Automatic quality optimization
    // f_auto = Automatic format selection
    return url.replace('/upload/', `/upload/w_${width},h_${height},c_limit,q_auto,f_auto/`);
  }
  
  return url;
};

// GET /api/slides - public
router.get('/', async (req, res) => {
  try {
    console.log('📸 Fetching slides...');
    const { data, error } = await supabase
      .from('slides')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    
    // Optimize image URLs for better display
    const optimizedSlides = (data || []).map(slide => ({
      ...slide,
      image_url: optimizeImageUrl(slide.image_url, 1920, 800),
      // Also provide smaller version for mobile
      image_url_mobile: optimizeImageUrl(slide.image_url, 768, 600),
    }));
    
    console.log(`✅ Found ${optimizedSlides?.length || 0} slides`);
    res.json({ slides: optimizedSlides });
  } catch (err) {
    console.error('❌ Error fetching slides:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/slides - admin create slide
router.post('/', authenticate, requireAdmin, (req, res, next) => {
  console.log('📝 POST /api/slides - Upload middleware starting');
  next();
}, uploadSlide.single('image'), async (req, res) => {
  try {
    console.log('✅ Upload middleware completed');
    console.log('File:', req.file ? 'Uploaded successfully' : 'No file');
    
    const { 
      title, 
      title_sw, 
      subtitle, 
      subtitle_sw, 
      button_text, 
      button_text_sw, 
      link, 
      sort_order 
    } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Get image URL from Cloudinary (already optimized by Cloudinary)
    const image_url = req.file?.path || req.body.image_url;
    
    if (!image_url) {
      return res.status(400).json({ error: 'Image is required' });
    }
    
    console.log('🖼️ Image URL:', image_url);
    
    // Insert into database
    const { data, error } = await supabase
      .from('slides')
      .insert({
        title: title,
        title_sw: title_sw || title,
        subtitle: subtitle || '',
        subtitle_sw: subtitle_sw || subtitle || '',
        button_text: button_text || 'Shop Now',
        button_text_sw: button_text_sw || 'Nunua Sasa',
        link: link || '/products',
        image_url: image_url, // Store original URL
        sort_order: parseInt(sort_order) || 0,
        is_active: true,
      })
      .select()
      .single();
      
    if (error) {
      console.error('❌ Supabase insert error:', error);
      throw error;
    }
    
    console.log('✅ Slide created successfully:', data.id);
    res.status(201).json({ success: true, slide: data });
  } catch (err) {
    console.error('❌ Error creating slide:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/slides/:id - admin update slide
router.put('/:id', authenticate, requireAdmin, uploadSlide.single('image'), async (req, res) => {
  try {
    console.log(`📝 PUT /api/slides/${req.params.id}`);
    
    const { id } = req.params;
    const updates = { ...req.body };
    
    // Convert sort_order to number
    if (updates.sort_order) {
      updates.sort_order = parseInt(updates.sort_order);
    }
    
    // If there's a new image, use it
    if (req.file) {
      updates.image_url = req.file.path;
    }
    
    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined || updates[key] === 'undefined') {
        delete updates[key];
      }
    });
    
    const { data, error } = await supabase
      .from('slides')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    console.log('✅ Slide updated:', data.id);
    res.json({ success: true, slide: data });
  } catch (err) {
    console.error('❌ Error updating slide:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/slides/:id - admin soft delete
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('slides')
      .update({ is_active: false })
      .eq('id', id);
      
    if (error) throw error;
    
    res.json({ success: true, message: 'Slide deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting slide:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;