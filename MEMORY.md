# Dreamscape Memory

## Product Shape

Dreamscape is a Next.js App Router app for dream logging, AI interpretation, sleep stories, audio experiences, astrology, and community sharing. The app is local-first, with optional cloud sync and optional Supabase auth for the broader app, but some newer social features are intentionally auth-gated.

## Core Stack

- Frontend: Next.js App Router, React, Tailwind, React Three Fiber, Three.js
- Backend: Next.js API routes
- Storage: localStorage / Capacitor local storage plus Supabase Postgres
- Auth: Supabase auth (Google OAuth, other Supabase flows)
- AI: OpenRouter / OpenAI-style LLM routes, ElevenLabs TTS, image generation for dream cards
- Payments: Stripe
- Mobile: Capacitor

## Storage and Identity Model

There are two different identity-ish states in the app and they matter:

1. Local-first usage
   - The app can be used without a Supabase session.
   - Dreams and related user data are stored locally through `lib/store.ts` and related helpers.
   - A local flag `dreamscape_sync_enabled` is used as a fallback signal that the user has enabled cloud sync.

2. Supabase-authenticated usage
   - Social/community routes require a real Supabase user token.
   - Server-side route auth is done by extracting a bearer token from the request and validating it with Supabase in `lib/supabaseServer.ts`.

This means “the user can use the app” and “the user can access community routes” are not the same thing.

## Auth Implementation

### Client Supabase

- File: `lib/supabaseClient.ts`
- Pattern: singleton `getSupabase()`
- Used in client pages/components when a browser session is needed

### Server Supabase auth

- File: `lib/supabaseServer.ts`
- Important functions:
  - `getBearerToken(request)`
  - `getUserFromRequest(request)`
- `getUserFromRequest()` only succeeds if the request includes an `Authorization: Bearer <supabase-access-token>` header.

### API-key auth

- File: `lib/auth.ts`
- Used for AI routes that are protected by a shared app key, not Supabase user auth
- Pattern:
  - If `DREAMSCAPE_API_KEY` is unset, local dev is permissive
  - Otherwise request must supply `x-api-key` or matching bearer token

These are separate auth systems. Do not confuse them.

## API Fetch Behavior

- File: `lib/apiFetch.ts`
- Purpose:
  - attach API key headers for protected AI routes
  - attach locally stored per-provider API keys
  - attach Supabase bearer token on the client when available
- This wrapper is important for community routes because `/api/feed`, `/api/feed/friends`, follow/react/share routes expect a real Supabase bearer token.

If a community route returns 401, first inspect whether `apiFetch()` is actually attaching the Supabase session access token.

## Route Categories

### Routes gated by shared API key flow

Examples:
- `/api/extract`
- `/api/story`
- `/api/letter`
- `/api/journal-extract`

These use `checkAuth()` from `lib/auth.ts`.

### Routes gated by Supabase user auth

Examples:
- `/api/feed`
- `/api/feed/friends`
- `/api/share/[dreamId]`
- `/api/dreams/[id]/react`
- `/api/dreams/[id]/interpret`
- `/api/profile/follow/[handle]`
- billing routes that operate on signed-in users

These use `getUserFromRequest()`.

### Public or mostly-public routes

Examples:
- `/api/profile/[handle]`
- `/api/og/[id]`
- `/api/generate-card`

`/api/profile/[handle]` is lookup-oriented and should not require the caller to be signed in.

## Social / Community Schema

Migration file:
- `supabase/migrations/002_social_schema.sql`

Important tables:
- `user_profiles`
- `shared_dreams`
- `follows`
- `dream_reactions`
- `dream_interpretations`

Important realities:
- `user_profiles.handle` drives public identity in community features.
- Social feed items need reaction counts, interpretation counts, and `my_reactions` for the signed-in viewer.
- Community browsing is intentionally sign-in-required right now.

## Social Feature Fixes Already Landed

- `app/shared/page.tsx`
  - auth check now considers both Supabase session checks and local sync fallback for page-level state
- `app/account/page.tsx`
  - handle validation added with 4-character minimum
  - handle save changed to `upsert` so first save works even if profile row does not exist yet
- `app/api/profile/[handle]/route.ts`
  - fixed profile lookup behavior and not-found handling
- `app/api/feed/route.ts` and `app/api/feed/friends/route.ts`
  - feed responses include `my_reactions`
- `app/api/similar/[dreamId]/route.ts`
  - similar-dream responses include counts and `my_reactions`

## Important Social Debugging Rule

If the UI claims the user is signed in but `/api/feed` or `/api/feed/friends` still return 401, the likely causes are:

1. the browser has a Supabase session but client fetches are not sending its bearer token
2. the session exists in one auth flow but not the one `getSupabase()` reads from
3. local sync state is being mistaken for community auth capability

