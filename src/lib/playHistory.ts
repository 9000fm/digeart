import type { CardData } from "./types";

// Persistent listening history (localStorage). Records each track as it starts
// playing. Kept deliberately separate from the play queue so it can later feed
// a "Recently played" view and a real back-stack without touching player state.

const KEY = "digeart-play-history";
const MAX = 100;

export interface PlayHistoryEntry {
  card: CardData;
  playedAt: number; // epoch ms
}

function read(): PlayHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries: PlayHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    /* quota / serialization — ignore, history is best-effort */
  }
}

/**
 * Record a track when it starts playing. Collapses consecutive repeats of the
 * same track (refreshes the timestamp instead of stacking) and caps the list.
 */
export function recordPlay(card: CardData): void {
  if (!card?.id) return;
  // Dedupe: a replay MOVES the track to the top instead of stacking a duplicate,
  // so the history stays a unique, most-recent-first list.
  const entries = read().filter((e) => e.card.id !== card.id);
  entries.unshift({ card, playedAt: Date.now() });
  if (entries.length > MAX) entries.length = MAX;
  write(entries);
}

/** Most-recent-first listening history (for the Recently-played / History view). */
export function getPlayHistory(): PlayHistoryEntry[] {
  return read();
}

/** Wipe the listening history. */
export function clearPlayHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
