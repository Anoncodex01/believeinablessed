-- Optional dedicated Snippe columns (not required for current code).
-- Current implementation reuses:
--   pesapal_order_tracking_id  → Snippe payment reference
--   pesapal_payment_reference  → Snippe external reference
--   stripe_payment_status      → Snippe payment type (mobile|card)
--   mpesa_checkout_request_id  → Snippe channel
--   mpesa_receipt_number       → Snippe failure reason
--
-- Run this later if you want dedicated column names, then update
-- COL mapping in backend/src/routes/snippe.js.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS snippe_payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS snippe_external_reference TEXT,
  ADD COLUMN IF NOT EXISTS snippe_payment_type TEXT,
  ADD COLUMN IF NOT EXISTS snippe_channel TEXT,
  ADD COLUMN IF NOT EXISTS snippe_failure_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_snippe_payment_reference
  ON orders (snippe_payment_reference);

CREATE INDEX IF NOT EXISTS idx_orders_pesapal_order_tracking_id
  ON orders (pesapal_order_tracking_id);
