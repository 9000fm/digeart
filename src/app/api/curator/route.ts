import { NextRequest, NextResponse } from "next/server";
import { getChannelUploads, getChannelStats, getOldestUploadDate } from "@/lib/youtube";
import { classifyActivity } from "@/lib/curator-activity";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

// Curator-only auth gate. Returns NextResponse if forbidden, null if allowed.
async function requireCurator(): Promise<NextResponse | null> {
  const session = await auth();
  const curatorEmail = process.env.CURATOR_EMAIL;
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!curatorEmail) {
    // Misconfigured server — fail closed
    return NextResponse.json({ error: "Curator not configured" }, { status: 503 });
  }
  if (session.user.email !== curatorEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// Simple in-memory rate limiter (per-process, resets on deploy)
const rateLimitMap = new Map<string, number[]>();
function checkRateLimit(key: string, maxCalls: number, windowMs: number): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const calls = (rateLimitMap.get(key) || []).filter((t) => now - t < windowMs);
  if (calls.length >= maxCalls) {
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - calls[0])) / 1000) };
  }
  calls.push(now);
  rateLimitMap.set(key, calls);
  return { ok: true };
}

function pickUploads(allUploads: Awaited<ReturnType<typeof getChannelUploads>>) {
  const sorted = [...allUploads].sort(
    (a, b) => (b.viewCount || 0) - (a.viewCount || 0)
  );
  const top3 = sorted.slice(0, 3).map((v) => ({ ...v, isTopViewed: true as const }));
  const rest = sorted.slice(3);
  const shuffled = [...rest].sort(() => Math.random() - 0.5);
  const random6 = shuffled.slice(0, 6).map((v) => ({ ...v, isTopViewed: false as const }));
  return [...top3, ...random6];
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode");
  const rescan = req.nextUrl.searchParams.get("rescan");
  const rescanChannelId = req.nextUrl.searchParams.get("channelId");

  // Stats — single query instead of 6
  if (mode === "stats") {
    const { data: rows } = await supabase
      .from("curator_channels")
      .select("status, starred");

    const stats = { imported: 0, approved: 0, rejected: 0, starred: 0, pending: 0 };
    for (const row of rows || []) {
      stats.imported++;
      if (row.status === "approved") stats.approved++;
      else if (row.status === "rejected") stats.rejected++;
      else if (row.status === "pending" || row.status === "filtered") stats.pending++;
      if (row.starred) stats.starred++;
    }

    return NextResponse.json(stats);
  }

  // Check subs
  if (mode === "check-subs") {
    const session = await auth();
    const accessToken = (session as unknown as { accessToken?: string })?.accessToken;
    if (!session || !accessToken) {
      return NextResponse.json({ newCount: 0, error: "Not authenticated" });
    }

    try {
      const url = new URL("https://www.googleapis.com/youtube/v3/subscriptions");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("mine", "true");
      url.searchParams.set("maxResults", "50");
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return NextResponse.json({ newCount: 0, error: "API error" });

      const data = await res.json();
      const subIds = (data.items || []).map((i: { snippet: { resourceId: { channelId: string } } }) => i.snippet.resourceId.channelId);

      const { data: existing } = await supabase.from("curator_channels").select("channel_id");
      const existingIds = new Set((existing || []).map((c: { channel_id: string }) => c.channel_id));
      const newCount = subIds.filter((id: string) => !existingIds.has(id)).length;

      return NextResponse.json({ newCount });
    } catch {
      return NextResponse.json({ newCount: 0, error: "Check failed" });
    }
  }

  // Filtered channels
  if (mode === "filtered") {
    const { data: channels } = await supabase
      .from("curator_channels")
      .select("channel_id, name, notes, imported_at")
      .eq("status", "filtered")
      .order("imported_at", { ascending: false });

    return NextResponse.json({
      channels: (channels || []).map((c) => ({
        name: c.name,
        id: c.channel_id,
        topics: c.notes ? [c.notes] : [],
        importedAt: c.imported_at,
      })),
    });
  }

  // Rejected channels
  if (mode === "rejected") {
    const { data: channels } = await supabase
      .from("curator_channels")
      .select("channel_id, name, reviewed_at, imported_at, notes")
      .eq("status", "rejected")
      .order("name");

    return NextResponse.json({
      channels: (channels || []).map((c) => ({
        name: c.name,
        id: c.channel_id,
        reviewedAt: c.reviewed_at,
        importedAt: c.imported_at,
        notes: c.notes,
      })),
    });
  }

  // Approved channels — try with new activity columns, fall back if migration not applied
  if (mode === "approved") {
    type ApprovedRow = {
      channel_id: string;
      name: string;
      labels?: string[] | null;
      starred?: boolean | null;
      reviewed_at?: string | null;
      notes?: string | null;
      activity_tier?: string | null;
      last_upload_at?: string | null;
      total_uploads?: number | null;
      subscriber_count?: number | null;
      curator_notes?: string | null;
      boost_state?: string | null;
    };
    let channels: ApprovedRow[] | null = null;
    const withMeta = await supabase
      .from("curator_channels")
      .select("channel_id, name, labels, starred, reviewed_at, notes, activity_tier, last_upload_at, total_uploads, subscriber_count, curator_notes, boost_state")
      .eq("status", "approved")
      .order("name");
    if (withMeta.error) {
      // Migration not applied yet — fall back to original columns
      const fallback = await supabase
        .from("curator_channels")
        .select("channel_id, name, labels, starred, reviewed_at, notes")
        .eq("status", "approved")
        .order("name");
      channels = fallback.data;
    } else {
      channels = withMeta.data;
    }

    return NextResponse.json({
      channels: (channels || []).map((c) => ({
        name: c.name,
        id: c.channel_id,
        labels: c.labels || [],
        isStarred: c.starred,
        reviewedAt: c.reviewed_at,
        notes: c.notes,
        activityTier: c.activity_tier ?? null,
        lastUploadAt: c.last_upload_at ?? null,
        totalUploads: c.total_uploads ?? null,
        subscriberCount: c.subscriber_count ?? null,
        curatorNotes: c.curator_notes ?? null,
        boostState: c.boost_state ?? "default",
      })),
    });
  }

  // Pending channels (for Review tab) — same fallback pattern
  if (mode === "pending") {
    type PendingRow = {
      channel_id: string;
      name: string;
      imported_at?: string | null;
      activity_tier?: string | null;
      last_upload_at?: string | null;
      total_uploads?: number | null;
      subscriber_count?: number | null;
    };
    let channels: PendingRow[] | null = null;
    const withMeta = await supabase
      .from("curator_channels")
      .select("channel_id, name, imported_at, activity_tier, last_upload_at, total_uploads, subscriber_count")
      .eq("status", "pending")
      .order("imported_at", { ascending: false });
    if (withMeta.error) {
      const fallback = await supabase
        .from("curator_channels")
        .select("channel_id, name, imported_at")
        .eq("status", "pending")
        .order("imported_at", { ascending: false });
      channels = fallback.data;
    } else {
      channels = withMeta.data;
    }

    return NextResponse.json({
      channels: (channels || []).map((c) => ({
        name: c.name,
        id: c.channel_id,
        importedAt: c.imported_at,
        activityTier: c.activity_tier ?? null,
        lastUploadAt: c.last_upload_at ?? null,
        totalUploads: c.total_uploads ?? null,
        subscriberCount: c.subscriber_count ?? null,
      })),
    });
  }

  // Rescan: fetch uploads + topics for a specific channel
  if (rescan === "true" && rescanChannelId) {
    // Curator-only + rate limit (rescan burns YouTube quota)
    const forbidden = await requireCurator();
    if (forbidden) return forbidden;

    // Curator is auth-gated to a single user; rate limit is mostly for accidental quota protection.
    // 60/min comfortably handles browsing through approved channels with arrow keys.
    const limit = checkRateLimit("curator-rescan", 60, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: `Rate limited — retry in ${limit.retryAfter}s` },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    // Fetch channel row — try with boost_state, fall back if migration not applied
    let chData: { channel_id: string; name: string; starred?: boolean | null; boost_state?: string | null } | null = null;
    const chWithBoost = await supabase
      .from("curator_channels")
      .select("channel_id, name, starred, boost_state")
      .eq("channel_id", rescanChannelId)
      .single();
    if (chWithBoost.error) {
      const fallback = await supabase
        .from("curator_channels")
        .select("channel_id, name, starred")
        .eq("channel_id", rescanChannelId)
        .single();
      chData = fallback.data;
    } else {
      chData = chWithBoost.data;
    }

    if (!chData) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    let allUploads: Awaited<ReturnType<typeof getChannelUploads>> = [];
    try {
      allUploads = await getChannelUploads(rescanChannelId, 50, true, true);
    } catch (e) {
      console.error("Failed to rescan uploads for", chData.name, e);
    }

    // Fetch channel-level stats (subscriber + total uploads) — used for activity classification
    let channelStats: { subscriberCount: number | null; videoCount: number | null } | null = null;
    let oldestUpload: string | null = null;
    try {
      channelStats = await getChannelStats(rescanChannelId);
    } catch { /* ignore */ }
    try {
      oldestUpload = await getOldestUploadDate(rescanChannelId);
    } catch { /* ignore */ }

    // Compute activity tier
    const uploadDates = allUploads.map((u) => u.publishedAt).filter((d): d is string => !!d);
    const lastUploadAt = uploadDates.length > 0
      ? uploadDates.map((d) => new Date(d).getTime()).sort((a, b) => b - a)[0]
      : null;
    const tier = classifyActivity({
      uploadDates,
      totalUploads: channelStats?.videoCount ?? allUploads.length,
      oldestUploadDate: oldestUpload,
    });

    // Update scan info + activity metadata. Try with new columns; fall back to original if migration not applied.
    const fullUpdate = await supabase
      .from("curator_channels")
      .update({
        last_scanned_at: new Date().toISOString(),
        uploads_fetched: allUploads.length,
        activity_tier: tier,
        last_upload_at: lastUploadAt ? new Date(lastUploadAt).toISOString() : null,
        total_uploads: channelStats?.videoCount ?? null,
        oldest_upload_at: oldestUpload,
        subscriber_count: channelStats?.subscriberCount ?? null,
        activity_computed_at: new Date().toISOString(),
      })
      .eq("channel_id", rescanChannelId);
    if (fullUpdate.error) {
      // Migration not applied — fall back to original columns only
      const { error: fallbackErr } = await supabase
        .from("curator_channels")
        .update({
          last_scanned_at: new Date().toISOString(),
          uploads_fetched: allUploads.length,
        })
        .eq("channel_id", rescanChannelId);
      if (fallbackErr) console.error("Failed to update scan info:", fallbackErr);
    }

    const uploads = pickUploads(allUploads);

    // Fetch YouTube topic categories
    let topics: string[] = [];
    try {
      const topicUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
      topicUrl.searchParams.set("part", "topicDetails");
      topicUrl.searchParams.set("id", rescanChannelId);
      topicUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY || "");
      const topicRes = await fetch(topicUrl.toString());
      if (topicRes.ok) {
        const topicData = await topicRes.json();
        const item = topicData.items?.[0];
        if (item?.topicDetails?.topicCategories) {
          topics = item.topicDetails.topicCategories.map((url: string) => {
            const match = url.match(/wiki\/(.+)$/);
            return match ? match[1].replace(/_/g, " ") : url;
          });
        }
      }
    } catch { /* ignore */ }

    const { count: pendingCount } = await supabase
      .from("curator_channels")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    return NextResponse.json({
      channel: { name: chData.name, id: chData.channel_id },
      uploads,
      topics,
      reviewed: 0,
      total: pendingCount || 0,
      isStarred: chData.starred,
      activityTier: tier,
      lastUploadAt: lastUploadAt ? new Date(lastUploadAt).toISOString() : null,
      totalUploads: channelStats?.videoCount ?? null,
      subscriberCount: channelStats?.subscriberCount ?? null,
      boostState: chData.boost_state ?? "default",
    });
  }

  // Default: next unreviewed channel
  const { data: nextChannel } = await supabase
    .from("curator_channels")
    .select("channel_id, name, starred")
    .eq("status", "pending")
    .order("imported_at")
    .limit(1)
    .single();

  if (!nextChannel) {
    const { data: doneRows } = await supabase.from("curator_channels").select("status");
    let total = 0, approvedCount = 0;
    for (const row of doneRows || []) { total++; if (row.status === "approved") approvedCount++; }
    return NextResponse.json({ done: true, reviewed: total, total, approvedCount });
  }

  let allUploads: Awaited<ReturnType<typeof getChannelUploads>> = [];
  try {
    allUploads = await getChannelUploads(nextChannel.channel_id, 50, true, true);
  } catch { /* ignore */ }

  const { error: scanErr2 } = await supabase
    .from("curator_channels")
    .update({ last_scanned_at: new Date().toISOString(), uploads_fetched: allUploads.length })
    .eq("channel_id", nextChannel.channel_id);
  if (scanErr2) console.error("Failed to update scan info:", scanErr2);

  const { data: statusRows } = await supabase
    .from("curator_channels")
    .select("status");
  const counts = { total: 0, approved: 0, pending: 0 };
  for (const row of statusRows || []) {
    counts.total++;
    if (row.status === "approved") counts.approved++;
    else if (row.status === "pending" || row.status === "filtered") counts.pending++;
  }

  return NextResponse.json({
    channel: { name: nextChannel.name, id: nextChannel.channel_id },
    uploads: pickUploads(allUploads),
    reviewed: counts.total - counts.pending,
    total: counts.total,
    remaining: counts.pending,
    approvedCount: counts.approved,
    isStarred: nextChannel.starred,
  });
}

