import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.YOUTUBE_API_KEY!;
const YT_API = "https://www.googleapis.com/youtube/v3";

// Per-IP rate limit (per-process, resets on deploy) — caps quota abuse on this public route.
const rateLimitMap = new Map<string, number[]>();
function checkRateLimit(key: string, maxCalls: number, windowMs: number): boolean {
  const now = Date.now();
  const calls = (rateLimitMap.get(key) || []).filter((t) => now - t < windowMs);
  if (calls.length >= maxCalls) return false;
  calls.push(now);
  rateLimitMap.set(key, calls);
  return true;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!checkRateLimit(ip, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
  }

  const params = new URLSearchParams({
    part: "snippet",
    id,
    key: API_KEY,
    fields: "items(snippet/description)",
  });

  const res = await fetch(`${YT_API}/videos?${params}`, {
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "YouTube API error" }, { status: 502 });
  }

  const data = await res.json();
  const description = data.items?.[0]?.snippet?.description ?? null;

  return NextResponse.json({ description });
}
