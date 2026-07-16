# Round 4: the big one - your database schema was years behind your code

## TL;DR - run this first

**`backend/migrations/CRITICAL_affiliate_commission_fix.sql`** - run it in
Supabase → SQL Editor → Run, then Settings → API → "Reload schema cache".
This is almost certainly the fix for nearly everything you've reported
across our last few rounds: withdrawals, the leaderboard, commissions,
and the manual mobile-money 500s.

## What I found

I went through every place your backend code reads or writes a database
column and cross-checked it against your actual table definitions
(`database_schema.sql` + existing migrations). Your code is actually
well-designed - the delivery-based commission logic you're asking for
**already exists exactly the way you want it**. But dozens of columns that
code depends on were never added to the database, so all of it has been
silently failing:

- `affiliate_orders` was missing `is_confirmed`, `confirmed_at`,
  `cancelled_at`, `cancellation_reason`, `commission_rate`, `tier_at_time`,
  `product_name`, `updated_at` - i.e. almost every column the
  delivery-confirmation and cancellation-reversal logic touches.
- `users` was missing `affiliate_approved`, `affiliate_requested_at`,
  `affiliate_approved_at`, `affiliate_approved_by`, `affiliate_phone`,
  `affiliate_social_media`, `affiliate_experience(_years)`,
  `affiliate_admin_notes` - your whole "apply to become an affiliate /
  admin approves" workflow.
- `users.role` didn't allow `'affiliate_pending'`, and
  `users.affiliate_level` didn't allow `'platinum'` - both values your own
  code writes. Every write hit a check-constraint violation.
- `withdrawals` was missing `completed_at` and `tier_at_time` - this was
  your literal reported error.
- `orders` was missing `affiliate_name`, `affiliate_email`,
  `commission_status`, `commission_total`, `affiliate_tier`,
  `country_code`, `country_name`, `customer_phone_local`.
- `mobile_money_transactions` (from last round) - included again here too.

Practically: every time a referred order was created, the step that logs
it into `affiliate_orders` (with `product_name`) crashed - which is also
why some checkouts appeared to 500 even though the order had already been
saved (you'd see it in admin, but the customer's browser got an error).

## 1. Commission timing - your code was already correct, now it'll actually work

Confirmed in `backend/src/routes/orders.js`:
- A commission is only written to `total_earnings` /
  `withdrawable_balance` when **you click "Delivered"** on an order in
  `/admin/orders` (`confirmOrderCommission`).
- If you click **Cancelled**, the linked `affiliate_orders` rows flip to
  `cancelled` and any pending or already-confirmed commission is
  subtracted back out (`cancelOrderCommission`). The affiliate dashboard
  already renders a `cancelled` badge for these.
- What *does* update immediately at checkout is `pending_earnings` - shown
  on the affiliate dashboard as a separate "Pending Earnings" stat, clearly
  distinct from "Total Earnings" (confirmed) and "Withdrawable". That's
  intentional - it's an estimate, not money they can withdraw yet.

Nothing needed to change in the logic itself; it was just crashing before
it could run, because of the missing columns above.

## 2. Withdrawal 500 - fixed a genuine code bug too

Beyond the missing column, `PUT /api/affiliates/admin/withdrawals/:id` had
a real bug: it checked `status === 'completed'` to decide whether to stamp
`completed_at`, but your admin UI actually sends `status: 'paid'`. Fixed to
check `'paid'`.

## 3. Share link showing the backend URL instead of your website

`frontend/src/app/affiliate/dashboard/page.jsx` built share links from
`process.env.NEXT_PUBLIC_SITE_URL`. That env var is set to your backend's
Fly URL somewhere in your Vercel project settings, which is why links came
out as `backend-calm-meadowland-7817.fly.dev/...`.

Fixed the code so it always uses the actual browser address
(`window.location.origin`) first, falling back to that env var only if
somehow unavailable - so this can't break again regardless of the env var.
**You should still fix the Vercel env var** to
`https://www.believeinablessed.com` when you get a chance, for anywhere
else that might read it server-side.

## 4. Referral code follows the customer around - already built, extended it

`AffiliateContext.jsx` already does exactly what you asked: the first time
someone lands on any page with `?ref=CODE`, it's saved to a cookie
(`bib_ref`) and used from then on - product pages, "back" navigation,
and checkout (`checkout/page.jsx` already reads `Cookies.get('bib_ref')`
as a fallback when there's no `?ref=` in the current URL). So a returning
visitor without the query param still gets correctly attributed at
checkout.

I extended the cookie's lifetime from 7 to 30 days, since you specifically
asked about a customer coming back later after browsing around - 30 days
is a more standard affiliate attribution window for this kind of gap.

## Files touched this round

- `backend/migrations/CRITICAL_affiliate_commission_fix.sql` - **run this**
- `backend/src/routes/affiliates.js` - fixed `completed_at`/`'paid'` bug
- `frontend/src/app/affiliate/dashboard/page.jsx` - share link uses real
  browser origin
- `frontend/src/contexts/AffiliateContext.jsx` - cookie now lasts 30 days
