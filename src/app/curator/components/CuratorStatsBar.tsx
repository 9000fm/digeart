"use client";

import { useState, useEffect } from "react";
import type { CuratorStats } from "../types";
import { useCuratorToast } from "../hooks/useCuratorToast";

interface CuratorStatsBarProps {
  stats: CuratorStats | null;
  /** Bulk-rescan state (owned by the page, shared with the approved-list overlay). */
  rescanRunning?: boolean;
  rescanDone?: number;
  rescanTotal?: number;
  rescanFinishedMsg?: string | null;
  /** Counts for the two rescan targets. */
  allCount?: number;
  staleCount?: number;
  /** Triggers. */
  onRescanAll?: () => void;
  onRescanStale?: () => void;
}

function formatLastSaved(ts: number | null, now: number): string {
  if (!ts) return "no changes yet";
  const diffSec = Math.floor((now - ts) / 1000);
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

export function CuratorStatsBar({
  stats,
  rescanRunning = false,
  rescanDone = 0,
  rescanTotal = 0,
  rescanFinishedMsg = null,
  allCount = 0,
  staleCount = 0,
  onRescanAll,
  onRescanStale,
}: CuratorStatsBarProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);
  const { lastSavedAt } = useCuratorToast();
  const [now, setNow] = useState(() => Date.now());

  // Tick every 10s so "Xs ago" stays current
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(interval);
  }, []);

  async function handleRefreshPool() {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await fetch("/api/curator/refresh-pool", { method: "POST" });
      if (res.ok) {
        setRefreshMsg("Pool cleared — rebuilds on next load");
      } else {
        setRefreshMsg("Failed to refresh");
      }
    } catch {
      setRefreshMsg("Failed to refresh");
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshMsg(null), 4000);
    }
  }

  function handleRescanAll() {
    if (rescanRunning || allCount === 0) return;
    if (!window.confirm(`Rescan all ${allCount} approved channels? Recomputes every activity tier. Takes a few minutes.`)) return;
    onRescanAll?.();
  }

  function handleRescanStale() {
    if (rescanRunning) return;
    if (staleCount === 0) return;
    if (!window.confirm(`Rescan ${staleCount} grey + stale channels (unscanned or 30+ days old)?`)) return;
    onRescanStale?.();
  }

  if (!stats) return null;

  return (
    <div className="flex items-center gap-2 mb-4 text-[11px] font-mono text-[var(--text-muted)] tracking-wider flex-wrap">
      <span className="text-[var(--text)] font-bold">{stats.imported}</span> imported
      <span className="opacity-30">/</span>
      <span className="text-[var(--text)] font-bold">{stats.approved}</span> approved
      <span className="opacity-30">/</span>
      <span className="text-[var(--text-secondary)] font-bold">{stats.pending}</span> pending
      <span className="opacity-30">/</span>
      <span className="font-bold">{stats.rejected}</span> rejected
      <span className="opacity-30 mx-1">|</span>
      <button
        onClick={handleRefreshPool}
        disabled={refreshing}
        className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors uppercase disabled:opacity-40"
      >
        {refreshing ? "refreshing..." : "refresh pool"}
      </button>
      {refreshMsg && (
        <span className="text-[var(--text)]">{refreshMsg}</span>
      )}
      <span className="opacity-30 mx-1">|</span>
      {rescanRunning ? (
        <span className="text-[var(--accent)] uppercase tabular-nums">scanning {rescanDone}/{rescanTotal}</span>
      ) : (
        <>
          <button
            onClick={handleRescanAll}
            disabled={allCount === 0}
            className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors uppercase disabled:opacity-40"
          >
            rescan all
          </button>
          <span className="opacity-30">·</span>
          <button
            onClick={handleRescanStale}
            disabled={staleCount === 0}
            className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors uppercase disabled:opacity-40"
            title="grey + stale (unscanned or 30+ days old)"
          >
            rescan stale{staleCount > 0 ? ` (${staleCount})` : ""}
          </button>
        </>
      )}
      {rescanFinishedMsg && (
        <span className="text-[var(--text)] lowercase">{rescanFinishedMsg}</span>
      )}
      <span className="opacity-30 mx-1">|</span>
      <span className="text-[var(--text-muted)] uppercase">
        synced <span className="text-[var(--text)] font-bold tabular-nums">{formatLastSaved(lastSavedAt, now)}</span>
      </span>
    </div>
  );
}
