"use client";

import { useState, useEffect, useRef, useMemo, useCallback, Fragment, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SettingsPanel from "./SettingsPanel";
import AuthButton from "./AuthButton";
import { useTranslation } from "./LanguageProvider";
import { TAGS, type TagId } from "@/lib/tags";

const SEARCH_PHRASES = [
  "House...",
  "Deep House...",
  "Tech House...",
  "Techno...",
  "Minimal...",
  "Rominimal...",
  "Electro...",
  "Breaks...",
  "DnB...",
  "Jungle...",
  "UKG...",
  "Ambient...",
  "Downtempo...",
  "Dub...",
  "Disco...",
  "Funk...",
  "Acid...",
  "Trance...",
  "Industrial...",
  "EBM...",
  "Hip Hop...",
  "Jazz...",
  "Reggae...",
  "Experimental...",
];

// Ticker phrases — English only by design (do NOT translate).
const BANNER_PHRASES = [
  "DIGEART — MUSIC FROM THE UNDERGROUND",
  "HUMAN CURATED",
  "FOR REAL DIGGERS",
];

const SEPARATOR_ICONS = ["✦", "◇", "⬥", "✧", "◆", "⏣", "✦"];

// One pass of all phrases joined with separators.
const BANNER_SINGLE = BANNER_PHRASES.map((phrase, i) => {
  const icon = SEPARATOR_ICONS[i % SEPARATOR_ICONS.length];
  return `${phrase}     ${icon}     `;
}).join("");
// One BANNER_SINGLE pass; the component repeats it to a measured count (bannerReps) so one
// copy always exceeds the viewport width — keeps the 2-copy loop seamless with no empty gap.

const GENRE_PRESETS = [
  { label: "All", genres: ["electronic", "house", "techno"] },
  { label: "House", genres: ["house", "deep-house"] },
  { label: "Techno", genres: ["techno", "minimal-techno"] },
  { label: "Electro", genres: ["electro", "detroit-techno"] },
  { label: "Breaks", genres: ["breakbeat", "drum-and-bass"] },
  { label: "Ambient", genres: ["ambient", "idm"] },
  { label: "Dub", genres: ["dub", "dub-techno"] },
  { label: "Disco", genres: ["disco", "funk"] },
];

// "playlist" is a queue-source sentinel only (playing a playlist) — never a nav item.
export type ViewType = "home" | "samples" | "mixes" | "saved" | "playlist";

interface NavItem {
  key: ViewType;
  label: string;
  icon: (active: boolean) => ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: "home",
    label: "For You",
    icon: (active) => (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2}>
        {active ? (
          <path d="M12 2.1L1 12h3v9h7v-6h2v6h7v-9h3L12 2.1z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        )}
      </svg>
    ),
  },
  {
    key: "mixes",
    label: "Mixes",
    icon: (active) => (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <line x1="4" y1="10" x2="4" y2="14" />
          <line x1="8" y1="6" x2="8" y2="18" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="16" y1="8" x2="16" y2="16" />
          <line x1="20" y1="7" x2="20" y2="17" />
        </svg>
      ),
  },
  {
    key: "samples",
    label: "Samples",
    icon: (active) =>
      active ? (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd"
            d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 8a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
      ) : (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
  },
  {
    key: "saved",
    label: "Saved",
    icon: (active) => (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} strokeWidth={2}>
        {active ? (
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        )}
      </svg>
    ),
  },
];

export type TagFilter = "all" | TagId;

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  activeGenre: number;
  onGenreChange: (index: number) => void;
  activeTagFilters: string[];
  onTagFiltersChange: (tags: string[]) => void;
  activeGenreLabels: string[];
  onGenreLabelsChange: (labels: string[]) => void;
  onSearchChange?: (q: string) => void;
  showAbout?: boolean;
  onSetAbout?: (show: boolean) => void;
  onRunTutorial?: () => void;
  djMode?: boolean;
  onToggleDjMode?: () => void;
}

export { GENRE_PRESETS };

function randomPhraseIndex(current: number): number {
  let next: number;
  do {
    next = Math.floor(Math.random() * SEARCH_PHRASES.length);
  } while (next === current && SEARCH_PHRASES.length > 1);
  return next;
}

// Gear icon SVG — active=true renders a filled gear with bg-color hole (matches Heart fill-on-active pattern)
const GearIcon = ({ className, active = false }: { className?: string; active?: boolean }) => (
  <svg
    className={className || "w-5 h-5"}
    viewBox="0 0 24 24"
    fill={active ? "currentColor" : "none"}
    stroke={active ? "none" : "currentColor"}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
    <circle cx="12" cy="12" r="3" fill={active ? "var(--bg)" : "none"} stroke={active ? "none" : "currentColor"} />
  </svg>
);

