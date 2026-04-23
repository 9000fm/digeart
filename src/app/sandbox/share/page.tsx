"use client";

import { useEffect, useRef, useState } from "react";
import ShareMenuV1QueueRow from "@/components/share/ShareMenuV1QueueRow";
import ShareMenuV2AboutCard from "@/components/share/ShareMenuV2AboutCard";
import ShareMenuV3TerminalZine from "@/components/share/ShareMenuV3TerminalZine";
import ShareMenuV4GlassGrid from "@/components/share/ShareMenuV4GlassGrid";
import LinkCopiedToast from "@/components/LinkCopiedToast";

const MOCK_TRACK_ID = "dQw4w9WgXcQ";
const MOCK_TRACK_NAME = "Test Track Name";
const MOCK_CHANNEL = "Mock Channel";
const MOCK_YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

// Each frame gives enough vertical space for the popup to render below its anchor.
// Anchor sits near the TOP of each frame — popup then flips downward (triggered by
// the `if (top < 8) top = rect.bottom + 10` logic inside each variant) and lives
// inside the frame instead of overflowing into its neighbour.
function VariantFrame({ label, description, children }: {
  label: string;
  description: string;
  children: (anchor: HTMLButtonElement | null) => React.ReactNode;
}) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  return (
    <div className="relative flex flex-col items-center gap-3 p-6 border border-[var(--border)]/40 rounded-2xl bg-[var(--bg-alt)]/20 min-h-[520px]">
      <div className="text-center">
        <p className="font-mono text-[11px] text-[var(--text-secondary)] uppercase tracking-widest font-bold">{label}</p>
        <p className="font-mono text-[10px] text-[var(--text-muted)] mt-0.5">{description}</p>
      </div>
      <button
        ref={setAnchor}
        className="mt-2 w-7 h-7 flex items-center justify-center rounded-full bg-[var(--text)]/10 text-[var(--text-muted)] border border-[var(--border)]/40"
        title="anchor"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>
      {children(anchor)}
    </div>
  );
}

export default function ShareSandboxPage() {
  const [openV1, setOpenV1] = useState(true);
  const [openV2, setOpenV2] = useState(true);
  const [openV3, setOpenV3] = useState(true);
  const [openV4, setOpenV4] = useState(false);
  const reopenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reopen after ESC / outside-click so they stay visible for comparison
  useEffect(() => {
    if (reopenTimer.current) clearTimeout(reopenTimer.current);
    reopenTimer.current = setTimeout(() => {
      setOpenV1(true); setOpenV2(true); setOpenV3(true);
    }, 600);
    return () => { if (reopenTimer.current) clearTimeout(reopenTimer.current); };
  }, [openV1, openV2, openV3]);

  return (
    <main className="min-h-screen bg-[var(--bg)] p-6 md:p-10">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-6">
          <p className="font-[family-name:var(--font-display)] text-5xl text-[var(--text)]">share · sandbox</p>
          <p className="font-mono text-[12px] text-[var(--text-muted)] mt-1 max-w-[640px]">
            Las 4 variantes abren simultáneamente debajo de su anchor.
            Mock: <span className="text-[var(--text)]">{MOCK_TRACK_NAME} · {MOCK_CHANNEL}</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <VariantFrame label="V1 · Queue-row" description="Angosto, mono uppercase, separadores estilo Queue">
            {(a) => <ShareMenuV1QueueRow trackId={MOCK_TRACK_ID} trackName={MOCK_TRACK_NAME} channel={MOCK_CHANNEL} anchorEl={a} open={openV1} onClose={() => setOpenV1(false)} preferDown />}
          </VariantFrame>

          <VariantFrame label="V2 · About-card" description="Header ♦ + pills 2 cols, matchea About panel">
            {(a) => <ShareMenuV2AboutCard trackId={MOCK_TRACK_ID} trackName={MOCK_TRACK_NAME} channel={MOCK_CHANNEL} anchorEl={a} open={openV2} onClose={() => setOpenV2(false)} preferDown />}
          </VariantFrame>

          <VariantFrame label="V3 · Terminal-zine" description="Display font SHARE + > prompts, zine energy">
            {(a) => <ShareMenuV3TerminalZine trackId={MOCK_TRACK_ID} trackName={MOCK_TRACK_NAME} channel={MOCK_CHANNEL} anchorEl={a} open={openV3} onClose={() => setOpenV3(false)} preferDown />}
          </VariantFrame>

          <VariantFrame label="V4 · Glass-grid (modal)" description="Modal centrado con backdrop — click para abrir">
            {(a) => (
              <>
                <button
                  onClick={() => setOpenV4(true)}
                  className="px-3 py-1.5 bg-[var(--text)]/10 border border-[var(--border)]/40 rounded font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  Abrir modal
                </button>
                <ShareMenuV4GlassGrid trackId={MOCK_TRACK_ID} trackName={MOCK_TRACK_NAME} channel={MOCK_CHANNEL} anchorEl={a} open={openV4} onClose={() => setOpenV4(false)} />
              </>
            )}
          </VariantFrame>
        </div>

        <p className="font-mono text-[10px] text-[var(--text-muted)] mt-8 text-center">
          ESC o click afuera cierra temporalmente · se reabre solo después de 600ms
        </p>
      </div>
      <LinkCopiedToast />
    </main>
  );
}