// POST: Record a decision (approve/reject)
export async function POST(req: NextRequest) {
  const forbidden = await requireCurator();
  if (forbidden) return forbidden;

  const body = await req.json();
  const { channelId, decision, labels, notes } = body;
  if (!channelId || !decision || !["approve", "reject"].includes(decision)) {
    return NextResponse.json({ error: "Invalid request: channelId and decision (approve|reject) required" }, { status: 400 });
  }
  const now = new Date().toISOString();

  if (decision === "approve") {
    const { error } = await supabase
      .from("curator_channels")
      .update({
        status: "approved",
        labels: labels || [],
        notes: notes || null,
        reviewed_at: now,
      })
      .eq("channel_id", channelId);
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  } else if (decision === "reject") {
    const { error } = await supabase
      .from("curator_channels")
      .update({
        status: "rejected",
        reviewed_at: now,
        notes: notes || null,
      })
      .eq("channel_id", channelId);
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// PUT: Various actions
const VALID_PUT_ACTIONS = ["sendToPending", "rescueChannel", "rescueFiltered", "rescueToFiltered", "confirmRejectFiltered", "changeDecision", "updateLabels", "undoDecision", "updateCuratorNotes", "updateBoostState"];

export async function PUT(req: NextRequest) {
  const forbidden = await requireCurator();
  if (forbidden) return forbidden;

  const body = await req.json();
  const { action, channelId } = body;
  if (!action || !channelId || !VALID_PUT_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid request: action and channelId required" }, { status: 400 });
  }

  // Send to pending (filtered) from review
  if (action === "sendToPending") {
    const { error } = await supabase
      .from("curator_channels")
      .update({ status: "filtered", notes: "Rejected from Review" })
      .eq("channel_id", channelId);
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Rescue from rejected → pending (music-channels / review)
  if (action === "rescueChannel") {
    const { error } = await supabase
      .from("curator_channels")
      .update({ status: "pending", reviewed_at: null })
      .eq("channel_id", channelId);
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Rescue from filtered → pending (review)
  if (action === "rescueFiltered") {
    const { error } = await supabase
      .from("curator_channels")
      .update({ status: "pending", reviewed_at: null, notes: null })
      .eq("channel_id", channelId);
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Rescue from rejected → filtered (pending review)
  if (action === "rescueToFiltered") {
    const { error } = await supabase
      .from("curator_channels")
      .update({ status: "filtered", notes: "Rescued from Rejected" })
      .eq("channel_id", channelId);
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Confirm reject from filtered → rejected
  if (action === "confirmRejectFiltered") {
    const { error } = await supabase
      .from("curator_channels")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("channel_id", channelId);
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Change decision (from approved → rejected). Preserve labels in case of undo/rescue.
  if (action === "changeDecision") {
    const { error } = await supabase
      .from("curator_channels")
      .update({ status: body.newDecision || "rejected", reviewed_at: new Date().toISOString() })
      .eq("channel_id", channelId);
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Undo last decision — revert channel to pending, clear reviewed_at
  if (action === "undoDecision") {
    const { error } = await supabase
      .from("curator_channels")
      .update({ status: "pending", reviewed_at: null })
      .eq("channel_id", channelId);
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Update labels
  if (action === "updateLabels") {
    if (!Array.isArray(body.labels)) return NextResponse.json({ error: "labels must be an array" }, { status: 400 });
    const { error } = await supabase
      .from("curator_channels")
      .update({ labels: body.labels })
      .eq("channel_id", channelId);
    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Update curator notes (private free-text per channel) — silently no-op if migration not applied
  if (action === "updateCuratorNotes") {
    const notes = typeof body.curatorNotes === "string" ? body.curatorNotes.slice(0, 500) : null;
    const { error } = await supabase
      .from("curator_channels")
      .update({ curator_notes: notes })
      .eq("channel_id", channelId);
    if (error) {
      // Likely missing column (migration not applied) — return ok so the UI doesn't show an error
      console.warn("updateCuratorNotes failed (migration applied?):", error.message);
      return NextResponse.json({ ok: true, warning: "migration_pending" });
    }
    return NextResponse.json({ ok: true });
  }

  // Update boost state (boost / default / bury) — drives pool weighting
  if (action === "updateBoostState") {
    const boostState = body.boostState;
    if (boostState !== "boost" && boostState !== "default" && boostState !== "bury") {
      return NextResponse.json({ error: "boostState must be 'boost' | 'default' | 'bury'" }, { status: 400 });
    }
    const { error } = await supabase
      .from("curator_channels")
      .update({ boost_state: boostState })
      .eq("channel_id", channelId);
    if (error) {
      console.warn("updateBoostState failed (migration applied?):", error.message);
      return NextResponse.json({ ok: true, warning: "migration_pending" });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// PATCH: Toggle star
export async function PATCH(req: NextRequest) {
  const forbidden = await requireCurator();
  if (forbidden) return forbidden;

  const body = await req.json();
  const { channelId } = body;
  if (!channelId) return NextResponse.json({ error: "channelId required" }, { status: 400 });

  const { data: ch } = await supabase
    .from("curator_channels")
    .select("starred")
    .eq("channel_id", channelId)
    .single();

  if (!ch) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newStarred = !ch.starred;
  const { error } = await supabase
    .from("curator_channels")
    .update({ starred: newStarred })
    .eq("channel_id", channelId);
  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });

  return NextResponse.json({ starred: newStarred });
}
