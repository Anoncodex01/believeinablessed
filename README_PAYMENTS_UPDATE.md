# Believe in a Blessed — Setup, Deployment & Troubleshooting

## Update 2 — order lifecycle, notifications crash, live tracking, PESAPAL_CALLBACK_URL

### "PESAPAL_CALLBACK_URL is not configured on the server"
This meant the `PESAPAL_CALLBACK_URL` env var wasn't set on your live Fly.io app (only in your local `.env`, which Fly never reads — see §4 below for `fly secrets set`). The code no longer hard-fails on this: if the var isn't set, it now **derives the callback/IPN URLs automatically** from the incoming request and logs a warning telling you the exact `fly secrets set` command to run to make it explicit. Payments will now work even before you set it, but you should still set it properly for reliability.

### Orders → Admin → Confirm / Deliver / Cancel
- Orders already appear in `/admin/orders` as soon as they're placed.
- Admin can move an order through `pending → confirmed → processing → shipped → delivered`, or cancel it — from either the card view, table view, or the order detail modal.
- **Fixed:** cancelling a **delivered** order is no longer allowed (both on the server and in the UI) — it doesn't make sense to "cancel" something already in the customer's hands, and doing so was incorrectly reversing the affiliate's commission after the fact. If a customer rejects a delivered order or wants a refund, handle that separately as a return/refund; don't cancel the order record.
- Cancelling any other order now asks for confirmation first, since it removes the affiliate's commission.

### Admin notifications page ("the page is not working")
Found it: the page was reading the login token from `localStorage`, but the token is actually stored in a cookie everywhere else in the app. `localStorage` doesn't even exist during server-side rendering, so the page was crashing outright. Fixed to use the same cookie-based auth as the rest of the admin panel.

### Order tracking, Uber Eats style
The tracking page (`/track`) already had a live-updating step tracker, 30-second auto-polling, and browser notifications on status change — but two bugs were silently breaking it:
- Clicking "Refresh Now" threw an error because the loading state it referenced was never declared — fixed.
- Turning off live tracking called a toast method that doesn't exist in this toast library — fixed.

With both fixed, customers get: an animated step-by-step progress tracker, a live "current status" message, automatic polling every 30s, a browser notification + sound when status changes (if they grant permission), and a manual refresh button.

---


## 1. Why you're still seeing errors right now

Both errors you're seeing are **expected until you deploy the updated code and re-check your Pesapal credentials.** Nothing more needs fixing in the code for these two — this is a deployment + credentials step.

### `404` on `/api/pesapal/payment-methods`
This route didn't exist in the old code — it was added in this update. Seeing a 404 means **your backend on Fly.io is still running the old code.** You need to redeploy (see §3).

### `500` — "Invalid Access Token"
This is Pesapal itself rejecting the request — the app is now correctly showing you Pesapal's real error instead of swallowing it (that was the `[object Object]` bug from before). "Invalid Access Token" happens when the `consumer_key`/`consumer_secret` pair doesn't work for the host being called. The most common causes, in order of likelihood for your case:

1. **You rotated your Pesapal keys** (I recommended this last time since your old `.env` was exposed in this chat) **but the live server still has the old ones.** → Go to your Pesapal merchant dashboard → API keys, copy the current sandbox (or production) `consumer_key`/`consumer_secret`, and set them on Fly.io (§4). Redeploy.
2. **Environment mismatch** — sandbox keys used with `PESAPAL_ENVIRONMENT=production` (or vice versa). Sandbox keys only work against `cybqa.pesapal.com`; production keys only work against `pay.pesapal.com`. Double check which tab of the Pesapal dashboard you copied the keys from, and match `PESAPAL_ENVIRONMENT` to it.
3. **Sandbox account not fully provisioned.** Some Pesapal sandbox accounts need to be explicitly approved for API access even in test mode — check for a pending/approval banner on the dashboard.

Once redeployed, check `fly logs` — the new code logs the exact request/response at every step (`🔑 Getting Pesapal token...`, `📝 Registering IPN...`, `📤 Sending order to Pesapal...`) so you can see precisely which call Pesapal is rejecting.

---

## 2. What changed in this update

**Payments**
- Fixed the root cause of the 500 (callback/IPN URLs were pointing at the frontend domain, which has no API routes)
- Fixed Pesapal's production URL bug, IPN over-registration, and the `[object Object]` error bug
- Added a working `/api/pesapal/payment-methods` endpoint
- Added M-Pesa (STK Push), Stripe Card, and a manual Airtel Money / Tigo Pesa flow as selectable payment options on checkout, each with badges
- Fixed a Stripe bug that was charging customers 100x less than the order total
- Added an admin panel to verify manual Airtel Money / Tigo Pesa payments
- Fixed the checkout success page never showing the order number; added a matching failure page

