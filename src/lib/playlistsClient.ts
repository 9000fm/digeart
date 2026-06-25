// Thin client wrapper over /api/playlists. The browser never reads or writes the
// playlist tables directly — every call goes through the server route, which
// derives the user from the session. Email is never sent from here.

import type { CardData, Playlist, PlaylistTrack } from "@/lib/types";

// Abort if a read route hangs (e.g. DB wedged) so the UI fails fast instead of
// freezing for the browser's default ~30s timeout.
async function getJSON(url: string, errLabel: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(errLabel + ": " + res.status);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPlaylists(): Promise<Playlist[]> {
  const json = (await getJSON("/api/playlists", "Failed to load playlists")) as { playlists?: Playlist[] };
  return (json.playlists ?? []) as Playlist[];
}

export async function fetchPlaylist(id: string): Promise<{ playlist: Playlist; tracks: PlaylistTrack[] }> {
  return (await getJSON(`/api/playlists?id=${encodeURIComponent(id)}`, "Failed to load playlist")) as {
    playlist: Playlist;
    tracks: PlaylistTrack[];
  };
}

type Action = "create" | "rename" | "delete" | "addTrack" | "removeTrack" | "reorder";

function post(action: Action, payload: Record<string, unknown> = {}): Promise<Response> {
  return fetch("/api/playlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
}

export async function createPlaylist(name: string): Promise<Playlist | null> {
  const res = await post("create", { name });
  if (!res.ok) return null;
  const json = await res.json();
  return (json.playlist ?? null) as Playlist | null;
}

export const renamePlaylist = (playlistId: string, name: string) => post("rename", { playlistId, name });
export const deletePlaylist = (playlistId: string) => post("delete", { playlistId });
export const addTrackToPlaylist = (playlistId: string, card: CardData) =>
  post("addTrack", { playlistId, videoId: card.id, cardData: card });
export const removeTrackFromPlaylist = (playlistId: string, videoId: string) =>
  post("removeTrack", { playlistId, videoId });
export const reorderPlaylist = (playlistId: string, orderedVideoIds: string[]) =>
  post("reorder", { playlistId, orderedVideoIds });
