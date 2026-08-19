-- Recalculate products.sold_count from paid or delivered orders only.
-- Paste into Supabase SQL Editor after deploying this change.

UPDATE public.products p
SET
  sold_count = COALESCE(s.qty, 0),
  updated_at = NOW()
FROM (
  SELECT
    (item->>'product_id')::uuid AS product_id,
    SUM(GREATEST(COALESCE((item->>'quantity')::int, 1), 0)) AS qty
  FROM public.orders o
  CROSS JOIN LATERAL jsonb_array_elements(o.items) AS item
  WHERE COALESCE(o.status, '') <> 'cancelled'
    AND (
      COALESCE(o.payment_status, '') = 'paid'
      OR COALESCE(o.status, '') = 'delivered'
    )
    AND (item->>'product_id') IS NOT NULL
  GROUP BY 1
) s
WHERE p.id = s.product_id;

UPDATE public.products
SET sold_count = 0, updated_at = NOW()
WHERE id NOT IN (
  SELECT DISTINCT (item->>'product_id')::uuid
  FROM public.orders o
  CROSS JOIN LATERAL jsonb_array_elements(o.items) AS item
  WHERE COALESCE(o.status, '') <> 'cancelled'
    AND (
      COALESCE(o.payment_status, '') = 'paid'
      OR COALESCE(o.status, '') = 'delivered'
    )
    AND (item->>'product_id') IS NOT NULL
);
