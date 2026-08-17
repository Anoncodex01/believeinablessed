-- Keep ONLY:
--   - products
--   - categories (needed by products.category_id)
--   - admin users (role = 'admin')
--   - settings (site config)
--
-- Deletes customers, affiliates, orders, payments, reviews, coupons, etc.
-- Paste into Supabase → SQL Editor (same project as the live site).
-- Preview first: run the SELECT at the bottom after the wipe, or run this
-- before wiping:
--   SELECT id, name, email, role FROM public.users WHERE role = 'admin';

DO $$
BEGIN
  -- Reviews
  IF to_regclass('public.review_helpful') IS NOT NULL THEN
    DELETE FROM public.review_helpful;
  END IF;
  IF to_regclass('public.review_reports') IS NOT NULL THEN
    DELETE FROM public.review_reports;
  END IF;
  IF to_regclass('public.reviews') IS NOT NULL THEN
    DELETE FROM public.reviews;
  END IF;

  -- Notifications
  IF to_regclass('public.notifications') IS NOT NULL THEN
    DELETE FROM public.notifications;
  END IF;

  -- Affiliate / commission
  IF to_regclass('public.affiliate_orders') IS NOT NULL THEN
    DELETE FROM public.affiliate_orders;
  END IF;
  IF to_regclass('public.affiliate_clicks') IS NOT NULL THEN
    DELETE FROM public.affiliate_clicks;
  END IF;
  IF to_regclass('public.affiliate_links') IS NOT NULL THEN
    DELETE FROM public.affiliate_links;
  END IF;
  IF to_regclass('public.withdrawals') IS NOT NULL THEN
    DELETE FROM public.withdrawals;
  END IF;

  -- Payments
  IF to_regclass('public.mobile_money_transactions') IS NOT NULL THEN
    DELETE FROM public.mobile_money_transactions;
  END IF;
  IF to_regclass('public.mpesa_transactions') IS NOT NULL THEN
    DELETE FROM public.mpesa_transactions;
  END IF;
  IF to_regclass('public.pesapal_transactions') IS NOT NULL THEN
    DELETE FROM public.pesapal_transactions;
  END IF;

  -- Competitions
  IF to_regclass('public.competition_entries') IS NOT NULL THEN
    DELETE FROM public.competition_entries;
  END IF;
  IF to_regclass('public.competitions') IS NOT NULL THEN
    DELETE FROM public.competitions;
  END IF;

  -- Orders (after child payment / affiliate rows)
  IF to_regclass('public.orders') IS NOT NULL THEN
    DELETE FROM public.orders;
  END IF;

  -- Store extras (not products)
  IF to_regclass('public.coupons') IS NOT NULL THEN
    DELETE FROM public.coupons;
  END IF;
  IF to_regclass('public.slides') IS NOT NULL THEN
    DELETE FROM public.slides;
  END IF;

  -- All non-admin users last
  IF to_regclass('public.users') IS NOT NULL THEN
    DELETE FROM public.users
    WHERE COALESCE(role, '') <> 'admin';
  END IF;

  -- Reset product sales counters (keep the products themselves)
  IF to_regclass('public.products') IS NOT NULL THEN
    UPDATE public.products
    SET
      sold_count = 0,
      views = 0,
      updated_at = NOW();
  END IF;
END $$;

-- Confirm what remains
SELECT id, name, email, role FROM public.users ORDER BY role, email;
SELECT COUNT(*) AS products_left FROM public.products;
SELECT COUNT(*) AS orders_left FROM public.orders;
SELECT COUNT(*) AS users_left FROM public.users;
