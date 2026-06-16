// One-off: re-export the static fallback approved-channels.json from the live DB.
// The fallback is only used when Supabase returns empty; keeping it current avoids
// serving a stale channel set in that edge case. Read-only on the DB.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await sb
  .from("curator_channels")
  .select("channel_id, name, labels, starred")
  .eq("status", "approved")
  .order("name");

if (error) {
  console.error("Query failed:", error.message);
  process.exit(1);
}

const out = data.map((c) => {
  const o = { name: c.name, id: c.channel_id, labels: c.labels || [] };
  if (c.starred === true) o.starred = true;
  return o;
});

fs.writeFileSync("src/data/approved-channels.json", JSON.stringify(out, null, 2) + "\n");
console.log(`wrote ${out.length} channels (${out.filter((o) => o.starred).length} starred)`);
