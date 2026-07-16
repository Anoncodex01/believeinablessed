# Round 5: duplicate pending orders, "lost" order after Pesapal, full leaderboard

## 1. Clicking "Pay with Pesapal" multiple times created multiple pending orders

Every click of "Pay" created a brand-new order row. If the customer backed
out and tried again, the old abandoned attempt just sat there forever as
its own order - and if it was referred, as its own separate "pending"
commission. 5 retries looked like 5 pending sales from one shared link.

Fixed in `backend/src/routes/orders.js`: right before creating a new order
for an online payment method (Pesapal or M-Pesa), the backend now looks for
that same customer's own still-unpaid Pesapal/M-Pesa orders from the last 2
hours and automatically cancels them first - using the exact same reversal
logic as an admin clicking "Cancelled" (`cancelOrderCommission`), so
`pending_earnings` and `affiliate_orders` stay accurate. Only the latest
attempt remains pending.

**This only prevents it going forward.** The duplicates already sitting in
your database from before this fix won't clean themselves up automatically
- I didn't want to write a raw SQL script that manually subtracts money from
a balance without running through your real reversal logic (that's exactly
the kind of thing that causes double-counting bugs). Instead: go to
`/admin/orders`, find those duplicate abandoned orders, and click
**Cancel** on each - that button already runs the correct commission
reversal, so the affiliate's pending total will correct itself immediately.

## 2. Order "getting lost" after the Pesapal payment page

Found the real cause: your checkout was doing
`window.location.href = pesapalRedirectUrl` - a full navigation that took
the customer's entire tab away from your site to Pesapal's hosted page.
If they closed that page instead of finishing, or their bank's redirect
back didn't fire, there was nothing left anywhere showing the order -
they'd left your site entirely.

Fixed: Pesapal's payment page now opens in a **new tab**
(`window.open(...)`), and the customer's original tab moves straight to
`/track?order=...` (which already auto-polls every 10 seconds while
unpaid). So now:
- If they finish paying in the new tab, that tab gets Pesapal's normal
  success/failure redirect (fine either way, they can just close it).
- Their original tab was never abandoned - it's already showing "Confirming
  your payment" and will flip to full tracking automatically the moment
  Pesapal confirms.
- If the new tab gets closed without paying, the order still exists and is
  still visible/trackable - nothing is "lost."
- (If their browser blocks the popup, it falls back to the old full-page
  redirect so payment still works either way.)

Also: `/checkout/success` now auto-advances into `/track` after ~1.8s
instead of requiring a click, and `/checkout/failure` now also has a
"Track My Order" button (the order still exists even if payment failed -
they can retry from there).

## 3. Live tracking auto-refresh

Confirmed already working exactly as asked: once an order is found and
isn't delivered/cancelled, `/track` automatically turns on 30-second
polling - no toggle required. (Also still 10-second polling specifically
while a payment is unconfirmed, so that part resolves faster.)

## 4. Leaderboard still showing "0 sales" + full leaderboard page

- If you haven't run `CRITICAL_affiliate_commission_fix.sql` yet, do that
  first - the sales count literally cannot compute without those columns.
- "0 sales" is also just accurate if no order has been marked **Delivered**
  yet for that affiliate (sales count = confirmed commissions, which only
  happen on delivery, by design - see Round 4 notes).
- The dedicated `/affiliate/leaderboard` page was quietly reusing the same
  homepage "top 6" widget, capped at 6 people server-side too. It now
  fetches and shows up to 50, and the redundant "See All" link is hidden
  since you're already on that page.

## 5. Made the leaderboard responsive

Each row was one long `flex` line (rank, avatar, name, tier, code,
earnings, sales, payout time) all packed side-by-side - on a narrow phone
that's exactly the squished/wrapping mess you pasted. Rows now stack into
two lines on small screens (identity on top, earnings/commission on a
second line below a thin divider) and go back to the single-line layout
on tablet/desktop widths.

## Files touched this round

- `backend/src/routes/orders.js` - stale/duplicate pending order cleanup
- `backend/src/routes/affiliates.js` - leaderboard `?limit=`
- `frontend/src/components/checkout/PesapalPayment.jsx` - opens in a new
  tab instead of navigating the whole app away
- `frontend/src/app/checkout/page.jsx` - updated handler for the above
- `frontend/src/app/checkout/success/page.jsx` - auto-redirect to tracking
- `frontend/src/app/checkout/failure/page.jsx` - added Track My Order
- `frontend/src/components/home/LeaderboardSection.jsx` - `limit` prop,
  responsive row layout
- `frontend/src/app/affiliate/leaderboard/page.jsx` - requests full list
- `frontend/src/lib/api.js` - `getLeaderboard(limit)`

## About the two errors you pasted separately

- `EADDRINUSE :5000` is your local machine only - something (often an old
  `nodemon` process that didn't fully stop) is already listening on port
  5000. Find and stop it (`lsof -i :5000` then `kill -9 <PID>` on
  Mac/Linux, or `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`
  on Windows), or change `PORT` in `.env` and restart. Nothing in the code
  needs to change for this.
- The `users_role_check` violation from Supabase was fixed in the same
  migration file I already sent you (`CRITICAL_affiliate_commission_fix.sql`)
  - it now detects whatever role values already exist in your table and
  includes them automatically instead of guessing, so it can't fail like
  that again. Re-download that file if you grabbed it before this update.
