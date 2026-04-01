import { cacheGet, cacheSet } from "./cache";
import { supabase } from "./supabase";
import type { CardData } from "./types";

const API_KEY = process.env.YOUTUBE_API_KEY!;
const YT_API = "https://www.googleapis.com/youtube/v3";

/* ── Tag type ────────────────────────────────────────────────────────── */

export type Tag = "all" | "hot" | "rare" | "new";

const VALID_TAGS: Tag[] = ["all", "hot", "rare", "new"];

export function isValidTag(v: string | null | undefined): v is Tag {
  return VALID_TAGS.includes(v as Tag);
}

/* ── Seeded PRNG (mulberry32) ────────────────────────────────────────── */

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Daily seed — same value across all Vercel instances for the same day */
function dailySeed(): number {
  return Math.floor(Date.now() / 86_400_000);
}

/** Fisher-Yates shuffle with seeded PRNG — deterministic per day */
function seededShuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  const rand = mulberry32(dailySeed());
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ── Approved channels from Supabase (cached) ───────────────────────── */

type ApprovedChannel = { name: string; id: string; labels?: string[]; starred?: boolean };

async function getApprovedChannels(): Promise<ApprovedChannel[]> {
  const cacheKey = "supabase-approved-channels-v1";
  const cached = cacheGet<ApprovedChannel[]>(cacheKey);
  if (cached) return cached;

  const { data } = await supabase
    .from("curator_channels")
    .select("channel_id, name, labels, starred")
    .eq("status", "approved");

  const channels: ApprovedChannel[] = (data || []).map((c) => ({
    id: c.channel_id,
    name: c.name,
    labels: c.labels || [],
    starred: c.starred === true,
  }));

  // Fall back to static JSON if Supabase returns empty (first-time setup)
  if (channels.length === 0) {
    const fallback = await import("@/data/approved-channels.json");
    const result = (fallback.default || []) as ApprovedChannel[];
    cacheSet(cacheKey, result);
    return result;
  }

  cacheSet(cacheKey, channels);
  return channels;
}

/* ── Persistent pool cache (Supabase) ────────────────────────────────── */

const POOL_MAX_AGE = 6 * 60 * 60 * 1000; // 6 hours

async function getPoolFromSupabase(key: string): Promise<CardData[] | null> {
  try {
    const { data } = await supabase
      .from("pool_cache")
      .select("data, updated_at")
      .eq("key", key)
      .single();
    if (!data) return null;
    const age = Date.now() - new Date(data.updated_at).getTime();
    if (age > POOL_MAX_AGE) return null;
    return data.data as CardData[];
  } catch {
    return null;
  }
}

async function savePoolToSupabase(key: string, pool: CardData[]): Promise<void> {
  try {
    await supabase
      .from("pool_cache")
      .upsert({ key, data: pool, updated_at: new Date().toISOString() });
  } catch {
    // Non-critical — in-memory cache still works
  }
}

/* ── Shared types & constants ────────────────────────────────────────── */

interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  width: number;
  height: number;
  duration: number | null;
  viewCount: number | null;
  publishedAt: string | null;
  description: string | null;
}

const NON_MUSIC_KEYWORDS = [
  // tutorials & education
  "tutorial", "how to", "how-to", "walkthrough", "explained",
  "lesson", "masterclass", "course", "learn to",
  "piano lesson", "music theory", "chord progression", "beginner", "practice",
  // production / DAW content
  "fl studio", "ableton", "logic pro", "bitwig", "pro tools",
  "making a beat", "beat making", "beatmaking", "sound design tutorial",
  "preset pack", "sample pack review", "plugin review",
  // gear & reviews
  "gear review", "unboxing", "studio tour", "setup tour",
  "vs comparison", "synth review", "midi controller",
  // covers & non-original
  "cover)", "cover]", "(cover", "[cover",
  "piano cover", "guitar cover", "drum cover", "vocal cover",
  "acoustic cover", "ukulele cover",
  // reactions & commentary
  "reaction", "reacting to", "first time hearing",
  "review:", "album review", "track review",
  // vlogs & non-music
  "vlog", "q&a", "q & a", "behind the scenes",
  "day in the life", "studio vlog",
];

function isNonMusic(title: string): boolean {
  const lower = title.toLowerCase();
  return NON_MUSIC_KEYWORDS.some((kw) => lower.includes(kw));
}

/* ── Feed-separation filters ─────────────────────────────────────────── */

