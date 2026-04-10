export interface Upload {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  viewCount?: number | null;
  isTopViewed?: boolean;
  duration?: number | null;
}

export type ActivityTier = "purple" | "green" | "yellow" | "red";

export type BoostState = "boost" | "default" | "bury";

export interface CuratorData {
  channel?: { name: string; id: string };
  uploads?: Upload[];
  reviewed: number;
  total: number;
  remaining?: number;
  approvedCount?: number;
  starredCount?: number;
  isStarred?: boolean;
  done?: boolean;
  rejectedCount?: number;
  topics?: string[];
  // Channel metadata (populated on rescan)
  activityTier?: ActivityTier | null;
  lastUploadAt?: string | null;
  totalUploads?: number | null;
  subscriberCount?: number | null;
  curatorNotes?: string | null;
  boostState?: BoostState | null;
}

export interface ApprovedChannel {
  name: string;
  id: string;
  labels?: string[];
  isStarred?: boolean;
  reviewedAt?: string | null;
  notes?: string;
  activityTier?: ActivityTier | null;
  lastUploadAt?: string | null;
  totalUploads?: number | null;
  subscriberCount?: number | null;
  curatorNotes?: string | null;
  boostState?: BoostState | null;
}

export interface CuratorStats {
  imported: number;
  approved: number;
  rejected: number;
  starred: number;
  pending: number;
}

export type CuratorTab = "approved" | "review" | "rejected";

export interface FilteredChannel {
  name: string;
  id: string;
  topics: string[];
  importedAt?: string | null;
}

export interface RejectedChannel {
  name: string;
  id: string;
  rejectedAt?: string | null;
}

export type ApprovedView =
  | { mode: "landing" }
  | { mode: "audit"; channel: ApprovedChannel };

export const GENRE_LABELS = [
  "House",
  "Deep House",
  "Tech House",
  "Techno",
  "Minimal",
  "Rominimal",
  "Electro",
  "Breaks",
  "DnB",
  "Jungle",
  "Garage / UKG",
  "Ambient",
  "Downtempo",
  "Dub",
  "Disco",
  "Funk",
  "Acid",
  "Trance",
  "Industrial",
  "EBM",
  "Hip Hop",
  "Jazz",
  "Reggae",
  "Pop",
  "Indie / Rock",
  "World",
  "Experimental",
  "IDM",
  "VGM",
  "Samples",
  "DJ Sets",
  "Live Sets",
];
