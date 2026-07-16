-- ============================================================
-- Payment integration migration for believeinablessed
-- Safe to run multiple times (IF NOT EXISTS everywhere).
-- Run this in the Supabase SQL editor.
-- ============================================================

-- ---- orders: columns every payment route reads/writes ----
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pesapal_order_tracking_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pesapal_payment_reference TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_client_secret TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mpesa_checkout_request_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mpesa_receipt_number TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- ---- notifications (used by pesapal.js, payments.js, admin.js, notifications.js) ----
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT,
  title TEXT,
  message TEXT,
  link TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ---- pesapal_transactions ----
CREATE TABLE IF NOT EXISTS pesapal_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_number TEXT,
  pesapal_order_tracking_id TEXT UNIQUE,
  pesapal_merchant_reference TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'TZS',
  status TEXT DEFAULT 'pending',
  payment_status TEXT,
  payment_method TEXT,
  payment_reference TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pesapal_tracking ON pesapal_transactions(pesapal_order_tracking_id);
CREATE INDEX IF NOT EXISTS idx_pesapal_order_id ON pesapal_transactions(order_id);

-- ---- mpesa_transactions (Daraja STK Push) ----
CREATE TABLE IF NOT EXISTS mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_number TEXT,
  checkout_request_id TEXT UNIQUE,
  merchant_request_id TEXT,
  phone_number TEXT,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  mpesa_receipt_number TEXT,
  result_code TEXT,
  result_desc TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mpesa_checkout_request ON mpesa_transactions(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_order_id ON mpesa_transactions(order_id);

-- ---- mobile_money_transactions (Airtel Money / Tigo Pesa manual verification) ----
CREATE TABLE IF NOT EXISTS mobile_money_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_number TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('airtel_money', 'tigo_pesa', 'mpesa', 'halopesa')),
  phone_number TEXT,
  reference TEXT NOT NULL,
  status TEXT DEFAULT 'awaiting_verification' CHECK (status IN ('awaiting_verification', 'confirmed', 'rejected')),
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mobile_money_order_id ON mobile_money_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_mobile_money_status ON mobile_money_transactions(status);
