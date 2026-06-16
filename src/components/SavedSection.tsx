"use client";

import { useState } from "react";
import SavedGrid from "./SavedGrid";
import PlaylistsHub from "./PlaylistsHub";
import PlaylistDetail from "./PlaylistDetail";
import { useTranslation } from "./LanguageProvider";
import type { CardData, Playlist } from "@/lib/types";

type SavedFilterType = "all" | "tracks" | "samples" | "mixes" | "deleted";

interface SavedSectionProps {
  // SavedGrid (Liked) passthrough
  cards: CardData[];
  loading: boolean;
  likedIds: Set<string>;
  softDeletedIds?: Set<string>;
  playingId: string | null;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onPlayNext?: (id: string) => void;
  onAddToQueue?: (id: string) => void;
  onAddToPlaylist?: (id: string) => void;
  onToggleLike: (id: string) => void;
  activeTagFilters?: string[];
  isAuthenticated?: boolean;
  onCardsLoaded?: (cards: CardData[]) => void;
  recentlyRemoved?: (CardData & { deletedAt: string })[];
  onRestoreRemoved?: (id: string) => void;
  onHardDelete?: (id: string) => void;
  onClearAllRemoved?: () => void;
  onFilterChange?: (filter: SavedFilterType) => void;
  // Playlists
  playlists: Playlist[];
  createPlaylist: (name: string) => Promise<Playlist | null>;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  removeTrackFromPlaylist: (playlistId: string, videoId: string) => Promise<boolean> | void;
  onPlayPlaylist: (tracks: CardData[], startId: string) => void;
  onShareCard: (card: CardData) => void;
}

type Screen = { kind: "hub" } | { kind: "liked" } | { kind: "playlist"; id: string };

export default function SavedSection(props: SavedSectionProps) {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>({ kind: "hub" });

  if (!props.isAuthenticated) {
    // Reuse SavedGrid's signed-out state
    return <SavedGrid {...props} />;
  }

  if (screen.kind === "playlist") {
    return (
      <PlaylistDetail
        playlistId={screen.id}
        onBack={() => setScreen({ kind: "hub" })}
        playingId={props.playingId}
        isPlaying={props.isPlaying}
        likedIds={props.likedIds}
        onPlayPlaylist={props.onPlayPlaylist}
        onToggleLike={props.onToggleLike}
        onShare={props.onShareCard}
        onRemoveTrack={props.removeTrackFromPlaylist}
        onRename={props.renamePlaylist}
        onDelete={props.deletePlaylist}
        isAuthenticated={props.isAuthenticated}
      />
    );
  }

  if (screen.kind === "liked") {
    return <SavedGrid {...props} onBack={() => setScreen({ kind: "hub" })} backLabel={t("playlist.liked")} />;
  }

  return (
    <PlaylistsHub
      likedCount={props.cards.length}
      likedCovers={props.cards.slice(0, 4)}
      playlists={props.playlists}
      onOpenLiked={() => setScreen({ kind: "liked" })}
      onOpenPlaylist={(id) => setScreen({ kind: "playlist", id })}
      onCreate={props.createPlaylist}
    />
  );
}
