/**
 * 4-tier activity classification for curator channels.
 * Locked thresholds (Flavi):
 *   PURPLE  = veteran active uploader  (recent < 20d, avgGap < 15d, total >= 150, history > 1y)
 *   GREEN   = active uploader          (recent < 30d, avgGap < 21d)
 *   YELLOW  = alive but inconsistent
 *   RED     = abandoned                (recent > 120d OR no uploads)
 */

export type ActivityTier = "purple" | "green" | "yellow" | "red";

export interface ClassifyActivityInput {
  uploadDates: string[];          // ISO strings of recent ~10 uploads (most recent first or any order)
  totalUploads: number;            // from YouTube channels.list statistics.videoCount
  oldestUploadDate: string | null; // ISO string of the channel's oldest upload (paginated to last page)
}

export function classifyActivity(input: ClassifyActivityInput): ActivityTier {
  const { uploadDates, totalUploads, oldestUploadDate } = input;
  if (!uploadDates || uploadDates.length === 0) return "red";

  const now = Date.now();
  const sorted = uploadDates
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => b - a);

  if (sorted.length === 0) return "red";

  const lastUpload = sorted[0];
  const daysSinceLast = (now - lastUpload) / (1000 * 60 * 60 * 24);

  // RED: abandoned
  if (daysSinceLast > 120) return "red";

  // Calculate avg gap between uploads (use up to 10 most recent)
  const recent = sorted.slice(0, 10);
  if (recent.length < 2) {
    return daysSinceLast < 30 ? "yellow" : "red";
  }
  const gaps: number[] = [];
  for (let i = 0; i < recent.length - 1; i++) {
    gaps.push((recent[i] - recent[i + 1]) / (1000 * 60 * 60 * 24));
  }
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

  // PURPLE: epic — veteran high-volume tight-cadence very-recent
  const oldestUpload = oldestUploadDate ? new Date(oldestUploadDate).getTime() : null;
  const yearsActive = oldestUpload ? (now - oldestUpload) / (1000 * 60 * 60 * 24 * 365) : 0;
  if (
    daysSinceLast < 20 &&
    avgGap < 15 &&
    totalUploads >= 150 &&
    yearsActive > 1
  ) {
    return "purple";
  }

  // GREEN: active uploader
  if (daysSinceLast < 30 && avgGap < 21) return "green";

  // YELLOW: alive but inconsistent
  return "yellow";
}

/** Convert tier to a CSS color value (hex) for inline styles. */
export function tierColor(tier: ActivityTier | null | undefined): string {
  switch (tier) {
    case "purple": return "#a855f7";
    case "green":  return "#22c55e";
    case "yellow": return "#eab308";
    case "red":    return "#ef4444";
    default:       return "#71717a"; // unknown / not yet computed
  }
}

/** Human label for tooltip / aria-label. */
export function tierLabel(tier: ActivityTier | null | undefined): string {
  switch (tier) {
    case "purple": return "Epic — veteran active uploader";
    case "green":  return "Active";
    case "yellow": return "Inconsistent";
    case "red":    return "Abandoned";
    default:       return "Unknown";
  }
}

/** Format days-since-last as a relative-time string. */
export function formatLastUpload(lastUploadAt: string | null | undefined): string {
  if (!lastUploadAt) return "—";
  const ms = Date.now() - new Date(lastUploadAt).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

/** Humanize subscriber/upload counts (12.4K, 1.2M, etc.). */
export function formatChannelCount(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
