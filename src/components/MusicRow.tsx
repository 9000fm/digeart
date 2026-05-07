"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import HeartLikeButton from "./HeartLikeButton";
import ShareButton from "./ShareButton";
import Tooltip from "./Tooltip";
import { useTranslation } from "./LanguageProvider";
import type { CardData } from "@/lib/types";

interface MusicRowProps {
  card: CardData;
  saved: boolean;
  isGracePeriod?: boolean;
  isPlaying: boolean;
  viewContext?: string;
  onPlay: () => void;
  onSave: () => void;
  onShare?: () => void;
  isAuthenticated?: boolean;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default memo(function MusicRow({
  card,
  saved,
  isGracePeriod = false,
  isPlaying,
  viewContext = "default",
  onPlay,
  onSave,
  isAuthenticated = true,
}: MusicRowProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      layout
      layoutId={`${viewContext}-row-${card.id}`}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      data-card-id={card.id}
      className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isPlaying
          ? "bg-[var(--accent)]/12"
          : "hover:bg-[var(--bg-alt)]"
      } ${isGracePeriod ? "opacity-75" : ""}`}
      onClick={onPlay}
    >
      {/* Thumbnail with EQ overlay when playing */}
      <div className="relative shrink-0 w-10 h-10 rounded-md overflow-hidden bg-[var(--bg-alt)]">
        <img
          src={card.imageSmall || card.image || "/placeholder.svg"}
          alt={`${card.name} by ${card.artist}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* EQ on play / play arrow on hover */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
            isPlaying
              ? "bg-black/55 opacity-100"
              : "bg-black/55 opacity-0 group-hover:opacity-100"
          }`}
        >
          {isPlaying ? (
            <div className="flex items-end gap-[2px] h-3.5">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className={`eq-bar-base w-[2px] bg-white rounded-full eq-bar-${n}`}
                />
              ))}
            </div>
          ) : (
            <span className="text-white text-base leading-none drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]">▶</span>
          )}
        </div>
      </div>

      {/* Title + artist */}
      <div className="min-w-0 flex-1">
        <p
          className={`font-mono text-[13px] uppercase truncate leading-tight font-bold ${
            isPlaying ? "text-[var(--accent)]" : "text-[var(--text)]"
          }`}
        >
          {card.name}
        </p>
        <p className="font-mono text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold truncate leading-tight mt-0.5">
          {card.artist}
        </p>
      </div>

      {/* Right cluster: heart, share, duration */}
      <div
        className="shrink-0 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip
          label={
            isAuthenticated
              ? saved
                ? t("card.saved")
                : t("card.save")
              : t("card.loginToSave")
          }
          position="top"
        >
          <HeartLikeButton
            isLiked={saved}
            trackId={card.id}
            onToggle={onSave}
            size="sm"
            disabled={!isAuthenticated}
            ariaLabel={
              isAuthenticated
                ? saved
                  ? t("card.unlike")
                  : t("card.save")
                : t("card.loginToSave")
            }
            lottieVariant="auto"
            className={`rounded-full hover:bg-[var(--bg-alt)] ${
              saved || isGracePeriod
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            }`}
          />
        </Tooltip>

        <ShareButton
          trackId={card.id}
          trackName={card.name}
          channel={card.artist}
          youtubeUrl={card.youtubeUrl}
          size="sm"
          className="w-6 h-6 rounded-full text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] opacity-0 group-hover:opacity-100"
        />

        {/* Duration — always visible, fixed-width tabular */}
        {card.duration != null && card.duration > 0 && (
          <span className="font-mono text-[11px] text-[var(--text-secondary)] tabular-nums tracking-wider w-12 text-right">
            {formatDuration(card.duration)}
          </span>
        )}
      </div>
    </motion.div>
  );
});
