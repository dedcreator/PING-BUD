# Bachs Billing & Monetization Integration

Sentiro integrates with **Bachs** ([docs.bachs.io](https://docs.bachs.io)) for automated Nigerian Naira subscription billing and open-source infrastructure community donations.

---

## 1. Overview & Pricing Model
Legacy monitoring tools (Datadog, Pingdom, BetterStack) charge **$35 to $80/mo (₦55,000 to ₦125,000/mo)**, pricing out independent developers and African engineering teams.

Sentiro runs on single-node SQLite WAL (`< 120MB` RAM), enabling sustainable native Naira pricing via Bachs:
- **Community Tier**: ₦0 / forever (up to 10 monitors, 60s intervals).
- **Indie Pro Tier**: ₦2,000 / month (50 monitors, 30s checks, AI RCA, 5 seats).
- **Team Pro Tier**: ₦5,000 / month (unlimited monitors, 10s checks, 6 edge regions, unlimited seats).

---

## 2. API Architecture (per docs.bachs.io)

### Environments & Base URLs
- **Sandbox**: `https://sandbox-api.bachs.io`
- **Production**: `https://api.bachs.io`

### Authentication
Every request includes the HTTP `Authorization` header with your environment API key:
- Sandbox key prefix: `sk_sandbox_...`
- Live key prefix: `sk_live_...`

```http
Authorization: Bearer sk_live_...
Content-Type: application/json
Accept: application/json
```

---

## 3. Creating a Hosted Checkout Session

Sentiro calls `POST /v1/checkout-sessions` on Bachs to initiate a hosted payment session:

```json
{
  "pricing": {
    "currency": "NGN",
    "amount": "2000.00"
  },
  "customer": {
    "email": "engineer@company.com",
    "name": "Alex DevOps"
  },
  "success_url": "https://sentiro.xyz/dashboard?checkout=success",
  "cancel_url": "https://sentiro.xyz/dashboard?checkout=cancel",
  "metadata": {
    "plan_id": "indie_pro",
    "billing_cycle": "monthly",
    "user_id": 14
  }
}
```

Bachs returns a hosted `checkout_url` supporting:
1. **Direct Nigerian Bank Transfer**: Instant virtual account generation with automatic reconciliation in `< 15` seconds.
2. **Debit & Credit Cards**: Visa, Mastercard, and Verve debit card checkout with 1-click tokenized renewals.

---

## 4. Webhook Event Handling & Verification

### Webhook Endpoint
- URL: `https://api.sentiro.xyz/api/billing/webhook/` (and alias `/api/billing/bachs-webhook/`)

### Signature Verification
Bachs signs each delivery with the `Bachs-Signature` header using HMAC-SHA256:
```python
import hmac, hashlib

secret = os.environ.get('BACHS_WEBHOOK_SECRET')
sig_header = request.headers.get('Bachs-Signature')

expected_sig = hmac.new(secret.encode('utf-8'), request.body, hashlib.sha256).hexdigest()
if not hmac.compare_digest(expected_sig, sig_header):
    return Response({'error': 'Invalid signature'}, status=400)
```

### Event Processing
When `checkout.completed` or `charge.successful` arrives:
1. **Extract Metadata**: Plan ID (`indie_pro` or `team_pro`) and customer details.
2. **Activate Tier**: `ProSubscription.objects.update(is_active=True, active_tier=plan_id)`.
3. **Generate Tax Invoice**: Create an official `Invoice` record with invoice number (e.g. `INV-BCHS-9403`) and payment method.
4. **Respond**: Return HTTP `200` with `{"received": true}`.

---

## 5. Local Testing with Bachs CLI
To test webhooks locally without public DNS:
```bash
bachs listen --forward-to localhost:8000/api/billing/webhook/
```
Trigger test events using:
```bash
bachs trigger checkout.completed
```
