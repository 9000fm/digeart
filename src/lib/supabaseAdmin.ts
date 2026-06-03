import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client using the SECRET key (sb_secret_…). It bypasses RLS,
// so once RLS is enabled on curator_channels/pool_cache the server can still
// read/write them while the public anon key cannot.
//
// IMPORTANT: never expose this client-side. It's created LAZILY inside a function
// (not at module load) and guarded by a window check, so even though this module
// may be bundled into client code (youtube.ts is imported by page.tsx), the secret
// client is never instantiated in the browser and the key (a non-public env var)
// is never inlined into the client bundle.
let _admin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("supabaseAdmin() is server-only and must not run in the browser");
  }
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY;
    if (!url || !secret) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
    }
    _admin = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}
