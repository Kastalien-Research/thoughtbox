/**
 * Observatory Channel - Global session discovery
 *
 * Handles global events and session listing.
 *
 * Events (Server → Client):
 * - sessions:active    List of active sessions (on join)
 * - sessions:list      Response to list request
 * - session:started    New session notification
 * - session:ended      Session completed notification
 *
 * Events (Client → Server):
 * - list:sessions      Request session list
 * - list:active        Request active sessions only
 */

import { z } from "zod";
import { Channel } from "../channel.js";
import { thoughtEmitter } from "../emitter.js";
import type { WebSocketServer } from "../ws-server.js";
import { sessionStore } from "./reasoning.js";

/**
 * List sessions request schema
 */
const ListSessionsRequestSchema = z.object({
  status: z.enum(["active", "completed", "abandoned", "all"]).optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

/**
 * Create and register the observatory channel
 */
export function createObservatoryChannel(wss: WebSocketServer): Channel {
  const channel = new Channel("observatory");

  // Handle subscription - send active sessions
  channel.onJoin(async ({ send }) => {
    const activeSessions = sessionStore.getActiveSessions();
    send("sessions:active", { sessions: activeSessions });
  });

  // Handle list:sessions request
  channel.on("list:sessions", ListSessionsRequestSchema, async ({ send }, payload) => {
    let sessions = sessionStore.getAllSessions();

    // Filter by status
    if (payload.status && payload.status !== "all") {
      sessions = sessions.filter((s) => s.status === payload.status);
    }

    // Apply pagination
    const offset = payload.offset || 0;
    const limit = payload.limit || 50;
    sessions = sessions.slice(offset, offset + limit);

    send("sessions:list", { sessions });
  });

  // Handle list:active request (convenience method)
  channel.on("list:active", z.object({}), async ({ send }) => {
    const sessions = sessionStore.getActiveSessions();
    send("sessions:active", { sessions });
  });

  // Wire up emitter events to WebSocket broadcasts
  thoughtEmitter.on("session:started", (data) => {
    wss.broadcast("observatory", "session:started", {
      session: data.session,
    });
  });

  thoughtEmitter.on("session:ended", (data) => {
    wss.broadcast("observatory", "session:ended", {
      sessionId: data.sessionId,
      finalThoughtCount: data.finalThoughtCount,
    });
  });

  return channel;
}
