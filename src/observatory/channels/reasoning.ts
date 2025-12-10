/**
 * Reasoning Channel - reasoning:<sessionId>
 *
 * Handles real-time observation of a specific reasoning session.
 *
 * Events (Server → Client):
 * - session:snapshot   Full state on subscribe
 * - thought:added      New thought appended
 * - thought:revised    Thought revision
 * - thought:branched   New branch created
 * - session:ended      Session completed
 * - error              Error occurred
 *
 * Events (Client → Server):
 * - subscribe          Join channel (built-in)
 * - unsubscribe        Leave channel (built-in)
 */

import { z } from "zod";
import { Channel } from "../channel.js";
import { thoughtEmitter } from "../emitter.js";
import type { WebSocketServer } from "../ws-server.js";
import type { Thought, Session, Branch } from "../schemas/thought.js";

/**
 * In-memory session store for active sessions
 * In production, this would integrate with the persistence layer
 */
interface SessionStore {
  getSession(sessionId: string): Promise<Session | null>;
  getThoughts(sessionId: string): Promise<Thought[]>;
  getBranches(sessionId: string): Promise<Record<string, Branch>>;
}

/**
 * Simple in-memory session store for MVP
 */
class InMemorySessionStore implements SessionStore {
  private sessions: Map<string, Session> = new Map();
  private thoughts: Map<string, Thought[]> = new Map();
  private branches: Map<string, Record<string, Branch>> = new Map();

  setSession(session: Session): void {
    this.sessions.set(session.id, session);
    if (!this.thoughts.has(session.id)) {
      this.thoughts.set(session.id, []);
    }
    if (!this.branches.has(session.id)) {
      this.branches.set(session.id, {});
    }
  }

  addThought(sessionId: string, thought: Thought): void {
    const thoughts = this.thoughts.get(sessionId) || [];
    thoughts.push(thought);
    this.thoughts.set(sessionId, thoughts);
  }

  addBranchThought(sessionId: string, branchId: string, thought: Thought): void {
    const branches = this.branches.get(sessionId) || {};
    if (!branches[branchId]) {
      branches[branchId] = {
        id: branchId,
        fromThoughtNumber: thought.branchFromThought || 0,
        thoughts: [],
      };
    }
    branches[branchId].thoughts.push(thought);
    this.branches.set(sessionId, branches);
  }

  async getSession(sessionId: string): Promise<Session | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getThoughts(sessionId: string): Promise<Thought[]> {
    return this.thoughts.get(sessionId) || [];
  }

  async getBranches(sessionId: string): Promise<Record<string, Branch>> {
    return this.branches.get(sessionId) || {};
  }

  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.status === "active"
    );
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }
}

// Singleton store
export const sessionStore = new InMemorySessionStore();

/**
 * Create and register the reasoning channel
 */
export function createReasoningChannel(wss: WebSocketServer): Channel {
  const channel = new Channel("reasoning:<sessionId>");

  // Handle subscription - send snapshot
  channel.onJoin(async ({ params, send }) => {
    const { sessionId } = params;

    const session = await sessionStore.getSession(sessionId);
    if (!session) {
      send("error", {
        code: "SESSION_NOT_FOUND",
        message: `Session ${sessionId} not found`,
      });
      return;
    }

    const thoughts = await sessionStore.getThoughts(sessionId);
    const branches = await sessionStore.getBranches(sessionId);

    send("session:snapshot", {
      session,
      thoughts,
      branches,
    });
  });

  // Wire up emitter events to WebSocket broadcasts
  thoughtEmitter.on("thought:added", (data) => {
    const topic = `reasoning:${data.sessionId}`;
    wss.broadcast(topic, "thought:added", {
      thought: data.thought,
      parentId: data.parentId,
    });

    // Also store in memory
    sessionStore.addThought(data.sessionId, data.thought);
  });

  thoughtEmitter.on("thought:revised", (data) => {
    const topic = `reasoning:${data.sessionId}`;
    wss.broadcast(topic, "thought:revised", {
      thought: data.thought,
      parentId: data.parentId,
      originalThoughtNumber: data.originalThoughtNumber,
    });

    sessionStore.addThought(data.sessionId, data.thought);
  });

  thoughtEmitter.on("thought:branched", (data) => {
    const topic = `reasoning:${data.sessionId}`;
    wss.broadcast(topic, "thought:branched", {
      thought: data.thought,
      parentId: data.parentId,
      branchId: data.branchId,
      fromThoughtNumber: data.fromThoughtNumber,
    });

    sessionStore.addBranchThought(data.sessionId, data.branchId, data.thought);
  });

  thoughtEmitter.on("session:started", (data) => {
    sessionStore.setSession(data.session);
  });

  thoughtEmitter.on("session:ended", (data) => {
    const topic = `reasoning:${data.sessionId}`;
    wss.broadcast(topic, "session:ended", {
      sessionId: data.sessionId,
      finalThoughtCount: data.finalThoughtCount,
    });
  });

  return channel;
}