const NON_ELECTRONIC_ONLY_LABELS = [
  "Samples", "Experimental", "Pop", "World", "Jazz", "Hip Hop", "Reggae",
  "Rock", "Alternative", "Indie", "Metal", "Punk", "Folk", "Country",
  "Classical", "R&B", "Soul", "Blues", "Funk",
];

const HOMEPAGE_TITLE_EXCLUDES = [
  "sample", "samples", "drum break", "drum breaks", "breaks compilation",
  "rock", "metal", "punk", "grunge", "classic rock",
  "alternative", "indie rock", "folk", "country", "classical", "blues", "r&b", "soul",
  "dj set", "dj mix", "live set", "live mix", "b2b", "boiler room",
];

const SAMPLE_TITLE_KEYWORDS = [
  "sample", "rare", "obscure", "ost", "soundtrack", "library",
  "private press", "unreleased", "forgotten",
];

const MIX_TITLE_KEYWORDS = [
  "mix", "set", "dj", "live", "b2b", "session", "boiler room", "recorded at",
];

const MIX_CHANNEL_LABELS = ["DJ Sets", "Live Sets"];

function isNonElectronicOnly(labels: string[]): boolean {
  if (labels.some((l) => ["samples", "dj sets", "live sets"].includes(l.toLowerCase()))) return true;
  return labels.every((l) =>
    NON_ELECTRONIC_ONLY_LABELS.some((nl) => nl.toLowerCase() === l.toLowerCase())
  );
}

function titleContainsAny(title: string, keywords: string[]): boolean {
  const lower = title.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

/** Parse ISO 8601 duration (PT1H23M45S) to seconds */
export function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/* ── Tag filtering utility ───────────────────────────────────────────── */

/**
 * Filter + sort a card pool by tag(s) BEFORE offset/limit slicing.
 * Accepts a single tag or an array of tags.
 * When multiple tags are provided, returns cards matching ANY tag (union).
 */
export function applyTagFilter(pool: CardData[], tag: Tag | Tag[]): CardData[] {
  const tags: Tag[] = Array.isArray(tag) ? tag : [tag];
  // No filter needed
  if (tags.length === 0 || (tags.length === 1 && tags[0] === "all")) return pool;

  const thirtyDaysMs = 30 * 86_400_000;
  const now = Date.now();

  return pool.filter((c) => {
    for (const t of tags) {
      if (t === "all") return true;
      if (t === "hot" && c.viewCount != null && c.viewCount >= 50_000) return true;
      if (t === "rare" && c.viewCount != null && c.viewCount < 5_000) return true;
      if (t === "new" && c.publishedAt && now - new Date(c.publishedAt).getTime() <= thirtyDaysMs) return true;
    }
    return false;
  });
}

/* ── YouTube helpers ─────────────────────────────────────────────────── */

/** Batch-fetch durations + view counts for video IDs via videos.list */
async function fetchVideoDetails(
  videoIds: string[]
): Promise<Map<string, { duration: number; viewCount: number }>> {
  const details = new Map<string, { duration: number; viewCount: number }>();
  if (videoIds.length === 0) return details;

  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  for (const chunk of chunks) {
    const params = new URLSearchParams({
      part: "contentDetails,statistics",
      id: chunk.join(","),
      key: API_KEY,
    });

    try {
      const res = await fetch(`${YT_API}/videos?${params}`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const data = await res.json();
        for (const item of data.items || []) {
          const dur = parseDuration(item.contentDetails?.duration || "");
          const views = parseInt(item.statistics?.viewCount || "0", 10);
          details.set(item.id, { duration: dur, viewCount: views });
        }
      }
    } catch {
      // silently skip fetch failures
    }
  }

  return details;
}

function uploadsPlaylistId(channelId: string): string {
  return "UU" + channelId.slice(2);
}

/**
 * Fetch uploads from a channel's uploads playlist.
 * `maxPages` controls YouTube API pagination (each page ≤ maxResults items).
 */
export async function getChannelUploads(
  channelId: string,
  maxResults = 5,
  withDuration = false,
  skipCache = false,
  maxPages = 1
): Promise<YouTubeVideo[]> {
  const cacheKey = `yt-uploads-${channelId}-${maxResults}-${withDuration ? "dur" : "nodur"}-p${maxPages}`;
  if (!skipCache) {
    const cached = cacheGet<YouTubeVideo[]>(cacheKey);
    if (cached) return cached;
  }

  const playlistId = uploadsPlaylistId(channelId);
  const allVideos: YouTubeVideo[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      part: "snippet",
      playlistId,
      maxResults: String(maxResults),
      key: API_KEY,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${YT_API}/playlistItems?${params}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`YouTube uploads error for ${channelId}:`, res.status);
      break;
    }

    const data = await res.json();
    const videos: YouTubeVideo[] = (data.items || [])
      .filter((item: { snippet?: { resourceId?: { videoId?: string } } }) =>
        item.snippet?.resourceId?.videoId
      )
      .map(
        (item: {
          snippet: {
            resourceId: { videoId: string };
            title: string;
            channelTitle: string;
            publishedAt?: string;
            description?: string;
            thumbnails?: {
              high?: { url: string; width?: number; height?: number };
              medium?: { url: string; width?: number; height?: number };
              default?: { url: string; width?: number; height?: number };
            };
          };
        }) => {
          const thumb =
            item.snippet.thumbnails?.high ||
            item.snippet.thumbnails?.medium ||
            item.snippet.thumbnails?.default;
          return {
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnail: thumb?.url || "",
            width: thumb?.width || 480,
            height: thumb?.height || 360,
            duration: null as number | null,
            viewCount: null as number | null,
            publishedAt: item.snippet.publishedAt || null,
            description: item.snippet.description || null,
          };
        }
      );

    allVideos.push(...videos);

    // Check for next page
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  // Fetch durations + view counts
  if (allVideos.length > 0) {
    const details = await fetchVideoDetails(allVideos.map((v) => v.id));
    for (const v of allVideos) {
      const d = details.get(v.id);
      if (d) {
        v.duration = d.duration;
        v.viewCount = d.viewCount;
      }
    }
  }

  cacheSet(cacheKey, allVideos);
  return allVideos;
}

