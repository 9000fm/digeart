"use client";

import { useState, useCallback, useEffect } from "react";
import type { ApprovedChannel, ActivityTier, BoostState, Upload } from "../types";
import { GenreLabels } from "./GenreLabels";
import { ChannelUploadGrid } from "./ChannelUploadGrid";
import { ActivityDot } from "./ActivityDot";
import { formatChannelCount, formatLastUpload } from "@/lib/curator-activity";
import { useCuratorToast } from "../hooks/useCuratorToast";

interface ChannelAuditBodyProps {
  channel: ApprovedChannel;
  labels: Set<string>;
  onToggleLabel: (label: string) => void;
  onToggleStar?: () => void;
  isStarred?: boolean;
  /** Extra content rendered below the header (e.g. progress indicator) */
  headerExtra?: React.ReactNode;
  onBoostUpdated?: (channelId: string, newState: BoostState) => void;
}

export function ChannelAuditBody({
  channel,
  labels,
  onToggleLabel,
  onToggleStar,
  isStarred,
  headerExtra,
  onBoostUpdated,
}: ChannelAuditBodyProps) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    activityTier: ActivityTier | null;
    lastUploadAt: string | null;
    totalUploads: number | null;
    subscriberCount: number | null;
  }>({
    activityTier: channel.activityTier ?? null,
    lastUploadAt: channel.lastUploadAt ?? null,
    totalUploads: channel.totalUploads ?? null,
    subscriberCount: channel.subscriberCount ?? null,
  });
  const [boostState, setBoostState] = useState<BoostState>(channel.boostState ?? "default");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { showToast } = useCuratorToast();

  const fetchUploads = useCallback(async () => {
    setLoading(true);
    setPlayingId(null);
    setFetchError(null);
    try {
      const res = await fetch(
        `/api/curator?rescan=true&channelId=${channel.id}`
      );
      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter = res.headers.get("Retry-After");
          const msg = `Rate limited — retry in ${retryAfter || "a moment"}s`;
          showToast(msg, "error");
          setFetchError(msg);
        } else {
          showToast("Rescan failed", "error");
          setFetchError("Rescan failed — try again");
        }
        setUploads([]);
        return;
      }
      const json = await res.json();
      setUploads(json.uploads || []);
      setMeta({
        activityTier: json.activityTier ?? null,
        lastUploadAt: json.lastUploadAt ?? null,
        totalUploads: json.totalUploads ?? null,
        subscriberCount: json.subscriberCount ?? null,
      });
    } catch {
      setUploads([]);
      showToast("Network error — rescan failed", "error");
      setFetchError("Network error — try again");
    }
    setLoading(false);
  }, [channel.id, showToast]);

  const handleSetBoost = useCallback(async (newState: BoostState) => {
    if (newState === boostState) return; // no-op if same
    const previous = boostState;
    setBoostState(newState); // optimistic
    onBoostUpdated?.(channel.id, newState);
    try {
      const res = await fetch("/api/curator", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateBoostState",
          channelId: channel.id,
          boostState: newState,
        }),
      });
      if (!res.ok) {
        // Rollback both local + parent
        setBoostState(previous);
        onBoostUpdated?.(channel.id, previous);
        showToast("Boost update failed", "error");
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (json.warning === "migration_pending") {
        setBoostState(previous);
        onBoostUpdated?.(channel.id, previous);
        showToast("boost_state column missing — apply the migration", "error");
        return;
      }
      const labelMap: Record<BoostState, string> = { boost: "Boosted", default: "Reset to default", bury: "Buried" };
      showToast(labelMap[newState], "success");
    } catch {
      setBoostState(previous);
      onBoostUpdated?.(channel.id, previous);
      showToast("Network error — boost unchanged", "error");
    }
  }, [boostState, channel.id, onBoostUpdated, showToast]);

  // Fetch on mount and when channel changes
  useEffect(() => {
    fetchUploads(); // eslint-disable-line react-hooks/set-state-in-effect -- fetch-on-mount is intentional
  }, [fetchUploads]);

  // X keyboard shortcut for rescan
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "x" || e.key === "X") fetchUploads();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fetchUploads]);

  return (
    <>
      {/* Channel info card */}
      <div className="mb-3 p-4 bg-[var(--bg-alt)]/40 border border-[var(--border)] rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <ActivityDot tier={meta.activityTier} lastUploadAt={meta.lastUploadAt} size="md" />
          <h2 className="text-2xl font-bold tracking-tight">{channel.name}</h2>
          {onToggleStar && (
            <button
              onClick={onToggleStar}
              className={`text-2xl leading-none transition-all duration-200 active:scale-150 ${
                isStarred
                  ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                  : "text-[var(--text-muted)]/30 hover:text-amber-400"
              }`}
              title={isStarred ? "Unstar (F)" : "Star (F)"}
              aria-label={isStarred ? "Unstar this channel" : "Star this channel"}
            >
              {isStarred ? "\u2605" : "\u2606"}
            </button>
          )}
          {isStarred && (
            <span className="text-[9px] text-amber-400 uppercase tracking-[0.2em] font-bold animate-pulse">
              STARRED
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <a
              href={`https://www.youtube.com/channel/${channel.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)] no-underline bg-transparent border border-[var(--border)] hover:border-[var(--text-muted)] rounded-lg transition-all"
            >
              YouTube ↗
            </a>
            <button
              onClick={fetchUploads}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)] bg-transparent border border-[var(--border)] hover:border-[var(--text-muted)] rounded-lg transition-all disabled:opacity-40"
            >
              {loading ? "..." : "Rescan"}
            </button>
          </div>
        </div>
        {(meta.subscriberCount != null || meta.totalUploads != null || meta.lastUploadAt) && (
          <div className="flex items-center gap-2 flex-wrap">
            {meta.subscriberCount != null && (
              <div className="flex items-baseline gap-1.5 px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                <span className="font-mono text-sm font-bold text-[var(--text)] tabular-nums">{formatChannelCount(meta.subscriberCount)}</span>
                <span className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-wider">subs</span>
              </div>
            )}
            {meta.totalUploads != null && (
              <div className="flex items-baseline gap-1.5 px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                <span className="font-mono text-sm font-bold text-[var(--text)] tabular-nums">{formatChannelCount(meta.totalUploads)}</span>
                <span className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-wider">uploads</span>
              </div>
            )}
            {meta.lastUploadAt && (
              <div className="flex items-baseline gap-1.5 px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                <span className="font-mono text-sm font-bold text-[var(--text)] tabular-nums">{formatLastUpload(meta.lastUploadAt)}</span>
                <span className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-wider">last upload</span>
              </div>
            )}
          </div>
        )}
        {headerExtra}
      </div>

      <GenreLabels selected={labels} onToggle={onToggleLabel} />

      {/* Boost / default / bury — drives feed weight in pool builder */}
      <div className="my-3">
        <div className="inline-flex border border-[var(--border)] rounded-lg overflow-hidden font-mono text-[10px] font-bold uppercase tracking-wider">
          {(["bury", "default", "boost"] as const).map((state, i, arr) => {
            const active = boostState === state;
            const label = state === "bury" ? "↓ BURY" : state === "boost" ? "↑ BOOST" : "— DEFAULT";
            return (
              <button
                key={state}
                onClick={() => handleSetBoost(state)}
                className={`px-4 py-2 transition-all ${
                  i < arr.length - 1 ? "border-r border-[var(--border)]" : ""
                } ${
                  active
                    ? "bg-[var(--text)] text-[var(--bg)]"
                    : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]"
                }`}
                aria-pressed={active}
                aria-label={`Set channel boost to ${state}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pb-36">
        <h3 className="text-[11px] text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2">
          UPLOADS
        </h3>
        {fetchError && !loading ? (
          <div className="text-center py-12 border border-[var(--border)] rounded-lg bg-[var(--bg-alt)]/30">
            <p className="text-[var(--text)] text-sm font-mono mb-1">{fetchError}</p>
            <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider mb-4">channel data not loaded</p>
            <button
              onClick={fetchUploads}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider bg-[var(--text)] text-[var(--bg)] rounded-lg hover:opacity-90 active:scale-[0.97] transition-all"
            >
              Retry
            </button>
          </div>
        ) : (
        <ChannelUploadGrid
          uploads={uploads}
          playingVideoId={playingId}
          setPlayingVideoId={setPlayingId}
          loading={loading}
          onRescan={fetchUploads}
        />
        )}
      </div>
    </>
  );
}
