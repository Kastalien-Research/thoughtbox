/**
 * Workspace Channel - Hub event bridge for Observatory
 *
 * Bridges hub-handler events to Observatory WebSocket broadcasts
 * so the GitHub Lite UI can display problems, proposals, and messages
 * in real-time.
 *
 * Events (Server → Client):
 * - hub:event     Hub event (problem_created, proposal_created, message_posted, etc.)
 *
 * Events (Client → Server):
 * - subscribe     Join channel (built-in)
 * - unsubscribe   Leave channel (built-in)
 */

import { Channel } from "../channel.js";
import { thoughtEmitter } from "../emitter.js";
import type { WebSocketServer } from "../ws-server.js";

/**
 * Create and register the workspace channel for hub event bridging
 */
export function createWorkspaceChannel(wss: WebSocketServer): Channel {
  const channel = new Channel("workspace");

  // No snapshot on join — clients fetch initial state via REST

  // Bridge hub events from emitter to WebSocket broadcasts
  thoughtEmitter.on("hub:event", (event) => {
    wss.broadcast("workspace", "hub:event", event);
  });

  return channel;
}
