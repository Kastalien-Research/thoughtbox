/**
 * Background queue worker: thought_processing (pgmq) → archive + Realtime signal.
 *
 * NOT an MCP surface — invoke only from cron, pg_net, or internal automation (see SUPABASE-INTELLIGENCE.md).
 *
 * Prerequisites:
 * - Migration 20260408033928_add_hub_tables_vectors_pgmq_realtime.sql applied (queue + thoughts.embedding).
 * - RPC wrappers in same migration: pgmq_read_queue, pgmq_archive_queue_message.
 *
 * Embeddings: NOT generated here. The embedding column exists on thoughts but is populated
 * only when a real embedding provider is wired (external API or Cloud Run worker).
 * This worker processes the queue, broadcasts a Realtime event, and archives the message.
 * Embedding generation can be added as a step in processOneMessage when ready.
 *
 * Env:
 * - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto in hosted Edge)
 * - CRON_SECRET (optional): require Authorization: Bearer <CRON_SECRET>
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const QUEUE = "thought_processing";

type QueueRow = {
  msg_id: number;
  read_ct: number;
  enqueued_at: string;
  vt: string;
  message: { thought_id?: string; action?: string; [key: string]: unknown };
};

type ThoughtRow = {
  id: string;
  workspace_id: string;
  session_id: string;
  thought: string;
  embedding: string | null;
};

function assertAuthorized(req: Request): void {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) return;
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${secret}`) {
    throw new HttpError(401, "Unauthorized");
  }
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

async function broadcastProcessingEvent(
  supabase: SupabaseClient,
  workspaceId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const channelName = `intelligence:${workspaceId}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { ack: false } },
    });

    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("Realtime subscribe timeout")), 8000);
      channel.subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(t);
          resolve();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(t);
          reject(err ?? new Error(status));
        }
      });
    });

    try {
      const sendRes = await channel.send({
        type: "broadcast",
        event: "thought_processed",
        payload,
      });
      if (sendRes !== "ok" && (sendRes as { error?: unknown }).error) {
        console.warn("Realtime broadcast:", sendRes);
      }
    } finally {
      await supabase.removeChannel(channel);
    }
  } catch (e) {
    console.warn("broadcastProcessingEvent skipped:", e);
  }
}

function coerceMsgId(row: QueueRow): number {
  const id = row.msg_id as unknown;
  if (typeof id === "number") return id;
  if (typeof id === "string") return Number(id);
  return Number(id);
}

async function processOneMessage(
  supabase: SupabaseClient,
  row: QueueRow,
): Promise<{ ok: boolean; detail: string }> {
  const msgId = coerceMsgId(row);
  const thoughtId = row.message?.thought_id;
  if (!thoughtId || typeof thoughtId !== "string") {
    await supabase.rpc("pgmq_archive_queue_message", {
      queue_name: QUEUE,
      msg_id: msgId,
    });
    return { ok: false, detail: "invalid payload; archived poison message" };
  }

  const { data: thought, error: fetchErr } = await supabase
    .from("thoughts")
    .select("id, workspace_id, session_id, thought, embedding")
    .eq("id", thoughtId)
    .maybeSingle();

  if (fetchErr) {
    console.error("fetch thought", fetchErr);
    return { ok: false, detail: fetchErr.message };
  }
  if (!thought) {
    await supabase.rpc("pgmq_archive_queue_message", {
      queue_name: QUEUE,
      msg_id: msgId,
    });
    return { ok: false, detail: "thought not found; archived" };
  }

  const t = thought as ThoughtRow;

  try {
    // TODO: Wire real embedding provider here.
    // When ready, generate embedding and write to thoughts.embedding:
    //   const vec = await generateEmbedding(t.thought);
    //   await supabase.from("thoughts").update({ embedding: vec }).eq("id", t.id);

    await broadcastProcessingEvent(supabase, t.workspace_id, {
      thought_id: t.id,
      session_id: t.session_id,
      has_embedding: t.embedding != null,
      msg_id: msgId,
    });

    const { data: archived, error: archErr } = await supabase.rpc(
      "pgmq_archive_queue_message",
      { queue_name: QUEUE, msg_id: msgId },
    );

    if (archErr) {
      console.error("archive", archErr);
      return { ok: false, detail: archErr.message };
    }
    if (archived === false) {
      return { ok: false, detail: "archive returned false" };
    }

    return { ok: true, detail: "processed" };
  } catch (e) {
    console.error("processOneMessage", e);
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    assertAuthorized(req);
  } catch (e) {
    if (e instanceof HttpError) {
      return new Response(e.message, { status: e.status });
    }
    throw e;
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", { status: 500 });
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const vt = 30;
  const qty = 5;

  const { data: messages, error: readErr } = await supabase.rpc("pgmq_read_queue", {
    queue_name: QUEUE,
    vt,
    qty,
  });

  if (readErr) {
    console.error("pgmq_read_queue", readErr);
    return new Response(JSON.stringify({ error: readErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const batch = (messages ?? []) as QueueRow[];
  const results: { msg_id: number; ok: boolean; detail: string }[] = [];

  for (const m of batch) {
    const r = await processOneMessage(supabase, m);
    results.push({ msg_id: coerceMsgId(m), ok: r.ok, detail: r.detail });
  }

  return new Response(
    JSON.stringify({ queue: QUEUE, read: batch.length, results }),
    { headers: { "Content-Type": "application/json" } },
  );
});
