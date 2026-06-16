-- Playlists v1 — personal now, social-ready.
-- SECURITY: unlike the old v1 branch, the browser NEVER touches these tables.
-- All access goes through /api/playlists with supabaseAdmin() (service role) and
-- the user email is taken from the authenticated session. RLS is enabled with NO
-- policy, so the anon key is denied entirely — the service role bypasses RLS.
-- "Liked" is NOT stored here; it's a virtual playlist the API synthesizes from
-- the existing `likes` table.

create table if not exists public.playlists (
  id              uuid primary key default gen_random_uuid(),
  user_email      text not null,
  name            text not null,
  description     text,
  cover_video_id  text,                              -- reserved (custom cover later); v1 auto-collages tracks
  is_public       boolean not null default false,    -- future: shareable playlists / curator boost
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists playlists_user_email_updated_idx
  on public.playlists (user_email, updated_at desc);

create table if not exists public.playlist_tracks (
  id           uuid primary key default gen_random_uuid(),
  playlist_id  uuid not null references public.playlists(id) on delete cascade,
  video_id     text not null,
  position     integer not null,
  card_data    jsonb not null,                       -- denormalized card snapshot (survives pool rebuilds)
  added_at     timestamptz not null default now(),
  unique (playlist_id, video_id)                     -- no duplicate track in the same playlist
);

create index if not exists playlist_tracks_playlist_position_idx
  on public.playlist_tracks (playlist_id, position);

-- RLS: enabled, NO policy → anon key denied. Only the service-role admin client
-- (used by /api/playlists) can read/write. Same lockdown as curator_channels.
alter table public.playlists       enable row level security;
alter table public.playlist_tracks enable row level security;

-- updated_at auto-bump on playlists (touched whenever the row or its tracks change)
create or replace function public.playlists_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists playlists_touch_updated_at_trg on public.playlists;
create trigger playlists_touch_updated_at_trg
  before update on public.playlists
  for each row
  execute function public.playlists_touch_updated_at();
