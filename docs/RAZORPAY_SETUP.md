# Razorpay setup (partner plan & boosts)

BarberNow collects the ₹1,499/month partner plan and boost packs through Razorpay
(UPI, cards, net banking, wallets). Customers' service payments do **not** go
through Razorpay — they pay the salon directly.

## How it works

```
Barber taps "Pay"  →  server creates `payments` row + Razorpay order
                   →  Razorpay Checkout opens (UPI / card / netbanking)
                   →  success: browser sends {order_id, payment_id, signature}
                   →  server verifies HMAC signature → marks paid → adds days
Backup: Razorpay webhook (payment.captured / order.paid) does the same, idempotently.
Stuck?  "Check status" (barber) / "Reconcile" (admin) asks Razorpay directly
        and captures + fulfils if money was taken.
```

- Fulfilment is idempotent: a payment can never add days twice.
- Paying early adds 30 days on top of the current end date.
- Amounts always come from `src/lib/plans.ts`, never from the browser.

## 1. Create the account
1. Sign up at https://dashboard.razorpay.com with your business email.
2. Complete KYC (PAN, bank account, business details). **Live mode only works after KYC is approved.**
3. Until then, use **Test mode** (toggle at the top of the dashboard).

## 2. Get API keys
Dashboard → **Account & Settings → API Keys → Generate key**.

| Mode | Key ID starts with | Use for |
|---|---|---|
| Test | `rzp_test_` | Trying the flow, no real money |
| Live | `rzp_live_` | Real payments (after KYC) |

Copy the **Key ID** and **Key Secret** (the secret is shown only once).

## 3. Create the webhook
Dashboard → **Account & Settings → Webhooks → Add new webhook**
- **URL:** `https://barber-now-brown.vercel.app/api/razorpay/webhook`
- **Secret:** any long random string (you'll paste it into Vercel too)
- **Events:** `payment.captured`, `order.paid`, `payment.failed`

Create the webhook separately in Test mode and in Live mode — each mode has its own.

## 4. Add to Vercel
Vercel → Barber-Now → Settings → Environment Variables (Production + Preview):

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=the-secret-from-step-3
NEXT_PUBLIC_SITE_URL=https://barber-now-brown.vercel.app
```
Then **Redeploy**. `/admin/payments` shows green ticks when everything is connected,
and whether you're in TEST or LIVE mode.

## 5. Test it (Test mode)
1. Log in as a barber → Plan & billing → **Activate · ₹1,499**.
2. In Checkout use test UPI ID `success@razorpay` (or `failure@razorpay` to test a failure),
   or Razorpay's test card from their docs.
3. The plan should show **Active · 30 days left**, and the payment appears in
   `/admin/payments` and the barber's payment history with a receipt.

## 6. Go live
1. KYC approved → switch the dashboard to **Live mode** → generate live keys.
2. Create the live webhook (step 3).
3. Replace the three env vars in Vercel with live values → Redeploy.
4. `/admin/payments` should say **LIVE mode**.

## Offline payments
If a salon pays you by UPI/cash outside Razorpay: `/admin/shops` → open the shop →
**Record offline payment** → choose the plan/boost → Apply.

## Troubleshooting
| Symptom | Fix |
|---|---|
| Barber sees "Online payments aren't switched on yet" | Key ID / Secret missing in Vercel, or not redeployed |
| Money debited, plan not active | Barber taps **Check status** on billing page, or admin taps **Reconcile** in `/admin/payments` |
| Webhook shows 401 in Razorpay logs | `RAZORPAY_WEBHOOK_SECRET` doesn't match the webhook's secret |
| Payment stays "Pending" | Checkout was closed. It's auto-marked failed when reconciled after an hour |

## Not built yet
- **Auto-renewal** (Razorpay Subscriptions / UPI AutoPay): today each payment gives 30 days and the barber renews manually.
- **GST tax invoices**: receipts are payment receipts, not GST invoices. Add once your GST registration is in place.
- **Refunds**: do them from the Razorpay dashboard; the app doesn't reverse plan days automatically.
