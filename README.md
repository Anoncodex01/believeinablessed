# 🛍️ BelieveinaBlessed — Full Stack Fashion E-Commerce & Affiliate Platform

Tanzania's premier fashion e-commerce platform with a built-in affiliate system, admin dashboard, multilingual support (English/Swahili), dark/light mode, and cloud-first architecture.

---

## 🏗️ Project Structure

```
believeinablessed/
├── backend/              # Express.js REST API
│   ├── src/
│   │   ├── config/       # Supabase, Cloudinary config
│   │   ├── middleware/   # JWT auth middleware
│   │   ├── routes/       # All API routes
│   │   └── server.js     # Entry point
│   ├── database_schema.sql   # Full Supabase schema + functions
│   ├── .env.example      # Backend env template
│   └── package.json
│
└── frontend/             # Next.js 14 App Router
    ├── src/
    │   ├── app/
    │   │   ├── page.jsx            # Homepage
    │   │   ├── products/           # Products listing + detail
    │   │   ├── cart/               # Shopping cart
    │   │   ├── checkout/           # Checkout + order placement
    │   │   ├── track/              # Order tracking
    │   │   ├── affiliate/          # Affiliate landing + dashboard
    │   │   ├── competition/        # Monthly competition page
    │   │   ├── auth/               # Login + Register
    │   │   └── admin/              # Full admin dashboard
    │   ├── components/
    │   │   ├── layout/             # Navbar, Footer, BottomNav
    │   │   ├── home/               # Hero, FlashSale, Trending, etc.
    │   │   ├── product/            # ProductCard
    │   │   └── ui/                 # WhatsApp button, etc.
    │   ├── contexts/               # Auth, Cart, Lang providers
    │   └── lib/                    # API utility
    ├── .env.example
    └── package.json
```

---

## ⚙️ Setup Guide

### Step 1: Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open the **SQL Editor** in your Supabase dashboard
3. Copy the entire contents of `backend/database_schema.sql` and run it
4. Go to **Settings → API** and copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. From the dashboard, copy:
   - Cloud Name → `CLOUDINARY_CLOUD_NAME`
   - API Key → `CLOUDINARY_API_KEY`
   - API Secret → `CLOUDINARY_API_SECRET`

### Step 3: Backend Setup

```bash
cd backend

# Copy env file
cp .env.example .env

# Fill in your .env with:
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
# CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
# JWT_SECRET=any_long_random_string_at_least_32_chars
# ADMIN_EMAIL=believeinablessed@gmail.com
# ADMIN_PASSWORD=your_chosen_admin_password

# Install dependencies
npm install

# Start development server
npm run dev
```

Backend runs on: http://localhost:5000

### Step 4: Frontend Setup

```bash
cd frontend

# Copy env file
cp .env.example .env.local

# Fill in:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
# NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Install dependencies
npm install

# Start development
npm run dev
```

Frontend runs on: http://localhost:3000

---

## 🔑 Admin Login

- **URL:** `/admin` (redirects to `/auth/login`)
- **Email:** `believeinablessed@gmail.com`
- **Password:** Whatever you set in `ADMIN_PASSWORD` in backend `.env`

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Admin** | Full dashboard: products, orders, affiliates, slides, categories, coupons, competitions, settings |
| **Affiliate** | Affiliate dashboard: generate links, track earnings, withdraw |
| **Customer** | Browse, buy (guest checkout supported) |

---

## 🌟 Key Features

### 🛒 E-Commerce
- Full product catalog (clothes only)
- Categories management
- Product variants (size, color)
- Image upload via Cloudinary
- Guest checkout
- Order tracking by order number
- Coupon codes
- Flash sales with countdown timer
- Trending products

### 💰 Affiliate System
- Unique referral codes per user
- Product-specific affiliate links
- Commission tracking per sale
- 5 affiliate levels: Bronze → Silver → Gold → Diamond → VIP
- Earnings dashboard with charts
- Withdrawal requests (M-Pesa, Tigo Pesa, Airtel Money)
- Admin approval workflow
- Click & conversion tracking
- Real-time leaderboard

### 📊 Admin Dashboard
- Revenue analytics (30-day charts)
- Order management with status updates
- Product CRUD with image upload
- Category management
- Slide/hero carousel management
- Flash sale management
- Coupon creator
- Affiliate management & level control
- Withdrawal approval/rejection
- Competition management
- User management
- Platform settings

### 🌍 Multilingual
- English & Kiswahili (toggle in navbar)
- All UI text, product names, descriptions support both languages
- Persistent language preference (localStorage)

### 🎨 Design
- Dark mode & Light mode (instant toggle)
- Mobile-first responsive design
- Sticky bottom navigation on mobile
- Glassmorphism UI elements
- Smooth Framer Motion animations
- Floating WhatsApp button (+255747110777)

---

## 🚀 Production Deployment

### Backend (Railway/Render)
```bash
# Set all environment variables in your hosting dashboard
# Change FRONTEND_URL to your production domain
npm start
```

### Frontend (Vercel)
```bash
# Set NEXT_PUBLIC_API_URL to your backend production URL
npm run build
```

---

## 📞 Contact

- **WhatsApp:** +255 747 110 777
- **Email:** believeinablessed@gmail.com

---

## 📋 Supabase Functions Required

These RPC functions are included in `database_schema.sql`:
- `increment_product_views(product_id)`
- `decrement_stock(product_id, qty)`
- `add_pending_earnings(affiliate_id, amount)`
- `confirm_affiliate_commission(order_id)`
- `refund_withdrawal(withdrawal_id)`

---

Built with ❤️ for Tanzania 🇹🇿
