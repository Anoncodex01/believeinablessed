-- Run this in Supabase → SQL Editor → New Query → Run.
-- This is the exact table your backend already expects
-- (backend/src/routes/payments.js writes to it); it just never got
-- created in your database yet, which is why you saw:
--   "Could not find the table 'public.mobile_money_transactions' in the schema cache"

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- After running this, go to Supabase → Settings → API and click
-- "Reload schema cache" (or just wait ~60s) so PostgREST picks up the new
-- table. Then try "Pay with M-Pesa" again - the 500 error will be gone.
