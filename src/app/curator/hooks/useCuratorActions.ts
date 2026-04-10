import { useState, useCallback, useRef } from "react";
import type { CuratorData, Upload } from "../types";
import { useCuratorToast } from "./useCuratorToast";

interface HistoryEntry {
  id: string;
  name: string;
  decision: string;
  labels: string[];
  uploads: Upload[];
  wasStarred: boolean;
}

interface UseCuratorActionsProps {
  data: CuratorData | null;
  setData: React.Dispatch<React.SetStateAction<CuratorData | null>>;
  selectedLabels: Set<string>;
  notes: string;
  isStarred: boolean;
  setIsStarred: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedLabels: React.Dispatch<React.SetStateAction<Set<string>>>;
  setPlayingVideoId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useCuratorActions({
  data,
  setData,
  selectedLabels,
  notes,
  isStarred,
  setIsStarred,
  setSelectedLabels,
  setPlayingVideoId,
}: UseCuratorActionsProps) {
  const [acting, setActing] = useState(false);
  const actingRef = useRef(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [rescanning, setRescanning] = useState(false);
  const { showToast } = useCuratorToast();

  const handleDecision = useCallback(
    async (decision: "approve" | "reject") => {
      if (!data?.channel || actingRef.current) return;
      actingRef.current = true;
      setActing(true);
      const labelsToSave = decision === "approve" ? Array.from(selectedLabels) : [];
      const labelsForHistory = Array.from(selectedLabels);
      const channelName = data.channel.name;
      setHistory((prev) => [
        ...prev,
        {
          id: data.channel!.id,
          name: data.channel!.name,
          decision,
          labels: labelsForHistory,
          uploads: data.uploads || [],
          wasStarred: isStarred,
        },
      ]);
      try {
        const res = await fetch("/api/curator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId: data.channel.id,
            channelName: data.channel.name,
            decision,
            labels: labelsToSave,
            notes: notes || undefined,
          }),
        });
        if (!res.ok) {
          showToast(`${decision === "approve" ? "Approve" : "Reject"} failed`, "error");
        } else {
          showToast(`${decision === "approve" ? "Approved" : "Rejected"}: ${channelName}`, "success");
        }
      } catch {
        showToast("Network error — decision not saved", "error");
      }
      actingRef.current = false;
      setActing(false);
    },
    [data, selectedLabels, notes, isStarred, showToast]
  );

  // Navigate back to previous channel (does NOT undo the decision)
  const handleGoBack = useCallback(async () => {
    if (history.length === 0 || actingRef.current) return;

    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setPlayingVideoId(null);
    setSelectedLabels(new Set(last.labels));
    setIsStarred(last.wasStarred);
    setData((prev) => ({
      ...prev,
      reviewed: prev?.reviewed || 0,
      total: prev?.total || 0,
      channel: { name: last.name, id: last.id },
      uploads: last.uploads,
    }));
  }, [history, setData, setIsStarred, setSelectedLabels, setPlayingVideoId]);

  const handleToggleStar = useCallback(async () => {
    if (!data?.channel) return;
    const previousStarred = isStarred;
    const newStarred = !isStarred;
    // Optimistic
    setIsStarred(newStarred);
    try {
      const res = await fetch("/api/curator", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: data.channel.id,
          channelName: data.channel.name,
        }),
      });
      if (!res.ok) {
        // Rollback
        setIsStarred(previousStarred);
        showToast("Star toggle failed", "error");
        return;
      }
      const result = await res.json();
      setData((prev) =>
        prev ? { ...prev, starredCount: result.starredCount } : prev
      );
      showToast(previousStarred ? "Unstarred" : "Starred", "success");
    } catch {
      setIsStarred(previousStarred);
      showToast("Network error — star unchanged", "error");
    }
  }, [data, isStarred, setIsStarred, setData, showToast]);

  const handleRescan = useCallback(async () => {
    if (!data?.channel || rescanning) return;
    setRescanning(true);
    try {
      const res = await fetch(
        `/api/curator?rescan=true&channelId=${data.channel.id}`
      );
      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter = res.headers.get("Retry-After");
          showToast(`Slow down — retry in ${retryAfter || "a moment"}s`, "error");
        } else {
          showToast("Rescan failed", "error");
        }
        return;
      }
      const json = await res.json();
      setData((prev) => prev ? { ...prev, uploads: json.uploads || [], topics: json.topics || [] } : json);
      setPlayingVideoId(null);
      showToast("Rescanned", "success");
    } catch {
      showToast("Network error — rescan failed", "error");
    } finally {
      setRescanning(false);
    }
  }, [data, rescanning, setData, setPlayingVideoId, showToast]);

  return {
    acting,
    history,
    rescanning,
    handleDecision,
    handleGoBack,
    handleToggleStar,
    handleRescan,
  };
}
