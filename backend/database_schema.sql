-- =============================================
-- BelieveinaBlessed - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'affiliate' CHECK (role IN ('customer', 'affiliate', 'admin')),
  avatar_url TEXT,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  affiliate_level TEXT DEFAULT 'bronze' CHECK (affiliate_level IN ('bronze', 'silver', 'gold', 'diamond', 'vip')),
  total_earnings DECIMAL(12,2) DEFAULT 0,
  pending_earnings DECIMAL(12,2) DEFAULT 0,
  withdrawable_balance DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_sw TEXT,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed categories
INSERT INTO categories (name, name_sw, slug, icon, sort_order) VALUES
  ('Women''s Clothing', 'Nguo za Wanawake', 'womens', '👗', 1),
  ('Men''s Clothing', 'Nguo za Wanaume', 'mens', '👔', 2),
  ('Kids', 'Watoto', 'kids', '👶', 3),
  ('Dresses', 'Mavazi', 'dresses', '👘', 4),
  ('T-Shirts', 'T-Shati', 'tshirts', '👕', 5),
  ('Jackets', 'Jaketi', 'jackets', '🧥', 6),
  ('Shoes', 'Viatu', 'shoes', '👟', 7),
  ('Accessories', 'Vipande', 'accessories', '💍', 8)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- PRODUCTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_sw TEXT,
  description TEXT,
  description_sw TEXT,
  price DECIMAL(12,2) NOT NULL,
  sale_price DECIMAL(12,2),
  category_id UUID REFERENCES categories(id),
  images TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  stock INT DEFAULT 0,
  sold_count INT DEFAULT 0,
  views INT DEFAULT 0,
  is_trending BOOLEAN DEFAULT false,
  is_flash_sale BOOLEAN DEFAULT false,
  flash_sale_end_date TIMESTAMPTZ,
  commission_rate DECIMAL(5,2) DEFAULT 10,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  shipping_address JSONB,
  items JSONB NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  payment_method TEXT DEFAULT 'mpesa',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  affiliate_id UUID REFERENCES users(id),
  referral_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AFFILIATE LINKS
-- =============================================
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  link TEXT,
  referral_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(affiliate_id, product_id)
);

-- =============================================
-- AFFILIATE CLICKS
-- =============================================
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  referral_code TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AFFILIATE ORDERS (commissions)
-- =============================================
CREATE TABLE IF NOT EXISTS affiliate_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  order_amount DECIMAL(12,2),
  commission DECIMAL(12,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
  referral_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- WITHDRAWALS
-- =============================================
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  method TEXT DEFAULT 'mpesa',
  account_details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SLIDES (homepage hero carousel)
-- =============================================
CREATE TABLE IF NOT EXISTS slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  title_sw TEXT,
  subtitle TEXT,
  subtitle_sw TEXT,
  button_text TEXT DEFAULT 'Shop Now',
  button_text_sw TEXT DEFAULT 'Nunua Sasa',
  link TEXT DEFAULT '/products',
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COUPONS
-- =============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('percent', 'fixed')),
  value DECIMAL(10,2) NOT NULL,
  min_order DECIMAL(10,2) DEFAULT 0,
  max_uses INT,
  used_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COMPETITIONS
-- =============================================
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_sw TEXT,
  description TEXT,
  description_sw TEXT,
  prize TEXT,
  prize_sw TEXT,
  rules TEXT,
  rules_sw TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'upcoming')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COMPETITION ENTRIES
-- =============================================
CREATE TABLE IF NOT EXISTS competition_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID REFERENCES competitions(id),
  user_id UUID REFERENCES users(id),
  total_sales INT DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  rank INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competition_id, user_id)
);

-- =============================================
-- SETTINGS
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
  ('site_name', 'BelieveinaBlessed'),
  ('default_commission', '10'),
  ('whatsapp_number', '+255747110777'),
  ('contact_email', 'believeinablessed@gmail.com'),
  ('currency', 'TZS'),
  ('shipping_fee', '3000'),
  ('free_shipping_threshold', '50000')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- RPC FUNCTIONS
-- =============================================

-- Increment product views
CREATE OR REPLACE FUNCTION increment_product_views(product_id UUID)
RETURNS VOID AS $$
  UPDATE products SET views = views + 1 WHERE id = product_id;
$$ LANGUAGE SQL;

-- Decrement stock
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, qty INT)
RETURNS VOID AS $$
  UPDATE products
  SET stock = GREATEST(stock - qty, 0), sold_count = sold_count + qty
  WHERE id = product_id;
$$ LANGUAGE SQL;

-- Add pending earnings
CREATE OR REPLACE FUNCTION add_pending_earnings(affiliate_id UUID, amount DECIMAL)
RETURNS VOID AS $$
  UPDATE users
  SET pending_earnings = pending_earnings + amount
  WHERE id = affiliate_id;
$$ LANGUAGE SQL;

-- Confirm affiliate commission (when order delivered)
CREATE OR REPLACE FUNCTION confirm_affiliate_commission(order_id UUID)
RETURNS VOID AS $$
DECLARE
  aff_id UUID;
  commission_total DECIMAL;
BEGIN
  SELECT affiliate_id INTO aff_id FROM orders WHERE id = order_id;

  SELECT SUM(commission) INTO commission_total
  FROM affiliate_orders
  WHERE order_id = order_id AND status = 'pending';

  IF aff_id IS NOT NULL AND commission_total > 0 THEN
    UPDATE users
    SET pending_earnings = GREATEST(pending_earnings - commission_total, 0),
        total_earnings = total_earnings + commission_total,
        withdrawable_balance = withdrawable_balance + commission_total
    WHERE id = aff_id;

    UPDATE affiliate_orders
    SET status = 'confirmed'
    WHERE order_id = order_id AND status = 'pending';

    -- Update affiliate level based on total earnings
    UPDATE users SET affiliate_level =
      CASE
        WHEN total_earnings >= 5000000 THEN 'vip'
        WHEN total_earnings >= 1000000 THEN 'diamond'
        WHEN total_earnings >= 500000 THEN 'gold'
        WHEN total_earnings >= 100000 THEN 'silver'
        ELSE 'bronze'
      END
    WHERE id = aff_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Refund withdrawal (if rejected)
CREATE OR REPLACE FUNCTION refund_withdrawal(withdrawal_id UUID)
RETURNS VOID AS $$
DECLARE
  aff_id UUID;
  amt DECIMAL;
BEGIN
  SELECT affiliate_id, amount INTO aff_id, amt
  FROM withdrawals WHERE id = withdrawal_id;

  UPDATE users
  SET withdrawable_balance = withdrawable_balance + amt
  WHERE id = aff_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY (basic)
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- For service role (backend), full access is granted automatically
-- These policies are for direct Supabase client access if needed

CREATE POLICY "Service role full access users"
  ON users FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access orders"
  ON orders FOR ALL
  USING (auth.role() = 'service_role');
