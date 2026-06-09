"use client";

import { useSyncExternalStore } from "react";

// Tiny external store for playback progress + duration. These update ~4×/sec while a
// track plays. Keeping them OUT of the page component means the card grid no longer
// re-renders on every tick — only the player UI (which subscribes here) updates.
// Playback/auto-advance logic never read these; they read the YT player directly.

let progress = 0;
let duration = 0;
let snapshot = { progress, duration };
const listeners = new Set<() => void>();

/** Update progress and/or duration, then notify subscribers (the player UI). */
export function updatePlayback(next: { progress?: number; duration?: number }): void {
  if (next.progress !== undefined) progress = next.progress;
  if (next.duration !== undefined) duration = next.duration;
  snapshot = { progress, duration }; // new ref so useSyncExternalStore re-renders
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): { progress: number; duration: number } {
  return snapshot;
}

/** Subscribe the calling component to live playback progress. */
export function usePlaybackProgress(): { progress: number; duration: number } {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