export function parseVideoTitle(
  title: string,
  channelName: string
): { name: string; artist: string } {
  const cleaned = title
    .replace(/\b(?:premiere|premier)\s*[:：]\s*/gi, "")
    .replace(/\s*[\[\(](?:official|music|lyric|audio|video|hd|hq|4k|visualizer|remastered|remaster|full|original)[\s\w]*[\]\)]/gi, "")
    .replace(/\s*\|\s*.*$/, "")
    .trim();

  const separators = [" — ", " – ", " - "];
  const stripPremiere = (s: string) => s.replace(/\b(?:premiere|premier)\s*[:：]\s*/gi, "").trim();

  for (const sep of separators) {
    const idx = cleaned.indexOf(sep);
    if (idx > 0) {
      return {
        artist: stripPremiere(cleaned.slice(0, idx).trim()),
        name: stripPremiere(cleaned.slice(idx + sep.length).trim()) || cleaned,
      };
    }
  }

  return { name: stripPremiere(cleaned) || title, artist: channelName };
}

function videoThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function videoToCard(v: YouTubeVideo): CardData {
  const { name, artist } = parseVideoTitle(v.title, v.channelTitle);
  return {
    id: `yt-${v.id}`,
    name,
    artist,
    album: v.channelTitle,
    image: videoThumbnail(v.id),
    imageSmall: v.thumbnail,
    previewUrl: null,
    youtubeUrl: `https://www.youtube.com/watch?v=${v.id}`,
    videoId: v.id,
    uri: null,
    source: "youtube" as const,
    bpm: null,
    energy: null,
    danceability: null,
    valence: null,
    key: null,
    duration: v.duration,
    viewCount: v.viewCount,
    publishedAt: v.publishedAt,
    description: v.description,
  };
}

/* ── Pool return type ────────────────────────────────────────────────── */

interface PoolResult {
  cards: CardData[];
  totalFiltered: number;
}

/* ── Genre label filtering ────────────────────────────────────────────── */

function filterChannelsByGenre(
  channels: { name: string; id: string; labels?: string[] }[],
  genre?: string
): { name: string; id: string; labels?: string[] }[] {
  if (!genre) return channels;
  // Support comma-separated genres (match ANY)
  const genres = genre.split(",").map((g) => g.trim().toLowerCase()).filter(Boolean);
  if (genres.length === 0) return channels;
  return channels.filter(
    (c) => c.labels?.some((l) => genres.includes(l.toLowerCase()))
  );
}

/* ── Discover (homepage) ─────────────────────────────────────────────── */

/** Common video filter for homepage */
function isValidHomepageVideo(v: YouTubeVideo): boolean {
  if (v.title === "Private video" || v.title === "Deleted video") return false;
  const lower = v.title.toLowerCase();
  if (lower.includes("#shorts") || lower.includes("#short")) return false;
  if (lower.includes("shorts") && lower.length < 80) return false;
  if (v.height > v.width) return false;
  if (isNonMusic(v.title)) return false;
  if (!v.duration || v.duration < 240 || v.duration > 900) return false;
  if (titleContainsAny(v.title, HOMEPAGE_TITLE_EXCLUDES)) return false;
  return true;
}

