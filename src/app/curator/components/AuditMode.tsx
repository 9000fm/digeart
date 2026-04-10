"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { ApprovedChannel, CuratorStats } from "../types";
import { ChannelAuditBody } from "./ChannelAuditBody";
import { CuratorStatsBar } from "./CuratorStatsBar";
import { CuratorTabBar } from "./CuratorTabBar";
import { RejectModal } from "./RejectModal";
import { useCuratorToast } from "../hooks/useCuratorToast";
import type { CuratorTab } from "../types";

interface AuditModeProps {
  channel: ApprovedChannel;
  stats: CuratorStats | null;
  activeTab: CuratorTab;
  setActiveTab: (tab: CuratorTab) => void;
  onExit: () => void;
  onChangeDecision: (
    id: string,
    name: string,
    d: "reject"
  ) => void;
  fetchStats: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  position?: { current: number; total: number };
  onStarUpdated?: (channelId: string, isStarred: boolean) => void;
  onBoostUpdated?: (channelId: string, newState: import("../types").BoostState) => void;
}

export function AuditMode({
  channel,
  stats,
  activeTab,
  setActiveTab,
  onExit,
  onChangeDecision,
  fetchStats,
  onPrev,
  onNext,
  position,
  onStarUpdated,
  onBoostUpdated,
}: AuditModeProps) {
  const [labels, setLabels] = useState<Set<string>>(
    new Set(channel.labels || [])
  );
  const [auditChannel, setAuditChannel] = useState(channel);
  const [saveFlash, setSaveFlash] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const flashTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const { showToast } = useCuratorToast();

  // B23: focus the SAVE LABELS button when audit mode mounts
  useEffect(() => {
    saveButtonRef.current?.focus();
  }, []);

  const handleSaveLabels = useCallback(async () => {
    const labelArr = Array.from(labels);
    try {
      const res = await fetch("/api/curator", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateLabels",
          channelId: channel.id,
          labels: labelArr,
        }),
      });
      if (!res.ok) {
        const msg = res.status === 429 ? "Slow down — try again shortly" : res.status === 403 ? "Forbidden" : "Save failed";
        showToast(msg, "error");
        return;
      }
      // Visual feedback
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
      setSaveFlash(true);
      flashTimeout.current = setTimeout(() => setSaveFlash(false), 1500);
      showToast("Labels saved", "success");
    } catch {
      showToast("Network error — labels not saved", "error");
    }
  }, [channel.id, labels, showToast]);

  const handleToggleStar = useCallback(async () => {
    // Optimistic
    const previousStarred = auditChannel.isStarred ?? false;
    const newStarred = !previousStarred;
    setAuditChannel((prev) => ({ ...prev, isStarred: newStarred }));
    // Sync to parent so navigating away/back doesn't lose the star
    onStarUpdated?.(channel.id, newStarred);
    try {
      const res = await fetch("/api/curator", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: channel.id,
          channelName: channel.name,
        }),
      });
      if (!res.ok) {
        // Rollback both local + parent
        setAuditChannel((prev) => ({ ...prev, isStarred: previousStarred }));
        onStarUpdated?.(channel.id, previousStarred);
        showToast("Star toggle failed", "error");
        return;
      }
      fetchStats();
      showToast(previousStarred ? "Unstarred" : "Starred", "success");
    } catch {
      setAuditChannel((prev) => ({ ...prev, isStarred: previousStarred }));
      onStarUpdated?.(channel.id, previousStarred);
      showToast("Network error — star unchanged", "error");
    }
  }, [channel.id, channel.name, fetchStats, auditChannel.isStarred, showToast, onStarUpdated]);

  const toggleLabel = (label: string) => {
    setLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleReject = useCallback(() => {
    setRejectModalOpen(true);
  }, []);

  const confirmReject = useCallback(() => {
    setRejectModalOpen(false);
    onChangeDecision(channel.id, channel.name, "reject");
  }, [channel.id, channel.name, onChangeDecision]);

  // Keyboard shortcuts for audit mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "l" || e.key === "L") handleSaveLabels();
      if (e.key === "r" || e.key === "R") handleReject();
      if (e.key === "f" || e.key === "F") handleToggleStar();
      if (e.key === "b" || e.key === "B" || e.key === "Escape") onExit();
      if ((e.key === "ArrowRight" || e.key === "n" || e.key === "N") && onNext) { e.preventDefault(); onNext(); }
      if ((e.key === "ArrowLeft" || e.key === "p" || e.key === "P") && onPrev) { e.preventDefault(); onPrev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSaveLabels, handleToggleStar, handleReject, onExit, onNext, onPrev]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-mono">
      <div className="max-w-7xl mx-auto px-4 py-3 lg:px-8 lg:py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-3 text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors group"
            aria-label="Back to curator"
          >
            <span className="text-3xl leading-none transition-transform group-hover:-translate-x-1">&larr;</span>
            <span className="text-3xl font-bold uppercase tracking-[0.25em]">CURATOR</span>
          </button>
        </div>

        <CuratorStatsBar stats={stats} />
        <CuratorTabBar activeTab={activeTab} onChange={setActiveTab} />

        <ChannelAuditBody
          channel={auditChannel}
          labels={labels}
          onToggleLabel={toggleLabel}
          onToggleStar={handleToggleStar}
          isStarred={auditChannel.isStarred}
          onBoostUpdated={onBoostUpdated}
        />
      </div>

      {/* Fixed bottom audit action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg)] border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3">
          <div className="flex gap-3 mb-2" role="toolbar" aria-label="Audit actions">
            <button
              ref={saveButtonRef}
              onClick={handleSaveLabels}
              className="relative flex-[2] flex items-center rounded-lg bg-[var(--text)] text-[var(--bg)] transition-all duration-150 hover:opacity-90 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] focus-visible:ring-[var(--text)] overflow-hidden outline-none"
            >
              <div className="flex-1 flex items-center justify-between px-4 py-2.5">
                <span className="text-sm font-bold uppercase tracking-[0.15em]">
                  {saveFlash ? "SAVED ✓" : "SAVE LABELS"}
                </span>
                <kbd className="text-[9px] font-normal opacity-60 border border-current/20 px-1.5 py-0.5 rounded-sm">
                  L
                </kbd>
              </div>
            </button>
            <button
              onClick={handleReject}
              className="relative flex-1 flex items-center rounded-lg bg-[var(--bg-alt)] text-[var(--text-muted)] border border-[var(--border)] transition-all duration-150 hover:text-[var(--text)] hover:border-[var(--text-muted)] active:scale-[0.97]"
            >
              <div className="flex-1 flex items-center justify-between px-3 py-2.5">
                <span className="text-xs font-bold uppercase tracking-wider">
                  &times; REJECT
                </span>
                <kbd className="text-[9px] font-normal opacity-40 border border-[var(--border)] px-1.5 py-0.5 rounded-sm">
                  R
                </kbd>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onPrev}
              disabled={!onPrev}
              className="inline-flex items-center gap-1 py-1.5 px-3 text-[11px] uppercase tracking-wider text-[var(--text-muted)] rounded-md border border-[var(--border)] transition-all duration-100 hover:border-[var(--text-muted)] hover:text-[var(--text)] active:scale-[0.93] disabled:opacity-30 disabled:cursor-default"
              aria-label="Previous channel"
            >
              ← PREV
              <kbd className="text-[9px] opacity-50 border border-current/30 px-1 py-0.5 ml-1 rounded-sm">P</kbd>
            </button>
            <button
              onClick={onNext}
              disabled={!onNext}
              className="inline-flex items-center gap-1 py-1.5 px-3 text-[11px] uppercase tracking-wider text-[var(--text-muted)] rounded-md border border-[var(--border)] transition-all duration-100 hover:border-[var(--text-muted)] hover:text-[var(--text)] active:scale-[0.93] disabled:opacity-30 disabled:cursor-default"
              aria-label="Next channel"
            >
              NEXT →
              <kbd className="text-[9px] opacity-50 border border-current/30 px-1 py-0.5 ml-1 rounded-sm">N</kbd>
            </button>
            {position && (
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider tabular-nums ml-1">
                {position.current} / {position.total}
              </span>
            )}
            <button
              onClick={onExit}
              className="py-1.5 px-4 text-[11px] uppercase tracking-wider text-[var(--text-muted)] rounded-none border border-transparent transition-all duration-100 hover:border-[var(--border)] hover:text-[var(--text)] active:scale-[0.93]"
            >
              <span className="inline-flex items-center gap-2">
                &larr; BACK{" "}
                <kbd className="text-[9px] opacity-40 border border-[var(--border)] px-1 py-0.5">
                  ESC
                </kbd>
              </span>
            </button>
            <div className="ml-auto flex items-center gap-3 text-[var(--text-muted)] text-[11px] tracking-wider uppercase">
              <span>
                <kbd className="text-[9px] opacity-50 border border-[var(--border)] px-1 py-0.5 rounded-sm mr-1">
                  L
                </kbd>
                Save
              </span>
              <span>
                <kbd className="text-[9px] opacity-50 border border-[var(--border)] px-1 py-0.5 rounded-sm mr-1">
                  R
                </kbd>
                Reject
              </span>
              <span>
                <kbd className="text-[9px] opacity-50 border border-[var(--border)] px-1 py-0.5 rounded-sm mr-1">
                  F
                </kbd>
                Star
              </span>
              <span>
                <kbd className="text-[9px] opacity-50 border border-[var(--border)] px-1 py-0.5 rounded-sm mr-1">
                  X
                </kbd>
                Rescan
              </span>
              <span>
                <kbd className="text-[9px] opacity-50 border border-[var(--border)] px-1 py-0.5 rounded-sm mr-1">
                  B
                </kbd>
                Back
              </span>
            </div>
          </div>
        </div>
      </div>

      <RejectModal
        open={rejectModalOpen}
        channelName={channel.name}
        onCancel={() => setRejectModalOpen(false)}
        onConfirm={confirmReject}
      />
    </div>
  );
}
