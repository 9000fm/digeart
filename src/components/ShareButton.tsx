"use client";

import { useCallback, useState } from "react";
import { useTranslation } from "@/components/LanguageProvider";
import Tooltip from "@/components/Tooltip";
import ShareMenu from "@/components/ShareMenu";

interface Props {
  trackId: string;
  trackName: string;
  channel?: string;
  youtubeUrl?: string | null;
  size?: "sm" | "md";
  className?: string;
  showTooltip?: boolean;
}

export default function ShareButton({
  trackId,
  trackName,
  channel,
  youtubeUrl,
  size = "md",
  className = "",
  showTooltip = true,
}: Props) {
  const { t } = useTranslation();
  // Store button element in state (instead of ref) so the ShareMenu can read it
  // during render — satisfies react-hooks/refs rule.
  const [btnEl, setBtnEl] = useState<HTMLButtonElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Same custom menu on every device — consistent UX. The menu itself
      // offers "Más opciones" as an escape hatch to the OS native share sheet
      // for users who want Outlook/AirDrop/Bluetooth/etc.
      setMenuOpen((v) => !v);
    },
    []
  );

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const btnSize = size === "sm" ? "w-7 h-7" : "w-7 h-7";

  const button = (
    <button
      ref={setBtnEl}
      onClick={onClick}
      aria-label={t("share.action")}
      className={`share-btn shrink-0 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-all duration-200 ease-out active:scale-95 cursor-pointer ${btnSize} ${className}`}
    >
      <svg
        className={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Share-out: box with arrow exiting top */}
        <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    </button>
  );

  const wrapped = showTooltip ? (
    <Tooltip label={t("share.action")} position="top" hideOnClick>
      {button}
    </Tooltip>
  ) : button;

  return (
    <>
      {wrapped}
      <ShareMenu
        trackId={trackId}
        trackName={trackName}
        channel={channel}
        youtubeUrl={youtubeUrl}
        anchorEl={btnEl}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </>
  );
}
