-- =============================================
-- HOW schema works
-- ---------------------------------------------
-- backend/database_schema.sql is only a BLUEPRINT.
-- Tables exist in Supabase ONLY if that SQL (or
-- migrations) was actually run there.
--
-- Your app can use one Supabase project while the
-- SQL editor is open on another — that causes
-- "relation does not exist" for users / affiliate_orders.
--
-- Expected (from database_schema.sql):
--   users, categories, products, orders,
--   affiliate_links, affiliate_clicks, affiliate_orders,
--   withdrawals, slides, coupons, competitions,
--   competition_entries, settings
--
-- Extra (from migrations):
--   mobile_money_transactions
--   + extra columns on orders / affiliate_orders
-- =============================================

-- STEP 1 — run this alone. Paste the result if wipe still fails.
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- STEP 2 — after you confirm `orders` is in the list above,
-- run ONLY the deletes for tables you actually have.
-- Skip any line that errors with "does not exist".

-- Usually present:
DELETE FROM public.orders;

-- Only if STEP 1 listed these (skip if missing):
-- DELETE FROM public.affiliate_orders;
-- DELETE FROM public.affiliate_clicks;
-- DELETE FROM public.withdrawals;
-- DELETE FROM public.mobile_money_transactions;
-- DELETE FROM public.affiliate_links;

-- Only if STEP 1 listed `users`:
-- UPDATE public.users
-- SET total_earnings = 0,
--     pending_earnings = 0,
--     withdrawable_balance = 0,
--     updated_at = NOW();

-- Only if STEP 1 listed `products`:
-- UPDATE public.products
-- SET sold_count = 0, updated_at = NOW()
-- WHERE COALESCE(sold_count, 0) <> 0;

-- Only if STEP 1 listed `coupons`:
-- UPDATE public.coupons
-- SET used_count = 0
-- WHERE COALESCE(used_count, 0) <> 0;
