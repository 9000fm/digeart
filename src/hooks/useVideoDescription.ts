"use client";

import { useState, useCallback } from "react";

/**
 * Lazy-load a video description from /api/video-info.
 * Call `fetchDescription()` when the info popover opens.
 * Resets automatically when videoId changes via key comparison.
 */
export function useVideoDescription(
  videoId: string | null | undefined,
  existingDescription: string | null | undefined,
) {
  const [cache, setCache] = useState<Record<string, string | null>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchDescription = useCallback(() => {
    if (!videoId || existingDescription || cache[videoId] !== undefined || loadingId === videoId) return;
    setLoadingId(videoId);
    const vid = videoId;
    fetch(`/api/video-info?id=${vid}`)
      .then((r) => r.json())
      .then((data) => {
        setCache((prev) => ({ ...prev, [vid]: data.description ?? null }));
      })
      .catch(() => {
        setCache((prev) => ({ ...prev, [vid]: null }));
      })
      .finally(() => {
        setLoadingId((prev) => (prev === vid ? null : prev));
      });
  }, [videoId, existingDescription, cache, loadingId]);

  const description = existingDescription ?? (videoId ? cache[videoId] ?? null : null);
  const loading = loadingId === videoId;

  return { description, loading, fetchDescription };
}
