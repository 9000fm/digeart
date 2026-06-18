// Snapshot the live feed pools into a static fallback file (src/data/fallback-pool.json).
// This file is served as the LAST layer when Supabase is slow/empty, so the feed is
// NEVER blank ("Volvemos pronto") on a DB blip. Re-run occasionally to keep it fresh —
// it just copies the existing pool from the DB (no YouTube, no quota).
//
//   node scripts/export-pool.mjs
//
// Reads pool_cache directly via the service key (no 8s app timeout), so it can capture
// the snapshot even while the DB is sluggish, as long as it answers at all.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(url, secret, { auth: { persistSession: false } });

// Cap per pool: this is a last-resort blip fallback, not the whole library.
// A few hundred fills the grid many times over; the full pool would bloat the
// serverless bundle (19MB+) and slow cold starts.
const CAP = 1000;

const out = {};
for (const key of ["discover", "mixes", "samples"]) {
  try {
    const { data, error } = await sb.from("pool_cache").select("data").eq("key", key).single();
    if (error) { console.warn(`${key}: ${error.message}`); out[key] = []; continue; }
    const all = Array.isArray(data?.data) ? data.data : [];
    out[key] = all.slice(0, CAP);
    console.log(`${key}: ${out[key].length} cards${all.length > CAP ? ` (capped from ${all.length})` : ""}`);
  } catch (e) {
    console.warn(`${key}: ${e}`);
    out[key] = [];
  }
}

const total = Object.values(out).reduce((n, a) => n + a.length, 0);
if (total === 0) {
  console.error("\nGot 0 cards — DB unreadable right now. Fallback NOT overwritten. Try again when the DB is healthier.");
  process.exit(2);
}

fs.writeFileSync("src/data/fallback-pool.json", JSON.stringify(out) + "\n");
console.log(`\nwrote src/data/fallback-pool.json (${total} cards total)`);