Page-level “signed in” logic and route-level “authorized as Supabase user” logic are distinct.

## Sleep Stories / Generate Card

Main page:
- `app/dreamscape/page.tsx`

Image route:
- `app/api/generate-card/route.ts`

Current UI flow:
- Generate story through SSE from `/api/story`
- Parse chapters
- After story completes, client auto-calls `doGenerateCard()`
- Manual button also calls `doGenerateCard()`

If the button appears dead, inspect the client code first for swallowed SSE errors or missing `res.ok` handling before assuming the route is broken.

## Dream Sharing / OG Flow

- `app/dream/[id]/page.tsx` is now a server wrapper with metadata generation
- `components/DreamDetailClient.tsx` holds client detail logic
- `app/api/og/[id]/route.ts` creates SVG OG images without new deps

## Puzzle / Hyperfold Sigil

Main file:
- `app/puzzle/page.tsx`

Math helpers:
- `lib/geometry4d.ts`
- `lib/manifold.ts`
- `lib/tuning.ts`

Visual components:
- `components/puzzle/DreamMotes.tsx` — 180 floating particles, 3 color populations, drift on sine waves
- `components/puzzle/SigilFloor.tsx` — procedural sacred geometry per vertex (concentric rings, star polygons, radiating spokes)

Current state:
- Room-slice prototype on a tesseract manifold; each room is a graph vertex
- Adjacent vertices reached through portal-like folds (WASD or swipe)
- Q/E shift slice through W; R rotates active SO(4) plane; pinch-to-slice on mobile
- Post-processing: Bloom + ChromaticAberration + Vignette via @react-three/postprocessing@2.19.1 + postprocessing@6.36.3 (pinned for three.js 0.164 compat)
- Touch navigation: swipe-to-fold, pinch-to-slice, mobile d-pad buttons
- Audio: 31-EDO arpeggiator (Tone.js Loop at 48bpm), notes built from vertex index + discovery count. Drone + synth + arp all clean up on page unmount via cleanupAudio()
- Audio presets: Ethereal / Deep / Silent with Advanced mixer toggle
- Canvas has zIndex:1, HUD elements at zIndex:30-50 to prevent click-blocking
- Floor sigils unique per vertex, portals have star polygon sigil marks + shimmer
- Guidance orb drifts gently (not aggressive pulse)
- Start screen titled "HYPERFOLD SIGIL" with animated 2D canvas sigil background
- Discovery text: "SIGIL MANIFESTED" / "The Fold Remembers"

## Dream Oracle / Tarot Reading

- `components/DreamOracle.tsx` — three-card tarot spread (422 lines)
  - Card 1 "The Symbol": top extraction symbol → tarot via findTarotCard()
  - Card 2 "The Current": dominant emotion + moon sign → astrological note
  - Card 3 "The Guidance": goetic resonance or recommendation
  - CSS 3D flip animation (rotateY, 700ms, cubic-bezier), staggered at 0/600/1200ms
  - autoReveal deferred by requestAnimationFrame + 400ms to ensure cards paint face-down first
- `app/reading/page.tsx` — dedicated Reading tab, full-screen oracle experience
  - Loads user's dreams, lets them pick which to read
  - Shows interpretation + Invoke CTA after reveal completes

## Symbol Tooltips

- `components/SymbolTooltip.tsx` — tappable pill with popover
  - Shows: symbol name/category/meaning, salience %, tarot association (name/number/principle/meaning)
  - Wired into ExtractionDisplay.tsx (wraps sym.name in symbol list)
  - `SymbolPillList` export for bulk rendering
  - Close on outside click or Escape

## Interactive Natal Chart

- `components/NatalChartWheel.tsx` (377 lines)
  - Tappable planets (r=20 invisible hit targets), aspects (strokeWidth=14), house cusps (strokeWidth=12)
  - Toggle selection, pulse animation via @keyframes wheelPulse
  - Interpretation panel below SVG: planet sign/degree/house/aspects, aspect type/orb, house meaning/planets
  - Lives on the strata page (moved from account/altar)

## Celestial Guidance

- `components/AstroPanel.tsx` — CelestialGuidance component at bottom
  - Moon sign guidance (12 signs × actionable advice)
  - Moon phase guidance (8 phases × forward-looking text)
  - Retrograde warnings, strongest aspect meaning, Chiron healing note
  - "What this means for you" section

## Growth Features

### Weekly Dream Letter
- `lib/email.ts` — Resend wrapper, sendWeeklyDigest() with dark cosmic HTML template
- `app/api/cron/weekly-letter/route.ts` — Vercel cron (Sundays 8am ET / 13:00 UTC)
- Queries users with weekly_digest=true, fetches past 7 days dreams, sends digest
- Requires: RESEND_API_KEY, RESEND_FROM_EMAIL, CRON_SECRET

