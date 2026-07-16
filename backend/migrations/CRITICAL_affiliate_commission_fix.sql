-- ============================================================
-- CRITICAL: run this in Supabase → SQL Editor → New Query → Run
-- Safe to run multiple times.
--
-- This fixes the root cause behind nearly every 500 error you've been
-- seeing: your application code (affiliate approval, delivery-based
-- commissions, withdrawals, leaderboard) already does the right thing,
-- but the database is missing a large number of columns that code reads
-- and writes. Supabase returns "column not found" / "table not found"
-- errors for all of them, which is what you've been seeing in the
-- browser console.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------
-- USERS: affiliate application/approval workflow
-- ---------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_requested_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_approved_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_approved_by TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_social_media TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_experience TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_experience_years INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_admin_notes TEXT;

-- Existing affiliates who were manually approved before this column existed
-- shouldn't suddenly disappear from "approved affiliate" queries.
UPDATE users SET affiliate_approved = TRUE WHERE role = 'affiliate' AND affiliate_approved IS NOT TRUE;

-- role: code sets 'affiliate_pending' while an application is awaiting review.
-- Your users table already has at least one row whose role isn't in the
-- plain list below (that's what caused the constraint error), so instead
-- of guessing what it is and possibly resetting someone's real role, this
-- reads every distinct role value that actually exists in your table and
-- includes it automatically - nobody's data gets touched.
DO $$
DECLARE
  existing_roles TEXT;
BEGIN
  SELECT string_agg(DISTINCT quote_literal(role), ', ')
  INTO existing_roles
  FROM users
  WHERE role IS NOT NULL;

  EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check';

  EXECUTE format(
    'ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (''customer'', ''affiliate'', ''affiliate_pending'', ''admin''%s))',
    CASE WHEN existing_roles IS NOT NULL THEN ', ' || existing_roles ELSE '' END
  );
END $$;

-- affiliate_level: the tier system uses 'platinum' (old schema only had
-- 'diamond'). Same self-healing approach - include whatever values already
-- exist in the table so this can never fail on data we don't know about.
DO $$
DECLARE
  existing_levels TEXT;
BEGIN
  SELECT string_agg(DISTINCT quote_literal(affiliate_level), ', ')
  INTO existing_levels
  FROM users
  WHERE affiliate_level IS NOT NULL;

  EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS users_affiliate_level_check';

  EXECUTE format(
    'ALTER TABLE users ADD CONSTRAINT users_affiliate_level_check CHECK (affiliate_level IN (''bronze'', ''silver'', ''gold'', ''diamond'', ''platinum'', ''vip''%s))',
    CASE WHEN existing_levels IS NOT NULL THEN ', ' || existing_levels ELSE '' END
  );
END $$;

-- ---------------------------------------------------------------
-- ORDERS: denormalized affiliate info + commission tracking
-- ---------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_total DECIMAL(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_tier TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS country_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone_local TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- ---------------------------------------------------------------
-- AFFILIATE_ORDERS: this is the table that makes "commission only after
-- admin clicks Delivered, reversed on Cancel" actually work. All of these
-- were missing, so that logic has been silently failing.
-- ---------------------------------------------------------------
ALTER TABLE affiliate_orders ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE affiliate_orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE affiliate_orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE affiliate_orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE affiliate_orders ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2);
ALTER TABLE affiliate_orders ADD COLUMN IF NOT EXISTS tier_at_time TEXT;
ALTER TABLE affiliate_orders ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE affiliate_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ---------------------------------------------------------------
-- WITHDRAWALS: approve/reject/mark-paid workflow
-- ---------------------------------------------------------------
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS tier_at_time TEXT;

-- ---------------------------------------------------------------
-- mobile_money_transactions (manual M-Pesa / Airtel / Tigo verification)
-- same table from the previous urgent fix - included here too so this one
-- file covers everything in a single run.
-- ---------------------------------------------------------------
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

-- ---------------------------------------------------------------
-- Done. After running this, go to Supabase → Settings → API and click
-- "Reload schema cache" (or wait ~60 seconds) so PostgREST picks everything
-- up immediately instead of waiting for its normal cache refresh.
-- ---------------------------------------------------------------
