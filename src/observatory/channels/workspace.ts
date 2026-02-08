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
 * Create and register the workspace channel for hub event bridging.
 *
 * Returns the channel and a cleanup function that removes the emitter
 * listener. Call cleanup() when the Observatory server stops to prevent
 * duplicate listeners on restart.
 */
export function createWorkspaceChannel(wss: WebSocketServer): {
  channel: Channel;
  cleanup: () => void;
} {
  // Static topic — all clients receive all workspace events.
  // The UI (observatory.html) subscribes to "workspace" (static string),
  // and wss.broadcast targets "workspace" (static string). These MUST match.
  // If per-workspace scoping is needed later, change ALL THREE:
  //   1. Channel("workspace:<workspaceId>")
  //   2. wss.broadcast("workspace:<id>", ...)
  //   3. UI subscribe("workspace:<id>")
  const channel = new Channel("workspace");

  // No snapshot on join — clients fetch initial state via REST

  // Bridge hub events from emitter to WebSocket broadcasts
  const listener = (event: unknown) => {
    wss.broadcast("workspace", "hub:event", event);
  };
  thoughtEmitter.on("hub:event", listener);

  return {
    channel,
    cleanup: () => {
      thoughtEmitter.off("hub:event", listener);
    },
  };
}
