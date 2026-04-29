# dreamscape

A Thelemic/HGA-focused dream practice app — journal, invocation, pathwork, scrying, and sigil work.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Altar — daily anchor and dream overview |
| `/log` | Dream log (morning) |
| `/journal` | Morning reflection / Evening ritual with dream incubation |
| `/reading` | Oracle reading |
| `/dreamscape` | Sleep tracking |
| `/strata` | Pattern analysis |
| `/invoke` | Entity invocation — Sephirothic archangels with optional LBRP or Star Ruby pre-ritual |
| `/pathwork` | Daily practice: Yesod→Tiphareth, Middle Pillar, or Tarot gate pathworking |
| `/sigil` | Sigil forge — Spare method: reduce intention → animated SVG → 60s charge |
| `/tattwa` | Elemental scrying — 5 Tattwa symbols, 60s gaze timer, afterimage portal |

## Practice features

### `/invoke`
Sephirothic archangels (replacing Ars Goetia) with Tibetan Buddhist correspondences. Dream-resonant entity suggestions via `lib/entities.ts`. Optional pre-invocation rituals:
- **LBRP** — Lesser Banishing Ritual of the Pentagram, 8 steps with animated pentagrams per quarter
- **Star Ruby** — Thelemic variant (Therion · Babalon · Nuit · Hadit)

### `/pathwork`
Four modes via the TIB · WST · MPL · TAR toggle:
- **Tibetan** — OM/AH/HUM mantra tradition, Yesod→Tiphareth canvas
- **Western** — Bornless One invocation, Hermetic framing
- **Middle Pillar** — 5 Sephirothic body centers (Kether→Malkuth), vibrated names, per-center canvas
- **Tarot** — 22 Thoth arcana as path gates via `lib/thoth-tarot.ts`; Entry → Threshold (8 min) → Return

### `/sigil`
Austin Osman Spare method. Strips vowels and duplicate consonants from intention statement, generates deterministic sigil geometry via `lib/sigil.ts`, renders as animated SVG, 60s charge ring, archive in localStorage.

### `/tattwa`
Earth · Water · Fire · Air · Akasha. Each element: animated symbol (pulse/breathe), 60s gaze timer, complementary afterimage portal (10s), scrying notes. Sessions logged to localStorage.

### `/journal` — Dream Incubation
After evening journal extraction, an **Incubation Ritual** section maps the first extracted theme to a resonant entity (via `findResonantEntities`), extracts the Tibetan seed syllable, and provides a 3-step pre-sleep ritual with editable intention. Saved to `incubation-seeds` in localStorage.



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
