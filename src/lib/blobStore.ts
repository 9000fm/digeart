// Pool storage on Vercel Blob.
//
// The card feed (discover / mixes / samples pools + their raw caches + the
// cold-start seed) is stored here, NOT in Supabase. Reason: when the Supabase
// NANO instance wedges, every query times out and the feed used to die with it.
// Blob is served from Vercel's own CDN and is independent of Postgres, so the
// feed keeps loading even while the database is down.
//
// Only the FEED moves here. Likes, playlists, curators and gems stay on
// Supabase (per-user / curator data — see likesClient.ts, playlistsClient.ts).
//
// This file is the entire Blob surface: two functions, readPool / writePool.
// `getPoolFromSupabase` / `savePoolToSupabase` in youtube.ts delegate to these
// and keep their old names + shapes so nothing upstream changes.

import { put, head } from "@vercel/blob";

// All pools live under one prefix as fixed, deterministic pathnames (no random
// suffix) so the same key always overwrites the same blob.
const PREFIX = "pool/";
const pathFor = (key: string) => `${PREFIX}${key}.json`;

// The public store base URL (e.g. https://<id>.public.blob.vercel-storage.com).
// Learned once per server instance from the first head()/put() so later reads
// can hit the CDN URL directly — a cache HIT, free and fast — instead of an API
// round-trip on every read.
let _baseUrl: string | null = null;

function rememberBase(url: string, pathname: string): void {
  const suffix = "/" + pathname;
  if (url.endsWith(suffix)) _baseUrl = url.slice(0, url.length - suffix.length);
}

export interface PoolBlob<T> {
  updatedAt: string; // ISO — replaces the Supabase `updated_at` column
  data: T;
}

// Write a pool blob. Overwrites the same pathname every time; Vercel purges the
// CDN cache on overwrite, so a daily rebuild is reflected within minutes.
export async function writePool(key: string, data: unknown): Promise<void> {
  const pathname = pathFor(key);
  const body = JSON.stringify({ updatedAt: new Date().toISOString(), data });
  const blob = await put(pathname, body, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60 * 60, // 1h CDN ceiling; overwrite purges sooner on rebuild
  });
  rememberBase(blob.url, pathname);
}

// Read a pool blob, or null if it doesn't exist / fetch fails. Never throws — a
// failure just means the caller falls back (memory cache → static fallback).
export async function readPool<T>(key: string): Promise<PoolBlob<T> | null> {
  const pathname = pathFor(key);
  try {
    // Warm path: construct the public CDN URL and fetch it straight (cache HIT).
    if (_baseUrl) {
      const res = await fetch(`${_baseUrl}/${pathname}`);
      if (res.status === 404) return null;
      if (res.ok) return (await res.json()) as PoolBlob<T>;
      // any other status → fall through to the API path below
    }
    // Cold path (or stale base): ask the API for the blob URL, cache the base,
    // then fetch the body from the CDN.
    const meta = await head(pathname);
    rememberBase(meta.url, pathname);
    const res = await fetch(meta.url);
    if (!res.ok) return null;
    return (await res.json()) as PoolBlob<T>;
  } catch {
    return null; // not found / network / parse → caller falls back
  }
}
