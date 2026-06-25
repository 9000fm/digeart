"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence } from "framer-motion";
import DiscoverGrid from "@/components/DiscoverGrid";
import MixesGrid from "@/components/MixesGrid";
import SamplesGrid from "@/components/SamplesGrid";
import SavedSection from "@/components/SavedSection";
import AddToPlaylistMenu from "@/components/AddToPlaylistMenu";
import { usePlaylists } from "@/hooks/usePlaylists";
import { fetchLikes, likeAction } from "@/lib/likesClient";
import NowPlayingBanner from "@/components/NowPlayingBanner";
import Sidebar from "@/components/Sidebar";
import UndoToast from "@/components/UndoToast";
import LinkCopiedToast from "@/components/LinkCopiedToast";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import QueuePanel from "@/components/QueuePanel";
import WelcomeScreen from "@/components/WelcomeScreen";
import type { ViewType } from "@/components/Sidebar";
import type { CardData } from "@/lib/types";
import { stripCardForStorage, hydrateCardDefaults } from "@/lib/youtube";
import { MIX_MIN_SECONDS } from "@/lib/durations";
import { updatePlayback } from "@/lib/playbackProgress";
import { recordPlay } from "@/lib/playHistory";

/* ── YouTube IFrame API types ── */
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  getVolume(): number;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getDuration(): number;
  getCurrentTime(): number;
  getPlayerState(): number;
  destroy(): void;
  loadVideoById(videoId: string, startSeconds?: number): void;
  cueVideoById(videoId: string, startSeconds?: number): void;
  setPlaybackRate(suggestedRate: number): void;
  getPlaybackRate(): number;
}

interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

// YT types are declared in youtube-player.ts — use the local interfaces here
// without re-declaring on Window (which conflicts with the `any` declaration)

