"use client";

import { tierColor, tierLabel, formatLastUpload, type ActivityTier } from "@/lib/curator-activity";

interface ActivityDotProps {
  tier?: ActivityTier | null;
  lastUploadAt?: string | null;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function ActivityDot({ tier, lastUploadAt, showLabel = false, size = "sm" }: ActivityDotProps) {
  const color = tierColor(tier);
  const dim = size === "sm" ? 8 : size === "md" ? 10 : size === "lg" ? 14 : 22;
  const label = tierLabel(tier);
  const last = lastUploadAt ? formatLastUpload(lastUploadAt) : null;
  const title = last ? `${label} · ${last}` : label;

  return (
    <span
      className="inline-flex items-center gap-1.5 shrink-0"
      title={title}
      aria-label={title}
    >
      <span
        className="rounded-full shrink-0"
        style={{
          width: dim,
          height: dim,
          backgroundColor: color,
          boxShadow: tier === "purple" ? `0 0 6px ${color}` : undefined,
        }}
      />
      {showLabel && last && (
        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider tabular-nums">
          {last}
        </span>
      )}
    </span>
  );
}
