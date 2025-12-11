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
  private updateQueue: Promise<void> = Promise.resolve();
  private readonly MAX_SESSIONS = 1000; // Prevent unbounded growth

  /**
   * Queue an update operation to prevent race conditions
   */
  private queueUpdate<T>(operation: () => T | Promise<T>): Promise<T> {
    const queued = this.updateQueue.then(() => operation());
    this.updateQueue = queued.then(() => {}, () => {}); // Continue queue even on error
    return queued;
  }

  setSession(session: Session): Promise<void> {
    return this.queueUpdate(() => {
      this.sessions.set(session.id, session);
      if (!this.thoughts.has(session.id)) {
        this.thoughts.set(session.id, []);
      }
      if (!this.branches.has(session.id)) {
        this.branches.set(session.id, {});
      }
      
      // Cleanup old sessions if we exceed the limit
      if (this.sessions.size > this.MAX_SESSIONS) {
        this.cleanupOldSessions();
      }
    });
  }

  addThought(sessionId: string, thought: Thought): Promise<void> {
    return this.queueUpdate(() => {
      const thoughts = this.thoughts.get(sessionId) || [];
      thoughts.push(thought);
      this.thoughts.set(sessionId, thoughts);
    });
  }

  addBranchThought(sessionId: string, branchId: string, thought: Thought): Promise<void> {
    return this.queueUpdate(() => {
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
    });
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

  /**
   * Clean up old completed/abandoned sessions to prevent memory leaks
   * Keeps the most recent sessions up to MAX_SESSIONS limit
   */
  private cleanupOldSessions(): void {
    const sessions = Array.from(this.sessions.values());
    
    // Sort by creation time (oldest first)
    sessions.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeA - timeB;
    });

    // Remove oldest completed/abandoned sessions until we're under the limit
    const toRemove = sessions.length - this.MAX_SESSIONS;
    let removed = 0;
    
    for (const session of sessions) {
      if (removed >= toRemove) break;
      
      // Only remove completed or abandoned sessions, keep active ones
      if (session.status === "completed" || session.status === "abandoned") {
        this.sessions.delete(session.id);
        this.thoughts.delete(session.id);
        this.branches.delete(session.id);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`[Observatory] Cleaned up ${removed} old sessions`);
    }
  }

  /**
   * Manually clean up a specific session
   */
  cleanupSession(sessionId: string): void {
    this.queueUpdate(() => {
      this.sessions.delete(sessionId);
      this.thoughts.delete(sessionId);
      this.branches.delete(sessionId);
    });
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

    console.log(`[Observatory] Sending snapshot for ${sessionId}: ${thoughts.length} thoughts`);

    send("session:snapshot", {
      session,
      thoughts,
      branches,
    });
  });

  // Wire up emitter events to WebSocket broadcasts
  thoughtEmitter.on("thought:added", (data) => {
    const topic = `reasoning:${data.sessionId}`;
    const payload = {
      thought: data.thought,
      parentId: data.parentId,
      sessionId: data.sessionId,
    };

    // Broadcast to reasoning channel subscribers
    wss.broadcast(topic, "thought:added", payload);

    // Also broadcast to observatory channel so new sessions get immediate updates
    // This ensures clients see thought 1 even before subscription completes
    wss.broadcast("observatory", "thought:added", payload);

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

  thoughtEmitter.on("session:ended", async (data) => {
    const topic = `reasoning:${data.sessionId}`;
    
    // Update session status to completed
    const session = await sessionStore.getSession(data.sessionId);
    if (session) {
      session.status = "completed";
      session.completedAt = new Date().toISOString();
      await sessionStore.setSession(session);
    }
    
    wss.broadcast(topic, "session:ended", {
      sessionId: data.sessionId,
      finalThoughtCount: data.finalThoughtCount,
    });
  });

  return channel;
}
