// Thin client wrapper over /api/playlists. The browser never reads or writes the
// playlist tables directly — every call goes through the server route, which
// derives the user from the session. Email is never sent from here.

import type { CardData, Playlist, PlaylistTrack } from "@/lib/types";

export async function fetchPlaylists(): Promise<Playlist[]> {
  const res = await fetch("/api/playlists");
  if (!res.ok) throw new Error("Failed to load playlists: " + res.status);
  const json = await res.json();
  return (json.playlists ?? []) as Playlist[];
}

export async function fetchPlaylist(id: string): Promise<{ playlist: Playlist; tracks: PlaylistTrack[] }> {
  const res = await fetch(`/api/playlists?id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Failed to load playlist: " + res.status);
  return res.json();
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
