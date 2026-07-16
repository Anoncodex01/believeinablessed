# Round 2 changes: two payment methods, paid-only orders, live tracking

## 1. Only Pesapal and M-Pesa remain

Removed everywhere (checkout UI, `/api/payments/methods`): Stripe/Card,
direct Airtel Money, direct Tigo Pesa, Cash on Delivery.

- **Pesapal** stays as the recommended, one-click option - it already covers
  M-Pesa, Airtel Money, Tigo Pesa and Card in a single redirect flow.
- **M-Pesa** is now manual/directions-only. Selecting it never fires an STK
  push. Instead `frontend/src/components/checkout/MpesaManualPayment.jsx`
  shows the till number (from `MOBILE_MONEY_TILL_MPESA`), the order number to
  use as reference, and a field for the customer to paste the M-Pesa
  confirmation code they get by SMS after paying themselves. That code is
  submitted to the existing `POST /api/payments/manual-mobile/submit`
  endpoint with `provider: 'mpesa'`.
- Old files `MpesaPayment.jsx` (STK push) and `StripeElementsWrapper.jsx`
  are no longer imported anywhere. They're left in place in case you want
  them again later, but they're dead code today - safe to delete.

**Set this Fly secret** so the till number actually shows up instead of a
placeholder: `fly secrets set MOBILE_MONEY_TILL_MPESA="0747XXXXXX"` (or your
paybill/till number).

## 2. Admin verifies M-Pesa payments the same way Airtel/Tigo already worked

Nothing new to build here - `GET /api/payments/manual-mobile/pending` and
`PUT /api/payments/manual-mobile/:id/verify` already handle any provider,
`mpesa` included. When an admin approves a submitted code, the order's
`payment_status` flips to `paid` and `status` to `confirmed` automatically.

## 3. Unpaid orders don't show up anywhere customer-facing until paid

- `GET /api/orders/my-orders` (new) only returns orders where
  `payment_status = 'paid'`. An order sitting at `pending` (Pesapal not
  finished) or `verifying` (M-Pesa code submitted, awaiting admin) simply
  doesn't appear in **My Orders** (`/orders`) yet.
- `GET /api/orders/track/:orderNumber` now checks payment status too. If the
  order isn't paid yet, it responds with a `paymentPending` payload instead
  of full order/delivery details:
  ```json
  { "order": null, "paymentPending": true, "payment_status": "verifying", "message": "..." }
  ```
  The `/track` page shows a dedicated "Confirming your payment" screen for
  this state (auto-checks every 10 seconds) instead of a normal 404 or an
  empty tracker - once the admin confirms the M-Pesa code (or Pesapal's
  callback lands), the same page automatically shows the full Uber-Eats-style
  delivery tracker.
- The admin's own order list (`/api/orders/admin/all`) is **not** filtered -
  admins still see every order, paid or not, since they're the ones who need
  to verify the unpaid ones.

## 4. Tracking now behaves like Uber Eats end-to-end

- Unpaid → "Confirming your payment" (spinner, auto-polls every 10s)
- Paid, `pending`/`confirmed`/`processing`/`shipped`/`delivered` → the
  existing step tracker in `/track` (already built) with live auto-refresh
  every 30s, browser notifications, and a delivered celebration screen.
- Fixed a crash: the manual "Refresh Now" button called `setRefreshing(...)`
  without that state ever being declared - already fixed in this codebase
  before this round, confirmed working.

## Still true from the previous round

- Pesapal 404/500 → almost certainly a stale Fly deploy / missing secrets,
  see `FIXES_AND_DEPLOYMENT.md` for the exact commands.
- Dark-mode logo, hero slider "fit any photo", real payment logos, and the
  affiliate tier system were already fixed/implemented and are untouched by
  this round.

## New/changed files this round

- `backend/src/routes/orders.js` - `/my-orders` endpoint (paid-only),
  `/track/:orderNumber` payment-pending handling
- `backend/src/routes/payments.js` - `/methods` trimmed to Pesapal + M-Pesa
- `frontend/src/app/checkout/page.jsx` - two payment options only
- `frontend/src/components/checkout/MpesaManualPayment.jsx` - new
- `frontend/src/app/orders/page.jsx` - new "My Orders" page
- `frontend/src/app/track/page.jsx` - payment-pending state + polling
- `frontend/src/components/layout/Navbar.jsx` - "My Orders" link
- `frontend/src/lib/api.js` - `getMyOrders()`
