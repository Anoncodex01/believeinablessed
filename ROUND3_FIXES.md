# Round 3 fixes

## 1. "Could not find the table 'public.mobile_money_transactions'" - run this SQL

Your database is missing a table the backend already expects. Run
`backend/migrations/URGENT_fix_mobile_money_table.sql` in Supabase → SQL
Editor → New Query → Run. Then go to Supabase → Settings → API and hit
"Reload schema cache" (or wait ~60s). Try "Pay with M-Pesa" again - the 500
will be gone.

(This is the same table defined in your existing
`backend/migrations/2026_07_payments_upgrade.sql` — if you've genuinely
never run that whole migration, run that one instead; it also created your
tier/withdrawal/coupon tables.)

## 2. Order showing in admin immediately, before payment lands

This part is intentional and was already handled: the admin `/admin/orders`
page already labels unpaid orders clearly - it filters `isPaid =
payment_status === 'paid'`, and pending M-Pesa/Airtel/Tigo submissions get
their own "⏳ N Mobile Money Payments Awaiting Verification" banner at the
top. An order has to exist the moment it's created so you (the admin) can
see and verify it - what matters is that it's never confused with a paid
one, which it already isn't. Nothing changed here; just wanted you to know
where to look.

## 3. Straight to tracking immediately after payment

- Pesapal success → redirects straight to `/track?order=...`, no click
  needed.
- M-Pesa manual code submitted → same, straight to `/track?order=...`. The
  tracking page shows "Confirming your payment" (auto-checks every 10s)
  until you verify the code in admin, then flips into the full delivery
  tracker automatically.
- Cash on Delivery → also goes straight to `/track?order=...` (see #4).

The old inline "Thank You" success screen is no longer used by any payment
path.

## 4. Cash on Delivery is back

Added back as a third option alongside Pesapal and M-Pesa. Since there's no
online payment to wait for, a Cash order is trackable immediately - it
isn't held behind the "only paid orders show up" rule the way Pesapal/M-Pesa
orders are.

## 5. Leaderboard showing 0 sales - found and fixed a real bug

`GET /api/affiliates/leaderboard` never sent a `sales` field at all, but the
homepage leaderboard component reads `leader.sales`, so it always rendered
0 regardless of real activity. Fixed - the endpoint now returns each
affiliate's confirmed order count.

One thing to know about how "confirmed" works in this codebase (by design,
not new): a sale only counts toward the leaderboard/commission once the
order is marked **delivered** by an admin (see `confirmOrderCommission` in
`orders.js`) - not the moment it's paid. This protects against counting
orders that get cancelled or refunded before delivery. So if your leaderboard
is still showing low numbers after this fix, check whether any orders have
actually been marked "delivered" in `/admin/orders` yet - if none have, 0 is
correct, not a bug.

## Files touched this round

- `backend/migrations/URGENT_fix_mobile_money_table.sql` - new, run this
- `backend/src/routes/affiliates.js` - leaderboard now returns `sales`
- `frontend/src/app/checkout/page.jsx` - Cash re-added, all 3 payment paths
  redirect straight to `/track` after completing