export default function Sidebar({
  activeView,
  onViewChange,
  onTagFiltersChange,
  onSearchChange,
  showAbout: showAboutProp,
  onSetAbout,
  onRunTutorial,
  djMode,
  onToggleDjMode,
}: SidebarProps) {
  const { t } = useTranslation();
  const [placeholder, setPlaceholder] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showAboutLocal, setShowAboutLocal] = useState(false);
  const showAbout = showAboutProp !== undefined ? showAboutProp : showAboutLocal;
  const setShowAbout = onSetAbout ?? setShowAboutLocal;
  const [aboutSource, setAboutSource] = useState<"dropdown" | "gear">("dropdown");
  const [gearAnchor, setGearAnchor] = useState<{ left: number; bottom: string } | null>(null);
  const [settingsAnchor, setSettingsAnchor] = useState<DOMRect | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const gearRef = useRef<HTMLButtonElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const aboutIconRef = useRef<HTMLButtonElement>(null);
  const mobileSheetRef = useRef<HTMLDivElement>(null);
  const aboutIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [aboutAnchor, setAboutAnchor] = useState<DOMRect | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [shortcutsAnchor, setShortcutsAnchor] = useState<{ left: number; bottom: string } | null>(null);
  const shortcutsRef = useRef<HTMLDivElement>(null);
  // Short-height nav collapse (active icon + flyout)
  const [navFlyoutOpen, setNavFlyoutOpen] = useState(false);
  const navFlyoutRef = useRef<HTMLDivElement>(null);
  // Drive the 4→1 collapse from JS so the swap can animate (CSS display can't tween)
  const [isShortNav, setIsShortNav] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-height: 520px)");
    const apply = () => { setIsShortNav(mq.matches); setNavFlyoutOpen(false); };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  // Collapsed-nav active icon = single directional cube flip (+1 down the list, -1 up)
  const navActiveIdx = NAV_ITEMS.findIndex((n) => n.key === activeView);
  // Cube-flip direction is set at click time (+1 down the list, -1 up)
  const [navFlipDir, setNavFlipDir] = useState(1);
  const navFlipVariants = {
    enter: (d: number) => ({ rotateX: 80 * d, opacity: 0 }),
    center: { rotateX: 0, opacity: 1 },
    exit: (d: number) => ({ rotateX: -80 * d, opacity: 0 }),
  };
  const [initialPhrase] = useState(() => Math.floor(Math.random() * SEARCH_PHRASES.length));
  const phraseIndex = useRef(initialPhrase);
  const charIndex = useRef(0);
  const isDeleting = useRef(false);
  const typingPaused = useRef(false);

  // Ticker marquee — driven by a manual rAF loop (NOT CSS animation, NOT WAAPI).
  // We advance an offset in px each frame scaled by a 0..1 speed, and wrap at half
  // the track width (the two halves are identical, so the wrap is invisible). This
  // is fully deterministic: it cannot "restart" on hover the way CSS/WAAPI did.
  const tickerRef = useRef<HTMLDivElement>(null);
  const tickerSpeedRef = useRef(1);            // current speed 0..1, read by the loop
  const tickerRampRafRef = useRef<number | null>(null); // brake/resume ramp handle
  const tickerHalfRef = useRef(0); // cached half-track width; measured once (NOT per frame — reading scrollWidth every frame forces a layout reflow that stutters during card loads)
  // Banner copy width is measured so one copy always >= viewport (seamless, no empty gap).
  const [bannerReps, setBannerReps] = useState(4);
  const bannerText = useMemo(() => BANNER_SINGLE.repeat(bannerReps), [bannerReps]);

  useEffect(() => {
    const el = tickerRef.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = 0;
    let offset = 0;
    const SECONDS_PER_HALF = 80; // full-speed time to scroll one half-width
    const loop = (ts: number) => {
      if (!last) last = ts;
      const dt = (ts - last) / 1000;
      last = ts;
      const half = tickerHalfRef.current; // cached — no per-frame reflow
      if (half > 0) {
        offset += dt * (half / SECONDS_PER_HALF) * tickerSpeedRef.current;
        if (offset >= half) offset -= half;
        el.style.transform = `translateX(${-offset}px) translateZ(0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Size one banner copy to >= viewport width so the 2-copy marquee never shows an empty gap
  // on wide screens. Re-measure on resize and after the banner font loads.
  useEffect(() => {
    const measure = () => {
      const el = tickerRef.current;
      if (!el) return;
      const oneCopy = el.scrollWidth / 2;        // width of one BANNER_SINGLE.repeat(bannerReps)
      tickerHalfRef.current = oneCopy;           // feed the marquee loop (so it never reads scrollWidth itself)
      const singleWidth = oneCopy / bannerReps;  // width of a single BANNER_SINGLE pass
      if (singleWidth <= 0) return;
      const needed = Math.max(4, Math.ceil(window.innerWidth / singleWidth) + 1);
      if (needed !== bannerReps) setBannerReps(needed);
    };
    measure();
    window.addEventListener("resize", measure);
    let cancelled = false;
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => { if (!cancelled) measure(); });
    }
    return () => { cancelled = true; window.removeEventListener("resize", measure); };
  }, [bannerReps]);

  // Hover-brake: ease the speed 1↔0. Slower to brake (~0.9s), even slower to resume (~1.4s).
  const rampTicker = useCallback((to: number) => {
    if (tickerRampRafRef.current) cancelAnimationFrame(tickerRampRafRef.current);
    const from = tickerSpeedRef.current;
    if (from === to) return;
    const duration = to === 0 ? 900 : 1400;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - p, 2); // ease-out
      tickerSpeedRef.current = from + (to - from) * eased;
      if (p < 1) tickerRampRafRef.current = requestAnimationFrame(step);
      else tickerRampRafRef.current = null;
    };
    tickerRampRafRef.current = requestAnimationFrame(step);
  }, []);
  useEffect(() => () => { if (tickerRampRafRef.current) cancelAnimationFrame(tickerRampRafRef.current); }, []);

  // Lock body scroll when mobile about sheet is open
  useEffect(() => {
    if (showAbout && typeof window !== "undefined" && window.innerWidth < 1152) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [showAbout]);

  // Close panels on resize to avoid positioning bugs
  useEffect(() => {
    const onResize = () => { setShowAbout(false); setSettingsOpen(false); setShowShortcuts(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Settings keybind (",") — toggle the settings panel, anchored to the gear icon
  useEffect(() => {
    const handler = () => {
      setSettingsOpen((open) => {
        if (open) return false;
        const el = gearRef.current ?? document.querySelector("[data-auth-desktop]") ?? document.querySelector("[data-auth-button]");
        setSettingsAnchor(el?.getBoundingClientRect() ?? null);
        setShowAbout(false);
        return true;
      });
    };
    document.addEventListener("open-settings-keybind", handler);
    return () => document.removeEventListener("open-settings-keybind", handler);
  }, []);

  // About keybind ("A") — toggle the About panel, anchored to the book icon
  useEffect(() => {
    const handler = () => {
      if (showAbout) { setShowAbout(false); return; }
      const rect = aboutIconRef.current?.getBoundingClientRect();
      if (rect) {
        const playerEl = document.querySelector(".player-banner");
        const bottomPx = playerEl ? playerEl.getBoundingClientRect().height + 16 : 16;
        setGearAnchor({ left: rect.right + 18, bottom: `${bottomPx}px` });
      }
      setAboutSource("gear");
      setShowShortcuts(false);
      setSettingsOpen(false);
      setShowAbout(true);
    };
    document.addEventListener("open-about-keybind", handler);
    return () => document.removeEventListener("open-about-keybind", handler);
  }, [showAbout, setShowAbout]);

  // Close the short-height nav flyout on outside click / Escape
  useEffect(() => {
    if (!navFlyoutOpen) return;
    const onDown = (e: MouseEvent) => {
      if (navFlyoutRef.current?.contains(e.target as Node)) return;
      setNavFlyoutOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setNavFlyoutOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [navFlyoutOpen]);

  // Shortcuts keybind ("?") — toggle the shortcuts popover, anchored to the book icon
  useEffect(() => {
    const handler = () => {
      setShowShortcuts((open) => {
        if (open) return false;
        const rect = aboutIconRef.current?.getBoundingClientRect();
        if (rect) {
          const playerEl = document.querySelector(".player-banner");
          const bottomPx = playerEl ? playerEl.getBoundingClientRect().height + 16 : 16;
          setShortcutsAnchor({ left: rect.right + 18, bottom: `${bottomPx}px` });
        }
        setShowAbout(false);
        setSettingsOpen(false);
        return true;
      });
    };
    document.addEventListener("open-shortcuts-keybind", handler);
    return () => document.removeEventListener("open-shortcuts-keybind", handler);
  }, []);

  // Close Shortcuts on outside click or Escape
  useEffect(() => {
    if (!showShortcuts) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (shortcutsRef.current?.contains(target)) return;
      setShowShortcuts(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowShortcuts(false);
    };
    const timer = setTimeout(() => {
      window.addEventListener("mousedown", handleClick);
      window.addEventListener("keydown", handleKey);
    }, 100);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [showShortcuts]);

  // Close About on outside click or Escape
  useEffect(() => {
    if (!showAbout) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (aboutRef.current?.contains(target)) return;
      if (mobileSheetRef.current?.contains(target)) return;
      if (aboutIconRef.current?.contains(target)) return;
      setShowAbout(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAbout(false);
    };
    const timer = setTimeout(() => {
      window.addEventListener("mousedown", handleClick);
      window.addEventListener("keydown", handleKey);
    }, 100);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [showAbout]);

  useEffect(() => {
    const tick = () => {
      if (typingPaused.current) {
        timer = setTimeout(tick, 200);
        return;
      }
      const current = SEARCH_PHRASES[phraseIndex.current];
      if (isDeleting.current) {
        charIndex.current--;
        setPlaceholder(current.slice(0, charIndex.current));
        if (charIndex.current === 0) {
          isDeleting.current = false;
          phraseIndex.current = randomPhraseIndex(phraseIndex.current);
        }
      } else {
        charIndex.current++;
        setPlaceholder(current.slice(0, charIndex.current));
        if (charIndex.current === current.length) {
          isDeleting.current = true;
          timer = setTimeout(tick, 1800);
          return;
        }
      }
      timer = setTimeout(tick, isDeleting.current ? 30 : 80);
    };
    let timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, []);


  return (
    <>
      {/* ===== SCROLLING BANNER ===== */}
      <div
        className="fixed top-0 left-0 right-0 z-[60] h-[var(--banner-height)] marquee-aurora overflow-hidden flex items-center"
        onMouseEnter={() => rampTicker(0)}
        onMouseLeave={() => rampTicker(1)}
      >
        <div ref={tickerRef} className="marquee-track inline-flex whitespace-nowrap">
          <span className="font-[family-name:var(--font-banner)] text-[11px] font-medium uppercase tracking-[0.35em] shrink-0 px-2">
            {bannerText}
          </span>
          <span aria-hidden="true" className="font-[family-name:var(--font-banner)] text-[11px] font-medium uppercase tracking-[0.35em] shrink-0 px-2">
            {bannerText}
          </span>
        </div>
      </div>

      {/* ===== DESKTOP: Fixed header bar ===== */}
      <header
        className="hidden min-[1152px]:flex fixed left-0 right-0 z-50 h-[var(--header-height)] bg-[var(--bg)]/80 backdrop-blur-md backdrop-saturate-150 border-b border-[var(--border)]/50 items-center px-2 gap-3"
        style={{ top: "var(--banner-height)" }}
      >
        <div className="shrink-0 flex justify-start">
          <span
            className="font-[family-name:var(--font-display)] text-5xl text-[var(--text)] select-none mr-1.5 cursor-pointer"
            onClick={() => { onViewChange("home"); onTagFiltersChange([]); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          >
            digeart
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Search the pool by track name or artist */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); onSearchChange?.(e.target.value); }}
              placeholder={t("search.placeholder")}
              className="w-full pl-9 pr-9 py-2.5 bg-[var(--bg-alt)] border border-[var(--border)] rounded-xl font-mono text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text-muted)]"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); onSearchChange?.(""); searchInputRef.current?.focus(); }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>
        </div>

        <div data-auth-desktop className="shrink-0 mr-1">
          <AuthButton onGoToSaved={() => onViewChange("saved")} onOpenSettings={() => { const el = document.querySelector('[data-auth-desktop]'); setSettingsAnchor(el?.getBoundingClientRect() ?? null); setSettingsOpen(true); setShowAbout(false); }} onOpenInfo={() => { setAboutSource("dropdown"); setShowAbout(!showAbout); setSettingsOpen(false); }} />
        </div>
      </header>

      {/* ===== DESKTOP: Sidebar below header ===== */}
      <aside
        className="hidden min-[1152px]:flex fixed left-0 z-40 w-[var(--sidebar-width)] bg-[var(--bg)] border-r border-[var(--border)] text-[var(--text)] flex-col items-center py-5"
        style={{
          top: "calc(var(--banner-height) + var(--header-height))",
          height: "calc(100vh - var(--banner-height) - var(--header-height))",
        }}
      >
        {/* Nav: persistent 4-item column. On short height the active icon stays put
            (same size/position) while the other 3 collapse away; position bars
            fade in to its left and a click opens the flyout to the hidden views. */}
        <nav ref={navFlyoutRef} className="relative flex flex-col items-center flex-1 w-full" style={{ perspective: 900 }}>
          {/* Position indicator (static) — lives at nav level so it never inherits item 3D rotation.
              Active pins to the top in short mode, so this sits beside that top icon. */}
          {isShortNav && (
            <span className="absolute left-[5px] top-[22px] -translate-y-1/2 z-[1] flex flex-col items-center justify-center gap-[3px]" aria-hidden>
              {NAV_ITEMS.map((it) => {
                const a = it.key === activeView;
                return (
                  <span
                    key={it.key}
                    className={`w-[3px] rounded-full ${a ? "bg-[var(--accent)]" : "bg-[var(--text-muted)]/40"}`}
                    style={{ height: a ? 11 : 4 }}
                  />
                );
              })}
            </span>
          )}
          {NAV_ITEMS.map((item, i) => {
            const isActive = activeView === item.key;
            const isSlot = isShortNav ? i === 0 : isActive;   // the big/interactive slot
            const collapsed = isShortNav && i !== 0;          // short: only slot 0 stays open
            const pivotIdx = isShortNav ? 0 : navActiveIdx;
            const above = i < pivotIdx;                        // wheel fold direction (resize only)
            const activeItem = NAV_ITEMS.find((n) => n.key === activeView) ?? NAV_ITEMS[0];
            return (
              <motion.div
                key={item.key}
                initial={false}
                animate={collapsed
                  ? { height: 0, marginTop: 0, rotateX: above ? 90 : -90 }
                  : { height: 44, marginTop: isShortNav ? 0 : (i === 0 ? 0 : 40), rotateX: 0 }}
                transition={{ type: "spring", stiffness: 440, damping: 32, mass: 0.85, delay: collapsed ? 0.03 * ((NAV_ITEMS.length - 1) - Math.abs(i - pivotIdx)) : 0.03 * Math.abs(i - pivotIdx) }}
                style={{ overflow: collapsed ? "hidden" : "visible", pointerEvents: collapsed ? "none" : "auto", transformOrigin: above ? "center bottom" : "center top", transformStyle: "preserve-3d" }}
                className="relative group/nav"
              >
                <button
                  onClick={() => {
                    if (isShortNav && i === 0) { setNavFlyoutOpen((v) => !v); return; }
                    onViewChange(item.key);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  aria-haspopup={isShortNav && i === 0 ? "menu" : undefined}
                  aria-expanded={isShortNav && i === 0 ? navFlyoutOpen : undefined}
                  className={`w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-colors duration-200 [&_svg]:w-[26px] [&_svg]:h-[26px] ${
                    isSlot
                      ? "text-[var(--text)] bg-[var(--accent)]/12"
                      : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]"
                  }`}
                >
                  {isShortNav && i === 0 ? (
                    <span className="relative w-full h-full flex items-center justify-center" style={{ perspective: 360 }}>
                      <AnimatePresence custom={navFlipDir} initial={false}>
                        <motion.span
                          key={activeView}
                          custom={navFlipDir}
                          variants={navFlipVariants}
                          initial="enter" animate="center" exit="exit"
                          transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.8 }}
                          style={{ transformOrigin: "center", backfaceVisibility: "hidden" }}
                          className="absolute inset-0 flex items-center justify-center [&_svg]:w-[26px] [&_svg]:h-[26px]"
                        >
                          {activeItem.icon(true)}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  ) : (
                    item.icon(isActive)
                  )}
                </button>
                {/* Tooltip — tall mode only */}
                {!isShortNav && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[var(--text)] text-[var(--bg)] rounded-md font-mono text-[11px] whitespace-nowrap opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-opacity duration-150 z-50">
                    {t(`nav.${item.key === "home" ? "forYou" : item.key}`)} ({i + 1})
                  </div>
                )}
                {/* Flyout to the other three — short mode, top slot */}
                {isShortNav && i === 0 && (
                  <AnimatePresence>
                    {navFlyoutOpen && (
                      <motion.div
                        initial={{ opacity: 0, x: -8, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -8, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 460, damping: 34, mass: 0.7 }}
                        className="absolute left-full ml-[18px] top-0 z-[80] flex flex-col gap-0.5 p-1.5 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)]/60 shadow-2xl"
                      >
                        {NAV_ITEMS.filter((it) => it.key !== activeView).map((it, idx) => (
                          <motion.button
                            key={it.key}
                            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ type: "spring", stiffness: 460, damping: 34, delay: 0.03 * idx }}
                            onClick={() => { setNavFlipDir(NAV_ITEMS.findIndex((n) => n.key === it.key) >= navActiveIdx ? 1 : -1); onViewChange(it.key); window.scrollTo({ top: 0, behavior: "smooth" }); setNavFlyoutOpen(false); }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-mono text-[11px] uppercase tracking-wider whitespace-nowrap cursor-pointer text-[var(--text)] hover:bg-[var(--accent)]/12 [&_svg]:w-4 [&_svg]:h-4"
                          >
                            {it.icon(false)}{t(`nav.${it.key === "home" ? "forYou" : it.key}`)}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </motion.div>
            );
          })}
        </nav>
        {/* Bottom icons — Info + Settings */}
        <div className="flex flex-col items-center gap-4">
        {/* About button (stacked vinyls icon) */}
        <div className="relative group/about">
          <button
            ref={aboutIconRef}
            data-about-trigger
            onClick={() => {
              setAboutSource("gear");
              const rect = aboutIconRef.current?.getBoundingClientRect();
              if (rect) {
                const playerEl = document.querySelector(".player-banner");
                const bottomPx = playerEl ? playerEl.getBoundingClientRect().height + 16 : 16;
                setGearAnchor({ left: rect.right + 18, bottom: `${bottomPx}px` });
              }
              setShowAbout(!showAbout);
              setShowShortcuts(false);
              setSettingsOpen(false);
            }}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
              showAbout
                ? "text-[var(--text)] bg-[var(--accent)]/12"
                : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]"
            }`}
          >
            {showAbout ? (
              <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                <path d="m2 17 10 5 10-5" fill="none" />
                <path d="m2 12 10 5 10-5" fill="none" />
              </svg>
            ) : (
              <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                <path d="m2 17 10 5 10-5" />
                <path d="m2 12 10 5 10-5" />
              </svg>
            )}
          </button>
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[var(--text)] text-[var(--bg)] rounded-md font-mono text-[11px] whitespace-nowrap opacity-0 pointer-events-none group-hover/about:opacity-100 transition-opacity duration-150 z-[90]">
            {t("settings.about")} (A)
          </div>
        </div>
        {/* Settings gear */}
        <div className="relative group/gear">
          <button
            ref={gearRef}
            data-settings-trigger
            onClick={() => {
              setSettingsAnchor(gearRef.current?.getBoundingClientRect() ?? null);
              setSettingsOpen((open) => !open); // toggle open/close, like the About button
              setShowAbout(false);
            }}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
              settingsOpen
                ? "text-[var(--text)] bg-[var(--accent)]/12"
                : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]"
            }`}
          >
            <GearIcon className="w-[22px] h-[22px]" active={settingsOpen} />
          </button>
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[var(--text)] text-[var(--bg)] rounded-md font-mono text-[11px] whitespace-nowrap opacity-0 pointer-events-none group-hover/gear:opacity-100 transition-opacity duration-150 z-[90]">
            {t("auth.settings")} (,)
          </div>
        </div>
        </div>
      </aside>

      {/* ===== MOBILE: Fixed header bar ===== */}
      <header
        data-mobile-header
        className="flex min-[1152px]:hidden fixed left-0 right-0 z-50 h-[var(--header-height-mobile)] bg-[var(--bg)] items-center px-3 gap-3"
        style={{ top: "var(--banner-height)" }}
      >
        <span
          className="shrink-0 font-[family-name:var(--font-display)] text-5xl text-[var(--text)] select-none mr-1 cursor-pointer"
          onClick={() => { onViewChange("home"); onTagFiltersChange([]); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        >
          digeart
        </span>
        <div className="flex-1 min-w-0">
          {/* Search the pool by track name or artist */}
          <div className="relative">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); onSearchChange?.(e.target.value); }}
              placeholder={t("search.placeholder")}
              className="w-full pl-8 pr-8 py-2.5 bg-[var(--bg-alt)] border border-[var(--border)] rounded-xl font-mono text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text-muted)]"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); onSearchChange?.(""); mobileSearchInputRef.current?.focus(); }}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>
        </div>
        <div data-auth-button className="shrink-0">
          <AuthButton onGoToSaved={() => onViewChange("saved")} onOpenSettings={() => { const el = document.querySelector('[data-auth-button]'); setSettingsAnchor(el?.getBoundingClientRect() ?? null); setSettingsOpen(true); setShowAbout(false); }} onOpenInfo={() => { setShowAbout(!showAbout); setSettingsOpen(false); }} onRunTutorial={onRunTutorial} />
        </div>
      </header>

      {/* ===== MOBILE: Nav icons below header ===== */}
      <div
        data-mobile-nav
        className="grid grid-cols-4 place-items-center min-[1152px]:hidden fixed left-0 right-0 z-40 h-[var(--nav-height-mobile)] bg-[var(--bg)] border-b border-[var(--border)] px-[10%]"
        style={{ top: "calc(var(--banner-height) + var(--header-height-mobile))" }}
      >
        {NAV_ITEMS.map((item, i) => {
          const isActive = activeView === item.key;
          return (
            <Fragment key={item.key}>
              <button
                onClick={() => { onViewChange(item.key); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={`w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 [&_svg]:w-[26px] [&_svg]:h-[26px] ${
                  isActive
                    ? "text-[var(--text)] bg-[var(--accent)]/12"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]"
                }`}
              >
                {item.icon(isActive)}
              </button>
            </Fragment>
          );
        })}
      </div>

      {/* Desktop About popover — anchored top-right near avatar */}
      <AnimatePresence>
        {showAbout && (
          <motion.div
            key="about-popover"
            ref={aboutRef}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="hidden min-[1152px]:block fixed z-[70] px-3 py-2.5 bg-[var(--bg)]/95 backdrop-blur-xl border border-[var(--border)]/60 rounded-xl shadow-2xl w-[350px] max-h-[calc(100vh-120px)] overflow-y-auto"
            style={aboutSource === "gear" && gearAnchor ? {
              left: gearAnchor.left,
              bottom: gearAnchor.bottom,
            } : {
              right: 12,
              top: "calc(var(--banner-height) + var(--header-height) + 8px)",
            }}
          >
            <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--text)]">digeart</p>
            <p className="font-mono text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed text-justify">{t("about.tagline")}</p>

            <div className="mt-2 pt-1.5 border-t border-[var(--border)]">
              <p className="font-mono font-bold uppercase tracking-widest mb-1" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t("about.tags")}</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1">
                {TAGS.map((tag) => (
                  <Fragment key={tag.id}>
                    <span className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${tag.color}`} />
                      <span className="font-mono text-[11px] text-[var(--text-muted)] font-bold tracking-wider">{tag.label}</span>
                    </span>
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">{t(tag.descKey)}</span>
                  </Fragment>
                ))}
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-[var(--border)]">
              <p className="font-mono font-bold uppercase tracking-widest mb-1" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t("about.tabs")}</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1">
                {[
                  [t("nav.forYou"), t("about.electronic"), "1"],
                  [t("nav.mixes"), t("about.djSets"), "2"],
                  [t("nav.samples"), t("about.worldFunk"), "3"],
                  [t("nav.saved"), t("about.yourLiked"), "4"],
                ].map(([tab, desc, dgt]) => (
                  <Fragment key={tab}>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <kbd className="font-mono text-[var(--text)] bg-[var(--text)]/10 px-1.5 py-0.5 rounded text-center min-w-[16px]" style={{ fontSize: 11 }}>{dgt}</kbd>
                      <span className="font-mono text-[11px] text-[var(--text-secondary)] font-bold">{tab}</span>
                    </span>
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">{desc}</span>
                  </Fragment>
                ))}
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-[var(--border)]">
              <p className="font-mono font-bold uppercase tracking-widest mb-1" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t("about.disclaimerTitle")}</p>
              <p className="font-mono text-[11px] text-[var(--text-muted)] leading-snug text-justify">
                {t("about.legal")}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-[var(--border)]">
              <span className="inline-flex text-[var(--text-muted)]">
                <svg className="w-3.5 h-3.5" viewBox="0 0 32 32">
                  <polygon points="8,4 24,4 30,13 16,29 2,13" fill="currentColor" opacity="0.5"/>
                  <polygon points="8,4 12,13 16,4" fill="currentColor" opacity="0.35"/>
                  <polygon points="24,4 20,13 16,4" fill="currentColor" opacity="0.45"/>
                  <polygon points="2,13 12,13 16,29" fill="currentColor" opacity="0.3"/>
                  <polygon points="30,13 20,13 16,29" fill="currentColor" opacity="0.2"/>
                  <polygon points="12,13 20,13 16,29" fill="currentColor" opacity="0.25"/>
                  <polygon points="12,13 20,13 16,4" fill="currentColor" opacity="0.5"/>
                </svg>
              </span>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">v{process.env.APP_VERSION}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Shortcuts popover — anchored next to the ? icon */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            key="shortcuts-popover"
            ref={shortcutsRef}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="hidden min-[1152px]:block fixed z-[70] px-3 py-2.5 bg-[var(--bg)]/95 backdrop-blur-xl border border-[var(--border)]/60 rounded-xl shadow-2xl w-[300px] max-h-[calc(100vh-120px)] overflow-y-auto"
            style={shortcutsAnchor ? {
              left: shortcutsAnchor.left,
              bottom: shortcutsAnchor.bottom,
            } : {
              right: 12,
              top: "calc(var(--banner-height) + var(--header-height) + 8px)",
            }}
          >
            <p className="font-mono font-bold uppercase tracking-widest mb-1" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t("about.shortcuts")}</p>
            <div className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1">
              {[
                [`${t("about.keySpace")} / K`, t("about.shortcutPlayPause")],
                ["N / →", t("about.shortcutNext")],
                ["P / ←", t("about.shortcutPrev")],
                ["S", t("about.shortcutShuffle")],
                ["M", t("about.shortcutMute")],
                ["L", t("about.shortcutLike")],
                ["Q", t("about.shortcutQueue")],
                ["1–4", t("about.shortcutTab")],
                ["?", t("about.shortcuts")],
                ["I", t("about.shortcutPanel")],
                [",", t("about.shortcutSettings")],
              ].map(([key, desc]) => (
                <Fragment key={key}>
                  <kbd className="font-mono text-[var(--text)] bg-[var(--text)]/10 px-1.5 py-0.5 rounded text-center min-w-[16px]" style={{ fontSize: 11 }}>{key}</kbd>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">{desc}</span>
                </Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile/Tablet About overlay */}
      <AnimatePresence>
        {showAbout && (
          <>
          <motion.div
            key="about-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="min-[1152px]:hidden fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
            style={{ touchAction: "none" }}
            onClick={() => setShowAbout(false)}
          />
          <motion.div
            key="about-sheet"
            ref={mobileSheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                setShowAbout(false);
              }
            }}
            className="min-[1152px]:hidden fixed bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto bg-[var(--bg)] border-t border-[var(--border)] rounded-t-2xl shadow-2xl px-5 py-4 z-[71]"
            style={{ touchAction: "pan-y" }}
            >
              {/* Drag handle */}
              <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-3" />

              {/* Close button */}
              <button
                onClick={() => setShowAbout(false)}
                className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center rounded-[9px] bg-[var(--bg-alt)] border border-[var(--border)]/40 text-[var(--text)]/70 shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-all duration-150 active:scale-[0.92]"
                aria-label="Close"
              >
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--text)]">digeart</p>
              <p className="font-mono text-[10px] text-[var(--text-muted)] mt-0.5 leading-relaxed text-justify">{t("about.tagline")}</p>

              {/* Tag legend */}
              <div className="mt-2.5 pt-2 border-t border-[var(--border)]">
                <p className="font-mono text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-1.5">{t("about.tags")}</p>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  {TAGS.map((tag) => (
                    <Fragment key={tag.id}>
                      <span className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${tag.color}`} />
                        <span className="font-mono text-[10px] text-[var(--text-muted)] font-bold tracking-wider">{tag.label}</span>
                      </span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">{t(tag.descKey)}</span>
                    </Fragment>
                  ))}
                </div>
              </div>

              {/* Navigation guide */}
              <div className="mt-2.5 pt-2 border-t border-[var(--border)]">
                <p className="font-mono text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-1.5">{t("about.tabs")}</p>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  {[
                    [t("nav.forYou"), t("about.electronic")],
                    [t("nav.samples"), t("about.worldFunk")],
                    [t("nav.mixes"), t("about.djSets")],
                    [t("nav.saved"), t("about.yourLiked")],
                  ].map(([tab, desc]) => (
                    <Fragment key={tab}>
                      <span className="font-mono text-[10px] text-[var(--text-secondary)] font-bold shrink-0">{tab}</span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">{desc}</span>
                    </Fragment>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[var(--border)]">
                <span className="inline-flex text-[var(--text-muted)]">
                  <svg className="w-4 h-4" viewBox="0 0 32 32">
                    <polygon points="8,4 24,4 30,13 16,29 2,13" fill="currentColor" opacity="0.5"/>
                    <polygon points="8,4 12,13 16,4" fill="currentColor" opacity="0.35"/>
                    <polygon points="24,4 20,13 16,4" fill="currentColor" opacity="0.45"/>
                    <polygon points="2,13 12,13 16,29" fill="currentColor" opacity="0.3"/>
                    <polygon points="30,13 20,13 16,29" fill="currentColor" opacity="0.2"/>
                    <polygon points="12,13 20,13 16,29" fill="currentColor" opacity="0.25"/>
                    <polygon points="12,13 20,13 16,4" fill="currentColor" opacity="0.5"/>
                  </svg>
                </span>
                <span className="font-mono text-[9px] text-[var(--text-muted)]">v{process.env.APP_VERSION}</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} anchorRect={settingsAnchor} onRunTutorial={onRunTutorial} djMode={djMode} onToggleDjMode={onToggleDjMode} onOpenInfo={() => { setAboutSource("gear"); const rect = gearRef.current?.getBoundingClientRect(); if (rect) { const playerEl = document.querySelector(".player-banner"); const bottomPx = playerEl ? playerEl.getBoundingClientRect().height + 16 : 16; setGearAnchor({ left: rect.right + 12, bottom: `${bottomPx}px` }); } setShowAbout(true); setSettingsOpen(false); }} />
    </>
  );
}
