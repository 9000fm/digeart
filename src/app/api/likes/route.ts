import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { dbCircuitOpen, tripDbCircuit, withDbTimeout } from "@/lib/dbGuard";

// All likes access goes through here so the browser never touches the `likes`
// table directly. The user's email is ALWAYS taken from the authenticated
// session — never from the request body — so a client can only ever read/write
// its own rows. Returns 401 when not signed in. Once this is live, RLS on
// `likes` can deny the anon key entirely (the admin client bypasses RLS).

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // DB wedged — fail fast so the saved view degrades instead of hanging.
  if (dbCircuitOpen()) return NextResponse.json({ rows: [], degraded: true });

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  try {
    const { data, error } = await withDbTimeout(
      supabaseAdmin()
        .from("likes")
        .select("video_id, card_data, deleted_at")
        .eq("user_email", email)
        .or("deleted_at.is.null,deleted_at.gte." + sevenDaysAgo)
        .order("created_at", { ascending: false })
    );
    if (error) return NextResponse.json({ rows: [], degraded: true });
    return NextResponse.json({ rows: data ?? [] });
  } catch {
    tripDbCircuit(); // timeout → cool off before hitting the DB again
    return NextResponse.json({ rows: [], degraded: true });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action: string | undefined = body?.action;
  const videoId: string | undefined = body?.videoId;
  const db = supabaseAdmin();

  switch (action) {
    case "save": {
      if (!videoId || !body?.cardData) {
        return NextResponse.json({ error: "Bad request" }, { status: 400 });
      }
      const { error } = await db.from("likes").upsert(
        { user_email: email, video_id: videoId, card_data: body.cardData, deleted_at: null },
        { onConflict: "user_email,video_id" }
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    case "unlike": {
      if (!videoId) return NextResponse.json({ error: "Bad request" }, { status: 400 });
      const { error } = await db.from("likes")
        .update({ deleted_at: new Date().toISOString() })
        .eq("user_email", email).eq("video_id", videoId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    case "restore": {
      if (!videoId) return NextResponse.json({ error: "Bad request" }, { status: 400 });
      const { error } = await db.from("likes")
        .update({ deleted_at: null })
        .eq("user_email", email).eq("video_id", videoId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    case "hardDelete": {
      if (!videoId) return NextResponse.json({ error: "Bad request" }, { status: 400 });
      const { error } = await db.from("likes")
        .delete()
        .eq("user_email", email).eq("video_id", videoId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    case "clearRemoved": {
      const { error } = await db.from("likes")
        .delete()
        .eq("user_email", email).not("deleted_at", "is", null);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
