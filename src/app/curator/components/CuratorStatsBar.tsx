"use client";

import { useState } from "react";
import type { CuratorStats } from "../types";

interface CuratorStatsBarProps {
  stats: CuratorStats | null;
}

export function CuratorStatsBar({ stats }: CuratorStatsBarProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

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

  if (!stats) return null;

  return (
    <div className="flex items-center gap-2 mb-4 text-[11px] font-mono text-[var(--text-muted)] tracking-wider">
      <span className="text-[var(--text)] font-bold">{stats.imported}</span> imported
      <span className="opacity-30">/</span>
      <span className="text-emerald-500 font-bold">{stats.approved}</span> approved
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
        <span className="text-emerald-500">{refreshMsg}</span>
      )}
    </div>
  );
}