export default function Home() {
  const { data: session } = useSession();
  const isAuthenticated = !!session;
  const playlistsApi = usePlaylists(isAuthenticated);
  const [addToPlaylistCard, setAddToPlaylistCard] = useState<CardData | null>(null);
  const [addToPlaylistAnchor, setAddToPlaylistAnchor] = useState<{ x: number; y: number; el: HTMLElement | null } | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number; el: HTMLElement | null } | null>(null); // last click → anchors the add-to-playlist popup to its trigger
  const [activeView, setActiveView] = useState<ViewType>("home");
  const [activeGenre, setActiveGenre] = useState(0);
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [activeGenreLabels, setActiveGenreLabels] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [nowPlayingCard, setNowPlayingCard] = useState<CardData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [djMode, setDjMode] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("digeart-dj-mode") === "1";
    return false;
  });
  const [playbackRate, setPlaybackRate] = useState(1);
  const playbackRateRef = useRef(1);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("digeart-volume");
      return saved ? parseInt(saved, 10) : 80;
    }
    return 80;
  });
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("digeart-muted");
      if (saved !== null) return saved === "1";
      return false;
    }
    return false;
  });
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const [skippingUnavailable, setSkippingUnavailable] = useState(false);
  const [savedCards, setSavedCards] = useState<CardData[]>([]);
  const savedFilterRef = useRef<"all" | "tracks" | "samples" | "mixes" | "deleted">("all");
  const [savedLoading, setSavedLoading] = useState(false);
  const [softDeletedIds, setSoftDeletedIds] = useState<Set<string>>(new Set());
  const [recentlyRemoved, setRecentlyRemoved] = useState<(CardData & { deletedAt: string })[]>([]);
  const [showAbout, setShowAbout] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [, bumpQueue] = useState(0); // force re-render so an open QueuePanel reflects queue mutations
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mountedTabs, setMountedTabs] = useState<Set<ViewType>>(new Set(["home"]));
  const scrollPositions = useRef<Record<string, number>>({});

  // Undo unlike state — stacking: each unlike gets its own toast + timer
  const [undoItems, setUndoItems] = useState<import("@/components/UndoToast").UndoItem[]>([]);
  const [undoRestoredId, setUndoRestoredId] = useState<string | null>(null);
  const pendingUnlikes = useRef<Map<string, { undoId: number; card: CardData; timer: ReturnType<typeof setTimeout> }>>(new Map());

  const skippingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardRegistry = useRef<Map<string, CardData>>(new Map());
  const cardViewMap = useRef<Map<string, ViewType>>(new Map());
  const playOriginView = useRef<ViewType | null>(null);
  const activeViewRef = useRef(activeView);
  activeViewRef.current = activeView;
  const shuffleQueue = useRef<string[]>([]);
  const queueIndex = useRef(-1);
  const queueView = useRef<ViewType | null>(null);
  // When the queue source is a playlist, this holds its full ordered id list so
  // shuffle-toggle (getOrderedIds) can rebuild from the whole playlist, not feed views.
  const playlistQueueIds = useRef<string[]>([]);
  // Layered queue: # of manual (Play Next / Add to Queue) items sitting right after
  // the current track, before the source-based auto-continuation tail. Reset to 0 on
  // any non-linear move (prev / jump / rebuild) to keep the invariant safe.
  const manualAfter = useRef(0);
  // YT IFrame API refs
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPendingVideoId = useRef<string | null>(null);
  const ytProgressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const ytPlayerReady = useRef(false);
  const hasAdvancedRef = useRef(false);

  // ── Load YouTube IFrame API script + pre-create player ──
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initPlayer = () => {
      // Pre-create player (no video, no autoplay) so first user play
      // goes through loadVideoById — works within mobile gesture context
      if (!ytPlayerRef.current && ytContainerRef.current) {
        const div = document.createElement("div");
        div.id = "yt-player-target";
        ytContainerRef.current.innerHTML = "";
        ytContainerRef.current.appendChild(div);

        ytPlayerRef.current = new window.YT.Player("yt-player-target", {
          height: "1",
          width: "1",
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: (event: YTPlayerEvent) => {
              ytPlayerReady.current = true;
              event.target.setVolume(volumeRef.current);
              if (isMutedRef.current) event.target.mute();
              // If user clicked a track before player was ready, play it now
              if (ytPendingVideoId.current) {
                event.target.loadVideoById(ytPendingVideoId.current);
                ytPendingVideoId.current = null;
                // Async YT callback fires after the fn is declared below; runtime-safe.
                // eslint-disable-next-line react-hooks/immutability
                startYTProgressPoller();
              }
            },
            onStateChange: (event: YTPlayerEvent) => {
              handleYTStateChange.current?.(event);
            },
            onError: () => {
              setSkippingUnavailable(true);
              if (skippingTimerRef.current) clearTimeout(skippingTimerRef.current);
              skippingTimerRef.current = setTimeout(() => {
                setSkippingUnavailable(false);
                handleNextTrackRef.current?.();
              }, 1500);
            },
          },
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }
    window.onYouTubeIframeAPIReady = initPlayer;

    // Keep the ~1MB IFrame API off the critical first paint, but warm it the moment
    // the user shows intent (first move / scroll / touch / key) so the player is
    // ready by the time they click a card. Falls back to the first idle moment if
    // they never interact. Player is still pre-created before any play tap, so the
    // mobile first-tap gesture path is unchanged.
    const loadYT = () => {
      if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) return;
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    };
    let warmed = false;
    const intentEvents = ["pointermove", "pointerdown", "scroll", "keydown", "touchstart"];
    const warmOnIntent = () => {
      if (warmed) return;
      warmed = true;
      loadYT();
      intentEvents.forEach((ev) => window.removeEventListener(ev, warmOnIntent));
    };
    intentEvents.forEach((ev) => window.addEventListener(ev, warmOnIntent, { passive: true }));

    // Fallback: warm during the first idle moment even without interaction.
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(loadYT, { timeout: 2500 });
    } else {
      setTimeout(loadYT, 1500);
    }

    return () => {
      intentEvents.forEach((ev) => window.removeEventListener(ev, warmOnIntent));
    };
  }, []);

  // ── Cleanup progress interval on unmount ──
  useEffect(() => {
    return () => {
      if (ytProgressInterval.current) clearInterval(ytProgressInterval.current);
    };
  }, []);

  // ── Reload starts at the top (infinite feed would otherwise restore scroll near the bottom) ──
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // ── Supabase: load saved likes on mount ──
  useEffect(() => {
    if (!session?.user?.email) return;
    const email = session.user.email;
    setSavedLoading(true);
    fetchLikes()
      .then((data) => {
        const ids = new Set<string>();
        const activeCards: CardData[] = [];
        const removed: (CardData & { deletedAt: string })[] = [];
        for (const row of data) {
          if (row.deleted_at === null) {
            ids.add(row.video_id);
            activeCards.push(hydrateCardDefaults(row.card_data as Partial<CardData>));
          } else {
            removed.push({ ...hydrateCardDefaults(row.card_data as Partial<CardData>), deletedAt: row.deleted_at });
          }
        }
        setLikedIds(ids);
        setSoftDeletedIds(new Set());
        setSavedCards(activeCards);
        setRecentlyRemoved(removed);
        setSavedLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load likes:", error);
        setSavedLoading(false);
      });
  }, [session?.user?.email]);

  // ── Onboarding: welcome (pre-login) + spotlight (post-login, first time) ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("digeart-welcome-seen")) {
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (typeof window === "undefined") return;
    // Mark welcome as seen once authenticated
    localStorage.setItem("digeart-welcome-seen", "1");
    setShowWelcome(false);
    if (!localStorage.getItem("digeart-onboarded")) {
      // Wait until the first card AND its thumbnail have painted before starting,
      // so step 1's spotlight always lands on a real card (not empty space during
      // a cold pool load). Safety cap so it never hangs if cards never arrive.
      let cancelled = false;
      let timer: ReturnType<typeof setTimeout>;
      const startedAt = Date.now();
      const ready = () => {
        const card = document.querySelector("[data-card-id]");
        if (!card) return false;
        const img = card.querySelector("img");
        return !img || (img.complete && img.naturalWidth > 0);
      };
      const tick = () => {
        if (cancelled) return;
        if (ready() || Date.now() - startedAt > 5000) {
          setShowAbout(false); setShowQueue(false); setShowOnboarding(true);
          return;
        }
        timer = setTimeout(tick, 150);
      };
      timer = setTimeout(tick, 600); // initial settle, then poll
      return () => { cancelled = true; clearTimeout(timer); };
    }
  }, [isAuthenticated]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem("digeart-onboarded", "1");
  }, []);

  const handleWelcomeDismiss = useCallback(() => {
    setShowWelcome(false);
    localStorage.setItem("digeart-welcome-seen", "1");
  }, []);

  // ── YT progress poller (also handles background-tab end detection) ──
  const startYTProgressPoller = useCallback(() => {
    if (ytProgressInterval.current) clearInterval(ytProgressInterval.current);
    ytProgressInterval.current = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p) return;
      try {
        const current = p.getCurrentTime();
        const duration = p.getDuration();
        const state = p.getPlayerState();
        // Update progress when playing (1) or buffering (3) with valid data
        if (state === 1 || (state === 3 && duration > 0 && current > 0)) {
          updatePlayback(duration > 0 ? { progress: current, duration } : { progress: current });
        }
        // End detection — catches track end even in background tabs
        // where onStateChange(ENDED) is deferred
        if (duration > 0 && current >= duration - 0.5 && !hasAdvancedRef.current) {
          hasAdvancedRef.current = true;
          clearInterval(ytProgressInterval.current!);
          ytProgressInterval.current = null;
          handleNextTrackRef.current?.();
        }
      } catch {
        // player may not be ready
      }
    }, 250);
  }, []);

  const stopYTProgressPoller = useCallback(() => {
    if (ytProgressInterval.current) {
      clearInterval(ytProgressInterval.current);
      ytProgressInterval.current = null;
    }
  }, []);

  // ── Auto-advance refs (to avoid stale closures in YT callbacks) ──
  const autoPlayEnabledRef = useRef(autoPlayEnabled);
  autoPlayEnabledRef.current = autoPlayEnabled;
  const nowPlayingCardRef = useRef(nowPlayingCard);
  nowPlayingCardRef.current = nowPlayingCard;

  // ── Create / load YT player ──
  const handleYTStateChange = useRef<((event: YTPlayerEvent) => void) | null>(null);

  const createYTPlayer = useCallback((videoId: string) => {
    // Arm the advance guard until the NEW video confirms PLAYING (reset at state 1).
    // Without this, on a track change the 250ms poller can read the OLD track's
    // near-end time during the async load and fire a 2nd advance → skipped track
    // (race widens under heavy render, e.g. loading more cards while playing).
    hasAdvancedRef.current = true;
    if (!ytPlayerReady.current) {
      // Player not ready yet — queue for when onReady fires
      ytPendingVideoId.current = videoId;
      return;
    }
    ytPlayerRef.current!.loadVideoById(videoId);
    try { ytPlayerRef.current!.playVideo(); } catch { /* ignore */ }
    startYTProgressPoller();
    // Retry playVideo() at 300ms and 1s for slow-loading / Safari
    setTimeout(() => {
      try {
        const p = ytPlayerRef.current;
        if (p && p.getPlayerState() !== 1) p.playVideo();
      } catch { /* ignore */ }
    }, 300);
    setTimeout(() => {
      try {
        const p = ytPlayerRef.current;
        if (p && p.getPlayerState() !== 1) p.playVideo();
      } catch { /* ignore */ }
    }, 1000);
  }, [startYTProgressPoller]);

  // Keep handleYTStateChange in sync
  useEffect(() => {
    // Latest handler stored on a ref so YT callbacks call the current closure; standard.
    // eslint-disable-next-line react-hooks/immutability
    handleYTStateChange.current = (event: YTPlayerEvent) => {
      if (event.data === 0 && !hasAdvancedRef.current) {
        // ENDED
        hasAdvancedRef.current = true;
        stopYTProgressPoller();
        handleNextTrackRef.current?.();
      } else if (event.data === 1) {
        // PLAYING — new video confirmed; safe to re-arm end detection
        hasAdvancedRef.current = false;
        setIsPlaying(true);
        startYTProgressPoller();
        // Get real duration
        try {
          const dur = event.target.getDuration();
          if (dur > 0) updatePlayback({ duration: dur });
        } catch { /* ignore */ }
        // Re-apply DJ mode playback rate on new track
        if (playbackRateRef.current !== 1) {
          try { event.target.setPlaybackRate(playbackRateRef.current); } catch { /* ignore */ }
        }
      } else if (event.data === 2) {
        // PAUSED — sync UI (handles background tab throttling + user pause)
        setIsPlaying(false);
        stopYTProgressPoller();
      }
    };
  }, [stopYTProgressPoller, startYTProgressPoller]);

  // Pending auto-play from shared ?t=<videoId> link — read on mount, triggered when card registers
  const pendingAutoPlayId = useRef<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("t");
    if (shared) {
      pendingAutoPlayId.current = shared;
      // Strip the ?t= from URL without reloading so refreshes don't re-trigger
      const url = new URL(window.location.href);
      url.searchParams.delete("t");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, []);

  const registerCards = useCallback((cards: CardData[], view: ViewType) => {
    const newIds: string[] = [];
    for (const c of cards) {
      const isNew = !cardRegistry.current.has(c.id);
      cardRegistry.current.set(c.id, c);
      // Don't let the saved view overwrite a card's real origin
      if (view !== "saved" || !cardViewMap.current.has(c.id)) {
        cardViewMap.current.set(c.id, view);
      }
      // Track genuinely new cards for queue injection
      if (isNew && view === queueView.current) {
        newIds.push(c.id);
      }
    }
    // Silently append new cards to the END of the queue
    // This keeps the visible "Up next" list stable — new cards appear after existing ones.
    // Only randomize when shuffle (autoplay) is on; otherwise preserve grid/display order.
    if (newIds.length > 0 && shuffleQueue.current.length > 0) {
      // Helper declared later in the module; this call runs at runtime, after declaration.
      // eslint-disable-next-line react-hooks/immutability
      if (autoPlayEnabledRef.current) fisherYatesShuffle(newIds);
      shuffleQueue.current.push(...newIds);
    }
    // Deferred auto-play from shared ?t=<videoId> link
    if (pendingAutoPlayId.current && cardRegistry.current.has(pendingAutoPlayId.current)) {
      const id = pendingAutoPlayId.current;
      pendingAutoPlayId.current = null;
      setTimeout(() => handlePlayRef.current?.(id), 0);
    }
  }, []);

  const registerHomeCards = useCallback(
    (cards: CardData[]) => registerCards(cards, "home"),
    [registerCards]
  );
  const registerSamplesCards = useCallback(
    (cards: CardData[]) => registerCards(cards, "samples"),
    [registerCards]
  );
  const registerMixesCards = useCallback(
    (cards: CardData[]) => registerCards(cards, "mixes"),
    [registerCards]
  );
  const registerSavedCards = useCallback(
    (cards: CardData[]) => registerCards(cards, "saved"),
    [registerCards]
  );


  // ── Shuffle queue helpers ──

  // Fisher-Yates shuffle (in-place)
  const fisherYatesShuffle = (arr: string[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Ordered card IDs for a view, in display (registry/feed) order, saved-filter applied.
  const getOrderedIds = useCallback((view: ViewType) => {
    // Playlist queues are bounded — their order lives in playlistQueueIds, not the
    // feed-membership map, so shuffle-toggle rebuilds from the whole playlist.
    if (view === "playlist") return [...playlistQueueIds.current];

    let ids = Array.from(cardRegistry.current.entries())
      .filter(([id]) => cardViewMap.current.get(id) === view)
      .map(([id]) => id);

    // Filter by type when playing from saved with an active filter
    if (view === "saved" && savedFilterRef.current !== "all") {
      const filter = savedFilterRef.current;
      ids = ids.filter((id) => {
        const card = cardRegistry.current.get(id);
        if (!card?.duration) return filter === "tracks";
        if (card.duration >= MIX_MIN_SECONDS) return filter === "mixes";
        if (card.duration <= 240) return filter === "samples";
        return filter === "tracks";
      });
    }
    return ids;
  }, []);

  // Build a queue of card IDs for a given view
  const buildQueue = useCallback((startingCardId: string, shuffle: boolean) => {
    const view = cardViewMap.current.get(startingCardId) || activeViewRef.current;
    const ids = getOrderedIds(view);

    if (shuffle) {
      // Shuffle on → randomize, then pull the clicked card to the front
      fisherYatesShuffle(ids);
      const startIdx = ids.indexOf(startingCardId);
      if (startIdx > 0) {
        ids.splice(startIdx, 1);
        ids.unshift(startingCardId);
      }
      queueIndex.current = 0;
      setCanGoPrev(false);
    } else {
      // Shuffle off → keep feed order, just position at the clicked card so Next
      // continues to the following card in the feed (never jumps back to the top).
      const startIdx = ids.indexOf(startingCardId);
      queueIndex.current = startIdx >= 0 ? startIdx : 0;
      setCanGoPrev(queueIndex.current > 0);
    }

    shuffleQueue.current = ids;
    queueView.current = view;
    manualAfter.current = 0;
  }, [getOrderedIds]);

  // Internal play handler (simplified — no history/forward stack)
  const handlePlayInternal = useCallback((card: CardData) => {
    setPlayingId(card.id);
    // Force isPlaying off on every track change so the EQ doesn't carry over from the
    // previous track. Don't set it true here — wait for YouTube state 1 (PLAYING). This
    // kills the show→hide→show flicker (stale-true EQ during the new video's load) and
    // keeps the EQ from animating while the video is still loading/cued.
    setIsPlaying(false);
    updatePlayback({ progress: 0, duration: card.duration || 0 });
    setNowPlayingCard(card);
    setCanGoPrev(queueIndex.current > 0);
    recordPlay(card); // log to listening history (separate from queue)

    if (card.source === "youtube" && card.videoId) {
      createYTPlayer(card.videoId);
    } else {
      // No playable source — show unavailable feedback then auto-advance
      stopYTProgressPoller();
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.stopVideo(); } catch { /* ignore */ }
      }
      setSkippingUnavailable(true);
      if (skippingTimerRef.current) clearTimeout(skippingTimerRef.current);
      skippingTimerRef.current = setTimeout(() => {
        setSkippingUnavailable(false);
        handleNextTrackRef.current?.();
      }, 1500);
    }
  }, [createYTPlayer, stopYTProgressPoller]);

  // Play a random track from a view (for onboarding / first play without queue)
  const playRandomTrack = useCallback(() => {
    const view = activeViewRef.current;
    const entries = Array.from(cardRegistry.current.entries())
      .filter(([id]) => cardViewMap.current.get(id) === view);
    if (entries.length === 0) return;
    const [, card] = entries[Math.floor(Math.random() * entries.length)];
    buildQueue(card.id, true);
    handlePlayInternal(card);
  }, [handlePlayInternal, buildQueue]);

  // Prev track — walk queue index backward
  const handlePrevTrack = useCallback(() => {
    if (queueIndex.current <= 0) return;
    queueIndex.current--;
    manualAfter.current = 0; // non-linear move → drop manual-block tracking
    const id = shuffleQueue.current[queueIndex.current];
    const card = cardRegistry.current.get(id);
    if (!card) return;
    playOriginView.current = cardViewMap.current.get(id) || null;
    handlePlayInternal(card);
  }, [handlePlayInternal]);

  // Infinite refill — top up the auto-continuation tail from the ACTIVE source
  // (queueView) when it runs low, so the queue never dries out. Manual items and
  // history are untouched; only the source-based tail grows.
  const REFILL_MIN = 8;
  const maybeRefillAuto = useCallback(() => {
    const q = shuffleQueue.current;
    const autoStart = queueIndex.current + 1 + manualAfter.current;
    if (q.length - autoStart >= REFILL_MIN) return;
    const view = queueView.current || activeViewRef.current;
    const have = new Set(q);
    const fresh = Array.from(cardRegistry.current.entries())
      .filter(([id]) => cardViewMap.current.get(id) === view && !have.has(id))
      .map(([id]) => id);
    if (fresh.length > 0) {
      if (autoPlayEnabledRef.current) fisherYatesShuffle(fresh);
      q.push(...fresh);
      bumpQueue((v) => v + 1);
    }
    // Infinite queue: the active feed runs low → ask its grid to fetch the next page
    // from the API even if the user hasn't scrolled. New cards register and get
    // live-injected into this queue (guarded by the grid's loading flags + hasMore).
    // View-scoped event name so only the matching grid (home/mixes/samples) fires.
    if (view === "home" || view === "mixes" || view === "samples") {
      document.dispatchEvent(new Event(`queue-needs-more:${view}`));
    }
  }, []);

  // Next track — walk queue index forward
  const handleNextTrack = useCallback(() => {
    const queue = shuffleQueue.current;
    if (queue.length === 0) return;

    // Try to advance to next valid card
    let nextIdx = queueIndex.current + 1;
    while (nextIdx < queue.length) {
      const card = cardRegistry.current.get(queue[nextIdx]);
      if (card) {
        queueIndex.current = nextIdx;
        if (manualAfter.current > 0) manualAfter.current -= 1; // consumed a manual item
        playOriginView.current = cardViewMap.current.get(card.id) || null;
        maybeRefillAuto();
        handlePlayInternal(card);
        return;
      }
      // Card was deregistered — skip it
      nextIdx++;
    }

    // Queue exhausted — rebuild and continue
    const currentId = nowPlayingCardRef.current?.id;
    const view = queueView.current || activeViewRef.current;
    const ids = Array.from(cardRegistry.current.entries())
      .filter(([id]) => cardViewMap.current.get(id) === view && id !== currentId)
      .map(([id]) => id);
    if (ids.length === 0) return;
    if (autoPlayEnabledRef.current) fisherYatesShuffle(ids);
    shuffleQueue.current = ids;
    queueIndex.current = 0;
    queueView.current = view;
    manualAfter.current = 0;
    const card = cardRegistry.current.get(ids[0]);
    if (card) {
      playOriginView.current = cardViewMap.current.get(card.id) || null;
      handlePlayInternal(card);
    }
  }, [handlePlayInternal, maybeRefillAuto]);

  // Stable ref for handleNextTrack (used in YT callbacks)
  const handleNextTrackRef = useRef(handleNextTrack);
  // Keep the ref on the latest callback for YT auto-advance; an effect would stale it.
  // eslint-disable-next-line react-hooks/immutability
  handleNextTrackRef.current = handleNextTrack;

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.pauseVideo(); } catch { /* ignore */ }
      }
      stopYTProgressPoller();
      setPlayingId(null);
      setIsPlaying(false);
    } else if (nowPlayingCard) {
      setPlayingId(nowPlayingCard.id);
      setIsPlaying(true);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.playVideo();
          startYTProgressPoller();
        } catch { /* ignore */ }
      }
    }
  }, [isPlaying, nowPlayingCard, stopYTProgressPoller, startYTProgressPoller]);

  // ── Media Session API — OS lock-screen / hardware media-key / Bluetooth controls ──
  const handleTogglePlayRef = useRef(handleTogglePlay);
  handleTogglePlayRef.current = handleTogglePlay;
  const handlePrevTrackRef = useRef(handlePrevTrack);
  handlePrevTrackRef.current = handlePrevTrack;

  // Register action handlers once (use refs so we never churn them)
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.setActionHandler("play", () => handleTogglePlayRef.current());
    ms.setActionHandler("pause", () => handleTogglePlayRef.current());
    ms.setActionHandler("previoustrack", () => handlePrevTrackRef.current());
    ms.setActionHandler("nexttrack", () => handleNextTrackRef.current?.());
    return () => {
      ms.setActionHandler("play", null);
      ms.setActionHandler("pause", null);
      ms.setActionHandler("previoustrack", null);
      ms.setActionHandler("nexttrack", null);
    };
  }, []);

  // Metadata follows the current track (title / artist / artwork on the OS UI)
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!nowPlayingCard) {
      navigator.mediaSession.metadata = null;
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: nowPlayingCard.name,
      artist: nowPlayingCard.artist,
      album: nowPlayingCard.album || "digeart",
      artwork: nowPlayingCard.image
        ? [{ src: nowPlayingCard.image, sizes: "480x360", type: "image/jpeg" }]
        : [],
    });
  }, [nowPlayingCard]);

  // Reflect play/pause state on the OS controls
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  const handlePlay = useCallback((id: string) => {
    // If clicking the currently-playing card, toggle pause
    if (id === nowPlayingCardRef.current?.id) {
      handleTogglePlay();
      return;
    }
    const card = cardRegistry.current.get(id);
    if (!card) return;

    // Direct play from a DIFFERENT source switches the active source (rebuild).
    // Same-source card already queued → jump to it.
    const cardSource = cardViewMap.current.get(id) || activeViewRef.current;
    const existingIdx = shuffleQueue.current.indexOf(id);
    if (existingIdx !== -1 && cardSource === queueView.current) {
      queueIndex.current = existingIdx;
      manualAfter.current = 0; // deliberate jump → drop manual-block tracking
    } else {
      // New source or not in queue — build a fresh queue from this card's source
      buildQueue(id, autoPlayEnabledRef.current);
    }

    // Record which view the user played from (for locate)
    playOriginView.current = activeViewRef.current;
    handlePlayInternal(card);
  }, [handlePlayInternal, handleTogglePlay, buildQueue]);

  // Play a card directly (e.g. from History). History persists the FULL card, but a
  // reload rebuilds the pool fresh — so a past track may not be in the registry. Register
  // it first (under the active view) so it's playable even when it's no longer in the feed.
  const handlePlayCard = useCallback((card: CardData) => {
    if (!card?.id) return;
    if (!cardRegistry.current.has(card.id)) {
      cardRegistry.current.set(card.id, card);
      if (!cardViewMap.current.has(card.id)) {
        cardViewMap.current.set(card.id, activeViewRef.current);
      }
    }
    handlePlay(card.id);
  }, [handlePlay]);

  // Play a playlist as a bounded queue source. Order lives in playlistQueueIds;
  // existing feed memberships are NOT overwritten (so clicking the same card in
  // its home feed later still builds a home queue). No infinite refill — finite.
  const handlePlayPlaylist = useCallback((tracks: CardData[], startId: string) => {
    if (tracks.length === 0) return;
    for (const c of tracks) {
      cardRegistry.current.set(c.id, c);
      if (!cardViewMap.current.has(c.id)) cardViewMap.current.set(c.id, "playlist");
    }
    playlistQueueIds.current = tracks.map((t) => t.id);
    const ids = [...playlistQueueIds.current];
    if (autoPlayEnabledRef.current) {
      fisherYatesShuffle(ids);
      const i = ids.indexOf(startId);
      if (i > 0) { ids.splice(i, 1); ids.unshift(startId); }
      queueIndex.current = 0;
      setCanGoPrev(false);
    } else {
      const i = ids.indexOf(startId);
      queueIndex.current = i >= 0 ? i : 0;
      setCanGoPrev(queueIndex.current > 0);
    }
    shuffleQueue.current = ids;
    queueView.current = "playlist";
    manualAfter.current = 0;
    const startCard = cardRegistry.current.get(startId);
    if (startCard) handlePlayInternal(startCard);
  }, [handlePlayInternal]);

  // Track the last click point so the add-to-playlist popup opens there (anchored,
  // like the queue ⋮ menu) instead of dead-center. Capture phase = fires before
  // the trigger's own click handler.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("button, [role='button']") as HTMLElement | null;
      lastPointerRef.current = { x: e.clientX, y: e.clientY, el: el ?? null };
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, []);

  const handleOpenAddToPlaylist = useCallback((id: string) => {
    const card = cardRegistry.current.get(id);
    if (card) { setAddToPlaylistAnchor(lastPointerRef.current); setAddToPlaylistCard(card); }
  }, []);

  const shareCardGlobal = useCallback(async (card: CardData) => {
    const url = card.youtubeUrl || "";
    if (navigator.share) {
      try { await navigator.share({ title: `${card.name} — ${card.artist}`, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }, []);

  // Play Next — insert this track right after the currently-playing one.
  const handlePlayNext = useCallback((id: string) => {
    const card = cardRegistry.current.get(id);
    if (!card) return;
    const q = shuffleQueue.current;
    // Nothing playing yet → just start it
    if (!nowPlayingCardRef.current || queueIndex.current < 0 || q.length === 0) {
      handlePlay(id);
      return;
    }
    // De-dupe: drop any existing occurrence, adjusting queueIndex / manual count,
    // then insert immediately after the current track (front of the manual block).
    const existing = q.indexOf(id);
    if (existing !== -1) {
      if (existing > queueIndex.current && existing <= queueIndex.current + manualAfter.current) manualAfter.current -= 1;
      q.splice(existing, 1);
      if (existing <= queueIndex.current) queueIndex.current -= 1;
    }
    q.splice(queueIndex.current + 1, 0, id);
    manualAfter.current += 1;
    bumpQueue((v) => v + 1);
  }, [handlePlay]);

  // Add to Queue — append this track to the END of the queue.
  const handleAddToQueue = useCallback((id: string) => {
    const card = cardRegistry.current.get(id);
    if (!card) return;
    const q = shuffleQueue.current;
    // Nothing playing yet → just start it
    if (!nowPlayingCardRef.current || queueIndex.current < 0 || q.length === 0) {
      handlePlay(id);
      return;
    }
    const existing = q.indexOf(id);
    if (existing === queueIndex.current) return; // already the current track
    if (existing !== -1) {
      if (existing > queueIndex.current && existing <= queueIndex.current + manualAfter.current) manualAfter.current -= 1;
      q.splice(existing, 1);
      if (existing < queueIndex.current) queueIndex.current -= 1;
    }
    // Insert after the existing manual block, before the auto-continuation tail.
    q.splice(queueIndex.current + 1 + manualAfter.current, 0, id);
    manualAfter.current += 1;
    bumpQueue((v) => v + 1);
  }, [handlePlay]);

  // Remove a track from the queue by index. Handles removing the current track
  // (advances to whatever now sits at that slot) and keeps queueIndex correct.
  const handleRemoveFromQueue = useCallback((index: number) => {
    const q = shuffleQueue.current;
    if (index < 0 || index >= q.length) return;
    const isCurrent = index === queueIndex.current;
    if (index > queueIndex.current && index <= queueIndex.current + manualAfter.current) manualAfter.current -= 1;
    q.splice(index, 1);
    if (index < queueIndex.current) {
      queueIndex.current -= 1;
    } else if (isCurrent) {
      // Removed the playing track — play whatever shifted into this slot
      // (the former "next"); if it was the last item, step back one.
      if (queueIndex.current >= q.length) queueIndex.current = q.length - 1;
      const id = q[queueIndex.current];
      const card = id ? cardRegistry.current.get(id) : null;
      if (card) {
        playOriginView.current = cardViewMap.current.get(card.id) || null;
        handlePlayInternal(card);
      }
    }
    setCanGoPrev(queueIndex.current > 0);
    bumpQueue((v) => v + 1);
  }, [handlePlayInternal]);

  // Drag-reorder the up-next list. Only the upcoming slice (after current) is reorderable;
  // history + current stay put. The manual/auto split is dropped (a hand-reorder overrides it).
  const handleReorderUpcoming = useCallback((newUpcoming: string[]) => {
    const q = shuffleQueue.current;
    const head = q.slice(0, queueIndex.current + 1); // previously-played + current
    shuffleQueue.current = [...head, ...newUpcoming];
    manualAfter.current = 0;
    bumpQueue((v) => v + 1);
  }, []);

  // Stable ref for handlePlay — used by shared-link auto-play
  const handlePlayRef = useRef(handlePlay);
  // Keep the ref on the latest callback for shared-link auto-play; effect would stale it.
  // eslint-disable-next-line react-hooks/immutability
  handlePlayRef.current = handlePlay;

  // Commit all pending unlikes (soft-deletes stay, just dismiss toasts)
  const commitPendingUnlike = useCallback(() => {
    for (const [, pending] of pendingUnlikes.current) {
      clearTimeout(pending.timer);
    }
    pendingUnlikes.current.clear();
    setUndoItems([]);
  }, []);

  // Undo handler — restore a specific soft-deleted like
  const handleUndoUnlike = useCallback((item: import("@/components/UndoToast").UndoItem) => {
    const pending = pendingUnlikes.current.get(item.trackId);
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingUnlikes.current.delete(item.trackId);
    setUndoItems((prev) => prev.filter((i) => i.id !== item.id));

    // Restore in UI — card is still in grid, just remove from softDeletedIds
    setUndoRestoredId(item.trackId);
    setTimeout(() => setUndoRestoredId(null), 100);
    setLikedIds((prev) => new Set(prev).add(item.trackId));
    setSoftDeletedIds((prev) => {
      const next = new Set(prev);
      next.delete(item.trackId);
      return next;
    });

    // Clear deleted_at in Supabase (restore the row)
    if (session?.user?.email) {
      likeAction("restore", { videoId: item.trackId })
        .then((res) => { if (!res.ok) console.error("Failed to restore like:", res.status); });
    }
  }, [session?.user?.email]);

  // Restore a card from recently removed back to saved
  const handleRestoreRemoved = useCallback((id: string) => {
    const item = recentlyRemoved.find((c) => c.id === id);
    if (!item) return;
    // Move back to savedCards + likedIds
    const { deletedAt: _, ...card } = item;
    setUndoRestoredId(id);
    setTimeout(() => setUndoRestoredId(null), 100);
    setRecentlyRemoved((prev) => prev.filter((c) => c.id !== id));
    setSavedCards((prev) => [card, ...prev]);
    setLikedIds((prev) => new Set(prev).add(id));
    // Clear deleted_at in Supabase
    if (session?.user?.email) {
      likeAction("restore", { videoId: id })
        .then((res) => { if (!res.ok) console.error("Failed to restore like:", res.status); });
    }
  }, [recentlyRemoved, session?.user?.email]);

  // Hard delete — permanently remove from DB
  const handleHardDelete = useCallback((id: string) => {
    setRecentlyRemoved((prev) => prev.filter((c) => c.id !== id));
    if (session?.user?.email) {
      likeAction("hardDelete", { videoId: id })
        .then((res) => { if (!res.ok) console.error("Failed to hard-delete like:", res.status); });
    }
  }, [session?.user?.email]);

  // Clear all recently removed
  const handleClearAllRemoved = useCallback(() => {
    setRecentlyRemoved([]);
    if (session?.user?.email) {
      likeAction("clearRemoved")
        .then((res) => { if (!res.ok) console.error("Failed to clear removed:", res.status); });
    }
  }, [session?.user?.email]);

  const toggleLike = useCallback((id: string) => {
    const wasLiked = likedIds.has(id);
    const wasSoftDeleted = softDeletedIds.has(id);
    const card = cardRegistry.current.get(id)
      || savedCards.find((c) => c.id === id);

    // Optimistic local update
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(id);
      else next.add(id);
      return next;
    });

    if (wasLiked) {
      // Card stays in grid — just add to softDeletedIds
      setSoftDeletedIds((prev) => new Set(prev).add(id));
    } else {
      // Re-liking a grace-period card — remove from softDeletedIds + cancel pending timer
      if (wasSoftDeleted) {
        setSoftDeletedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        const pending = pendingUnlikes.current.get(id);
        if (pending) {
          clearTimeout(pending.timer);
          pendingUnlikes.current.delete(id);
          setUndoItems((prev) => prev.filter((i) => i.trackId !== id));
        }
      } else if (card) {
        // Fresh like — prepend to savedCards
        setSavedCards((prev) => [card, ...prev]);
      }
    }

    // Background Supabase sync
    const email = session?.user?.email;
    if (!email || !card) return;

    if (wasLiked) {
      // Soft-delete: set deleted_at instead of DELETE
      likeAction("unlike", { videoId: id })
        .then((res) => { if (!res.ok) console.error("Failed to soft-delete like:", res.status); });

      // Show undo toast with 5s window — after expiry, move card to recently removed
      const deletedAt = new Date().toISOString();
      const undoId = Date.now();
      const now = performance.now();
      const timer = setTimeout(() => {
        if (!pendingUnlikes.current.has(id)) return;
        pendingUnlikes.current.delete(id);
        setUndoItems((prev) => prev.filter((i) => i.id !== undoId));
        // Move from main grid to recently removed
        setSavedCards((prev) => prev.filter((c) => c.id !== id));
        setSoftDeletedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        if (card) setRecentlyRemoved((prev) => [{ ...card, deletedAt }, ...prev]);
      }, 5000);
      pendingUnlikes.current.set(id, { undoId, card, timer });
      setUndoItems((prev) => [...prev, { id: undoId, trackId: id, trackName: card.name || "Track", createdAt: now }]);
    } else {
      // Liking — upsert with deleted_at cleared (handles re-liking a soft-deleted row)
      likeAction("save", { videoId: id, cardData: stripCardForStorage(card) })
        .then((res) => { if (!res.ok) console.error("Failed to upsert like:", res.status); });
    }
  }, [likedIds, softDeletedIds, session?.user?.email, commitPendingUnlike, savedCards]);


  const handleViewChange = useCallback((view: ViewType) => {
    scrollPositions.current[activeView] = window.scrollY;
    setActiveView(view);
    setMountedTabs((prev) => {
      if (prev.has(view)) return prev;
      const next = new Set(prev);
      next.add(view);
      return next;
    });
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositions.current[view] || 0);
    });
  }, [activeView]);

  // Seek — uses YT.Player.seekTo() directly
  const handleSeek = useCallback((seconds: number) => {
    if (ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(seconds, true);
      updatePlayback({ progress: seconds });
    }
  }, []);

  // Volume control — throttled setState to avoid full page re-render on every pixel
  const volumeThrottleRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleVolumeChange = useCallback((newVolume: number) => {
    volumeRef.current = newVolume;
    if (ytPlayerRef.current) {
      try { ytPlayerRef.current.setVolume(newVolume); } catch { /* ignore */ }
    }
    if (newVolume > 0 && isMutedRef.current) {
      isMutedRef.current = false;
      setIsMuted(false);
      localStorage.setItem("digeart-muted", "0");
      if (ytPlayerRef.current) try { ytPlayerRef.current.unMute(); } catch { /* ignore */ }
    }
    if (newVolume === 0 && !isMutedRef.current) {
      isMutedRef.current = true;
      setIsMuted(true);
      localStorage.setItem("digeart-muted", "1");
      if (ytPlayerRef.current) try { ytPlayerRef.current.mute(); } catch { /* ignore */ }
    }
    // Throttled state + localStorage update (every 50ms instead of every pixel)
    if (!volumeThrottleRef.current) {
      volumeThrottleRef.current = setTimeout(() => {
        setVolume(volumeRef.current);
        localStorage.setItem("digeart-volume", String(volumeRef.current));
        volumeThrottleRef.current = undefined;
      }, 50);
    }
  }, []);

  // Commit volume immediately — called on drag end
  const handleVolumeCommit = useCallback((newVolume: number) => {
    if (volumeThrottleRef.current) { clearTimeout(volumeThrottleRef.current); volumeThrottleRef.current = undefined; }
    setVolume(newVolume);
    localStorage.setItem("digeart-volume", String(newVolume));
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("digeart-muted", next ? "1" : "0");
      if (ytPlayerRef.current) {
        try {
          if (next) ytPlayerRef.current.mute();
          else ytPlayerRef.current.unMute();
        } catch { /* ignore */ }
      }
      // Unmuting from 0 → restore to 50%
      if (!next && volume === 0) {
        const restored = 50;
        setVolume(restored);
        localStorage.setItem("digeart-volume", String(restored));
        if (ytPlayerRef.current) try { ytPlayerRef.current.setVolume(restored); } catch { /* ignore */ }
      }
      return next;
    });
  }, [volume]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    const clamped = Math.round(Math.max(0.88, Math.min(1.12, rate)) * 100) / 100;
    playbackRateRef.current = clamped;
    setPlaybackRate(clamped);
    if (ytPlayerRef.current) try { ytPlayerRef.current.setPlaybackRate(clamped); } catch { /* ignore */ }
  }, []);

  const handleDjModeToggle = useCallback(() => {
    setDjMode((prev) => {
      const next = !prev;
      localStorage.setItem("digeart-dj-mode", next ? "1" : "");
      if (!next) {
        // Reset speed when turning off
        playbackRateRef.current = 1;
        setPlaybackRate(1);
        if (ytPlayerRef.current) try { ytPlayerRef.current.setPlaybackRate(1); } catch { /* ignore */ }
      }
      return next;
    });
  }, []);

  const handlePlayQueueIndex = useCallback((index: number) => {
    const id = shuffleQueue.current[index];
    const card = cardRegistry.current.get(id);
    if (!card) return;
    queueIndex.current = index;
    manualAfter.current = 0; // deliberate jump → drop manual-block tracking
    playOriginView.current = cardViewMap.current.get(id) || null;
    maybeRefillAuto();
    handlePlayInternal(card);
  }, [handlePlayInternal, maybeRefillAuto]);

  const handleToggleAutoPlay = useCallback(() => {
    setAutoPlayEnabled((prev) => {
      const next = !prev;
      const currentIdx = queueIndex.current;
      const queue = shuffleQueue.current;

      if (currentIdx >= 0 && queue.length > 0) {
        const curId = queue[currentIdx];
        if (next) {
          // Shuffle on → keep ONLY the current track, shuffle the WHOLE pool for the
          // view after it (incl. first-page tracks). Excluding everything-before-index
          // wrongly skipped early tracks whenever you'd jumped deep into the feed.
          const view = queueView.current || activeViewRef.current;
          const upcoming = getOrderedIds(view).filter((id) => id !== curId);
          fisherYatesShuffle(upcoming);
          shuffleQueue.current = [curId, ...upcoming];
          queueIndex.current = 0;
          setCanGoPrev(false);
        } else {
          // Shuffle off → rebuild the linear feed order, positioned AT the current
          // track, so Next continues forward (no jumping back to the top).
          const view = queueView.current || activeViewRef.current;
          const ordered = getOrderedIds(view);
          const curPos = ordered.indexOf(curId);
          shuffleQueue.current = ordered;
          queueIndex.current = curPos >= 0 ? curPos : 0;
          setCanGoPrev(queueIndex.current > 0);
        }
        manualAfter.current = 0;
      }

      return next;
    });
  }, [getOrderedIds]);

  // ── Keyboard shortcuts ──
  // Use e.code for letter/digit keys (physical position) so shortcuts work
  // regardless of keyboard layout (Cyrillic, Japanese, German, French, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.isComposing || e.keyCode === 229) return; // IME active (Japanese/Chinese/Korean)

      // Letter keys by physical position (layout-independent)
      if (e.code.startsWith("Key")) {
        const letter = e.code.slice(3).toLowerCase();
        switch (letter) {
          case "k":
            e.preventDefault();
            if (nowPlayingCard) handleTogglePlay();
            return;
          case "n":
            if (nowPlayingCard) handleNextTrack();
            return;
          case "p":
            if (nowPlayingCard && canGoPrev) handlePrevTrack();
            return;
          case "s":
            if (nowPlayingCard) handleToggleAutoPlay();
            return;
          case "m":
            if (nowPlayingCard) handleToggleMute();
            return;
          case "l":
            if (nowPlayingCard) document.dispatchEvent(new Event("heart-like-keybind"));
            return;
          case "f":
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              document.documentElement.requestFullscreen();
            }
            return;
          case "q":
            if (nowPlayingCard) setShowQueue((v) => !v);
            return;
          case "i":
            if (nowPlayingCard) document.dispatchEvent(new Event("info-toggle-keybind"));
            return;
          case "a":
            document.dispatchEvent(new Event("open-about-keybind"));
            return;
        }
      }

      // Digit keys (1-4) — physical position
      if (e.code.startsWith("Digit")) {
        const digit = e.code.slice(5);
        switch (digit) {
          case "1": handleViewChange("home"); return;
          case "2": handleViewChange("mixes"); return;
          case "3": handleViewChange("samples"); return;
          case "4": handleViewChange("saved"); return;
        }
      }

      // Special keys by e.key (Space/Arrows/Symbols stay identical across layouts)
      switch (e.key) {
        case " ":
          e.preventDefault();
          if (nowPlayingCard) handleTogglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          if (nowPlayingCard) handleNextTrack();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (nowPlayingCard && canGoPrev) handlePrevTrack();
          break;
        case "?":
          document.dispatchEvent(new Event("open-shortcuts-keybind"));
          break;
        case ",":
          document.dispatchEvent(new Event("open-settings-keybind"));
          break;
        case "+":
        case "=":
          if (nowPlayingCard) handleVolumeChange(Math.min(100, volume + 5));
          break;
        case "-":
          if (nowPlayingCard) handleVolumeChange(Math.max(0, volume - 5));
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nowPlayingCard, handleTogglePlay, handleNextTrack, handlePrevTrack, handleToggleAutoPlay, canGoPrev, handleToggleMute, handleViewChange, volume, handleVolumeChange, toggleLike]);

  const hasPlayer = !!nowPlayingCard;

  return (
    <main
      className="layout-shift min-h-screen bg-[var(--bg-content)] min-[1152px]:ml-[var(--sidebar-width)]"
      data-player={hasPlayer ? "true" : "false"}
    >
      {/* Hidden YT Player container */}
      <div
        ref={ytContainerRef}
        className="fixed w-px h-px opacity-0 pointer-events-none"
        style={{ top: 0, left: 0 }}
      />

      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        activeGenre={activeGenre}
        onGenreChange={setActiveGenre}
        activeTagFilters={activeTagFilters}
        onTagFiltersChange={setActiveTagFilters}
        activeGenreLabels={activeGenreLabels}
        onGenreLabelsChange={setActiveGenreLabels}
        showAbout={showAbout}
        onSetAbout={setShowAbout}
        onRunTutorial={() => { setShowAbout(false); setShowQueue(false); setShowOnboarding(true); }}
        djMode={djMode}
        onToggleDjMode={isAuthenticated ? handleDjModeToggle : undefined}
      />

      <div style={{ display: activeView === "home" ? undefined : "none" }}>
        <DiscoverGrid
          savedIds={likedIds}
          likedIds={likedIds}
          playingId={playingId}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onPlayNext={handlePlayNext}
          onAddToQueue={handleAddToQueue}
          onAddToPlaylist={handleOpenAddToPlaylist}
          onToggleSave={toggleLike}
          onToggleLike={toggleLike}
          activeGenre={activeGenre}
          activeTagFilters={activeTagFilters}
          activeGenreLabels={activeGenreLabels}
          onCardsLoaded={registerHomeCards}
          isAuthenticated={isAuthenticated}
        />
      </div>

      <div style={{ display: activeView === "mixes" ? undefined : "none" }}>
        {mountedTabs.has("mixes") && (
          <MixesGrid
            savedIds={likedIds}
            likedIds={likedIds}
            playingId={playingId}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPlayNext={handlePlayNext}
          onAddToQueue={handleAddToQueue}
            onAddToPlaylist={handleOpenAddToPlaylist}
            onToggleSave={toggleLike}
            onToggleLike={toggleLike}
            activeTagFilters={activeTagFilters}
            activeGenreLabels={activeGenreLabels}
            onCardsLoaded={registerMixesCards}
            isAuthenticated={isAuthenticated}
          />
        )}
      </div>

      <div style={{ display: activeView === "samples" ? undefined : "none" }}>
        {mountedTabs.has("samples") && (
          <SamplesGrid
            savedIds={likedIds}
            likedIds={likedIds}
            playingId={playingId}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPlayNext={handlePlayNext}
          onAddToQueue={handleAddToQueue}
            onAddToPlaylist={handleOpenAddToPlaylist}
            onToggleSave={toggleLike}
            onToggleLike={toggleLike}
            activeTagFilters={activeTagFilters}
            activeGenreLabels={activeGenreLabels}
            onCardsLoaded={registerSamplesCards}
            isAuthenticated={isAuthenticated}
          />
        )}
      </div>

      <div style={{ display: activeView === "saved" ? undefined : "none" }}>
        <SavedSection
          cards={savedCards}
          loading={savedLoading}
          likedIds={likedIds}
          softDeletedIds={softDeletedIds}
          playingId={playingId}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onPlayNext={handlePlayNext}
          onAddToQueue={handleAddToQueue}
          onAddToPlaylist={handleOpenAddToPlaylist}
          onToggleLike={toggleLike}
          activeTagFilters={activeTagFilters}
          isAuthenticated={isAuthenticated}
          onCardsLoaded={registerSavedCards}
          recentlyRemoved={recentlyRemoved}
          onRestoreRemoved={handleRestoreRemoved}
          onHardDelete={handleHardDelete}
          onClearAllRemoved={handleClearAllRemoved}
          onFilterChange={(f) => { savedFilterRef.current = f; }}
          playlists={playlistsApi.playlists}
          createPlaylist={playlistsApi.create}
          renamePlaylist={playlistsApi.rename}
          deletePlaylist={playlistsApi.remove}
          removeTrackFromPlaylist={playlistsApi.removeTrack}
          onPlayPlaylist={handlePlayPlaylist}
          onShareCard={shareCardGlobal}
        />
      </div>

      <UndoToast items={undoItems} onUndo={handleUndoUnlike} playerVisible={!!nowPlayingCard} />
      <LinkCopiedToast playerVisible={!!nowPlayingCard} />


      <AnimatePresence>
        {nowPlayingCard && (
          <NowPlayingBanner
            key="player"
            card={nowPlayingCard}
            isPlaying={isPlaying}
            isUnavailable={skippingUnavailable}
            onTogglePlay={handleTogglePlay}
            onPrevTrack={handlePrevTrack}
            onNextTrack={handleNextTrack}
            hasPrev={canGoPrev}
            onSeek={handleSeek}
            autoPlay={autoPlayEnabled}
            onToggleAutoPlay={handleToggleAutoPlay}
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={handleVolumeChange}
            onVolumeCommit={handleVolumeCommit}
            onToggleMute={handleToggleMute}
            isLiked={likedIds.has(nowPlayingCard.id)}
            onToggleLike={() => toggleLike(nowPlayingCard.id)}
            onAddToPlaylist={() => handleOpenAddToPlaylist(nowPlayingCard.id)}
            isAuthenticated={isAuthenticated}
            showQueue={showQueue}
            onToggleQueue={() => setShowQueue((v) => !v)}
            undoRestoredId={undoRestoredId}
            djMode={djMode}
            playbackRate={playbackRate}
            onPlaybackRateChange={handlePlaybackRateChange}
          />
        )}
      </AnimatePresence>

      <QueuePanel
        isOpen={showQueue}
        onClose={() => setShowQueue(false)}
        queue={shuffleQueue.current}
        currentIndex={queueIndex.current}
        cardRegistry={cardRegistry.current}
        onPlayIndex={handlePlayQueueIndex}
        onPlayTrack={handlePlayCard}
        onRemove={handleRemoveFromQueue}
        onReorderUpcoming={handleReorderUpcoming}
        likedIds={likedIds}
        onToggleLike={toggleLike}
        onPlayNext={handlePlayNext}
        onAddToQueue={handleAddToQueue}
        onAddToPlaylist={handleOpenAddToPlaylist}
      />

      <AddToPlaylistMenu
        card={addToPlaylistCard}
        anchor={addToPlaylistAnchor}
        playlists={playlistsApi.playlists}
        onAdd={playlistsApi.addTrack}
        onCreate={playlistsApi.create}
        onClose={() => setAddToPlaylistCard(null)}
      />

      <WelcomeScreen show={showWelcome} onDismiss={handleWelcomeDismiss} />
      <OnboardingOverlay show={showOnboarding} onComplete={handleOnboardingComplete} onPlayRandom={playRandomTrack} />
    </main>
  );
}
