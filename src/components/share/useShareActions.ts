// Shared action logic for all ShareMenu variants.
// Each variant imports this hook and renders differently.

import { useMemo, useCallback } from "react";
import { useTranslation } from "@/components/LanguageProvider";

export interface ShareActionItem {
  key: "copy" | "whatsapp" | "twitter" | "telegram" | "facebook";
  label: string;
  href?: string;
  onClick?: () => void;
}

export function useShareActions(trackId: string, trackName: string, channel?: string, youtubeUrl?: string | null) {
  const { t } = useTranslation();

  const url = useMemo(() => {
    // Prefer YouTube direct URL — robust, works anywhere, no digeart dependency
    if (youtubeUrl) return youtubeUrl;
    // Fallback: construct from raw videoId if trackId uses the `yt-<id>` format
    const rawId = trackId.startsWith("yt-") ? trackId.slice(3) : trackId;
    if (rawId) return `https://www.youtube.com/watch?v=${rawId}`;
    // Ultimate fallback: internal digeart URL
    const base = typeof window !== "undefined" ? window.location.origin : "https://digeart.vercel.app";
    return `${base}/?t=${encodeURIComponent(trackId)}`;
  }, [trackId, youtubeUrl]);

  const message = t("share.message");
  const titleLine = channel ? `${trackName} · ${channel}` : trackName;
  const body = `${message}: ${titleLine}`;

  const copyPayload = `${body} ${url}`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyPayload);
      document.dispatchEvent(new CustomEvent("link-copied"));
    } catch { /* ignore */ }
  }, [copyPayload]);

  const openNativeShare = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: titleLine, text: message, url });
      } else {
        await copyLink();
      }
    } catch { /* user cancelled */ }
  }, [titleLine, message, url, copyLink]);

  const items: ShareActionItem[] = useMemo(() => [
    { key: "copy", label: t("share.copyLink"), onClick: copyLink },
    { key: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${body} ${url}`)}` },
    { key: "twitter", label: "X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(body)}&url=${encodeURIComponent(url)}` },
    { key: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(body)}` },
    {
      key: "facebook",
      label: "Facebook",
      // FB removed the `quote` param from sharer.php for non-app actors, so we copy
      // the body to clipboard right before opening — user pastes into FB's compose box.
      onClick: async () => {
        try { await navigator.clipboard.writeText(copyPayload); } catch { /* ignore */ }
        document.dispatchEvent(new CustomEvent("link-copied"));
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          "_blank",
          "noopener,noreferrer"
        );
      },
    },
  ], [t, body, url, copyLink, copyPayload]);

  return { items, url, copyLink, openNativeShare, titleLine, moreLabel: t("share.moreOptions") };
}
