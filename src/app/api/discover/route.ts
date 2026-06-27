import { NextRequest, NextResponse, after } from "next/server";
import { discoverFromYouTube, isValidTag, warmDiscoverPool } from "@/lib/youtube";
import type { Tag } from "@/lib/youtube";

export async function GET(req: NextRequest) {
  const limit = Math.min(
    Number(req.nextUrl.searchParams.get("limit") || 30),
    50
  );
  const offset = Number(req.nextUrl.searchParams.get("offset") || 0);
  const rawTag = req.nextUrl.searchParams.get("tag") || "";
  const tags: Tag[] = rawTag.split(",").map((t) => t.trim()).filter(isValidTag);
  const tag: Tag | Tag[] = tags.length <= 1 ? (tags[0] || "all") : tags;
  const genre = req.nextUrl.searchParams.get("genre") || undefined;
  const rotate = parseInt(req.nextUrl.searchParams.get("rotate") || "0", 10) || undefined;
  const q = req.nextUrl.searchParams.get("q") || undefined;

  try {
    const { cards, totalFiltered } = await discoverFromYouTube(limit, offset, tag, genre, rotate, q);

    // After responding, ensure the full pool is warm in memory so the next request
    // serves the full 42k instead of the cold-start seed. No-op once warm.
    after(warmDiscoverPool());

    return NextResponse.json(
      {
        cards,
        hasMore: offset + cards.length < totalFiltered,
      },
      {
        // Edge-cache the feed: a burst of visitors is served from Vercel's CDN
        // instead of each cold instance re-reading the pool from the DB. The feed
        // is identical per (tag, offset, rotate-bucket, genre) — all in the URL —
        // so the CDN shares one copy; rotate-bucket keeps it feeling fresh.
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("Discover API error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