**UI**
- Fixed the logo being invisible in dark mode (it's a solid black graphic — now inverted to white via CSS in dark mode)
- Fixed the homepage hero slider cropping any photo that isn't a wide banner shape — it now fits any photo (portrait, square, landscape) fully, with a blurred backdrop filling the rest instead of cropping

**Admin**
- Orders page: payment method badges now match the values actually being written (`pesapal`, `mpesa`, `card`, `airtel_money`, `tigo_pesa`, `mobile_money`, `cash`) — before, most orders showed a blank/generic badge
- Added a payment-method filter row so you can isolate orders by how they were paid

See the bottom of this file for the full list of changed files.

---

## 3. Deploying the backend (Fly.io)

```bash
cd backend
fly deploy
```

If you don't have the Fly CLI set up in this environment, install it first: https://fly.io/docs/flyctl/install/, then `fly auth login`. The app name is already set in `fly.toml` (`backend-calm-meadowland-7817`), so `fly deploy` from inside `backend/` will update the right app.

After deploying, tail the logs while you try a test payment:
```bash
fly logs
```

## 4. Setting environment variables on Fly.io

Your `.env` file is only used for **local** development — Fly.io needs each variable set as a *secret*. Set (or update) these on the live app:

```bash
cd backend
fly secrets set \
  PESAPAL_CONSUMER_KEY="your_current_key" \
  PESAPAL_CONSUMER_SECRET="your_current_secret" \
  PESAPAL_ENVIRONMENT="sandbox" \
  PESAPAL_CALLBACK_URL="https://backend-calm-meadowland-7817.fly.dev/api/pesapal/callback" \
  PESAPAL_IPN_URL="https://backend-calm-meadowland-7817.fly.dev/api/pesapal/ipn" \
  FRONTEND_URL="https://www.believeinablessed.com"
```

Repeat for any of the other gateways you want to enable (Stripe, M-Pesa Daraja, etc — see the commented block in `backend/.env` for the full list of variable names). Setting a `fly secrets set` value automatically restarts the app with the new values.

To check what's currently set (values are hidden, but you can confirm the keys exist):
```bash
fly secrets list
```

## 5. Deploying the frontend (Vercel)

If it's connected to your GitHub repo, just push to the branch Vercel deploys from:
```bash
git add -A
git commit -m "Payments fix + UI fixes"
git push
```
Vercel will build automatically. If you deploy manually instead:
```bash
cd frontend
vercel --prod
```

Make sure `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are set in the Vercel project's Environment Variables (Project Settings → Environment Variables) — they need to be there for the *build*, not just your local `.env`.

## 6. Database migration (Supabase)

Some tables/columns the payment code relies on aren't in your original schema file. Run this once:

1. Open your Supabase project → SQL Editor
2. Paste and run the contents of `backend/migrations/2026_07_payments_upgrade.sql`

It's written with `IF NOT EXISTS` everywhere, so it's safe to run even if some of it already exists.

---

## 7. Testing checklist after deploying

- [ ] Visit `https://backend-calm-meadowland-7817.fly.dev/api/pesapal/payment-methods` directly in a browser — should return JSON, not 404
- [ ] Place a test order with Pesapal — watch `fly logs` for the exact step that fails, if any
- [ ] Check the site logo is visible with dark mode toggled on
- [ ] Upload a portrait (tall) photo as a slide in `/admin/slides` and confirm it isn't cropped on the homepage
- [ ] Place a test order with "Airtel Money / Tigo Pesa" and confirm it shows up in the new verification panel on `/admin/orders`

---

## 8. Security note (carried over from last time)

Your uploaded `.env` contained live Supabase, Cloudinary, Stripe, and Pesapal secrets. If you haven't already rotated all of them, do that now, then update the new values everywhere (local `.env` files **and** `fly secrets set` / Vercel env vars — both need to match).

---

## 9. Files changed in this update

**Backend**
- `backend/src/routes/pesapal.js` — rewritten (callback/IPN fix, error handling, IPN caching, `/payment-methods` route)
- `backend/src/routes/payments.js` — new (unified gateway status + manual mobile-money verification)
- `backend/src/routes/stripe.js` — fixed currency amount bug
- `backend/src/server.js` — mounted the new `/api/payments` route
- `backend/.env` — corrected callback/IPN URLs, added gateway placeholders
- `backend/migrations/2026_07_payments_upgrade.sql` — new

**Frontend**
- `frontend/src/app/checkout/page.jsx` — wired in M-Pesa, Card, and manual mobile-money as selectable payment options
- `frontend/src/app/checkout/success/page.jsx` — fixed to actually read the order number
- `frontend/src/app/checkout/failure/page.jsx` — new
- `frontend/src/components/checkout/PesapalPayment.jsx` — fixed error handling, added Tigo Pesa badge
- `frontend/src/components/checkout/PaymentBadges.jsx` — new
- `frontend/src/components/checkout/MobileMoneyManual.jsx` — new
- `frontend/src/lib/api.js` — added payments API helpers
- `frontend/src/app/admin/orders/page.jsx` — fixed payment badge mapping, added payment filter + manual verification panel
- `frontend/src/components/layout/Navbar.jsx`, `Footer.jsx`, `src/app/auth/login/page.jsx`, `src/app/auth/register/page.jsx` — logo dark-mode fix
- `frontend/src/components/home/HeroSlider.jsx` — fit-any-photo fix
