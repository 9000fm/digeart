"use client";

import type { CardData } from "@/lib/types";

// 2×2 auto-collage from the first up-to-4 track images (Spotify/Pinterest style).
// 0 tracks → empty note glyph. 1 → full bleed. 2 → side-by-side. 3 → one big + two. 4 → grid.
export default function PlaylistCover({
  cards,
  className = "",
}: {
  cards: Pick<CardData, "id" | "image" | "imageSmall">[];
  className?: string;
}) {
  const imgs = cards.slice(0, 4).map((c) => c.imageSmall || c.image).filter(Boolean);

  if (imgs.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-[var(--bg-alt)] ${className}`}>
        <svg className="w-1/3 h-1/3 text-[var(--text-muted)]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
      </div>
    );
  }

  if (imgs.length === 1) {
    return <img src={imgs[0]} alt="" className={`object-cover ${className}`} />;
  }

  return (
    <div className={`grid gap-px bg-[var(--bg-alt)] overflow-hidden ${className} ${imgs.length === 2 ? "grid-cols-2 grid-rows-1" : "grid-cols-2 grid-rows-2"}`}>
      {imgs.map((src, i) => (
        // 3-image layout: first image spans the full left column.
        <img
          key={i}
          src={src}
          alt=""
          className={`w-full h-full object-cover ${imgs.length === 3 && i === 0 ? "row-span-2" : ""}`}
        />
      ))}
    </div>
  );
}
