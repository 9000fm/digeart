// Share helper — uses Web Share API on mobile, clipboard fallback on desktop.
// Dispatches "link-copied" CustomEvent when the clipboard path succeeds so a
// toast can listen globally without prop drilling.

export interface ShareTarget {
  title: string;
  text: string;
  trackId?: string;
}

function buildUrl(trackId?: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://digeart.vercel.app";
  return trackId ? `${base}/?t=${encodeURIComponent(trackId)}` : base;
}

export async function shareTrack({ title, text, trackId }: ShareTarget): Promise<void> {
  const url = buildUrl(trackId);

  // Prefer native Web Share API (mobile + some desktop browsers)
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (err) {
      // User cancelled the share sheet — bail silently
      if ((err as Error).name === "AbortError") return;
      // Other errors fall through to clipboard
    }
  }

  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(url);
    document.dispatchEvent(new CustomEvent("link-copied"));
  } catch {
    // Ultimate fallback for ancient browsers — select + execCommand
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      document.dispatchEvent(new CustomEvent("link-copied"));
    } catch {
      // give up
    }
    document.body.removeChild(textarea);
  }
}
