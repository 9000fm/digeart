import { useState, useCallback } from "react";

export interface BulkRescanState {
  running: boolean;
  done: number;
  total: number;
  finishedMsg: string | null;
}

/**
 * Bulk-rescan driver. Loops the existing single-channel rescan endpoint over a
 * list of channel ids, sequentially + lightly throttled to stay gentle on quota.
 * Exposes live progress so both the stats-bar button and the approved-list
 * overlay can read the same state.
 */
export function useBulkRescan(onComplete?: () => void) {
  const [state, setState] = useState<BulkRescanState>({
    running: false,
    done: 0,
    total: 0,
    finishedMsg: null,
  });

  const start = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) {
        setState({ running: false, done: 0, total: 0, finishedMsg: "nothing to rescan" });
        setTimeout(() => setState((s) => ({ ...s, finishedMsg: null })), 4000);
        return;
      }
      setState({ running: true, done: 0, total: ids.length, finishedMsg: null });
      for (let i = 0; i < ids.length; i++) {
        try {
          await fetch(`/api/curator?rescan=true&channelId=${ids[i]}`);
        } catch {
          /* skip failures, keep going */
        }
        setState((s) => ({ ...s, done: i + 1 }));
        await new Promise((r) => setTimeout(r, 120));
      }
      onComplete?.();
      setState({ running: false, done: ids.length, total: ids.length, finishedMsg: `done · ${ids.length} rescanned` });
      setTimeout(() => setState((s) => ({ ...s, finishedMsg: null })), 5000);
    },
    [onComplete]
  );

  return { ...state, start };
}
