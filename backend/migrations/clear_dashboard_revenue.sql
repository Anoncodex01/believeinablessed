-- Reset admin "Total revenue" to TSh 0.
-- Paste into Supabase → SQL Editor (same project as the live site).
-- Keeps products, users, and catalog. Deletes orders and related money rows.

DO $$
BEGIN
  IF to_regclass('public.affiliate_orders') IS NOT NULL THEN
    DELETE FROM public.affiliate_orders;
  END IF;

  IF to_regclass('public.affiliate_clicks') IS NOT NULL THEN
    DELETE FROM public.affiliate_clicks;
  END IF;

  IF to_regclass('public.mobile_money_transactions') IS NOT NULL THEN
    DELETE FROM public.mobile_money_transactions;
  END IF;

  IF to_regclass('public.withdrawals') IS NOT NULL THEN
    DELETE FROM public.withdrawals;
  END IF;

  IF to_regclass('public.orders') IS NOT NULL THEN
    DELETE FROM public.orders;
  END IF;

  IF to_regclass('public.users') IS NOT NULL THEN
    UPDATE public.users
    SET
      total_earnings = 0,
      pending_earnings = 0,
      withdrawable_balance = 0,
      updated_at = NOW()
    WHERE role = 'affiliate';
  END IF;

  IF to_regclass('public.products') IS NOT NULL THEN
    UPDATE public.products
    SET sold_count = 0, updated_at = NOW()
    WHERE COALESCE(sold_count, 0) <> 0;
  END IF;

  IF to_regclass('public.coupons') IS NOT NULL THEN
    UPDATE public.coupons
    SET used_count = 0
    WHERE COALESCE(used_count, 0) <> 0;
  END IF;
END $$;
