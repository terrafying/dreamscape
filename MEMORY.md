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

## Puzzle / Hyperdimensional Manifold

Main file:
- `app/puzzle/page.tsx`

Math helpers:
- `lib/geometry4d.ts`
- `lib/manifold.ts`
- `lib/tuning.ts`

Current direction:
- old maze/corridor navigation has been replaced by a room-slice prototype based on a tesseract
- a room corresponds to a graph vertex
- adjacent vertices are reached through portal-like folds
- Q/E move the active slice through W
- R rotates the active SO(4) plane
- guidance comes from manifold graph distance, not grid distance

This is now a true manifold-navigation prototype rather than a normal maze with 4D decoration.

## Files That Matter Most

- `lib/apiFetch.ts` — request header behavior
- `lib/auth.ts` — shared API-key auth
- `lib/supabaseClient.ts` — client singleton
- `lib/supabaseServer.ts` — bearer-token user validation
- `app/shared/page.tsx` — community page auth UX
- `app/account/page.tsx` — handle save + validation
- `app/dreamscape/page.tsx` — sleep story and dream card client flow
- `app/api/feed/route.ts` and `app/api/feed/friends/route.ts` — social feeds
- `app/api/profile/[handle]/route.ts` — public profile lookup
- `app/puzzle/page.tsx` — hyperdimensional puzzle implementation

## Design Notes

- Dark UI, violet-forward palette
- Georgia / serif for mystical headings, monospace for labels and telemetry
- Social and puzzle features both lean on luminous wireframes, low-opacity glows, and restrained overlays

## Open Risks / Useful Reminders

- Local sync does not automatically equal valid community auth.
- When adding new protected routes, decide explicitly whether they use Supabase user auth or shared API-key auth.
- The community feature is still sensitive to mismatches between client session state and route-level bearer token expectations.
- The puzzle math helpers are more reusable than the current page structure; if the system grows, extract room-slice logic from `app/puzzle/page.tsx` into dedicated libs/components.
