// Thin client wrapper over /api/likes. The browser never reads or writes the
// `likes` table directly — every call goes through the server route, which
// derives the user from the session. Email is never sent from here.

export interface LikeRow {
  video_id: string;
  card_data: unknown;
  deleted_at: string | null;
}

export async function fetchLikes(): Promise<LikeRow[]> {
  // Abort if the route hangs (e.g. DB wedged) so the saved view fails fast
  // instead of freezing for the browser's default ~30s timeout.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch("/api/likes", { signal: controller.signal });
    if (!res.ok) throw new Error("Failed to load likes: " + res.status);
    const json = await res.json();
    return (json.rows ?? []) as LikeRow[];
  } finally {
    clearTimeout(timeout);
  }
}

export function likeAction(
  action: "save" | "unlike" | "restore" | "hardDelete" | "clearRemoved",
  payload: Record<string, unknown> = {}
): Promise<Response> {
  return fetch("/api/likes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
}
