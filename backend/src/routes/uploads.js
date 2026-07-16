// routes/uploads.js
import express from 'express';
import { uploadProduct, uploadSlide, uploadAvatar } from '../config/cloudinary.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/uploads/product
router.post('/product', authenticate, requireAdmin, uploadProduct.array('images', 6), (req, res) => {
  try {
    const urls = req.files?.map(f => f.path) || [];
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/uploads/slide
router.post('/slide', authenticate, requireAdmin, uploadSlide.single('image'), (req, res) => {
  try {
    res.json({ url: req.file?.path });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/uploads/avatar
router.post('/avatar', authenticate, uploadAvatar.single('avatar'), (req, res) => {
  try {
    res.json({ url: req.file?.path });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;