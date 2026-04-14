"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Tooltip from "./Tooltip";
import HeartLikeButton from "./HeartLikeButton";
import { useTranslation } from "./LanguageProvider";
import type { CardData } from "@/lib/types";

function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return String(count);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

interface NowPlayingBannerProps {
  card: CardData;
  isPlaying: boolean;
  isUnavailable?: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  onLocate?: () => void;
  onPrevTrack?: () => void;
  onNextTrack?: () => void;
  hasPrev?: boolean;
  audioProgress?: number;
  audioDuration?: number;
  onSeek?: (seconds: number) => void;
  autoPlay?: boolean;
  onToggleAutoPlay?: () => void;
  volume?: number;
  isMuted?: boolean;
  onVolumeChange?: (volume: number) => void;
  onVolumeCommit?: (volume: number) => void;
  onToggleMute?: () => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
  isAuthenticated?: boolean;
  showQueue?: boolean;
  onToggleQueue?: () => void;
  undoRestoredId?: string | null;
  djMode?: boolean;
  playbackRate?: number;
  onPlaybackRateChange?: (rate: number) => void;
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function NowPlayingBanner({
  card,
  isPlaying,
  isUnavailable = false,
  onTogglePlay,
  onClose,
  onLocate,
  onPrevTrack,
  onNextTrack,
  hasPrev = false,
  audioProgress = 0,
  audioDuration = 0,
  onSeek,
  autoPlay = true,
  onToggleAutoPlay,
  volume = 80,
  isMuted = false,
  onVolumeChange,
  onVolumeCommit,
  onToggleMute,
  isLiked = false,
  onToggleLike,
  isAuthenticated = true,
  showQueue = false,
  onToggleQueue,
  undoRestoredId = null,
  djMode = false,
  playbackRate = 1,
  onPlaybackRateChange,
}: NowPlayingBannerProps) {
  const { t } = useTranslation();

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const [dragPercent, setDragPercent] = useState<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const mobileProgressBarRef = useRef<HTMLDivElement>(null);
  const tabletProgressBarRef = useRef<HTMLDivElement>(null);
  const miniBarRef = useRef<HTMLDivElement>(null);

  // Hover preview tooltip
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);

  // Copy title to clipboard
  const [copied, setCopied] = useState(false);
  const [copyPos, setCopyPos] = useState<{ x: number; y: number } | null>(null);
  const copyTitle = useCallback((e: React.MouseEvent) => {
    navigator.clipboard.writeText(`${card.name} - ${card.artist}`);
    setCopyPos({ x: e.clientX + 16, y: e.clientY - 20 });
    setCopied(true);
    setTimeout(() => { setCopied(false); setCopyPos(null); }, 2000);
  }, [card.name, card.artist]);

  // Delayed close button reveal
  const [showClose, setShowClose] = useState(false);
  useEffect(() => {
    setShowClose(false);
    const timer = setTimeout(() => setShowClose(true), 1200);
    return () => clearTimeout(timer);
  }, [card.id]);

  // EQ collapse
  const [eqActive, setEqActive] = useState(isPlaying);
  const eqBarRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const prevPlayingRef = useRef(isPlaying);

  // Mobile volume popup
  const [showVolumeFader, setShowVolumeFader] = useState(false);
  const volumeFaderRef = useRef<HTMLDivElement>(null);
  const volumeIconRef = useRef<HTMLButtonElement>(null);
  const mobileVolumeFaderRef = useRef<HTMLDivElement>(null);
  const mobileVolumeIconRef = useRef<HTMLButtonElement>(null);
  const volumeIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volTrackRef = useRef<HTMLDivElement>(null);
  const volTrackTabletRef = useRef<HTMLDivElement>(null);
  const volFaderRef = useRef<HTMLDivElement>(null);
  const desktopVolFaderRef = useRef<HTMLDivElement>(null);
  const tabletVolFaderRef = useRef<HTMLDivElement>(null);
  const mobileVolFaderRef = useRef<HTMLDivElement>(null);
  const miniVolTrackRef = useRef<HTMLDivElement>(null);
  const isDraggingVolRef = useRef(false);
  const isDraggingPitchRef = useRef(false);
  const pitchTrackRef = useRef<HTMLDivElement>(null);
  const pitchTooltipDivRef = useRef<HTMLDivElement | null>(null);
  const [showPitchFader, setShowPitchFader] = useState(false);

  // Vanilla-DOM hover bubble for the pitch slider — bypasses portal/framer-motion clipping issues entirely
  const ensurePitchTooltip = useCallback(() => {
    if (pitchTooltipDivRef.current) return pitchTooltipDivRef.current;
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.zIndex = "99999";
    div.style.background = "var(--text)";
    div.style.color = "var(--bg)";
    div.style.padding = "2px 6px";
    div.style.borderRadius = "4px";
    div.style.fontFamily = "var(--font-space-mono, monospace)";
    div.style.fontSize = "10px";
    div.style.fontVariantNumeric = "tabular-nums";
    div.style.pointerEvents = "none";
    div.style.whiteSpace = "nowrap";
    div.style.transform = "translate(-50%, -100%)";
    document.body.appendChild(div);
    pitchTooltipDivRef.current = div;
    return div;
  }, []);

  const updatePitchTooltip = useCallback((sliderEl: HTMLDivElement, currentRate: number) => {
    const rect = sliderEl.getBoundingClientRect();
    const percent = ((currentRate - 0.88) / 0.24) * 100;
    const label = currentRate === 1 ? "0%" : `${currentRate > 1 ? "+" : ""}${Math.round((currentRate - 1) * 100)}%`;
    const div = ensurePitchTooltip();
    div.textContent = label;
    div.style.left = `${rect.left + (percent / 100) * rect.width}px`;
    div.style.top = `${rect.top - 8}px`;
  }, [ensurePitchTooltip]);

  const removePitchTooltip = useCallback(() => {
    if (pitchTooltipDivRef.current) {
      pitchTooltipDivRef.current.remove();
      pitchTooltipDivRef.current = null;
    }
  }, []);

  // Cleanup tooltip on unmount
  useEffect(() => {
    return () => removePitchTooltip();
  }, [removePitchTooltip]);

  const [isDraggingVol, setIsDraggingVol] = useState(false);
  const [dragVolume, setDragVolume] = useState(volume);
  const dragVolumeRef = useRef(volume);

  // Sync drag volume with prop when not dragging
  useEffect(() => {
    if (!isDraggingVolRef.current) {
      setDragVolume(volume);
      dragVolumeRef.current = volume;
    }
  }, [volume]);

  // Helper: update drag volume (state for visual + ref for commit)
  const updateDragVolume = useCallback((v: number) => {
    setDragVolume(v);
    dragVolumeRef.current = v;
  }, []);

  // Mobile minimize state
  const [isMinimized, setIsMinimized] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const expandedHeightRef = useRef(168);

