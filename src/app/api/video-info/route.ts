import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.YOUTUBE_API_KEY!;
const YT_API = "https://www.googleapis.com/youtube/v3";

export async function GET(req: NextRequest) {
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
