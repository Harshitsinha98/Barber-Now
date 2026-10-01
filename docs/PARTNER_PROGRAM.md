# BarberNow Partner Program

Zomato/Swiggy-style onboarding for barbershops, with a flat subscription instead of commission.

## Business model

| Revenue line | Price | What the barber gets |
|---|---|---|
| **Partner plan** | **₹1,499 / 30 days** (GST-inclusive) | Listing, unlimited bookings, live queue, dashboard, **0% commission**, and ads included |
| **Boost — Spark** | ₹299 / 7 days | Top of nearby results + "Sponsored" spotlight |
| **Boost — Blaze** | ₹499 / 15 days | Same, 15 days (most popular) |
| **Boost — Inferno** | ₹899 / 30 days | Same, 30 days |

- Customers pay the shop directly (cash/UPI). BarberNow never touches service money.
- Prices live in `src/lib/plans.ts`. Change them there only.

### "Ads included" in ₹1,499
1. **Discovery listing**: every paid partner appears in nearby results.
2. **Partner spotlight** on the home page: all paid partners rotate daily, so each one gets fair exposure.
3. **Ad report**: impressions, profile visits and app bookings per day (`/barber/growth`).

### Boosts (paid extra)
- Up to **3 boosted shops** are pinned to the top of discovery, **inside the customer's radius only**, always labelled **"Sponsored"**.
- Boosted shops show first in the home spotlight.
- A typed search stays purely relevance-based (no paid ranking).
- A boost needs an active partner plan. Buying again adds days on top.

## Barber journey

```
OTP login → Onboarding wizard (5 steps) → Submit → Admin review → Approved
                                    ↘ Pay ₹1,499 (before or after approval) ↗
                                              → LIVE (visible to customers)
```

**Wizard (`/barber/onboarding`)**
1. Shop details: name, owner, address, pincode, map pin, timings, weekly off
2. Services & prices (quick-add templates)
3. Photos: cover (required) + gallery
4. Documents: PAN (required), GSTIN (optional), registration document (optional, private bucket), consent to terms
5. Plan & go live: pay ₹1,499 via Razorpay, then submit for verification

**Live rule:** `published` AND `approved` AND `plan active` AND `not suspended`. Enforced in the database (RLS) and in the app.

**Lapse:** when the plan expires the shop is hidden (nothing is deleted). The dashboard shows a red renew banner, plus a reminder 5 days before expiry.

## Admin operations (`/admin/shops`)
- **Pending review** tab: open a shop to see owner, PAN, GSTIN, pincode, and the private document (2-minute signed link).
- **Approve & verify** or **Reject with a reason** (the barber sees the reason in the wizard and can resubmit).
- **Record offline payment**: for UPI/cash collected outside Razorpay. Applies a plan or boost instantly.
- **Overview** shows MRR, plan revenue, boost revenue and live boosts.

## Payments (Razorpay)
- Checkout creates a `payments` row + Razorpay order → customer pays → signature verified server-side → days added.
- Webhook `/api/razorpay/webhook` (`payment.captured`, `order.paid`) is the backup if the browser closes. Fulfilment is idempotent.
- Without Razorpay keys, the pay button explains that payment is offline and admins activate manually.
- Renewal is manual (pay again → +30 days on top). Auto-debit (Razorpay Subscriptions / UPI AutoPay) is a later step.

## Security
- Barbers can't change their own approval, plan dates, boost dates, verification or suspension. A DB trigger resets those unless the service role writes them.
- Payment and stats tables are read-only for owners; only the server writes them.
- KYC documents are in a private bucket, readable only by the owner and by admins via signed URLs.

## Setup checklist
1. Run `supabase/migrations/0007_partner_program.sql`. Already-live shops are auto-approved with a 30-day free grace period.
2. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` to Vercel.
3. In Razorpay Dashboard → Webhooks, add the URL above with those two events.

## Open decisions
- GST: prices are shown as GST-inclusive. Confirm with your CA, and add GST invoices before scaling.
- Free trial: none by default. A first-month offer can be given via "Record offline payment".
- Refund / cancellation policy for plans and boosts needs to be written into the partner terms.
