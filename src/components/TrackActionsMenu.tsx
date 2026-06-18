"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useFloating, autoUpdate, offset, flip, shift, useClick, useDismiss, useRole, useInteractions } from "@floating-ui/react";
import { useTranslation } from "./LanguageProvider";

interface TrackActionsMenuProps {
  onPlayNext?: () => void;
  onAddToQueue?: () => void;
  onAddToPlaylist?: () => void; // undefined → row shown disabled ("soon")
  onShare?: () => void;         // player surface: "Share" (native share / copy)
  onInfo?: () => void;          // player surface: "Track details" → info popover
  onRemove?: () => void;        // queue surface: "Remove from queue" in place of Add-to-Queue
  removeLabel?: string;
  onHide?: () => void;          // card surface: "Hide track"
  hideLabel?: string;
  /** Extra classes for the trigger button (controls hover/opacity per surface). */
  triggerClassName?: string;
  /** Trigger glyph: "list" (default, list+plus) or "dots" (classic vertical ⋮). */
  triggerIcon?: "list" | "dots";
  /** Notifies the parent when the menu opens/closes (e.g. to keep a card "active"). */
  onOpenChange?: (open: boolean) => void;
}

// Single "track actions" trigger → small menu: Play Next / Add to Queue /
// Add to Playlist. Reused on cards, player and queue. Labels disambiguate the
// rows so the leading glyphs can stay in the same family.
export default function TrackActionsMenu({ onPlayNext, onAddToQueue, onAddToPlaylist, onShare, onInfo, onRemove, removeLabel, onHide, hideLabel, triggerClassName = "", triggerIcon = "list", onOpenChange }: TrackActionsMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const MENU_W = 216;

  // Floating UI handles anchoring + flip (open up near the bottom) + shift (stay in
  // viewport) + autoUpdate (follow on resize/scroll). useDismiss/useRole give
  // outside-click + Escape + a11y for free — no hand-rolled listeners.
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    strategy: "fixed",
    placement: "bottom-end",
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "menu" });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);
  // Floating UI's refs are stable setter callbacks, not React refs — the rule misfires.
   
  const { setReference, setFloating } = refs;

  // Let the parent (e.g. a card) keep itself "active" while the menu is open.
  useEffect(() => { onOpenChange?.(open); }, [open, onOpenChange]);

  const run = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    fn?.();
  };

  const rowClass = "w-full flex items-center gap-2.5 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-left whitespace-nowrap transition-colors";

  const menu = open && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={setFloating}
          {...getFloatingProps({ onClick: (e) => e.stopPropagation() })}
          className="z-[95] rounded-xl bg-[var(--bg-alt)] border border-[var(--border)]/60 shadow-2xl overflow-hidden py-1"
          style={{ ...floatingStyles, width: MENU_W }}
        >
          {onPlayNext && (
            <button onClick={run(onPlayNext)} className={`${rowClass} text-[var(--text)] hover:bg-[var(--accent)]/12 cursor-pointer`}>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="7" x2="14" y2="7" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="17" x2="11" y2="17" /><polygon points="16 10 16 20 24 15" fill="currentColor" stroke="none" />
              </svg>
              {t("card.playNext")}
            </button>
          )}
          {onAddToQueue && (
            <button onClick={run(onAddToQueue)} className={`${rowClass} text-[var(--text)] hover:bg-[var(--accent)]/12 cursor-pointer`}>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="7" x2="16" y2="7" /><line x1="4" y1="12" x2="12" y2="12" /><line x1="4" y1="17" x2="12" y2="17" /><line x1="18" y1="10" x2="18" y2="20" /><line x1="13" y1="15" x2="23" y2="15" />
              </svg>
              {t("card.addToQueue")}
            </button>
          )}
          {onAddToPlaylist ? (
            <button onClick={run(onAddToPlaylist)} className={`${rowClass} text-[var(--text)] hover:bg-[var(--accent)]/12 cursor-pointer`}>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t("card.addToPlaylist")}
            </button>
          ) : (
            <div className={`${rowClass} text-[var(--text-muted)] cursor-default justify-between`}>
              <span className="flex items-center gap-2.5">
                <svg className="w-4 h-4 shrink-0 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t("card.addToPlaylist")}
              </span>
              <span className="text-[8px] tracking-widest opacity-70">{t("card.soon")}</span>
            </div>
          )}
          {onShare && (
            <button onClick={run(onShare)} className={`${rowClass} text-[var(--text)] hover:bg-[var(--accent)]/12 cursor-pointer`}>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              {t("share.action")}
            </button>
          )}
          {onInfo && (
            <button onClick={run(onInfo)} className={`${rowClass} text-[var(--text)] hover:bg-[var(--accent)]/12 cursor-pointer`}>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><circle cx="12" cy="8" r="0.5" fill="currentColor" />
              </svg>
              {t("card.info")}
            </button>
          )}
          {(onRemove || onHide) && (
            <>
              <div className="h-px my-1 bg-[var(--border)]/50" />
              {onHide && (
                <button onClick={run(onHide)} className={`${rowClass} text-[var(--text)] hover:bg-[var(--accent)]/12 cursor-pointer`}>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 8 10 8a9.74 9.74 0 0 0 5.39-1.61" /><path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" /><line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                  {hideLabel ?? t("card.hide")}
                </button>
              )}
              {onRemove && (
                <button onClick={run(onRemove)} className={`${rowClass} text-[var(--text)] hover:bg-[var(--accent)]/12 cursor-pointer`}>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  {removeLabel ?? t("queue.remove")}
                </button>
              )}
            </>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={setReference}
        {...getReferenceProps({ onClick: (e) => e.stopPropagation() })}
        aria-label={t("card.moreActions")}
        className={triggerClassName}
      >
        {triggerIcon === "dots" ? (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" />
          </svg>
        ) : (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="7" x2="15" y2="7" /><line x1="4" y1="12" x2="15" y2="12" /><line x1="4" y1="17" x2="11" y2="17" /><line x1="18" y1="13" x2="18" y2="21" /><line x1="14" y1="17" x2="22" y2="17" />
          </svg>
        )}
      </button>
      {menu}
    </>
  );
}