async function getDiscoverPool(genre?: string): Promise<CardData[]> {
  const poolKey = genre ? `discover-${genre.toLowerCase()}` : "discover";
  const memoryCacheKey = `pool-${poolKey}`;

  // Layer 1: in-memory cache (instant)
  const memCached = cacheGet<CardData[]>(memoryCacheKey);
  if (memCached && memCached.length > 0) return memCached;

  // Layer 2: Supabase persistent cache (survives cold starts)
  const sbCached = await getPoolFromSupabase(poolKey);
  if (sbCached && sbCached.length > 0) {
    cacheSet(memoryCacheKey, sbCached, POOL_MAX_AGE);
    return sbCached;
  }

  // Layer 3: rebuild from YouTube
  const allApproved = await getApprovedChannels();

  let homepageChannels = allApproved.filter((c) => {
    if (!c.labels || c.labels.length === 0) return false;
    if (isNonElectronicOnly(c.labels)) return false;
    return true;
  });

  homepageChannels = filterChannelsByGenre(homepageChannels, genre);

  const starredCards: CardData[] = [];
  const regularCards: CardData[] = [];

  const BATCH_SIZE = 10;
  for (let i = 0; i < homepageChannels.length; i += BATCH_SIZE) {
    const batch = homepageChannels.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((ch) => getChannelUploads(ch.id, 30, true))
    );
    for (let j = 0; j < batch.length; j++) {
      const result = results[j];
      if (result.status === "fulfilled") {
        const cards = result.value
          .filter(isValidHomepageVideo)
          .map(videoToCard);
        if (batch[j].starred) {
          starredCards.push(...cards);
        } else {
          regularCards.push(...cards);
        }
      }
    }
  }

  // Compose pool: ~35% starred, ~65% regular
  const totalAvailable = starredCards.length + regularCards.length;
  const starredTarget = Math.min(starredCards.length, Math.round(totalAvailable * 0.35));
  const regularTarget = totalAvailable - starredTarget;

  const pool = seededShuffle([
    ...seededShuffle(starredCards).slice(0, starredTarget),
    ...seededShuffle(regularCards).slice(0, regularTarget),
  ]);

  // Only cache non-empty pools (don't persist API failures)
  if (pool.length > 0) {
    cacheSet(memoryCacheKey, pool, POOL_MAX_AGE);
    await savePoolToSupabase(poolKey, pool);
  }

  return pool;
}

export async function discoverFromYouTube(
  limit = 30,
  offset = 0,
  tag: Tag | Tag[] = "all",
  genre?: string
): Promise<PoolResult> {
  const pool = await getDiscoverPool(genre);
  if (pool.length === 0) return { cards: [], totalFiltered: 0 };

  const filtered = applyTagFilter(pool, tag);
  return {
    cards: filtered.slice(offset, offset + limit),
    totalFiltered: filtered.length,
  };
}

/* ── Mixes ───────────────────────────────────────────────────────────── */

export async function discoverMixes(
  limit = 20,
  offset = 0,
  tag: Tag | Tag[] = "all",
  genre?: string
): Promise<PoolResult> {
  const poolKey = genre ? `mixes-${genre.toLowerCase()}` : "mixes";
  const memoryCacheKey = `pool-${poolKey}`;

  let pool = cacheGet<CardData[]>(memoryCacheKey);

  if (!pool || pool.length === 0) {
    // Check Supabase persistent cache
    const sbCached = await getPoolFromSupabase(poolKey);
    if (sbCached && sbCached.length > 0) {
      pool = sbCached;
      cacheSet(memoryCacheKey, pool, POOL_MAX_AGE);
    }
  }

  if (!pool || pool.length === 0) {
    const allApproved = await getApprovedChannels();
    if (allApproved.length === 0) return { cards: [], totalFiltered: 0 };

    let mixChannels = allApproved.filter(
      (c) => c.labels?.some((l) =>
        MIX_CHANNEL_LABELS.some((ml) => ml.toLowerCase() === l.toLowerCase())
      )
    );

    mixChannels = filterChannelsByGenre(mixChannels, genre);

    if (mixChannels.length === 0) return { cards: [], totalFiltered: 0 };

    const allVideos: YouTubeVideo[] = [];
    const results = await Promise.allSettled(
      mixChannels.map((ch) => getChannelUploads(ch.id, 50, true, false, 2))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        allVideos.push(...result.value);
      }
    }

    pool = seededShuffle(
      allVideos
        .filter((v) => {
          if (v.title === "Private video" || v.title === "Deleted video") return false;
          if (!v.duration || v.duration < 2400) return false;
          const lower = v.title.toLowerCase();
          if (lower.includes("#shorts") || lower.includes("#short")) return false;
          if (!titleContainsAny(v.title, MIX_TITLE_KEYWORDS)) {
            if (isNonMusic(v.title)) return false;
          }
          return true;
        })
        .map(videoToCard)
    );

    if (pool.length > 0) {
      cacheSet(memoryCacheKey, pool, POOL_MAX_AGE);
      await savePoolToSupabase(poolKey, pool);
    }
  }

  const filtered = applyTagFilter(pool, tag);
  return {
    cards: filtered.slice(offset, offset + limit),
    totalFiltered: filtered.length,
  };
}

