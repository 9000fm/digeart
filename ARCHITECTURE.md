# digeart — Technical Architecture

> Reference document for developers and AI assistants working on this codebase.  
> Last updated: v1.9.0-beta (2026-04-09)

---

## 1. Project Overview

**digeart** is a music discovery web application focused on underground electronic music. Content is sourced exclusively from YouTube via curated channels. A single curator (the project owner) approves, categorizes, and weights channels through a private admin panel. The public-facing site presents a daily-shuffled feed of tracks, mixes, and samples.

### History

| Version | Date | Milestone |
|---------|------|-----------|
| 1.0–1.2 | Mar 2026 | Initial launch. Persistent pool cache, quota management, starred channel priority. |
| 1.5 | Apr 2 | Shuffle queue, queue panel, saved tab rewrite, player polish. |
| 1.6 | Apr 3–4 | Quota overhaul, death spiral fix, cron-based pool rebuilds, dev tooling, welcome screen. Sentry integration. |
| 1.7 | Apr 4 | Player overhaul: volume fader, queue hearts, keybinds, brand polish. |
| 1.8 | Apr 6 | Saved tab sections, DJ mode (pitch fader), like animation, tab reorder. |
| 1.9 | Apr 8–9 | Curator overhaul, weighted pool algorithm, activity tier classification, boost/bury system, Lottie heart animation, toast system, ARCHITECTURE.md. |

### Direction

- **Phase 2 (planned):** Per-track hide, curator session log, channel era tags, Discogs metadata enrichment.
- **Long-term:** Multi-curator support, social follows, recommendation engine.

---

## 2. Tech Stack

```
Next.js 16 (App Router)  ·  React 19  ·  TypeScript 5
Tailwind CSS v4 (PostCSS plugin)
Supabase (PostgreSQL database + auth checks)
NextAuth v5 beta (Google OAuth with YouTube scope)
Framer Motion (player animations)
lottie-react (heart like celebration)
```

### Key Constraints

- **No test suite.** Validation is `npm run build` + `npm run lint` + manual testing.
- **YouTube API quota:** 10,000 units/day (applied for 50,000 increase, pending).
- **Single curator:** All mutations gated by `CURATOR_EMAIL` env var.

---

## 3. Data Flow

### 3.1 Pool Builder (`src/lib/youtube.ts`)

The pool builder is the core algorithm that determines what tracks appear on the homepage.

```
                    ┌─────────────┐
                    │  Supabase   │
                    │  curator_   │
                    │  channels   │
                    └──────┬──────┘
                           │ getApprovedChannels()
                           │ reads: status, labels, starred,
                           │        activity_tier, boost_state
                           ▼
               ┌───────────────────────┐
               │   YouTube API         │
               │   playlistItems.list  │
               │   videos.list         │
               └───────────┬───────────┘
                           │ getChannelUploads()
                           │ returns: YouTubeVideo[]
                           ▼
                    ┌──────────────┐
                    │  Raw Video   │
                    │  Cache       │
                    │  (Supabase   │
                    │  pool_cache) │
                    └──────┬───────┘
                           │ getRawVideos(poolType)
                           ▼
               ┌───────────────────────┐
               │   smartSample()       │
               │                       │
               │   1. Weight each      │
               │      video by its     │
               │      channel weight   │
               │                       │
               │   2. Weighted random  │
               │      selection        │
               │                       │
               │   3. Shape: 40%       │
               │      recent + 40%     │
               │      popular + 20%    │
               │      random           │
               │                       │
               │   4. Daily seeded     │
               │      shuffle          │
               └───────────┬───────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Pool Cache  │
                    │  (Supabase)  │
                    │              │
                    │  discover    │
                    │  mixes       │
                    │  samples     │
                    └──────────────┘
```

### 3.2 Channel Weight Formula

```
channelWeight = boostMultiplier × tierMultiplier × starMultiplier

boostMultiplier:
  "boost"   → 1.7
  "default" → 1.0
  "bury"    → 0.3

tierMultiplier:
  "purple"  → 1.5    (≥150 uploads, <15d cadence, <20d recency, >1y history)
  "green"   → 1.2    (<30d recency, <21d avg cadence)
  "yellow"  → 1.0    (everything in between)
  "red"     → 0.6    (>120d since last upload)
  null      → 1.0    (not yet classified)

starMultiplier:
  starred   → 1.5
  unstarred → 1.0
```

