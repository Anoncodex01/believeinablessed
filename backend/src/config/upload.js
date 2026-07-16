// config/upload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload directories if they don't exist
const uploadDirs = [
  'uploads',
  'uploads/slides',
  'uploads/products',
  'uploads/avatars',
  'uploads/general'
];

uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`📁 Created directory: ${fullPath}`);
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/general';
    
    // Determine folder based on route or fieldname
    if (req.baseUrl && req.baseUrl.includes('/slides')) {
      folder = 'uploads/slides';
    } else if (req.baseUrl && req.baseUrl.includes('/products')) {
      folder = 'uploads/products';
    } else if (file.fieldname === 'avatar') {
      folder = 'uploads/avatars';
    } else if (file.fieldname === 'slide_image' || file.fieldname === 'image') {
      folder = 'uploads/slides';
    } else if (file.fieldname === 'product_image') {
      folder = 'uploads/products';
    }
    
    const fullPath = path.join(__dirname, '..', folder);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
  }
};

// Create multer instance
export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Export named uploads for different purposes
export const uploadSlide = upload;
export const uploadProduct = upload;
export const uploadAvatar = upload;

export default upload;