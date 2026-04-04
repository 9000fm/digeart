# Changelog

All notable changes to digeart are documented here.

## [1.6.0-beta] — 2026-04-03

### Added
- Vercel cron job — auto-rebuilds pool at 7am and 7pm
- Supabase-based rebuild lock — prevents duplicate rebuilds across visitors
- Health check endpoint (`/api/health`)
- `APP_VERSION` env variable — version centralized from package.json
- Dependabot for weekly dependency checks

### Changed
- Pool cache TTL: 3h → 12h (fewer rebuilds, less quota usage)
- Raw cache TTL: 12h → 24h
- Fetch timeout: 8s → 20s (prevents AbortError on cold starts)
- "Refresh Pool" now marks cache stale instead of deleting (old data keeps serving)
- Disabled Vercel image optimization (YouTube serves optimized webp)
- Genres attached to cards — no per-genre pool rebuilds

### Fixed
- Maintenance screen: removed all-caps, fixed dot animation shift, display font for title
- Gem shadow animation synced to gem rotation

## [1.5.3-beta] — 2026-04-02

### Changed
- Version bump

## [1.5-beta] — 2026-04-02

### Added
- Shuffle queue with queue panel
- Saved tracks rewrite
- Player close button with hover reveal

### Fixed
- Queue close button styling
- Queue icon replacement

## [1.2-beta] — 2026-03-31

### Added
- Persistent pool cache (Supabase)
- Starred channel priority in shuffle

### Fixed
- YouTube quota handling
