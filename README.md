# dreamscape

## Local Stripe Webhook Testing (no public URL needed)

You can test webhooks against `localhost` using the Stripe CLI tunnel.

Before running the webhook scripts, set a **test** Stripe key in `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
```

The local scripts intentionally fail if you use a live key.

### 1) Start the app

```bash
npm run dev
```

### 2) Forward Stripe events to local webhook

```bash
npm run stripe:webhook:listen
```

This forwards to:

- `http://localhost:3000/api/webhooks/stripe`

The CLI prints a signing secret like:

- `whsec_...`

Copy that to your local env:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3) Trigger test events

```bash
npm run stripe:webhook:trigger:checkout
npm run stripe:webhook:trigger:sub-updated
npm run stripe:webhook:trigger:sub-deleted
```

### Notes

- Dashboard webhooks are typically public URLs, but **Stripe CLI forwarding is the standard localhost workflow**.
- Use separate secrets for local/test/live.
- If you saw `Invalid token id: tok_visa`, you were running trigger commands without a test key. The scripts now enforce `sk_test_...`.
- For deployed environments, configure a real Stripe Dashboard webhook endpoint:
  - `https://<your-domain>/api/webhooks/stripe`