Implementation: `computeChannelWeight()` in `src/lib/youtube.ts`.

### 3.3 Pool Types

| Pool | Filter | Duration | Source Channels |
|------|--------|----------|-----------------|
| `discover` | 4–15 min, electronic, not non-music | Short tracks | Channels with electronic labels |
| `mixes` | ≥45 min, music-related | Long DJ sets | Mix-labeled channels + long videos from any channel (excluding sample-tagged) |
| `samples` | Any duration | Samples, world, funk, jazz | Sample-labeled channels |

### 3.4 Cache Layers

```
Layer 1: In-memory (Node.js process)     → instant, lost on cold start
Layer 2: Supabase pool_cache table       → 12-hour TTL, survives deploys
Layer 3: YouTube API (deep fetch)         → only on rebuild
```

Rebuilds are triggered by cron (1x/day at 7am) or manually via the curator stats bar. User requests NEVER trigger rebuilds — they always read from cache.

### 3.5 Daily Seed

`seededShuffle()` uses a deterministic PRNG seeded by `Math.floor(Date.now() / 86_400_000)`. Same day → same shuffle order. Per-session `rotate` parameter shifts the starting position for fresh-on-refresh.

---

## 4. Player (`src/components/NowPlayingBanner.tsx`)

### 4.1 Layout

Desktop (≥1152px): 3-column CSS Grid, `max-w-[2560px]`.

```
┌──────────────────────────────────────────────────────────┐
│ Block 1          │ Block 2              │ Block 3        │
│ Album art (70px) │ Row 1: Controls      │ Queue button   │
│ Title + Artist   │ Row 2: Seek bar      │ Volume slider  │
│ EQ bars          │                      │ Fullscreen     │
└──────────────────────────────────────────────────────────┘
```

Three responsive layouts coexist in the DOM (desktop / tablet / mobile), toggled by CSS `display`. The breakpoint is **1152px** — not Tailwind's default `lg` (1024px). Use `min-[1152px]:` for all layout-dependent styles.

### 4.2 YouTube Iframe

The YouTube iframe must NEVER be destroyed and recreated on track change. Use `loadVideoById()` instead. Destroying kills the `postMessage` channel and breaks auto-advance in background tabs.

### 4.3 Pitch Fader (DJ Mode)

The pitch fader pill is inside `<AnimatePresence><motion.div className="overflow-hidden">` for the DJ mode slide-in animation. This creates a constraint:

- The `motion.div` has `overflow: hidden` + framer-motion `transform`.
- Together, these create a **containing block** that clips `position: fixed` children.
- Standard `<Tooltip>` and React portals (`createPortal`) are clipped inside this container.

**Solution for the slider hover bubble:** Vanilla DOM manipulation — `document.createElement('div')` appended directly to `document.body`, positioned via `getBoundingClientRect()` in mouse event handlers. This bypasses React's tree and the framer-motion transform entirely.

**Solution for the metronome tooltip:** The `<Tooltip>` component has an opt-in `portal` prop that renders via `createPortal` to `document.body` with viewport-based positioning.

### 4.4 Volume Slider

Each layout instance (desktop, tablet, mobile) needs its OWN ref for the volume track element. Sharing refs across multiple JSX renders of the same function causes reads from the wrong DOM node.

Volume state updates are throttled (50ms) to prevent full-page re-renders on every drag tick.

### 4.5 Close Button

The close-X button uses a CSS-only hover delay technique:
- Base state: `transition-delay: 800ms` (applies on mouse leave)
- Hover state: `transition-delay: 0ms` (instant show on enter)

This provides an 800ms grace period before the button fades on mouse leave.

---

## 5. Heart Animation (`src/components/HeartLikeButton.tsx`)

Shared component used in three contexts: MusicCard, NowPlayingBanner (player), QueuePanel.

### 5.1 Rendering

```
<span role="button">           ← NOT <button> (queue row is already a <button>)
  <svg>                         ← static heart, fills based on isLiked
    <path outline />            ← always rendered, hidden when filled
    <path fill overlay />       ← conditionally rendered with animation
  </svg>
  <span lottie-wrapper>         ← particle burst, absolute positioned
    <Lottie />
  </span>
</span>
```

