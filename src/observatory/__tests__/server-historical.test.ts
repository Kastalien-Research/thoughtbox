import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createObservatoryServer } from "../server.js";
import type { ObservatoryConfig } from "../config.js";
import type { ThoughtboxStorage } from "../../persistence/types.js";
import type { Session as PersistenceSession, ThoughtData } from "../../persistence/types.js";

// Helper: minimal config
function testConfig(port: number): ObservatoryConfig {
  return {
    enabled: true,
    port,
    path: "/",
    maxConnections: 10,
    cors: ["*"],
  };
}

// Helper: mock storage
function createMockStorage(
  sessions: PersistenceSession[] = [],
  thoughtsBySession: Record<string, ThoughtData[]> = {},
  branchesBySession: Record<string, string[]> = {},
  branchThoughts: Record<string, Record<string, ThoughtData[]>> = {}
): ThoughtboxStorage {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    getConfig: vi.fn().mockResolvedValue(null),
    updateConfig: vi.fn().mockResolvedValue({}),
    createSession: vi.fn(),
    getSession: vi.fn().mockImplementation(async (id: string) => {
      return sessions.find((s) => s.id === id) || null;
    }),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
    listSessions: vi.fn().mockResolvedValue(sessions),
    saveThought: vi.fn(),
    getThoughts: vi.fn().mockImplementation(async (sessionId: string) => {
      return thoughtsBySession[sessionId] || [];
    }),
    getAllThoughts: vi.fn().mockResolvedValue([]),
    getBranchIds: vi.fn().mockImplementation(async (sessionId: string) => {
      return branchesBySession[sessionId] || [];
    }),
    getThought: vi.fn().mockResolvedValue(null),
    saveBranchThought: vi.fn(),
    getBranch: vi.fn().mockImplementation(
      async (sessionId: string, branchId: string) => {
        return branchThoughts[sessionId]?.[branchId] || [];
      }
    ),
    updateThoughtCritique: vi.fn(),
    exportSession: vi.fn().mockResolvedValue(""),
    toLinkedExport: vi.fn(),
    validateSessionIntegrity: vi.fn(),
  } as unknown as ThoughtboxStorage;
}

// Helper: fetch from server
async function fetchJson(port: number, path: string) {
  const resp = await fetch(`http://localhost:${port}${path}`);
  return { status: resp.status, data: await resp.json() };
}

