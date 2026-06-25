/* ── Shared DB guard: timeout + circuit breaker ───────────────────────────
 * Saved/playlists routes import this so they degrade gracefully like discover
 * does, instead of hanging when the free-tier DB wedges. It SHARES STATE with
 * the breaker in youtube.ts via the same `globalThis.__digeartDbOpenUntil` key
 * — so one timeout anywhere cools off the DB everywhere. youtube.ts keeps its
 * own copy untouched (zero risk to the working discover path). */

const DB_QUERY_TIMEOUT = 8_000; // ms — a healthy query answers in <1s
const DB_CIRCUIT_COOLOFF = 30_000; // ms — skip the DB this long after a timeout

const dbBreaker = globalThis as typeof globalThis & { __digeartDbOpenUntil?: number };

export function dbCircuitOpen(): boolean {
  return (dbBreaker.__digeartDbOpenUntil ?? 0) > Date.now();
}

export function tripDbCircuit(): void {
  dbBreaker.__digeartDbOpenUntil = Date.now() + DB_CIRCUIT_COOLOFF;
}

/** Run a Supabase query with a hard timeout. Rejects (→ trip breaker) on hang. */
export function withDbTimeout<T>(query: PromiseLike<T>): Promise<T> {
  return Promise.race([
    Promise.resolve(query),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("db-timeout")), DB_QUERY_TIMEOUT)
    ),
  ]);
}