/* ── Samples ─────────────────────────────────────────────────────────── */

const STRICT_SAMPLE_LABELS = [
  "Samples", "Experimental", "Ambient", "Funk", "Disco", "Jazz",
  "Hip Hop", "Dub", "World", "Pop", "Downtempo", "Industrial", "Reggae",
];

export async function discoverSamples(
  limit = 30,
  offset = 0,
  tag: Tag | Tag[] = "all",
  genre?: string
): Promise<PoolResult> {
  const poolKey = genre ? `samples-${genre.toLowerCase()}` : "samples";
  const memoryCacheKey = `pool-${poolKey}`;

  let pool = cacheGet<CardData[]>(memoryCacheKey);

  if (!pool || pool.length === 0) {
    const sbCached = await getPoolFromSupabase(poolKey);
    if (sbCached && sbCached.length > 0) {
      pool = sbCached;
      cacheSet(memoryCacheKey, pool, POOL_MAX_AGE);
    }
  }

  if (!pool || pool.length === 0) {
    const allApproved = await getApprovedChannels();
    if (allApproved.length === 0) return { cards: [], totalFiltered: 0 };

    let sampleChannelPool = allApproved.filter(
      (c) => c.labels?.some((l) =>
        STRICT_SAMPLE_LABELS.some((sl) => l.toLowerCase() === sl.toLowerCase())
      )
    );

    let otherChannels = allApproved.filter(
      (c) => !sampleChannelPool.some((sc) => sc.id === c.id)
    );

    sampleChannelPool = filterChannelsByGenre(sampleChannelPool, genre);
    otherChannels = filterChannelsByGenre(otherChannels, genre);

    const shuffledSample = seededShuffle(sampleChannelPool).slice(0, 20);
    const shuffledOther = seededShuffle(otherChannels).slice(0, 10);

    const allVideos: { video: YouTubeVideo; fromSampleChannel: boolean }[] = [];

    const sampleResults = await Promise.allSettled(
      shuffledSample.map((ch) => getChannelUploads(ch.id, 20, true))
    );
    for (const result of sampleResults) {
      if (result.status === "fulfilled") {
        for (const v of result.value) {
          allVideos.push({ video: v, fromSampleChannel: true });
        }
      }
    }

    const otherResults = await Promise.allSettled(
      shuffledOther.map((ch) => getChannelUploads(ch.id, 15, true))
    );
    for (const result of otherResults) {
      if (result.status === "fulfilled") {
        for (const v of result.value) {
          allVideos.push({ video: v, fromSampleChannel: false });
        }
      }
    }

    pool = seededShuffle(
      allVideos
        .filter(({ video: v, fromSampleChannel }) => {
          if (v.title === "Private video" || v.title === "Deleted video") return false;
          if (!v.duration || v.duration > 900 || v.duration < 30) return false;
          const lower = v.title.toLowerCase();
          if (lower.includes("#shorts") || lower.includes("#short")) return false;
          if (lower.includes("shorts") && lower.length < 80) return false;
          if (v.height > v.width) return false;
          if (isNonMusic(v.title)) return false;
          if (!fromSampleChannel && !titleContainsAny(v.title, SAMPLE_TITLE_KEYWORDS)) return false;
          return true;
        })
        .map(({ video }) => videoToCard(video))
    );

    if (pool.length > 0) {
      cacheSet(memoryCacheKey, pool, POOL_MAX_AGE);
      await savePoolToSupabase(poolKey, pool);
    }
  }

  const filtered = applyTagFilter(pool, tag);
  return {
    cards: filtered.slice(offset, offset + limit),
    totalFiltered: filtered.length,
  };
}
