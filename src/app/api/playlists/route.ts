import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { dbCircuitOpen, tripDbCircuit, withDbTimeout } from "@/lib/dbGuard";
import type { CardData, Playlist, PlaylistTrack } from "@/lib/types";

// All playlist access goes through here so the browser never touches the
// `playlists` / `playlist_tracks` tables directly. The user's email is ALWAYS
// taken from the authenticated session — never from the request body — so a
// client can only ever read/write its own playlists. RLS denies the anon key;
// the admin client bypasses it. "Liked" is virtual (synthesized client-side
// from the existing likes) and is NOT stored here.

interface PlaylistRow {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface TrackRow {
  id: string;
  playlist_id: string;
  position: number;
  video_id: string;
  card_data: CardData;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = supabaseAdmin();
  const id = req.nextUrl.searchParams.get("id");

  // DB wedged — fail fast so the saved view degrades instead of hanging.
  if (dbCircuitOpen()) {
    return NextResponse.json(id ? { tracks: [], degraded: true } : { playlists: [], degraded: true });
  }

  try {
    // Single playlist + its ordered tracks
    if (id) {
      const { data: pl, error: plErr } = await withDbTimeout(
        db
          .from("playlists")
          .select("id, name, description, is_public, created_at, updated_at")
          .eq("user_email", email).eq("id", id).single()
      );
      if (plErr || !pl) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const { data: trackRows, error: tErr } = await withDbTimeout(
        db
          .from("playlist_tracks")
          .select("id, position, card_data")
          .eq("playlist_id", id)
          .order("position", { ascending: true })
          .limit(2000)
      );
      if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

      const tracks: PlaylistTrack[] = (trackRows ?? []).map((r) => ({
        id: r.id as string,
        position: r.position as number,
        card: r.card_data as CardData,
      }));
      const row = pl as PlaylistRow;
      const playlist: Playlist = {
        id: row.id, name: row.name, description: row.description, isPublic: row.is_public,
        createdAt: row.created_at, updatedAt: row.updated_at,
        trackCount: tracks.length,
        coverCards: tracks.slice(0, 4).map((t) => ({ id: t.card.id, image: t.card.image, imageSmall: t.card.imageSmall })),
      };
      return NextResponse.json({ playlist, tracks });
    }

    // List all of the user's playlists (with count + 2×2 cover snapshots)
    const { data: rows, error } = await withDbTimeout(
      db
        .from("playlists")
        .select("id, name, description, is_public, created_at, updated_at")
        .eq("user_email", email)
        .order("updated_at", { ascending: false })
    );
    if (error) return NextResponse.json({ playlists: [], degraded: true });

    const playlists = (rows ?? []) as PlaylistRow[];
    const ids = playlists.map((p) => p.id);

    // Fetch tracks for all playlists at once; group in JS for count + cover.
    // Fine for personal-scale playlists; revisit with an RPC/view if lists grow huge.
    const byPlaylist = new Map<string, TrackRow[]>();
    if (ids.length > 0) {
      const { data: trackRows } = await withDbTimeout(
        db
          .from("playlist_tracks")
          .select("id, playlist_id, position, video_id, card_data")
          .in("playlist_id", ids)
          .order("position", { ascending: true })
          .limit(5000)
      );
      for (const r of (trackRows ?? []) as TrackRow[]) {
        const list = byPlaylist.get(r.playlist_id) ?? [];
        list.push(r);
        byPlaylist.set(r.playlist_id, list);
      }
    }

    const result: Playlist[] = playlists.map((p) => {
      const tracks = byPlaylist.get(p.id) ?? [];
      return {
        id: p.id, name: p.name, description: p.description, isPublic: p.is_public,
        createdAt: p.created_at, updatedAt: p.updated_at,
        trackCount: tracks.length,
        coverCards: tracks.slice(0, 4).map((t) => ({ id: t.card_data.id, image: t.card_data.image, imageSmall: t.card_data.imageSmall })),
      };
    });
    return NextResponse.json({ playlists: result });
  } catch {
    tripDbCircuit(); // timeout → cool off before hitting the DB again
    return NextResponse.json(id ? { tracks: [], degraded: true } : { playlists: [], degraded: true });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action: string | undefined = body?.action;
  const db = supabaseAdmin();

  // Verifies the playlist belongs to the session user; returns false if not.
  const owns = async (playlistId: string): Promise<boolean> => {
    const { data } = await db.from("playlists").select("id").eq("id", playlistId).eq("user_email", email).single();
    return !!data;
  };
  const touch = (playlistId: string) =>
    db.from("playlists").update({ updated_at: new Date().toISOString() }).eq("id", playlistId).eq("user_email", email);

  switch (action) {
    case "create": {
      const name = (body?.name as string | undefined)?.trim();
      if (!name) return NextResponse.json({ error: "Bad request" }, { status: 400 });
      const { data, error } = await db.from("playlists")
        .insert({ user_email: email, name })
        .select("id, name, description, is_public, created_at, updated_at").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const row = data as PlaylistRow;
      const playlist: Playlist = {
        id: row.id, name: row.name, description: row.description, isPublic: row.is_public,
        createdAt: row.created_at, updatedAt: row.updated_at, trackCount: 0, coverCards: [],
      };
      return NextResponse.json({ ok: true, playlist });
    }
    case "rename": {
      const { playlistId, name } = body ?? {};
      const clean = (name as string | undefined)?.trim();
      if (!playlistId || !clean) return NextResponse.json({ error: "Bad request" }, { status: 400 });
      const { error } = await db.from("playlists").update({ name: clean }).eq("id", playlistId).eq("user_email", email);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    case "delete": {
      const { playlistId } = body ?? {};
      if (!playlistId) return NextResponse.json({ error: "Bad request" }, { status: 400 });
      const { error } = await db.from("playlists").delete().eq("id", playlistId).eq("user_email", email);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    case "addTrack": {
      const { playlistId, videoId, cardData } = body ?? {};
      if (!playlistId || !videoId || !cardData) return NextResponse.json({ error: "Bad request" }, { status: 400 });
      if (!(await owns(playlistId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
      // Append to the end: next position = max(position)+1. Using max (not count) stays
      // correct after removals leave gaps — count could collide with an existing position.
      const { data: last } = await db.from("playlist_tracks")
        .select("position").eq("playlist_id", playlistId)
        .order("position", { ascending: false }).limit(1).maybeSingle();
      const nextPos = (last?.position ?? -1) + 1;
      const { error } = await db.from("playlist_tracks").upsert(
        { playlist_id: playlistId, video_id: videoId, position: nextPos, card_data: cardData },
        { onConflict: "playlist_id,video_id", ignoreDuplicates: true }
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await touch(playlistId);
      return NextResponse.json({ ok: true });
    }
    case "removeTrack": {
      const { playlistId, videoId } = body ?? {};
      if (!playlistId || !videoId) return NextResponse.json({ error: "Bad request" }, { status: 400 });
      if (!(await owns(playlistId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const { error } = await db.from("playlist_tracks").delete().eq("playlist_id", playlistId).eq("video_id", videoId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await touch(playlistId);
      return NextResponse.json({ ok: true });
    }
    case "reorder": {
      const { playlistId, orderedVideoIds } = body ?? {};
      if (!playlistId || !Array.isArray(orderedVideoIds)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
      if (!(await owns(playlistId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
      // Rewrite positions to match the new order. Small N (personal playlists).
      // Surface any failure so the client can re-sync instead of trusting a half-written order.
      for (let i = 0; i < orderedVideoIds.length; i++) {
        const { error } = await db.from("playlist_tracks").update({ position: i })
          .eq("playlist_id", playlistId).eq("video_id", orderedVideoIds[i]);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
      await touch(playlistId);
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