### Transit Alerts
- `lib/transits.ts` — getNotableTransits() detects retrogrades, moons, eclipses, ingresses, aspects
- `app/api/cron/transit-alerts/route.ts` — daily cron (6am ET / 11:00 UTC)
- Personalizes with natal chart when available, dedupes same-day alerts

### Notification System
- `app/api/notifications/route.ts` — GET (list 20) + PATCH (mark read)
- `components/NotificationBell.tsx` — bell icon in Nav with unread badge, dropdown panel, 60s polling
- Notification types: transit_alert, weekly_digest, new_follower, dream_reaction, circle_invite, circle_dream

### Dream Circles
- `app/api/circles/` — full CRUD: create, list, detail+feed, delete, invite, share, join
- `app/circles/page.tsx` — circle list + create form
- `app/circles/[id]/page.tsx` — detail with member list, invite generation, dream feed
- `app/invite/[code]/page.tsx` — public invite redemption page
- Invite codes: 8-char alphanumeric, 7-day expiry, configurable max_uses
- Circle max 5 members by default

### One-Click Sharing
- `components/ShareableDreamCard.tsx` — canvas→blob→File, navigator.share({files}) for Instagram Stories
- Falls back to navigator.share({text, url}) then to image download
- Dream card includes transcript excerpt, interpretation, share URL

## Growth Schema

Migration: `supabase/migrations/003_growth_schema.sql`
Tables: email_preferences, notifications, dream_circles, circle_members, circle_invites, circle_dreams
All with RLS. Tables created before policies (forward-reference fix for circle_members).

## Cron Configuration

`vercel.json` — two cron schedules:
- `/api/cron/weekly-letter` at 0 13 * * 0 (Sunday 8am ET)
- `/api/cron/transit-alerts` at 0 11 * * * (daily 6am ET)
Both require CRON_SECRET Bearer token authorization.

## Files That Matter Most

- `lib/apiFetch.ts` — request header behavior
- `lib/auth.ts` — shared API-key auth
- `lib/supabaseClient.ts` — client singleton
- `lib/supabaseServer.ts` — bearer-token user validation
- `lib/email.ts` — Resend email sending
- `lib/transits.ts` — transit detection + alert generation
- `app/shared/page.tsx` — community page auth UX
- `app/account/page.tsx` — handle save + validation
- `app/dreamscape/page.tsx` — sleep story and dream card client flow (TTS cleans up on unmount)
- `app/reading/page.tsx` — tarot reading tab
- `app/circles/page.tsx` — dream circles
- `app/api/feed/route.ts` and `app/api/feed/friends/route.ts` — social feeds
- `app/api/circles/` — circle CRUD + invite + share + join
- `app/api/cron/` — weekly-letter + transit-alerts
- `app/api/notifications/route.ts` — notification read/mark
- `app/api/profile/[handle]/route.ts` — public profile lookup
- `app/puzzle/page.tsx` — hyperfold sigil puzzle

## Navigation

Bottom tab bar (Nav.tsx): Altar → Dusk/Dawn (time-aware) → Reading → Sleep → Strata
Community (/shared) accessible from altar quick-start grid, not main nav.
NotificationBell integrated into Nav with separator.

## Design Notes

- Dark UI, violet-forward palette (cosmic-bg #07070f, violet #a78bfa, indigo #818cf8, gold #fbbf24)
- Georgia / serif for mystical headings, monospace for labels and telemetry
- Social and puzzle features both lean on luminous wireframes, low-opacity glows, and restrained overlays
- Occult aesthetic: sigils, star polygons, sacred geometry, tarot card flip animations
- Voice recording: deferred mic access (user clicks button first, no autoStart)

## Open Risks / Useful Reminders

- Local sync does not automatically equal valid community auth.
- When adding new protected routes, decide explicitly whether they use Supabase user auth or shared API-key auth.
- The community feature is still sensitive to mismatches between client session state and route-level bearer token expectations.
- The puzzle page is ~1600 lines — should extract components (RoomShell, PortalGlyph, arpeggiator, etc.) if it grows further.
- @react-three/postprocessing pinned at 2.19.1 and postprocessing at 6.36.3 for three.js 0.164 compat. v3 requires R3F 9 + three 0.168+.
- Biometrics removed from strata (BiometricChart, health insights, sample data). Files still exist in lib/biometrics.ts and components/BiometricChart.tsx but are no longer imported.
- Cron routes need CRON_SECRET env var set in Vercel dashboard.
- Resend needs RESEND_API_KEY + verified sender domain for email delivery.
- Agent cost config at ~/.config/opencode/oh-my-opencode.json — sonnet as default, nemotron free for quick/writing, gpt-5.4 reserved for oracle/ultrabrain only.