Uses `<span role="button">` instead of `<button>` because the queue row is itself a `<button>`, and nested buttons are invalid HTML.

### 5.2 Animation States

| Trigger | Outline | Fill | Lottie Particles |
|---------|---------|------|------------------|
| **Self-click like** | Visible → hidden at 0.4s | Appears at 0.4s | Plays for 1.2s |
| **External like / undo** | Visible at 35% opacity | Fill-up animation from bottom (0.8s) | None |
| **Unlike** | Instant visible | Instant hidden | None |
| **Already liked (mount)** | Hidden | Visible (steady state) | None |

### 5.3 Lottie

The Lottie JSON (`src/data/heart-animation.json`) contains ONLY particle hearts — the main center heart layer was removed from the original file so it doesn't compete with the SVG heart.

Color adaptation via CSS filter:
```css
.lottie-light { filter: brightness(0) invert(1); }    /* white particles */
.lottie-dark  { filter: brightness(0); }               /* black particles */
```

The `lottieVariant` prop controls which class is applied. Default is `"auto"` which reads from `useTheme()`.

### 5.4 Context-Specific Colors

| Context | Heart Color | Lottie Variant |
|---------|-------------|----------------|
| Card (any theme) | `text-white` | `"light"` (always white) |
| Player (light) | `var(--text)` = dark | `"auto"` → `"dark"` |
| Player (dark) | `var(--text)` = light | `"auto"` → `"light"` |
| Queue current row | `var(--bg)` = inverted | Computed per theme |
| Queue other rows | `var(--text-muted)` | `"auto"` |

---

## 6. Curator (`src/app/curator/`)

### 6.1 Auth

All mutation endpoints in `src/app/api/curator/route.ts` call `requireCurator()`:

```
requireCurator():
  session = await auth()
  if session.user.email !== process.env.CURATOR_EMAIL:
    return 403 Forbidden
```

Rate limits (in-memory, per-process):
- Rescan: 60/minute
- Subscriptions sync: 3/5 minutes

### 6.2 Activity Tier Classification

Computed during channel rescan. Stored in `curator_channels.activity_tier`.

```
classifyActivity(uploadDates, totalUploads, oldestUploadDate):
  if no uploads OR daysSinceLast > 120: return "red"
  
  avgGap = average days between last 10 uploads
  
  if daysSinceLast < 20
     AND avgGap < 15
     AND totalUploads >= 150
     AND channel age > 1 year:
    return "purple"
  
  if daysSinceLast < 30 AND avgGap < 21:
    return "green"
  
  return "yellow"
```

Implementation: `src/lib/curator-activity.ts`

### 6.3 Toast System

`CuratorToastProvider` wraps the curator page. `useCuratorToast()` hook exposes:

```
{ toasts, showToast(message, variant), dismiss(id), lastSavedAt }
```

- Variants: `"success"` | `"error"` | `"info"`
- Auto-dismiss: 2.5s success, 5s error
- Max 3 visible (oldest dropped)
- Each toast has a subtle × close button
- `lastSavedAt` drives the stats bar "synced Xs ago" indicator

### 6.4 Boost/Bury System

Three-state control per channel: `boost` | `default` | `bury`

Stored in `curator_channels.boost_state`. UI: segmented button in the audit body (replaces the former notes textarea). The weight formula (§3.2) multiplies this with activity tier and star status.

### 6.5 API Resilience

All queries that include new columns (activity_tier, boost_state, etc.) use a try/fallback pattern:

```
result = query with new columns
if result.error:
  result = query with original columns only
```

This prevents the app from breaking before Supabase migrations are applied.

---

## 7. Theming (`src/app/globals.css`)

### 7.1 CSS Variables

Light theme is default. Dark theme via `[data-theme="dark"]` attribute on `<html>`.

| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--bg` | `#ffffff` | `#09090b` | Page background |
| `--bg-alt` | `#f4f4f5` | `#18181b` | Cards, panels, player |
| `--text` | `#18181b` | `#fafafa` | Primary text |
| `--text-secondary` | `#71717a` | `#71717a` | Secondary text |
| `--text-muted` | `#a1a1aa` | `#52525b` | Muted text, placeholders |
| `--border` | `#e4e4e7` | Same as bg-alt | Borders, dividers |
| `--accent` | `#18181b` | `#fafafa` | Accent (same as text) |

