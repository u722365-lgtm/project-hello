# FOUNDER50 + Payment Checkout — Production Readiness Audit
Date: 2026-07-28

## P0 — Block now or you will lose money / trust
1. **FOUNDER50 is client-side only** — `src/pages/FounderAccessPage.tsx` discounts UI price, but `submitManualPayment`, `create-payment-invoice`, `process-manual-payment`, `verify-manual-payment`, Stripe checkout, and LemonSqueezy checkout never see the promo. Fix: validate/apply discounts server-side or in a Supabase edge function and persist `promo_code`/`discounted_amount` on `manual_payments` and invoice.
2. **No idempotency on payment activation** — `process-manual-payment/index.ts` and `verify-manual-payment/index.ts` can activate the same payment multiple times and fire duplicate notifications/WhatsApp/Telegram. Fix: unique constraint/idempotency key on `(payment_id, status='verified')` and early return when already verified.
3. **Secret allowlists in client code** — `src/lib/resolveUserPlan.ts` hardcodes `SPECIAL_ACCESS_EMAILS` and `enterprisePlanForEmail` exposes domains in client bundle. Move all allowlists to server-side only (`check-subscription` / `_shared/enterpriseTenants.ts`); do not ship privileged mapping in `src/lib`.
4. **Blind fallback to free on subscription check error** — `check-subscription/index.ts` and `AuthProvider.tsx` both downgrade to `free` on any failure. This can truncate paid users into free on transient Stripe/Supabase errors. Fix: cache last known good state with TTL and only downgrade after explicit expiration evidence.

## P1 — Resolve before opening checkout publicly
5. **No server-side price validation** — manual and card checkout paths accept any `amount` from the client. Fix: enforce minimum/catalog amount in `submitManualPayment`, `create-payment-invoice`, `lemonsqueezy-checkout`, and `stripe-checkout`.
6. **Promo semantics differ by product type** — `selectedProduct.price` is `number` for subscriptions but `priceRange` string for solutions; FOUNDER50 won’t apply cleanly and discounts aren’t carried into non-subscription flows. Fix: normalize all purchasable products to a deterministic `amount` and apply discount in one shared place before any checkout call.
7. **Receipt uploads have no protection** — no file size/type allowlist enforcement, no malware scan, and no expiry cleanup. Fix: validate MIME/size server-side in `process-manual-payment`; add retention policy.
8. **Stripe/LemonSqueezy success path loses context** — hardcoded `success_url` does not carry invoice/plan context; user may land in chatbot with no activation trace. Fix: append `session_id`/`invoice_id` and reconcile on `check-subscription` + client hydration.

## P2 — Hardening & correctness
9. **Overly broad CORS** — payment functions use `Access-Control-Allow-Origin: *`. Restrict to actual origins and require `Authorization` header only.
10. **Duplicate Stripe customer creation risk** — `stripe-checkout` does `customers.list` by email but ignores merge/twin accounts; if email changes between sessions, multiple customers accumulate. Fix: store `stripe_customer_id` on `subscribers` and reuse.
11. **Missing rate-limit/retry control** — `AuthProvider` polls `check-subscription` every 60s; add backoff and cache window so real errors don’t amplify.
12. **UI/UX inconsistency** — `FounderAccessPage` amount input is controlled only after file selection, and discounted price is shown as `$discountedPrice` even for `selectedProduct.price=0` free plans. Stabilize amount field state and guard display logic.

## Recommended next actions
- Implement backend promo validation shared by all checkout paths.
- Add idempotency + early-return guards in payment processors.
- Strip client-only allowlists and rely solely on server plan resolution.
