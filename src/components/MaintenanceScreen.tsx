"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "./LanguageProvider";

export default function MaintenanceScreen() {
  const { t } = useTranslation();
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center relative overflow-hidden">
      {/* Wordmark */}
      <p className="font-[family-name:var(--font-display)] text-4xl text-[var(--text-muted)]/20 mb-6">
        digeart
      </p>

      {/* Spinning gem (Y-axis 3D rotation) */}
      <div className="mb-3" style={{ perspective: "400px" }}>
        <svg
          className="w-12 h-12 text-[var(--text-muted)]"
          viewBox="0 0 32 32"
          style={{ animation: "gemRotateY 3s ease-in-out infinite", transformStyle: "preserve-3d" }}
        >
          <polygon points="8,4 24,4 30,13 16,29 2,13" fill="currentColor" opacity="0.5" />
          <polygon points="8,4 12,13 16,4" fill="currentColor" opacity="0.35" />
          <polygon points="24,4 20,13 16,4" fill="currentColor" opacity="0.45" />
          <polygon points="2,13 12,13 16,29" fill="currentColor" opacity="0.3" />
          <polygon points="30,13 20,13 16,29" fill="currentColor" opacity="0.2" />
          <polygon points="12,13 20,13 16,29" fill="currentColor" opacity="0.25" />
          <polygon points="12,13 20,13 16,4" fill="currentColor" opacity="0.5" />
        </svg>
      </div>

      {/* Gem shadow — syncs with gem rotation */}
      <div
        className="h-[3px] rounded-full bg-[var(--text-muted)]/40 mb-6"
        style={{ width: "3rem", animation: "gemShadow 3s ease-in-out infinite" }}
      />

      {/* Message with cycling dots */}
      <p className="font-mono text-sm text-[var(--text)] font-bold tracking-wider">
        {t("maintenance.backSoon")}<span className="inline-block w-[2em] text-left">{".".repeat(dotCount)}</span>
      </p>
    </div>
  );
}
