import { describe, it, expect } from "vitest";
import {
  toObservatorySession,
  toObservatoryThought,
  toObservatoryBranches,
} from "../storage-adapter.js";
import type { Session as PersistenceSession, ThoughtData } from "../../persistence/types.js";

describe("toObservatorySession", () => {
  it("converts Date fields to ISO strings", () => {
    const ps: PersistenceSession = {
      id: "sess-1",
      title: "Test Session",
      tags: ["debug"],
      thoughtCount: 5,
      branchCount: 1,
      createdAt: new Date("2025-12-01T10:00:00Z"),
      updatedAt: new Date("2025-12-01T11:00:00Z"),
      lastAccessedAt: new Date("2025-12-01T12:00:00Z"),
    };

    const obs = toObservatorySession(ps);

    expect(obs.id).toBe("sess-1");
    expect(obs.title).toBe("Test Session");
    expect(obs.tags).toEqual(["debug"]);
    expect(obs.createdAt).toBe("2025-12-01T10:00:00.000Z");
    expect(obs.completedAt).toBe("2025-12-01T11:00:00.000Z");
    expect(obs.status).toBe("completed");
  });

  it("handles missing tags gracefully", () => {
    const ps: PersistenceSession = {
      id: "sess-2",
      title: "No Tags",
      tags: [],
      thoughtCount: 0,
      branchCount: 0,
      createdAt: new Date("2025-12-01T10:00:00Z"),
      updatedAt: new Date("2025-12-01T10:00:00Z"),
      lastAccessedAt: new Date("2025-12-01T10:00:00Z"),
    };

    const obs = toObservatorySession(ps);
    expect(obs.tags).toEqual([]);
  });

  it("always sets status to completed", () => {
    const ps: PersistenceSession = {
      id: "sess-3",
      title: "Active-ish",
      tags: [],
      thoughtCount: 1,
      branchCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    };

    expect(toObservatorySession(ps).status).toBe("completed");
  });
});

describe("toObservatoryThought", () => {
  it("synthesizes id from sessionId and thoughtNumber", () => {
    const td: ThoughtData = {
      thought: "This is thought 1",
      thoughtNumber: 1,
      totalThoughts: 5,
      nextThoughtNeeded: true,
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    const obs = toObservatoryThought("sess-1", td);

    expect(obs.id).toBe("sess-1:1");
    expect(obs.thoughtNumber).toBe(1);
    expect(obs.totalThoughts).toBe(5);
    expect(obs.thought).toBe("This is thought 1");
    expect(obs.nextThoughtNeeded).toBe(true);
    expect(obs.timestamp).toBe("2025-12-01T10:00:00.000Z");
  });

  it("maps optional branch fields", () => {
    const td: ThoughtData = {
      thought: "Branch thought",
      thoughtNumber: 3,
      totalThoughts: 5,
      nextThoughtNeeded: true,
      timestamp: "2025-12-01T10:00:00.000Z",
      branchId: "alt-1",
      branchFromThought: 2,
    };

    const obs = toObservatoryThought("sess-1", td);

    expect(obs.branchId).toBe("alt-1");
    expect(obs.branchFromThought).toBe(2);
  });

  it("maps optional revision fields", () => {
    const td: ThoughtData = {
      thought: "Revised thought",
      thoughtNumber: 4,
      totalThoughts: 5,
      nextThoughtNeeded: false,
      timestamp: "2025-12-01T10:00:00.000Z",
      isRevision: true,
      revisesThought: 2,
    };

    const obs = toObservatoryThought("sess-1", td);

    expect(obs.isRevision).toBe(true);
    expect(obs.revisesThought).toBe(2);
  });
});

describe("toObservatoryBranches", () => {
  it("builds branches from branch IDs and thought maps", () => {
    const branchIds = ["alt-1"];
    const thoughtsMap = new Map<string, ThoughtData[]>();
    thoughtsMap.set("alt-1", [
      {
        thought: "Branch thought 1",
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true,
        timestamp: "2025-12-01T10:00:00.000Z",
        branchId: "alt-1",
        branchFromThought: 3,
      },
      {
        thought: "Branch thought 2",
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false,
        timestamp: "2025-12-01T10:01:00.000Z",
        branchId: "alt-1",
        branchFromThought: 3,
      },
    ]);

    const branches = toObservatoryBranches("sess-1", branchIds, thoughtsMap);

    expect(branches["alt-1"]).toBeDefined();
    expect(branches["alt-1"].id).toBe("alt-1");
    expect(branches["alt-1"].fromThoughtNumber).toBe(3);
    expect(branches["alt-1"].thoughts).toHaveLength(2);
    expect(branches["alt-1"].thoughts[0].id).toBe("sess-1:1");
    expect(branches["alt-1"].thoughts[1].id).toBe("sess-1:2");
  });

  it("handles empty branch gracefully", () => {
    const branches = toObservatoryBranches("sess-1", ["empty-branch"], new Map());

    expect(branches["empty-branch"]).toBeDefined();
    expect(branches["empty-branch"].thoughts).toHaveLength(0);
    expect(branches["empty-branch"].fromThoughtNumber).toBe(0);
  });
});
