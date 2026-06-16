"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  fetchPlaylists, createPlaylist as apiCreate, renamePlaylist as apiRename,
  deletePlaylist as apiDelete, addTrackToPlaylist, removeTrackFromPlaylist,
} from "@/lib/playlistsClient";
import type { CardData, Playlist } from "@/lib/types";

// Owns the user's playlist list (metadata only — track lists are loaded on demand
// in PlaylistDetail). Mutations hit /api/playlists then refresh, with light
// optimistic touches so the UI feels instant.
export function usePlaylists(isAuthenticated: boolean) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) { setPlaylists([]); return; }
    setLoading(true);
    try {
      setPlaylists(await fetchPlaylists());
    } catch {
      /* keep stale list on failure */
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
    if (!isAuthenticated) { loadedRef.current = false; setPlaylists([]); }
  }, [isAuthenticated, refresh]);

  const create = useCallback(async (name: string): Promise<Playlist | null> => {
    const pl = await apiCreate(name);
    if (pl) setPlaylists((prev) => [pl, ...prev]);
    return pl;
  }, []);

  const rename = useCallback(async (id: string, name: string) => {
    setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    await apiRename(id, name);
  }, []);

  const remove = useCallback(async (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    await apiDelete(id);
  }, []);

  const addTrack = useCallback(async (id: string, card: CardData) => {
    const res = await addTrackToPlaylist(id, card);
    if (res.ok) await refresh(); // refresh count + cover collage
    return res.ok;
  }, [refresh]);

  const removeTrack = useCallback(async (id: string, videoId: string) => {
    const res = await removeTrackFromPlaylist(id, videoId);
    if (res.ok) await refresh();
    return res.ok;
  }, [refresh]);

  return { playlists, loading, refresh, create, rename, remove, addTrack, removeTrack };
}
