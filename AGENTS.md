# digeart

Music discovery app (YouTube-only) for underground diggers & curators of electronic music.

## Repo & Deploy

- **Repo:** github.com/9000fm/digeart
- **Host:** Vercel
- **Deploy URL:** _fill in production URL once live_

## Env vars

Required (see `.env.local`):
- `YOUTUBE_API_KEY` — YouTube Data API v3
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `NEXTAUTH_SECRET` — NextAuth session encryption
- `NEXTAUTH_URL` — `http://localhost:3000` (dev) or production URL
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `CURATOR_EMAIL` — email of the authorized curator

Optional:
- `DISCOGS_TOKEN` — Discogs API personal access token (Phase 2)

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript 5**
- **Tailwind CSS v4** (PostCSS plugin, NOT v3 config format)
- **Supabase** — database & auth checks
- **NextAuth v5 beta** — Google OAuth with YouTube scope
- **Framer Motion** — player enter/exit springs, grid animations
- **canvas-confetti** — heart save celebrations

## Commands

```bash
npm run dev       # local dev server
npm run build     # production build (catches TS errors)
npm run lint      # ESLint
```

No test suite — validation is build + lint + manual testing.

## Project structure

```
src/
├── app/
│   ├── api/          # Route handlers (curator, discover, mixes, samples, auth)
│   ├── curator/      # Curator panel (page, components, hooks, types)
│   ├── fonts/        # Local fonts (FlexingDemo)
│   ├── globals.css   # Theme vars, custom animations (EQ, marquee, skeleton)
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Main discovery interface (~600 lines, the big one)
├── components/       # Shared UI (MusicCard, Sidebar, QueuePanel, Player, etc.)
├── lib/              # Utilities (youtube.ts, supabase.ts, cache.ts, types.ts)
├── auth.ts           # NextAuth config
└── middleware.ts     # Next.js middleware
```

Path alias: `@/*` → `src/*`

## Code conventions

- Default exports: `export default function ComponentName()`
- `memo()` wrapper on heavy components (MusicCard, etc.)
- `"use client"` at top of interactive components
- State via React hooks + Context API (ThemeProvider, PreferencesProvider, AuthProvider)
- Props typed with `interface` above the component
- Fonts: Space Mono (body), Big Shoulders (banner), FlexingDemo (display)

## Theming

CSS variable system in `globals.css` — light default, dark via `data-theme="dark"`:

- Layout: `--sidebar-width`, `--banner-height`, `--header-height`, `--player-height`
- Colors: `--bg`, `--bg-alt`, `--bg-card`, `--text`, `--text-secondary`, `--accent`

Always use `var(--*)` for colors — never hardcode hex values.

## Rules

- NEVER change UI/visual elements without proposing 2-3 alternatives first — I will pick
- NEVER push to git without explicit permission — always confirm commit and push separately
- NEVER auto-rescue rejected channels during sync
- Prefer simple fixes over overengineered solutions — no Workers, AudioContexts, etc. when a simple code change works
- Verify CSS positioning actually matches the intended direction before applying — inline styles beat className
- Keep all public-facing text (README, info panel) vague — no thresholds, no internal logic exposed

## Multi-layout rules (CRITICAL — stop breaking things)

- **3 layouts coexist**: Desktop (≥1152px, sidebar left), Tablet (500-1152px, nav top), Mobile (<500px, nav top + bottom sheet). Changes to ONE layout must be verified in ALL THREE.
- **Shared components, separate renders**: NAV_ITEMS, volumeControl(), seekBar() are shared functions rendered in multiple layouts. Changing the function affects ALL layouts. To change only one layout, override via wrapper classes (e.g. `[&_svg]:w-6`) on the layout-specific container, NOT the shared function.
- **Hardcoded heights = bugs**: NEVER hardcode heights (e.g. `h-[72px]`) when a CSS variable exists (`h-[var(--header-height-mobile)]`). Hardcoded values desync from the variable, causing overlap/gap bugs across layouts.
- **`position: fixed` + `relative` conflict**: NEVER put both on the same element. `relative` overrides `fixed` → element renders inline instead of viewport-fixed. Use `fixed` alone; it already acts as containing block for `absolute` children.
- **About panel**: Desktop = popover (top-right). Tablet/Mobile = bottom sheet with blur backdrop. NEVER show the bottom sheet on desktop or the popover on mobile.
- **Settings panel anchor**: Desktop gear icon uses `gearRef`. Desktop dropdown uses `[data-auth-desktop]`. Mobile dropdown uses `[data-auth-button]`. Each layout queries its OWN selector.
- **Auto-close on resize**: About and Settings panels close on window resize to prevent positioning bugs across breakpoint transitions.
- **Test at ALL breakpoints before committing**: Full desktop, narrow desktop (1152-1350px), tablet (500-1152px), and mobile (<500px). Non-negotiable.

## Tailwind v4 pitfalls

- **`text-[Npx]` + `text-[var(--color)]` = BROKEN**: Tailwind v4 can't distinguish font-size from color when the value is a CSS variable. The color class may override font-size. **Fix**: Use `style={{ fontSize: N }}` when both are needed on the same element. See ARCHITECTURE.md §7.5.
- **Arbitrary values on `<button>`**: Browser default button styles can interfere with Tailwind arbitrary values. Always verify buttons render at the expected size.
- **`min-[1152px]:` not `lg:`**: The app uses 1152px as the primary breakpoint, NOT Tailwind's default `lg` (1024px). Using `lg:` will break layouts.

## Technical quirks (things I keep forgetting)

- **1152px breakpoint**: sidebar, player, nav, grid, and tutorial `isMobile` ALL switch at 1152px — not Tailwind `lg` (1024px). Use `min-[1152px]:` for layout-dependent styles
- **Tailwind v4 grid bug**: `min-[1152px]:grid-cols-5` loses to `sm:grid-cols-3` due to CSS ordering. Grid 5-col is handled via plain CSS media query with `!important` in globals.css
- **YouTube player**: NEVER destroy/recreate on track change — use `loadVideoById()`. Destroying kills the postMessage channel, breaks auto-advance in background tabs
- **Volume slider**: throttled `setVolume` (50ms) to avoid full-page re-renders. Each layout instance (desktop/tablet) needs its OWN ref — never share refs across multiple JSX calls of the same function
- **Player layout**: 2-row Spotify-style. Shuffle goes RIGHT of transport with locate, never left. No `flex-1 overflow-hidden` on center column — it blocks pointer events on right group
- **Pool system**: 3-layer cache (memory → Supabase → YouTube API). Rebuilds every 6h. `seededShuffle` with daily seed + per-session `rotate` param for fresh-on-refresh
- **Mix routing (Part C)**: videos > 45 min (2700s) auto-route to the mixes pool regardless of the channel's curator label. `buildMixesPool` pulls raw from BOTH `mixes` and `discover` raw caches, dedupes by id, then filters by `isValidMixVideo` (duration ≥ 2700). Mixed channels (e.g. AlbionStreetMusic83) contribute their long DJ sets to mixes AND their short tracks to discover
- **Scrollbar zoom**: `overflow: hidden` on body removes Windows scrollbar (~17px), causing layout shift. Compensate with `padding-right` equal to scrollbar width
