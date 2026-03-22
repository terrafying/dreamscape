# Dreamscape Project Context

## What This Is
A dream journaling iOS/web app with AI analysis, sleep soundscapes, and astrological context.

## Current State (as of 2026-03-22)
- Next.js + Tailwind + Supabase + Capacitor (iOS)
- Local-first storage (localStorage/Capacitor) with optional Supabase cloud sync
- Rich dream AI extraction: symbols, emotions, themes, characters, archetypes, narrative arc, lucidity, astro context, Goetic resonance
- Birth data + natal chart SVG wheel
- Supabase auth (magic link + Google OAuth) — **auth is optional** for app usage
- Zero social infrastructure — dreams are private, Supabase RLS isolates per user

## Recent Commits
- `046af17` — feat: remove jhana breathwork; add natal chart wheel
  - Removed jhana patterns from BreathworkPlayer, added NatalChartWheel SVG component
  - `lib/astro.ts`: added `getNatalPlanetPositions()`, `getNatalHouseCusps()`, `getNatalAspects()`, `getNatalChartData()`
  - `lib/types.ts`: added `NatalPlanetPosition`, `NatalAspect`, `NatalChartData`
  - `components/BirthDataEditor.tsx`: integrated NatalChartWheel below Big 3 grid

## Tech Stack
- **Frontend**: Next.js App Router, Tailwind CSS, React
- **Backend**: Next.js API routes, Supabase (auth + Postgres + RLS)
- **Mobile**: Capacitor (iOS)
- **AI**: OpenRouter (multiple model support), ElevenLabs TTS, DALL-E card generation
- **Payments**: Stripe subscriptions

## Key Files
- `lib/types.ts` — DreamLog, DreamExtraction, JournalLog, BirthData, NatalChart types
- `lib/store.ts` — localStorage/Capacitor storage layer
- `lib/cloudSync.ts` — Supabase sync logic
- `lib/astro.ts` — sun/moon signs, planet longitudes, natal chart, aspects
- `components/BreathworkPlayer.tsx` — 4D shape breathwork (jhanas removed)
- `components/BirthDataEditor.tsx` — birth data form + natal chart wheel
- `components/NatalChartWheel.tsx` — SVG natal chart wheel
- `app/account/page.tsx` — account, billing, settings, natal chart
- `app/strata/page.tsx` — longitudinal analytics, dream archive
- `app/dreamscape/page.tsx` — sleep stories, breathwork, binaural tabs
- `app/log/page.tsx` — morning dream logging + voice input

## Design System
- Dark theme: `#07070f` background, `rgba(15,15,26,0.6)` card bg
- Accent: `#a78bfa` violet (primary), `#60a5fa` blue (secondary), `#fbbf24` gold (highlights)
- Text: `#e2e8f0` primary, `#475569` muted
- Borders: `rgba(255,255,255,0.06)` default, `rgba(167,139,250,0.25)` violet
- Typography: Georgia serif for headings, system for body, monospace for labels
- Layout: `max-w-xl mx-auto px-4 pt-8 pb-4 space-y-5`

## Social Features (IN PROGRESS)
See active planning doc. Key decisions:
- Sign-in required to browse shared dreams
- User picks handle (auto-default from email or random)
- Both inline similarity + discovery page
- Feed: recent + similarity-boosted

## Gaps / TODOs
- Journal entries NOT synced to Supabase (only dreams sync)
- No user profile beyond Supabase UUID
- No content moderation pipeline
- No real-time (Supabase Realtime available but unused)
- Natal chart wheel needs house number display cleanup
