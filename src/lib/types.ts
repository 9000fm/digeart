export interface CardData {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string;
  imageSmall: string;
  previewUrl: string | null;
  youtubeUrl: string | null;
  videoId: string | null;
  uri: string | null;
  source: "youtube";
  bpm: number | null;
  energy: number | null;
  danceability: number | null;
  valence: number | null;
  key: number | null;
  duration: number | null;
  viewCount: number | null;
  publishedAt: string | null;
  description: string | null;
  starred?: boolean;
  genres?: string[];
  isGem?: boolean; // editorial: curator-liked track (stamped server-side)
  isHot?: boolean; // top 10% most-viewed of the current pool (stamped server-side)
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  trackCount: number;
  // First few track snapshots for the 2×2 collage cover (newest playlists first).
  coverCards: Pick<CardData, "id" | "image" | "imageSmall">[];
}

export interface PlaylistTrack {
  id: string;        // playlist_tracks row id (stable key for reorder)
  position: number;
  card: CardData;    // full denormalized snapshot from card_data
}