Always use `var(--*)` for colors. Hardcoded hex only for: YouTube thumbnail overlays, activity tier dots (`tierColor()` returns hex), confetti burst colors.

### 7.2 Layout Variables

```
--sidebar-width: 80px
--banner-height: 36px
--header-height: 68px / 72px (mobile)
--player-height: 148px (desktop) / 96px / 90px (mobile)
```

---

## 8. Supabase Schema

### 8.1 Tables

```
curator_channels
  channel_id          TEXT PRIMARY KEY
  name                TEXT
  status              TEXT            -- pending | approved | rejected | filtered
  labels              TEXT[]          -- genre tags
  starred             BOOLEAN
  boost_state         TEXT            -- boost | default | bury
  notes               TEXT            -- auto-classification notes
  curator_notes       TEXT            -- private curator notes
  activity_tier       TEXT            -- purple | green | yellow | red
  last_upload_at      TIMESTAMPTZ
  total_uploads       INTEGER
  oldest_upload_at    TIMESTAMPTZ
  subscriber_count    INTEGER
  activity_computed_at TIMESTAMPTZ
  import_source       TEXT
  imported_at         TIMESTAMPTZ
  reviewed_at         TIMESTAMPTZ
  last_scanned_at     TIMESTAMPTZ
  uploads_fetched     INTEGER

pool_cache
  key                 TEXT PRIMARY KEY  -- "discover", "mixes", "samples", "raw-*", "lock-*"
  data                JSONB
  updated_at          TIMESTAMPTZ

likes
  user_email          TEXT
  video_id            TEXT
  card_data           JSONB
  deleted_at          TIMESTAMPTZ       -- soft delete for undo
  PRIMARY KEY (user_email, video_id)
```

### 8.2 Migrations Applied

1. `20260408_curator_activity.sql` — Added: activity_tier, last_upload_at, total_uploads, oldest_upload_at, subscriber_count, curator_notes, activity_computed_at
2. `20260408_channel_boost.sql` — Added: boost_state (TEXT DEFAULT 'default')

---

## 9. File Reference

### Core

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main discovery page, keybind handler, undo state |
| `src/lib/youtube.ts` | Pool builder, YouTube API wrappers, weight formula |
| `src/lib/curator-activity.ts` | Activity tier classification, formatters |

### Components

| File | Purpose |
|------|---------|
| `src/components/NowPlayingBanner.tsx` | Player (all 3 layouts) |
| `src/components/HeartLikeButton.tsx` | Shared heart with Lottie + animation states |
| `src/components/MusicCard.tsx` | Track card in the grid |
| `src/components/QueuePanel.tsx` | Queue panel with heart + drag reorder |
| `src/components/Tooltip.tsx` | Shared tooltip with optional portal mode |
| `src/components/UndoToast.tsx` | Stacking undo toast pile |
| `src/components/SavedGrid.tsx` | Saved tab grid with type filtering |

### Curator

| File | Purpose |
|------|---------|
| `src/app/curator/page.tsx` | Curator entry, decision + undo handlers, boost wiring |
| `src/app/curator/components/AuditMode.tsx` | Approved channel audit view |
| `src/app/curator/components/ChannelAuditBody.tsx` | Channel header card, boost control, upload grid |
| `src/app/curator/components/ReviewQueue.tsx` | Pending channel review view |
| `src/app/curator/components/CuratorToast.tsx` | Curator toast pile UI |
| `src/app/curator/hooks/useCuratorToast.tsx` | Toast context + hook + lastSavedAt |
| `src/app/curator/hooks/useCuratorActions.ts` | Star toggle, decision, rescan with rollback |
| `src/app/api/curator/route.ts` | All curator CRUD (auth gate, rate limit, fallback queries) |

---

## 10. Environment Variables

```
# Required
YOUTUBE_API_KEY          — YouTube Data API v3
GOOGLE_CLIENT_ID         — Google OAuth
GOOGLE_CLIENT_SECRET     — Google OAuth
NEXTAUTH_SECRET          — NextAuth session encryption
NEXTAUTH_URL             — http://localhost:3000 (dev) or production URL
NEXT_PUBLIC_SUPABASE_URL — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anon key
CURATOR_EMAIL            — Email of the authorized curator (e.g. user@gmail.com)

# Optional
DISCOGS_TOKEN            — Discogs API personal access token (Phase 2)
```
