#!/usr/bin/env tsx
/**
 * Thoughtbox Supabase monitor
 *
 * Tails Thoughtbox writes (sessions + thoughts) to Supabase so you can watch
 * what an agent is producing while a probe runs. Connects with the service-role
 * key from `.env` (read-only usage) and polls for new rows.
 *
 * Usage:
 *   npx tsx scripts/probes/monitor.ts                 # tail new activity from now
 *   npx tsx scripts/probes/monitor.ts --since 15      # also backfill last 15 min
 *   npx tsx scripts/probes/monitor.ts --once          # one snapshot, then exit
 *   npx tsx scripts/probes/monitor.ts --interval 1    # poll every 1s (default 2)
 *
 * Typical use: run this in one terminal, run a probe in another.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config();

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const hasFlag = (flag: string): boolean => process.argv.includes(flag);

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.");
  process.exit(1);
}

const sinceMin = Number(argValue("--since") ?? 0);
const intervalMs = Number(argValue("--interval") ?? 2) * 1000;
const once = hasFlag("--once");

const sb = createClient(url, key, { auth: { persistSession: false } });

// Watermarks: only print rows newer than what we've already shown.
let lastThoughtTs = new Date(Date.now() - sinceMin * 60_000).toISOString();
let lastSessionTs = lastThoughtTs;

const short = (id: string): string => id.slice(0, 8);
const trunc = (s: string, n = 80): string =>
  (s ?? "").replace(/\s+/g, " ").slice(0, n);

async function poll(): Promise<void> {
  const { data: sessions, error: sErr } = await sb
    .from("sessions")
    .select("id,title,status,thought_count,created_at")
    .gt("created_at", lastSessionTs)
    .order("created_at", { ascending: true });
  if (sErr) console.error(`[sessions] ${sErr.message}`);
  for (const s of sessions ?? []) {
    console.log(
      `\x1b[36m+ session\x1b[0m ${short(s.id)}  [${s.status}]  ${s.thought_count} thoughts  "${trunc(s.title, 60)}"`,
    );
    lastSessionTs = s.created_at;
  }

  const { data: thoughts, error: tErr } = await sb
    .from("thoughts")
    .select("id,session_id,thought_number,thought_type,agent_name,thought,timestamp")
    .gt("timestamp", lastThoughtTs)
    .order("timestamp", { ascending: true });
  if (tErr) console.error(`[thoughts] ${tErr.message}`);
  for (const t of thoughts ?? []) {
    const who = t.agent_name ? ` <${t.agent_name}>` : "";
    console.log(
      `\x1b[32m  · thought\x1b[0m ${short(t.session_id)} #${t.thought_number} (${t.thought_type})${who}: ${trunc(t.thought)}`,
    );
    lastThoughtTs = t.timestamp;
  }
}

console.log(`monitoring ${new URL(url).host}  (interval ${intervalMs / 1000}s, backfill ${sinceMin}m)`);
console.log("waiting for Thoughtbox writes… (Ctrl+C to stop)\n");

await poll();
if (!once) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await new Promise((r) => setTimeout(r, intervalMs));
    await poll();
  }
}
