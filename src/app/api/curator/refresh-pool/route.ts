import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cacheDeleteByPrefix } from "@/lib/cache";

export async function POST() {
  // Delete all pool_cache entries — next request triggers rebuild
  const { error } = await supabase.from("pool_cache").delete().neq("key", "");

  if (error) {
    return NextResponse.json({ error: "Failed to clear pool cache" }, { status: 500 });
  }

  // Clear all in-memory pool caches (including genre-specific ones)
  cacheDeleteByPrefix("pool-");

  return NextResponse.json({ success: true, message: "Pool cache cleared. Next page load will rebuild." });
}