  // Info popover
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);
  const infoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const infoButtonRef = useRef<HTMLButtonElement>(null);
  const [infoAnchor, setInfoAnchor] = useState<{ left: number; top: number } | null>(null);

  // (likeHovered removed — heart uses scale+color shift only)

  const startInfoDismissTimer = useCallback(() => {
    if (infoTimerRef.current) clearTimeout(infoTimerRef.current);
    infoTimerRef.current = setTimeout(() => setShowInfo(false), 8000);
  }, []);

  const cancelInfoDismissTimer = useCallback(() => {
    if (infoTimerRef.current) { clearTimeout(infoTimerRef.current); infoTimerRef.current = null; }
  }, []);

  const hasDuration = audioDuration > 0;

  const progressPercent =
    dragPercent !== null
      ? dragPercent
      : hasDuration
        ? (audioProgress / audioDuration) * 100
        : 0;

  // EQ collapse: imperative 3-frame sequence — scaleY-based (GPU-accelerated)
  useEffect(() => {
    if (prevPlayingRef.current && !isPlaying) {
      const bars = eqBarRefs.current.filter(Boolean) as HTMLSpanElement[];
      // Frame 1: pause animation at current position
      bars.forEach((bar) => { bar.style.animationPlayState = "paused"; });

      requestAnimationFrame(() => {
        // Frame 2: read current scaleY from computed transform matrix, freeze it
        bars.forEach((bar, i) => {
          const cs = getComputedStyle(bar).transform;
          let d = 0.15; // fallback
          if (cs && cs !== "none") {
            const match = cs.match(/matrix\(([^)]+)\)/);
            if (match) {
              const vals = match[1].split(",").map(Number);
              d = vals[3] || d; // matrix(a,b,c,d,tx,ty) — d is scaleY
            }
          }
          bar.style.animation = "none";
          bar.style.transform = `scaleY(${d})`;
          bar.style.transition = `transform 0.35s ease-out ${i * 60}ms`;
        });

        requestAnimationFrame(() => {
          // Frame 3: collapse to 0 — transition kicks in from frozen scaleY
          bars.forEach((bar) => { bar.style.transform = "scaleY(0)"; });
        });
      });

      setEqActive(false);
    } else if (isPlaying) {
      // Clear all inline overrides, let CSS animation take over
      const bars = eqBarRefs.current.filter(Boolean) as HTMLSpanElement[];
      bars.forEach((bar) => {
        bar.style.animation = "";
        bar.style.animationPlayState = "";
        bar.style.transform = "";
        bar.style.transition = "";
      });
      setEqActive(true);
    }
    prevPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Dismiss volume fader on outside click
  useEffect(() => {
    if (!showVolumeFader) return;
    const handler = (e: PointerEvent) => {
      const t = e.target as Node;
      const insideFader = (t as HTMLElement).closest?.("[data-volume-fader]") || mobileVolumeFaderRef.current?.contains(t);
      const insideIcon = (t as HTMLElement).closest?.("[data-volume-icon]") || mobileVolumeIconRef.current?.contains(t);
      if (!insideFader && !insideIcon) {
        setShowVolumeFader(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [showVolumeFader]);

  // Dismiss pitch fader on outside click — but NOT when clicking the pill itself (so the icon click can toggle)
  useEffect(() => {
    if (!showPitchFader) return;
    const handler = (e: PointerEvent) => {
      const t = e.target as Node;
      const el = t as HTMLElement;
      if (!el.closest?.("[data-pitch-fader]") && !el.closest?.("[data-pitch-trigger]")) {
        setShowPitchFader(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [showPitchFader]);

  // Auto-dismiss volume fader after 5s idle
  useEffect(() => {
    if (!showVolumeFader) return;
    if (volumeIdleTimer.current) clearTimeout(volumeIdleTimer.current);
    volumeIdleTimer.current = setTimeout(() => setShowVolumeFader(false), 5000);
    return () => { if (volumeIdleTimer.current) clearTimeout(volumeIdleTimer.current); };
  }, [showVolumeFader]);

  // Dismiss info popover on outside click
  useEffect(() => {
    if (!showInfo) return;
    const handler = (e: PointerEvent) => {
      // Check if click is on any info toggle button (there are multiple across layouts)
      if ((e.target as HTMLElement).closest?.("[data-info-toggle]")) return;
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) setShowInfo(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [showInfo]);

  // Close info when track changes + clear timer
  useEffect(() => {
    setShowInfo(false);
    cancelInfoDismissTimer();
  }, [card.id, cancelInfoDismissTimer]);

  // Mobile viewport detection — reset minimize on desktop resize
  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 1152;
      setIsMobile(mobile);
      if (!mobile) setIsMinimized(false);
      setShowVolumeFader(false);
      // Read CSS-defined expanded height (temporarily remove inline override)
      const el = document.documentElement;
      const inlineVal = el.style.getPropertyValue('--player-height');
      if (inlineVal) el.style.removeProperty('--player-height');
      const val = parseInt(getComputedStyle(el).getPropertyValue('--player-height'), 10);
      if (val > 0) expandedHeightRef.current = val;
      if (inlineVal) el.style.setProperty('--player-height', inlineVal);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Sync --player-height CSS variable for page padding
  useEffect(() => {
    if (isMobile && isMinimized) {
      document.documentElement.style.setProperty('--player-height', '64px');
    } else {
      document.documentElement.style.removeProperty('--player-height');
    }
    return () => { document.documentElement.style.removeProperty('--player-height'); };
  }, [isMinimized, isMobile]);

  // --- Unified pointer seek handler ---
  const calcRatio = useCallback(
    (clientX: number, barEl: HTMLDivElement) => {
      const rect = barEl.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, barRef: React.RefObject<HTMLDivElement | null>) => {
      if (!onSeek || !barRef.current || !hasDuration) return;
      e.preventDefault();
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      isDraggingRef.current = true;
      setIsDragging(true);
      const ratio = calcRatio(e.clientX, barRef.current);
      setDragPercent(ratio * 100);
    },
    [onSeek, hasDuration, calcRatio]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, barRef: React.RefObject<HTMLDivElement | null>) => {
      if (!isDraggingRef.current || !barRef.current) return;
      const ratio = calcRatio(e.clientX, barRef.current);
      setDragPercent(ratio * 100);
    },
    [calcRatio]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, barRef: React.RefObject<HTMLDivElement | null>) => {
      if (!isDraggingRef.current || !onSeek || !barRef.current) return;
      const ratio = calcRatio(e.clientX, barRef.current);
      onSeek(ratio * audioDuration);
      isDraggingRef.current = false;
      setIsDragging(false);
      setDragPercent(null);
    },
    [onSeek, audioDuration, calcRatio]
  );

  const thumbUrl = card.imageSmall || card.image;

  // EQ bars — always rendered; collapse handled imperatively via refs
  const eqBars = (
    <div className="flex flex-col items-center shrink-0">
      <div className="flex items-end gap-[2px] h-3.5">
        {[1, 2, 3, 4, 5].map((n, i) => (
          <span
            key={n}
            ref={(el) => { eqBarRefs.current[i] = el; }}
            className={`eq-bar-base w-[2px] bg-[var(--text)] rounded-full ${eqActive ? `eq-bar-${n}` : "eq-bar-idle"}`}
          />
        ))}
      </div>
      <div className="flex items-start gap-[2px] h-2 opacity-25 overflow-hidden">
        {[1, 2, 3, 4, 5].map((n, i) => (
          <span key={n} className={`eq-bar-base w-[2px] bg-[var(--text)] rounded-full ${eqActive ? `eq-bar-${n}` : "eq-bar-idle"}`} style={{ transformOrigin: "top" }} />
        ))}
      </div>
    </div>
  );

  // Like/Heart button
  const likeButton = (size: "sm" | "md" = "md") => onToggleLike ? (
    <Tooltip label={isAuthenticated ? (isLiked ? t("card.saved") : t("card.save")) : t("card.loginToSave")} position="top">
      <HeartLikeButton
        isLiked={isLiked}
        trackId={card.id}
        onToggle={() => onToggleLike()}
        beforeToggle={isAuthenticated ? undefined : () => false}
        size={size}
        ariaLabel={isAuthenticated ? (isLiked ? t("card.unlike") : t("card.save")) : t("card.loginToSave")}
        className={`${isLiked ? "text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"} ${!isAuthenticated ? "opacity-50 cursor-default" : ""}`}
      />
    </Tooltip>
  ) : null;

  // Locate button — also triggers on custom "locate-triggered" event (from keyboard shortcut)
  const [locateSpin, setLocateSpin] = useState(false);
  useEffect(() => {
    const handler = () => { setLocateSpin(true); };
    document.addEventListener("locate-triggered", handler);
    return () => document.removeEventListener("locate-triggered", handler);
  }, []);
  const locateButton = (size: "sm" | "md" = "md") => onLocate ? (
    <Tooltip label={t("player.locate")} position="top" hideOnClick>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setLocateSpin(true);
          onLocate();
        }}
        className={`locate-btn shrink-0 flex items-center justify-center hover:text-[var(--text)] transition-all duration-200 ease-out active:scale-95 ${
          locateSpin ? "text-[var(--text)]" : "text-[var(--text-muted)]"
        } ${size === "sm" ? "w-7 h-7" : "w-7 h-7"}`}
      >
        <svg
          className={`${size === "sm" ? "w-4 h-4" : "w-4 h-4"} ${locateSpin ? "animate-[locate-spin_0.5s_ease-in-out]" : ""}`}
          onAnimationEnd={() => setLocateSpin(false)}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <line x1="12" y1="1" x2="12" y2="7" />
          <line x1="12" y1="17" x2="12" y2="23" />
          <line x1="1" y1="12" x2="7" y2="12" />
          <line x1="17" y1="12" x2="23" y2="12" />
        </svg>
      </button>
    </Tooltip>
  ) : null;

  // Fullscreen toggle (desktop only)
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);
  const fullscreenButton = (
    <Tooltip label={t("player.fullscreen")} position="top" hideOnClick>
      <button
        onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
        className="shrink-0 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors w-8 h-8 2xl:w-10 2xl:h-10 active:scale-95"
      >
        {isFullscreen ? (
          <svg className="w-4 h-4 2xl:w-5 2xl:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3" />
            <path d="M16 3v3a2 2 0 0 0 2 2h3" />
            <path d="M8 21v-3a2 2 0 0 0-2-2H3" />
            <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
          </svg>
        ) : (
          <svg className="w-4 h-4 2xl:w-5 2xl:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8V5a2 2 0 0 1 2-2h3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
          </svg>
        )}
      </button>
    </Tooltip>
  );

  const queueButton = onToggleQueue ? (
    <Tooltip label={t("player.queue")} position="top" hideOnClick>
      <button
        data-queue-btn
        onClick={(e) => { e.stopPropagation(); onToggleQueue(); }}
        className={`shrink-0 flex items-center justify-center transition-colors w-8 h-8 2xl:w-10 2xl:h-10 active:scale-[0.89] transition-transform ${
          showQueue ? "text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
        }`}
      >
        <svg className="w-4 h-4 2xl:w-5 2xl:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="18" y2="12" />
          <line x1="3" y1="18" x2="15" y2="18" />
        </svg>
      </button>
    </Tooltip>
  ) : null;

  // Pitch fader (DJ mode)
  const pitchDisplay = playbackRate === 1 ? "0%" : `${playbackRate > 1 ? "+" : ""}${Math.round((playbackRate - 1) * 100)}%`;
  const pitchPercent = ((playbackRate - 0.88) / 0.24) * 100;
  const pitchHorizontal = (
    <div
      className="hidden min-[1152px]:flex items-center w-20 h-7 cursor-pointer touch-none"
      onMouseEnter={(e) => {
        updatePitchTooltip(e.currentTarget as HTMLDivElement, playbackRate);
      }}
      onMouseLeave={() => {
        if (!isDraggingPitchRef.current) removePitchTooltip();
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        isDraggingPitchRef.current = true;
        const sliderEl = e.currentTarget as HTMLDivElement;
        const rect = sliderEl.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newRate = 0.88 + ratio * 0.24;
        onPlaybackRateChange?.(newRate);
        updatePitchTooltip(sliderEl, newRate);
      }}
      onPointerMove={(e) => {
        if (!isDraggingPitchRef.current) return;
        const sliderEl = e.currentTarget as HTMLDivElement;
        const rect = sliderEl.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newRate = 0.88 + ratio * 0.24;
        onPlaybackRateChange?.(newRate);
        updatePitchTooltip(sliderEl, newRate);
      }}
      onPointerUp={(e) => {
        isDraggingPitchRef.current = false;
        // If pointer left the slider during drag, remove the tooltip now
        const el = e.currentTarget as HTMLDivElement;
        const rect = el.getBoundingClientRect();
        const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
        if (!inside) removePitchTooltip();
      }}
      onDoubleClick={(e) => {
        onPlaybackRateChange?.(1);
        updatePitchTooltip(e.currentTarget as HTMLDivElement, 1);
      }}
    >
      <div className="relative w-full h-1 bg-[color-mix(in_srgb,var(--text-muted)_50%,var(--border))] rounded-full">
        <div className="absolute top-0 h-full bg-[var(--text)] rounded-full" style={pitchPercent >= 50 ? { left: '50%', width: `${pitchPercent - 50}%` } : { left: `${pitchPercent}%`, width: `${50 - pitchPercent}%` }} />
        <div className="absolute left-1/2 -translate-x-1/2 w-px h-1 bg-[var(--text)]/60 -top-[11px]" />
        <div className="absolute left-1/2 -translate-x-1/2 w-px h-1 bg-[var(--text)]/60 -bottom-[11px]" />
        {/* Knob center clamped to [7px, 73px] inside the 80px track so it never escapes the pill */}
        <div
          className="absolute w-3.5 h-3.5 rounded-full bg-[var(--bg)] border-2 border-[var(--text)] shadow-sm pointer-events-none"
          style={{ left: `${7 + pitchPercent * 0.66}px`, top: '50%', transform: 'translate(-50%, -50%)' }}
        />
      </div>
    </div>
  );

  const pitchFaderInner = onPlaybackRateChange ? (
    <div
      data-pitch-trigger
      className="relative flex items-center gap-1 shrink-0 mr-1 bg-[var(--bg-alt)] border border-[var(--border)]/50 rounded-lg pl-1 pr-2.5 py-0.5"
      onDoubleClick={(e) => {
        e.stopPropagation();
        onPlaybackRateChange(1);
      }}
    >
      <Tooltip label={t("player.reset")} position="top" hideOnClick portal>
        <span
          className="relative flex items-center justify-center font-mono text-[10px] text-[var(--text)] shrink-0 h-6 pl-[19px] pr-0.5 min-[1152px]:pl-[20px] min-[1152px]:pr-1 rounded cursor-pointer hover:text-[var(--text)] transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (window.innerWidth >= 1152) {
              onPlaybackRateChange(1);
            } else {
              setShowPitchFader((v) => !v);
            }
          }}
        >
          <svg className="absolute left-0.5 w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.153 8.188l-.72-3.236a2.493 2.493 0 00-4.867 0l-3.025 13.614a2 2 0 001.952 2.434h7.014a2 2 0 001.952-2.434l-.524-2.357m-4.935 1.791l9-13" />
            <circle cx="20" cy="5" r="1" fill="currentColor" />
          </svg>
          <span className={`hidden min-[1152px]:inline-block w-1 h-1 rounded-full bg-[var(--accent)] transition-opacity duration-200 ${playbackRate === 1 ? "opacity-0" : "opacity-100"}`} />
          <span className="w-[22px] text-center tabular-nums min-[1152px]:hidden">{pitchDisplay}</span>
        </span>
      </Tooltip>
      {pitchHorizontal}
    </div>
  ) : null;

  const pitchFader = (
    <div className="relative">
      <AnimatePresence>
        {djMode && pitchFaderInner && (
          <motion.div
            key="pitch"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="overflow-hidden"
          >
            {pitchFaderInner}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Vertical pitch popup — outside overflow-hidden, CDJ style */}
      {djMode && showPitchFader && onPlaybackRateChange && (
        <div
          data-pitch-fader
          className="absolute left-1/2 -translate-x-1/2 px-1.5 py-2 bg-[var(--bg-alt)]/95 backdrop-blur-xl border border-[var(--border)] rounded-lg shadow-2xl z-50 min-[1152px]:hidden"
          style={{ bottom: "calc(100% + 6px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="relative w-4 h-28 cursor-pointer touch-none mx-auto"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const el = e.currentTarget as HTMLDivElement;
              const rect = el.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
              onPlaybackRateChange(0.88 + ratio * 0.24);
              const onMove = (ev: MouseEvent) => {
                const r = el.getBoundingClientRect();
                const rat = Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height));
                onPlaybackRateChange(0.88 + rat * 0.24);
              };
              const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
            onDoubleClick={() => onPlaybackRateChange(1)}
          >
            <div className="absolute top-1/2 -translate-y-1/2 w-1 h-px bg-[var(--text)]/60 -left-[7px]" />
            <div className="absolute top-1/2 -translate-y-1/2 w-1 h-px bg-[var(--text)]/60 -right-[7px]" />
            <div className="absolute left-1/2 -translate-x-1/2 w-1 h-full bg-[color-mix(in_srgb,var(--text-muted)_50%,var(--border))] rounded-full">
              <div className="absolute left-0 w-full bg-[var(--text)] rounded-full" style={pitchPercent >= 50 ? { top: '50%', height: `${pitchPercent - 50}%` } : { top: `${pitchPercent}%`, height: `${50 - pitchPercent}%` }} />
            </div>
            <div className="absolute w-3 h-3 rounded-full bg-[var(--bg)] border-2 border-[var(--text)] shadow-sm pointer-events-none" style={{ top: `${pitchPercent}%`, left: '50%', transform: 'translate(-50%, -50%)' }} />
          </div>
          <div className="flex items-center justify-center gap-1 mt-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onPlaybackRateChange?.(Math.max(0.88, Math.round((playbackRate - 0.01) * 100) / 100)); }}
              className={`w-5 h-5 flex items-center justify-center font-mono text-[11px] font-bold transition-colors cursor-pointer ${playbackRate < 1 ? "text-[var(--text)]" : "text-[var(--text-muted)]/40"}`}
            >−</button>
            <button
              onClick={(e) => { e.stopPropagation(); onPlaybackRateChange?.(Math.min(1.12, Math.round((playbackRate + 0.01) * 100) / 100)); }}
              className={`w-5 h-5 flex items-center justify-center font-mono text-[11px] font-bold transition-colors cursor-pointer ${playbackRate > 1 ? "text-[var(--text)]" : "text-[var(--text-muted)]/40"}`}
            >+</button>
          </div>
        </div>
      )}
    </div>
  );

  // Info button (reusable like likeButton)
  const infoButton = (size: "sm" | "md" = "md") => isAuthenticated ? (
    <button
      ref={infoButtonRef}
      data-info-toggle
      onClick={(e) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setInfoAnchor({ left: rect.left + rect.width / 2, top: rect.top });
        setShowInfo((v) => {
          if (!v) startInfoDismissTimer();
          else cancelInfoDismissTimer();
          return !v;
        });
      }}
      className={`shrink-0 flex items-center justify-center rounded-full transition-all duration-200 ${
        size === "sm" ? "w-6 h-6" : "w-8 h-8 2xl:w-10 2xl:h-10"
      } ${showInfo ? "text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"}`}
    >
      <svg className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <circle cx="12" cy="8" r="0.5" fill="currentColor" />
      </svg>
    </button>
  ) : null;

  // Shuffle button
  const autoPlayButton = onToggleAutoPlay ? (
    <Tooltip label={autoPlay ? t("player.shuffleOn") : t("player.shuffleOff")} position="top">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleAutoPlay();
        }}
        className={`relative shrink-0 w-7 h-7 flex items-center justify-center transition-all duration-200 ease-out active:scale-95 ${
          autoPlay
            ? "text-[var(--text)]"
            : "text-[var(--text-muted)] hover:text-[var(--text)]"
        }`}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={autoPlay ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 3h5v5" />
          <path d="M4 20L21 3" />
          <path d="M21 16v5h-5" />
          <path d="M15 15l6 6" />
          <path d="M4 4l5 5" />
        </svg>
        <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current transition-opacity duration-200 ${autoPlay ? "opacity-100" : "opacity-0"}`} />
      </button>
    </Tooltip>
  ) : null;

  // Volume slider (desktop/tablet)
  const volumeControl = (trackRef: React.RefObject<HTMLDivElement | null> = volTrackRef, sliderClass = "hidden md:flex", faderRef: React.RefObject<HTMLDivElement | null> = volFaderRef) => {
    const effectiveVolume = isMuted ? 0 : dragVolume;
    const speakerIcon = (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        {isMuted || effectiveVolume === 0 ? (
          <>
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </>
        ) : effectiveVolume < 50 ? (
          <path d="M15.54 8.46a5 5 0 010 7.07" />
        ) : (
          <>
            <path d="M15.54 8.46a5 5 0 010 7.07" />
            <path d="M19.07 4.93a10 10 0 010 14.14" />
          </>
        )}
      </svg>
    );

    return (
      <div
        className="group/vol relative flex items-center gap-1.5"
        onMouseEnter={() => {
          const sliderVisible = trackRef.current && getComputedStyle(trackRef.current).display !== "none";
          if (!sliderVisible) {
            if (volumeIdleTimer.current) clearTimeout(volumeIdleTimer.current);
            updateDragVolume(volume);
            setShowVolumeFader(true);
          }
        }}
        onMouseLeave={() => {
          if (showVolumeFader && !isDraggingVolRef.current) {
            if (volumeIdleTimer.current) clearTimeout(volumeIdleTimer.current);
            volumeIdleTimer.current = setTimeout(() => setShowVolumeFader(false), 800);
          }
        }}
      >
        {/* Speaker button: mute/unmute (hover opens fader, touch toggles fader) */}
        <Tooltip label={showVolumeFader ? "" : (isMuted ? t("player.unmute") : t("player.mute"))} hideOnClick>
          <button
            ref={volumeIconRef}
            data-volume-icon
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute?.();
            }}
            onPointerDown={(e) => {
              // Touch devices: tap toggles fader (no hover available)
              if (e.pointerType === "touch") {
                e.stopPropagation();
                const sliderVisible = trackRef.current && getComputedStyle(trackRef.current).display !== "none";
                if (!sliderVisible) {
                  e.preventDefault();
                  updateDragVolume(volume);
                  setShowVolumeFader((prev) => !prev);
                }
              }
            }}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text)] transition-all duration-200 ease-out active:scale-95"
          >
            {speakerIcon}
          </button>
        </Tooltip>
        {/* Horizontal slider — visibility controlled by sliderClass */}
        <div
          ref={trackRef}
          className={`${sliderClass} items-center w-20 h-7 cursor-pointer touch-none`}
          onPointerDown={(e) => {
            if (!trackRef.current) return;
            e.preventDefault();
            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
            isDraggingVolRef.current = true;
            setIsDraggingVol(true);
            const rect = trackRef.current.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const newVol = Math.round(ratio * 100);
            updateDragVolume(newVol);
            onVolumeChange?.(newVol);
          }}
          onPointerMove={(e) => {
            if (!isDraggingVolRef.current || !trackRef.current) return;
            const rect = trackRef.current.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const newVol = Math.round(ratio * 100);
            updateDragVolume(newVol);
            onVolumeChange?.(newVol);
          }}
          onPointerUp={() => { isDraggingVolRef.current = false; setIsDraggingVol(false); onVolumeCommit?.(dragVolumeRef.current); }}
        >
          <div className="relative w-full h-1 bg-[color-mix(in_srgb,var(--text-muted)_50%,var(--border))] rounded-full">
            <div className="absolute left-0 top-0 h-full bg-[var(--text)] rounded-full" style={{ width: `${effectiveVolume}%`, transition: isDraggingVol ? 'none' : 'width 150ms cubic-bezier(0.4,0,0.2,1)' }} />
            <div className="absolute w-3.5 h-3.5 rounded-full bg-[var(--bg)] border-2 border-[var(--text)] shadow-sm pointer-events-none" style={{ left: `${effectiveVolume}%`, top: '50%', transform: 'translate(-50%, -50%)', transition: isDraggingVol ? 'none' : 'left 150ms cubic-bezier(0.4,0,0.2,1)' }} />
          </div>
        </div>
        {/* Vertical fader popup — narrow screens only */}
        <AnimatePresence>
        {showVolumeFader && (
          <motion.div
            ref={volumeFaderRef}
            data-volume-fader
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute left-1/2 -translate-x-1/2 px-3 py-3 bg-[var(--bg-alt)]/95 backdrop-blur-xl border border-[var(--border)] rounded-xl shadow-2xl z-50"
            style={{ bottom: "calc(100% + 8px)", transformOrigin: "bottom center" }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => {
              if (volumeIdleTimer.current) clearTimeout(volumeIdleTimer.current);
            }}
            onMouseLeave={() => {
              if (!isDraggingVolRef.current) {
                if (volumeIdleTimer.current) clearTimeout(volumeIdleTimer.current);
                volumeIdleTimer.current = setTimeout(() => setShowVolumeFader(false), 800);
              }
            }}
          >
            <div
              ref={faderRef}
              className="relative w-5 h-24 cursor-pointer touch-none mx-auto"
              onPointerDown={(e) => {
                if (!faderRef.current) return;
                e.preventDefault();
                e.stopPropagation();
                (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                isDraggingVolRef.current = true;
                setIsDraggingVol(true);
                const rect = faderRef.current.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
                const newVol = Math.round(ratio * 100);
                updateDragVolume(newVol);
                onVolumeChange?.(newVol);
                if (volumeIdleTimer.current) clearTimeout(volumeIdleTimer.current);
                volumeIdleTimer.current = setTimeout(() => setShowVolumeFader(false), 5000);
              }}
              onPointerMove={(e) => {
                if (!isDraggingVolRef.current || !faderRef.current) return;
                const rect = faderRef.current.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
                const newVol = Math.round(ratio * 100);
                updateDragVolume(newVol);
                onVolumeChange?.(newVol);
              }}
              onPointerUp={() => {
                isDraggingVolRef.current = false;
                setIsDraggingVol(false);
                onVolumeCommit?.(dragVolumeRef.current);
                if (volumeIdleTimer.current) clearTimeout(volumeIdleTimer.current);
                volumeIdleTimer.current = setTimeout(() => setShowVolumeFader(false), 5000);
              }}
            >
              {/* Visual track (thin) centered inside the wide transparent hit area */}
              <div className="absolute left-1/2 -translate-x-1/2 w-1 h-full bg-[color-mix(in_srgb,var(--text-muted)_50%,var(--border))] rounded-full">
                <div className="absolute bottom-0 left-0 w-full bg-[var(--text)] rounded-full" style={{ height: `${effectiveVolume}%`, transition: isDraggingVol ? 'none' : 'height 150ms cubic-bezier(0.4,0,0.2,1)' }} />
              </div>
              <div className="absolute w-3.5 h-3.5 rounded-full bg-[var(--bg)] border-2 border-[var(--text)] shadow-sm pointer-events-none" style={{ bottom: `${effectiveVolume}%`, left: '50%', transform: 'translate(-50%, 50%)', transition: isDraggingVol ? 'none' : 'bottom 150ms cubic-bezier(0.4,0,0.2,1)' }} />
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    );
  };

  // Mobile volume icon + vertical fader popup
  // Mobile volume — simple mute/unmute toggle (phone hardware controls volume)
  const mobileVolumeToggle = () => (
    <button
      ref={mobileVolumeIconRef}
      onClick={(e) => { e.stopPropagation(); onToggleMute?.(); }}
      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text)] transition-all duration-200 ease-out active:scale-95"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        {isMuted ? (
          <>
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </>
        ) : volume < 50 ? (
          <path d="M15.54 8.46a5 5 0 010 7.07" />
        ) : (
          <>
            <path d="M15.54 8.46a5 5 0 010 7.07" />
            <path d="M19.07 4.93a10 10 0 010 14.14" />
          </>
        )}
      </svg>
    </button>
  );

  // Seek bar
  const seekBar = (barRef: React.RefObject<HTMLDivElement | null>, trackHeight = 4, thumbSize = 14) => (
    <div
      className="group/seek flex-1 py-3 px-2 cursor-pointer touch-none"
      onMouseMove={(e) => {
        if (!barRef.current || !hasDuration) return;
        const rect = barRef.current.getBoundingClientRect();
        setHoverPercent(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
      }}
      onMouseLeave={() => setHoverPercent(null)}
      onPointerDown={(e) => handlePointerDown(e, barRef)}
      onPointerMove={(e) => handlePointerMove(e, barRef)}
      onPointerUp={(e) => handlePointerUp(e, barRef)}
    >
      <div
        ref={barRef}
        className="relative bg-[color-mix(in_srgb,var(--text-muted)_50%,var(--border))] rounded-full"
        style={{ height: trackHeight }}
      >
        {/* Hover preview fill */}
        {hoverPercent !== null && !isDragging && (
          <div
            className="absolute inset-y-0 left-0 bg-[var(--text)] opacity-45 rounded-full pointer-events-none"
            style={{ width: `${hoverPercent}%` }}
          />
        )}
        <div
          className="h-full bg-[var(--text)] rounded-full pointer-events-none"
          style={{
            width: `${progressPercent}%`,
            transition: isDragging ? "none" : "width 200ms linear",
            willChange: "width",
          }}
        />
        <div
          className="seek-thumb absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-[var(--bg)] border-2 border-[var(--text)] shadow-md pointer-events-none"
          style={{
            left: `${progressPercent}%`,
            width: thumbSize,
            height: thumbSize,
            transition: isDragging ? "none" : "left 200ms linear",
            willChange: "left",
          }}
        />
        {/* Hover timestamp tooltip */}
        {hoverPercent !== null && hasDuration && !isDragging && (
          <div
            className="absolute -top-7 -translate-x-1/2 pointer-events-none px-1.5 py-0.5 bg-[var(--text)] text-[var(--bg)] rounded font-mono text-[10px] tabular-nums whitespace-nowrap z-50"
            style={{ left: `${hoverPercent}%` }}
          >
            {formatTime((hoverPercent / 100) * audioDuration)}
          </div>
        )}
      </div>
    </div>
  );

  // Time labels — desktop
  const elapsedLabel = (
    <span className="shrink-0 font-mono text-[11px] text-[var(--text-muted)] tabular-nums w-9 text-right">
      {formatTime(audioProgress)}
    </span>
  );
  const remainingLabel = (
    <span className="shrink-0 font-mono text-[11px] text-[var(--text-muted)] tabular-nums w-9">
      {hasDuration ? `-${formatTime(Math.max(0, audioDuration - audioProgress))}` : "--:--"}
    </span>
  );

  // Time labels — mobile
  const mobileElapsedLabel = (
    <span className="shrink-0 font-mono text-[11px] text-[var(--text-muted)] tabular-nums w-9 text-right">
      {formatTime(audioProgress)}
    </span>
  );
  const mobileRemainingLabel = (
    <span className="shrink-0 font-mono text-[11px] text-[var(--text-muted)] tabular-nums w-9">
      {hasDuration ? `-${formatTime(Math.max(0, audioDuration - audioProgress))}` : "--:--"}
    </span>
  );

  // Transport buttons
  const prevButton = (size: number) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onPrevTrack?.();
      }}
      disabled={!hasPrev}
      className={`shrink-0 flex items-center justify-center rounded-full transition-all duration-200 ease-out ${
        hasPrev
          ? "text-[var(--text)] hover:bg-[var(--text)]/10 active:scale-95 active:-translate-x-0.5"
          : "text-[var(--text-muted)]/40 cursor-default"
      }`}
      style={{ width: size, height: size }}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
      </svg>
    </button>
  );

  const playPauseButton = (size: number, iconSize: number = 16) => (
    <button
      onClick={onTogglePlay}
      className="shrink-0 rounded-full bg-[var(--text)] text-[var(--bg)] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all duration-200 ease-out"
      style={{ width: size, height: size }}
    >
      {isPlaying ? (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <rect x="5" y="3" width="5" height="18" rx="1" />
          <rect x="14" y="3" width="5" height="18" rx="1" />
        </svg>
      ) : (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: Math.round(iconSize * 0.1) }}>
          <path d="M6 3.5v17a1 1 0 001.5.86l14-8.5a1 1 0 000-1.72l-14-8.5A1 1 0 006 3.5z" />
        </svg>
      )}
    </button>
  );

  const nextButton = (size: number) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onNextTrack?.();
      }}
      className="shrink-0 flex items-center justify-center rounded-full text-[var(--text)] hover:bg-[var(--text)]/10 active:scale-95 active:translate-x-0.5 transition-all duration-200 ease-out"
      style={{ width: size, height: size }}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
      </svg>
    </button>
  );

  // Close button — corner tab that pokes above the player top border
  const [closeDismissing, setCloseDismissing] = useState(false);

  const handleCloseClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCloseDismissing(true);
    setTimeout(() => {
      onClose();
      setCloseDismissing(false);
    }, 200);
  }, [onClose]);

  const closeButton = (
    <div
      className="absolute -top-[34px] right-2 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out group-hover:[transition-delay:0ms]"
      style={{ transitionDelay: "800ms", pointerEvents: showClose ? "auto" : "none", visibility: showClose ? "visible" : "hidden" }}
    >
      {/* Hit area: bigger than visible button */}
      <button
        onClick={handleCloseClick}
        className="w-8 h-8 flex items-center justify-center cursor-pointer"
        aria-label={t("player.closePlayer")}
      >
        {/* Visible button: smaller, centered inside hit area */}
        <span
          className={`w-5 h-5 flex items-center justify-center rounded-[9px] bg-[var(--bg-alt)] border border-[var(--border)]/40 text-[var(--text)]/70 shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-all duration-150 ${
            closeDismissing ? "scale-[0.3] opacity-0" : "active:scale-[0.92] active:translate-y-[0.5px]"
          }`}
        >
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </span>
      </button>
    </div>
  );

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0.5 }}
      /* eslint-disable react-hooks/refs -- framer-motion animate prop reads ref safely */
      animate={{
        y: 0,
        opacity: 1,
        ...(isMobile ? { height: isMinimized ? 64 : expandedHeightRef.current } : {}),
      }}
      /* eslint-enable react-hooks/refs */
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`group player-banner fixed left-0 right-0 min-[1152px]:left-[var(--sidebar-width)] bg-[var(--bg-alt)]/85 backdrop-blur-2xl backdrop-saturate-150 border-t border-[var(--border)]/50 overflow-visible`}
      style={{ bottom: 0, ...(!isMobile ? { height: "var(--player-height)" } : {}) }}
    >
      {/* Corner tab close — desktop only */}
      {closeButton}

      {/* ===== DESKTOP layout (sm+): single row, 96px ===== */}
      <div className="h-full hidden min-[1152px]:grid items-center pl-2.5 pr-1.5 gap-1.5 max-w-[2560px] mx-auto w-full" style={{ gridTemplateColumns: "1fr min(100%, 50%) 1fr" }}>
        {/* LEFT: Album art + Track info */}
        <div className="flex items-center gap-2.5 min-w-0">
          {thumbUrl && (
            <Tooltip label={t("player.watchOnYoutube")} position="top" align="start">
              <div
                key={card.id}
                className={`shrink-0 w-[70px] h-[70px] rounded-md overflow-hidden bg-[var(--bg)] shadow-md animate-art-in relative group/art cursor-pointer transition-opacity duration-300 ${isUnavailable ? "opacity-40" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (card.youtubeUrl) window.open(card.youtubeUrl, "_blank", "noopener,noreferrer");
                }}
              >
                <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                {card.source === "youtube" && card.youtubeUrl && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/art:opacity-100 transition-opacity duration-200">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.582 6.186a2.506 2.506 0 00-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418c-.86.23-1.538.908-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814c.23.86.908 1.538 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 001.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814zM10 15.464V8.536L16 12l-6 3.464z" />
                    </svg>
                  </div>
                )}
              </div>
            </Tooltip>
          )}
          <div className="min-w-0 cursor-pointer" onClick={isUnavailable ? undefined : copyTitle}>
            {isUnavailable ? (
              <p className="font-mono text-sm text-[var(--text-muted)] uppercase truncate leading-tight">
                {t("player.unavailable")}
              </p>
            ) : (
              <>
                <p className="font-mono text-[14px] text-[var(--text)] uppercase truncate leading-tight font-bold hover:text-[var(--accent)] transition-colors">
                  {card.name}
                </p>
                <p className="font-mono text-[11px] text-[var(--text-secondary)] uppercase truncate leading-tight">
                  {card.artist}
                </p>
              </>
            )}
          </div>
          <div className="shrink-0 ml-auto">
            {eqBars}
          </div>
        </div>

        {/* CENTER: Two rows — controls on top, seek bar below */}
        <div className="flex flex-col items-center justify-center gap-0.5 min-w-0 w-full">
          {/* Row 1: info, heart, transport, shuffle, locate */}
          <div className="flex items-center gap-1.5">
            {infoButton("md")}
            {likeButton("sm")}
            {hasPrev ? <Tooltip label={t("player.previous")} position="top">{prevButton(32)}</Tooltip> : prevButton(32)}
            <Tooltip label={isPlaying ? t("player.pause") : t("player.play")} position="top">{playPauseButton(38, 16)}</Tooltip>
            <Tooltip label={t("player.next")} position="top">{nextButton(32)}</Tooltip>
            {autoPlayButton}
            {locateButton("md")}
            {pitchFader}
          </div>
          {/* Row 2: Seek bar */}
          <div className="w-full flex items-center gap-1 px-1">
            {elapsedLabel}
            {seekBar(progressBarRef)}
            {remainingLabel}
          </div>
        </div>

        {/* RIGHT: Queue ··· Volume + Fullscreen */}
        <div className="flex items-center w-full relative z-10">
          {queueButton}
          <div className="flex items-center gap-2.5 ml-auto">
            {volumeControl(volTrackRef, "hidden min-[1350px]:flex", desktopVolFaderRef)}
            {fullscreenButton}
          </div>
        </div>
      </div>

      {/* ===== MOBILE layout ===== */}
      <div className="h-full min-[1152px]:hidden">
        {isMinimized ? (
          /* Minimized Spotify-style bar: art + title/artist + heart + play/pause, progress at bottom */
          <div
            className="h-full flex flex-col cursor-pointer"
            onClick={() => setIsMinimized(false)}
          >
            {/* Main row */}
            <div className="flex-1 flex items-center gap-3 px-3">
              {thumbUrl && (
                <div className="shrink-0 w-11 h-11 rounded-md overflow-hidden bg-[var(--bg)] shadow-sm">
                  <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm text-[var(--text)] uppercase truncate leading-tight font-bold">
                  {card.name}
                </p>
                <p className="font-mono text-xs text-[var(--text-secondary)] uppercase truncate leading-tight">
                  {card.artist}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                <div className="shrink-0">{eqBars}</div>
                {likeButton("md")}
                {playPauseButton(36, 14)}
              </div>
            </div>
            {/* Bottom progress bar — thin, clickable to seek */}
            <div
              className="w-full h-[5px] bg-[color-mix(in_srgb,var(--text-muted)_30%,var(--border))] cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (!onSeek || !hasDuration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                onSeek(ratio * audioDuration);
              }}
            >
              <div
                className="h-full bg-[var(--text)] pointer-events-none rounded-r-full"
                style={{ width: `${progressPercent}%`, transition: "width 200ms linear" }}
              />
            </div>
          </div>
        ) : (
          <>
          {/* Expanded 3-row layout — narrow mobile (<500px) */}
          <div className="h-full flex flex-col px-4 pt-1.5 pb-0 gap-1 min-[500px]:hidden">
            {/* Row 1: Chevron + Art + Info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
                className="shrink-0 w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] transition-all duration-200 active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {thumbUrl && (
                <a
                  href={card.source === "youtube" && card.youtubeUrl ? card.youtubeUrl : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={card.id}
                  className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-[var(--bg)] shadow-md animate-art-in relative group/art transition-opacity duration-300 ${isUnavailable ? "opacity-40" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!card.youtubeUrl) e.preventDefault();
                  }}
                >
                  <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                  {card.source === "youtube" && card.youtubeUrl && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/art:opacity-100 transition-opacity duration-200">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.582 6.186a2.506 2.506 0 00-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418c-.86.23-1.538.908-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814c.23.86.908 1.538 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 001.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814zM10 15.464V8.536L16 12l-6 3.464z" />
                      </svg>
                    </div>
                  )}
                </a>
              )}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={isUnavailable ? undefined : copyTitle}>
                {isUnavailable ? (
                  <p className="font-mono text-sm text-[var(--text-muted)] uppercase truncate leading-tight">
                    {t("player.unavailable")}
                  </p>
                ) : (
                  <>
                    <p className="font-mono text-[15px] text-[var(--text)] uppercase truncate leading-tight font-bold hover:text-[var(--accent)] transition-colors">
                      {card.name}
                    </p>
                    <p className="font-mono text-xs text-[var(--text-secondary)] uppercase truncate leading-tight">
                      {card.artist}
                    </p>
                  </>
                )}
              </div>
              <div className="shrink-0">
                {eqBars}
              </div>
            </div>

            {/* Row 2: Transport controls — centered */}
            <div className="flex items-center justify-center gap-3">
              {infoButton("md")}
              {likeButton("md")}
              {prevButton(32)}
              {playPauseButton(40, 16)}
              {nextButton(32)}
              {onToggleAutoPlay && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAutoPlay();
                  }}
                  className={`relative shrink-0 w-7 h-7 flex items-center justify-center transition-all duration-200 ease-out active:scale-95 ${
                    autoPlay
                      ? "text-[var(--text)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={autoPlay ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 3h5v5" />
                    <path d="M4 20L21 3" />
                    <path d="M21 16v5h-5" />
                    <path d="M15 15l6 6" />
                    <path d="M4 4l5 5" />
                  </svg>
                  <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current transition-opacity duration-200 ${autoPlay ? "opacity-100" : "opacity-0"}`} />
                </button>
              )}
              {queueButton}
              {mobileVolumeToggle()}
            </div>

            {/* Row 3: Seek bar */}
            <div className="flex items-center gap-1.5">
              {mobileElapsedLabel}
              {seekBar(mobileProgressBarRef)}
              {mobileRemainingLabel}
            </div>
          </div>

          {/* Expanded 2-row layout — tablet (500-1023px) */}
          <div className="h-full hidden min-[500px]:flex flex-col justify-center px-3 gap-1">
            {/* Row 1: art + controls */}
            <div className="grid items-center gap-2" style={{ gridTemplateColumns: "minmax(150px, 1fr) auto minmax(80px, 1fr)" }}>
              {/* Left: chevron + art + track info */}
              <div className="flex items-center gap-2 min-w-0" style={{ maxWidth: "clamp(280px, 38vw, 420px)" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
                  className="shrink-0 w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] transition-all duration-200 active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {thumbUrl && (
                  <a
                    href={card.source === "youtube" && card.youtubeUrl ? card.youtubeUrl : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={card.id}
                    className={`shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-[var(--bg)] shadow-md animate-art-in relative group/art transition-opacity duration-300 ${isUnavailable ? "opacity-40" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!card.youtubeUrl) e.preventDefault();
                    }}
                  >
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                  </a>
                )}
                <div className="min-w-0 flex-1 cursor-pointer" onClick={isUnavailable ? undefined : copyTitle}>
                  {isUnavailable ? (
                    <p className="font-mono text-xs text-[var(--text-muted)] uppercase truncate leading-tight">
                      {t("player.unavailable")}
                    </p>
                  ) : (
                    <>
                      <p className="font-mono text-sm text-[var(--text)] uppercase truncate leading-tight font-bold hover:text-[var(--accent)] transition-colors">
                        {card.name}
                      </p>
                      <p className="font-mono text-[11px] text-[var(--text-secondary)] uppercase truncate leading-tight">
                        {card.artist}
                      </p>
                    </>
                  )}
                </div>
                <div className="shrink-0 ml-auto">
                  {eqBars}
                </div>
              </div>
              {/* Center: info, heart, transport, shuffle, locate */}
              <div className="flex items-center justify-center gap-1">
                {infoButton("sm")}
                {likeButton("sm")}
                {prevButton(28)}
                {playPauseButton(34, 14)}
                {nextButton(28)}
                {onToggleAutoPlay && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleAutoPlay();
                    }}
                    className={`relative shrink-0 w-7 h-7 flex items-center justify-center transition-all duration-200 ease-out active:scale-95 ${
                      autoPlay
                        ? "text-[var(--text)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={autoPlay ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 3h5v5" />
                      <path d="M4 20L21 3" />
                      <path d="M21 16v5h-5" />
                      <path d="M15 15l6 6" />
                      <path d="M4 4l5 5" />
                    </svg>
                    <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current transition-opacity duration-200 ${autoPlay ? "opacity-100" : "opacity-0"}`} />
                  </button>
                )}
                {locateButton("sm")}
              </div>
              {/* Right: queue ··· volume + fullscreen */}
              <div className="flex items-center w-full relative z-10">
                {queueButton}
                <div className="flex items-center gap-3 ml-auto mr-0.5">
                  {volumeControl(volTrackTabletRef, "hidden md:flex", tabletVolFaderRef)}
                  {fullscreenButton}
                </div>
              </div>
            </div>
            {/* Row 2: Seek bar */}
            <div className="flex items-center gap-1.5">
              {mobileElapsedLabel}
              {seekBar(tabletProgressBarRef)}
              {mobileRemainingLabel}
            </div>
          </div>
          </>
        )}
      </div>

      {/* Info popover — shared across all layouts */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            ref={infoRef}
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="z-50 w-[220px] bg-black/85 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-3 text-left fixed"
            style={infoAnchor ? { left: Math.max(8, infoAnchor.left - 110), bottom: typeof window !== 'undefined' ? window.innerHeight - infoAnchor.top + 8 : 80 } : { bottom: 80, left: 8 }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={cancelInfoDismissTimer}
            onMouseLeave={() => { if (showInfo) startInfoDismissTimer(); }}
          >
            <p className="font-mono text-[11px] text-white/90 font-bold truncate">{card.album}</p>
            <div className="flex items-center gap-3 mt-1.5">
              {card.viewCount != null && (
                <span className="font-mono text-[10px] text-white/50">{formatViewCount(card.viewCount)} views</span>
              )}
              {card.publishedAt && (
                <span className="font-mono text-[10px] text-white/50">{formatDate(card.publishedAt)}</span>
              )}
            </div>
            {card.description && (
              <p className="font-mono text-[10px] text-white/40 mt-2 leading-relaxed line-clamp-4">{card.description}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating "Copied!" toast — portal to body to escape motion.div transform */}
      {copied && copyPos && createPortal(
        <div
          className="fixed z-[100] pointer-events-none"
          style={{ left: copyPos.x, top: copyPos.y, transform: "translate(-50%, -100%)" }}
        >
          <div className="px-2.5 py-1 bg-[var(--bg-card)] border border-[var(--border)] rounded font-mono text-xs text-[var(--text)] shadow-lg animate-fade-in">
            Copied!
          </div>
        </div>,
        document.body
      )}
    </motion.div>
  );
}