describe("Observatory Server - Historical Sessions", () => {
  let server: ReturnType<typeof createObservatoryServer>;
  // Use dynamic port to avoid conflicts
  let port: number;

  beforeEach(() => {
    // Random port in 30000-40000 range
    port = 30000 + Math.floor(Math.random() * 10000);
  });

  afterEach(async () => {
    if (server?.isRunning()) {
      await server.stop();
    }
  });

  it("returns historical sessions from storage via /api/sessions", async () => {
    const mockSessions: PersistenceSession[] = [
      {
        id: "hist-1",
        title: "Historical Session",
        tags: ["test"],
        thoughtCount: 3,
        branchCount: 0,
        createdAt: new Date("2025-12-01T10:00:00Z"),
        updatedAt: new Date("2025-12-01T11:00:00Z"),
        lastAccessedAt: new Date("2025-12-01T12:00:00Z"),
      },
    ];

    const storage = createMockStorage(mockSessions);
    server = createObservatoryServer(testConfig(port), storage);
    await server.start();

    const { status, data } = await fetchJson(port, "/api/sessions");

    expect(status).toBe(200);
    expect(data.sessions).toHaveLength(1);
    expect(data.sessions[0].id).toBe("hist-1");
    expect(data.sessions[0].status).toBe("completed");
    expect(data.sessions[0].title).toBe("Historical Session");
  });

  it("returns session detail with thoughts from storage", async () => {
    const mockSessions: PersistenceSession[] = [
      {
        id: "hist-2",
        title: "Detail Session",
        tags: [],
        thoughtCount: 2,
        branchCount: 0,
        createdAt: new Date("2025-12-01T10:00:00Z"),
        updatedAt: new Date("2025-12-01T10:05:00Z"),
        lastAccessedAt: new Date("2025-12-01T10:05:00Z"),
      },
    ];

    const thoughts: ThoughtData[] = [
      {
        thought: "First thought",
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true,
        timestamp: "2025-12-01T10:00:00.000Z",
      },
      {
        thought: "Second thought",
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false,
        timestamp: "2025-12-01T10:01:00.000Z",
      },
    ];

    const storage = createMockStorage(
      mockSessions,
      { "hist-2": thoughts }
    );
    server = createObservatoryServer(testConfig(port), storage);
    await server.start();

    const { status, data } = await fetchJson(port, "/api/sessions/hist-2");

    expect(status).toBe(200);
    expect(data.session.id).toBe("hist-2");
    expect(data.session.status).toBe("completed");
    expect(data.thoughts).toHaveLength(2);
    expect(data.thoughts[0].id).toBe("hist-2:1");
    expect(data.thoughts[1].id).toBe("hist-2:2");
  });

  it("returns 404 when session not in memory or storage", async () => {
    const storage = createMockStorage();
    server = createObservatoryServer(testConfig(port), storage);
    await server.start();

    const { status, data } = await fetchJson(port, "/api/sessions/nonexistent");

    expect(status).toBe(404);
    expect(data.error).toBe("Session not found");
  });

  it("works without storage (backward compat)", async () => {
    server = createObservatoryServer(testConfig(port));
    await server.start();

    const { status, data } = await fetchJson(port, "/api/sessions");

    expect(status).toBe(200);
    expect(data.sessions).toHaveLength(0);
  });

  it("supports source=historical filter", async () => {
    const mockSessions: PersistenceSession[] = [
      {
        id: "hist-3",
        title: "Historical Only",
        tags: [],
        thoughtCount: 1,
        branchCount: 0,
        createdAt: new Date("2025-12-01T10:00:00Z"),
        updatedAt: new Date("2025-12-01T10:00:00Z"),
        lastAccessedAt: new Date("2025-12-01T10:00:00Z"),
      },
    ];

    const storage = createMockStorage(mockSessions);
    server = createObservatoryServer(testConfig(port), storage);
    await server.start();

    const { data } = await fetchJson(port, "/api/sessions?source=historical");
    expect(data.sessions).toHaveLength(1);
    expect(data.sessions[0].id).toBe("hist-3");

    // source=active should return empty (no active sessions from sessionStore)
    const { data: activeData } = await fetchJson(port, "/api/sessions?source=active");
    expect(activeData.sessions).toHaveLength(0);
  });

  it("loads branches for historical session detail", async () => {
    const mockSessions: PersistenceSession[] = [
      {
        id: "hist-4",
        title: "Branched Session",
        tags: [],
        thoughtCount: 3,
        branchCount: 1,
        createdAt: new Date("2025-12-01T10:00:00Z"),
        updatedAt: new Date("2025-12-01T10:05:00Z"),
        lastAccessedAt: new Date("2025-12-01T10:05:00Z"),
      },
    ];

    const mainThoughts: ThoughtData[] = [
      {
        thought: "Main thought 1",
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true,
        timestamp: "2025-12-01T10:00:00.000Z",
      },
    ];

    const branchThoughts: ThoughtData[] = [
      {
        thought: "Branch thought 1",
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: false,
        timestamp: "2025-12-01T10:02:00.000Z",
        branchId: "alt-1",
        branchFromThought: 1,
      },
    ];

    const storage = createMockStorage(
      mockSessions,
      { "hist-4": mainThoughts },
      { "hist-4": ["alt-1"] },
      { "hist-4": { "alt-1": branchThoughts } }
    );
    server = createObservatoryServer(testConfig(port), storage);
    await server.start();

    const { status, data } = await fetchJson(port, "/api/sessions/hist-4");

    expect(status).toBe(200);
    expect(data.thoughts).toHaveLength(1);
    expect(data.branches["alt-1"]).toBeDefined();
    expect(data.branches["alt-1"].thoughts).toHaveLength(1);
    expect(data.branches["alt-1"].fromThoughtNumber).toBe(1);
  });
});
