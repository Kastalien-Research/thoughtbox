import type { Request, Response } from "express";
import express from "express";
import { describe, expect, it, vi } from "vitest";
import { InMemoryStorage } from "../../persistence/index.js";
import {
  CLAUDE_SESSION_TAG_PREFIX,
  DRIFT_SESSION_TAG,
  createDriftHttpSurface,
} from "../drift-http.js";

function getRouteHandler(
  app: express.Express,
  method: "post" | "get",
  routePath: string,
): ((req: Request, res: Response) => Promise<void>) | undefined {
  const router = (app as express.Express & {
    router?: {
      stack?: Array<{
        route?: {
          path?: string;
          methods?: Record<string, boolean>;
          stack?: Array<{
            handle?: (req: Request, res: Response) => Promise<void>;
          }>;
        };
      }>;
    };
  }).router;

  return router?.stack?.find(
    (layer) =>
      layer.route?.path === routePath && layer.route?.methods?.[method],
  )?.route?.stack?.[0]?.handle;
}

function listRoutes(app: express.Express): string[] {
  const router = (app as express.Express & {
    router?: { stack?: Array<{ route?: { path?: string } }> };
  }).router;
  return (router?.stack ?? [])
    .map((layer) => layer.route?.path)
    .filter((path): path is string => typeof path === "string");
}

interface CapturedResponse {
  res: Response;
  status: () => number;
  body: () => unknown;
}

function mockResponse(): CapturedResponse {
  let statusCode = 200;
  let jsonBody: unknown;
  const res = {
    status: vi.fn((code: number) => {
      statusCode = code;
      return res;
    }),
    json: vi.fn((body: unknown) => {
      jsonBody = body;
      return res;
    }),
  } as unknown as Response;
  return { res, status: () => statusCode, body: () => jsonBody };
}

interface TestSurface {
  postThought: (body: unknown) => Promise<CapturedResponse>;
  getDecisions: (
    query: Record<string, string>,
  ) => Promise<CapturedResponse>;
  storage: InMemoryStorage;
}

function buildSurface(options?: {
  resolveWorkspaceId?: (req: Request) => Promise<string>;
  cacheTtlMs?: number;
  getStorage?: (workspaceId?: string) => InMemoryStorage;
}): TestSurface {
  const app = express();
  app.use(express.json());
  const storage = new InMemoryStorage();

  createDriftHttpSurface({
    getStorage: options?.getStorage ?? (() => storage),
    ...(options?.resolveWorkspaceId
      ? { resolveWorkspaceId: options.resolveWorkspaceId }
      : {}),
    ...(options?.cacheTtlMs !== undefined
      ? { cacheTtlMs: options.cacheTtlMs }
      : {}),
  }).mount(app);

  const postHandler = getRouteHandler(app, "post", "/drift/session-thought")!;
  const getHandler = getRouteHandler(app, "get", "/drift/session-decisions")!;

  return {
    storage,
    async postThought(body: unknown) {
      const captured = mockResponse();
      await postHandler({ body, headers: {}, query: {} } as unknown as Request, captured.res);
      return captured;
    },
    async getDecisions(query: Record<string, string>) {
      const captured = mockResponse();
      await getHandler({ query, headers: {}, body: {} } as unknown as Request, captured.res);
      return captured;
    },
  };
}

describe("drift HTTP surface", () => {
  it("mounts both drift routes", () => {
    const app = express();
    app.use(express.json());
    createDriftHttpSurface({ getStorage: () => new InMemoryStorage() }).mount(
      app,
    );
    expect(listRoutes(app)).toContain("/drift/session-thought");
    expect(listRoutes(app)).toContain("/drift/session-decisions");
  });

  it("creates a tagged drift session on first capture and appends thoughts", async () => {
    const surface = buildSurface();

    const first = await surface.postThought({
      claudeSessionId: "cc-session-1",
      thoughtType: "context_snapshot",
      content: "use pnpm, never npm",
    });
    expect(first.status()).toBe(200);
    const firstBody = first.body() as {
      sessionId: string;
      thoughtNumber: number;
      deduped: boolean;
    };
    expect(firstBody.thoughtNumber).toBe(1);
    expect(firstBody.deduped).toBe(false);

    const sessions = await surface.storage.listSessions({
      tags: [`${CLAUDE_SESSION_TAG_PREFIX}cc-session-1`],
    });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].tags).toContain(DRIFT_SESSION_TAG);

    const second = await surface.postThought({
      claudeSessionId: "cc-session-1",
      thoughtType: "context_snapshot",
      content: "a different prompt",
    });
    expect((second.body() as { thoughtNumber: number }).thoughtNumber).toBe(2);
    expect((second.body() as { sessionId: string }).sessionId).toBe(
      firstBody.sessionId,
    );
  });

  it("is idempotent for duplicate submissions of the same turn", async () => {
    const surface = buildSurface();
    const body = {
      claudeSessionId: "cc-dup",
      thoughtType: "context_snapshot",
      content: "same prompt delivered twice",
    };

    const first = await surface.postThought(body);
    const second = await surface.postThought(body);

    expect((second.body() as { deduped: boolean }).deduped).toBe(true);
    expect((second.body() as { thoughtNumber: number }).thoughtNumber).toBe(
      (first.body() as { thoughtNumber: number }).thoughtNumber,
    );

    const sessionId = (first.body() as { sessionId: string }).sessionId;
    const thoughts = await surface.storage.getThoughts(sessionId);
    expect(thoughts).toHaveLength(1);
  });

  it("promotes a captured user turn to a refuted assumption_update revision", async () => {
    const surface = buildSurface();
    const prompt = "no, we removed the redis dependency, stop re-adding it";

    await surface.postThought({
      claudeSessionId: "cc-promote",
      thoughtType: "context_snapshot",
      content: prompt,
    });

    const promoted = await surface.postThought({
      claudeSessionId: "cc-promote",
      thoughtType: "assumption_update",
      content: prompt,
      reviseLatestUserTurn: true,
      assumptionChange: {
        text: prompt,
        oldStatus: "believed",
        newStatus: "refuted",
        trigger: "user-correction",
      },
    });

    const promotedBody = promoted.body() as {
      thoughtNumber: number;
      revisesThought?: number;
    };
    expect(promotedBody.thoughtNumber).toBe(2);
    expect(promotedBody.revisesThought).toBe(1);

    const decisions = await surface.getDecisions({
      claudeSessionId: "cc-promote",
    });
    const decisionsBody = decisions.body() as {
      decisions: Array<{ thoughtNumber: number; thoughtType: string }>;
      count: number;
    };
    expect(decisionsBody.count).toBe(1);
    expect(decisionsBody.decisions[0].thoughtType).toBe("assumption_update");
    expect(decisionsBody.decisions[0].thoughtNumber).toBe(2);
  });

  it("returns only decision_frames and refuted assumption_updates, recency first", async () => {
    const surface = buildSurface();
    const claudeSessionId = "cc-filter";

    await surface.postThought({
      claudeSessionId,
      thoughtType: "context_snapshot",
      content: "plain user turn",
    });
    await surface.postThought({
      claudeSessionId,
      thoughtType: "decision_frame",
      content: "Decided: Supabase-only persistence",
    });
    await surface.postThought({
      claudeSessionId,
      thoughtType: "assumption_update",
      content: "actually the hub endpoint moved",
      assumptionChange: {
        text: "hub endpoint unchanged",
        oldStatus: "believed",
        newStatus: "refuted",
      },
    });
    // Non-refuted assumption update must NOT surface.
    await surface.postThought({
      claudeSessionId,
      thoughtType: "assumption_update",
      content: "unsure about the cache TTL",
      assumptionChange: {
        text: "cache TTL is 2s",
        oldStatus: "believed",
        newStatus: "uncertain",
      },
    });

    const result = await surface.getDecisions({ claudeSessionId });
    const body = result.body() as {
      decisions: Array<{ thoughtNumber: number }>;
      count: number;
    };
    expect(body.count).toBe(2);
    expect(body.decisions.map((d) => d.thoughtNumber)).toEqual([3, 2]);
  });

  it("honors the limit parameter with a max of 25", async () => {
    const surface = buildSurface();
    const claudeSessionId = "cc-limit";
    for (let i = 0; i < 4; i++) {
      await surface.postThought({
        claudeSessionId,
        thoughtType: "decision_frame",
        content: `decision number ${i}`,
      });
    }

    const limited = await surface.getDecisions({ claudeSessionId, limit: "2" });
    expect((limited.body() as { count: number }).count).toBe(2);

    const clamped = await surface.getDecisions({
      claudeSessionId,
      limit: "9999",
    });
    expect((clamped.body() as { count: number }).count).toBe(4);
  });

  it("returns an empty decision list for an unknown Claude session", async () => {
    const surface = buildSurface();
    const result = await surface.getDecisions({ claudeSessionId: "nope" });
    expect(result.status()).toBe(200);
    expect(result.body()).toEqual({
      claudeSessionId: "nope",
      sessionId: null,
      decisions: [],
      count: 0,
    });
  });

  it("rejects invalid payloads with 400", async () => {
    const surface = buildSurface();

    const missingSession = await surface.postThought({
      thoughtType: "context_snapshot",
      content: "x",
    });
    expect(missingSession.status()).toBe(400);

    const missingContent = await surface.postThought({
      claudeSessionId: "cc",
      thoughtType: "context_snapshot",
      content: "   ",
    });
    expect(missingContent.status()).toBe(400);

    const badType = await surface.postThought({
      claudeSessionId: "cc",
      thoughtType: "reasoning",
      content: "x",
    });
    expect(badType.status()).toBe(400);

    const missingQuery = await surface.getDecisions({});
    expect(missingQuery.status()).toBe(400);
  });

  it("rejects unauthenticated requests with 401 in hosted mode", async () => {
    const surface = buildSurface({
      resolveWorkspaceId: async () => {
        throw new Error("Missing API key");
      },
    });

    const post = await surface.postThought({
      claudeSessionId: "cc",
      thoughtType: "context_snapshot",
      content: "x",
    });
    expect(post.status()).toBe(401);
    expect(post.body()).toEqual({ error: "Missing API key" });

    const get = await surface.getDecisions({ claudeSessionId: "cc" });
    expect(get.status()).toBe(401);
  });

  it("scopes storage per resolved workspace in hosted mode", async () => {
    const storages = new Map<string, InMemoryStorage>();
    const getStorage = vi.fn((workspaceId?: string) => {
      const key = workspaceId ?? "none";
      if (!storages.has(key)) storages.set(key, new InMemoryStorage());
      return storages.get(key)!;
    });

    let currentWorkspace = "ws-a";
    const surface = buildSurface({
      getStorage,
      resolveWorkspaceId: async () => currentWorkspace,
    });

    await surface.postThought({
      claudeSessionId: "cc-shared",
      thoughtType: "decision_frame",
      content: "workspace A decision",
    });

    currentWorkspace = "ws-b";
    const other = await surface.getDecisions({ claudeSessionId: "cc-shared" });
    expect((other.body() as { count: number }).count).toBe(0);

    currentWorkspace = "ws-a";
    const own = await surface.getDecisions({ claudeSessionId: "cc-shared" });
    expect((own.body() as { count: number }).count).toBe(1);

    expect(getStorage).toHaveBeenCalledWith("ws-a");
    expect(getStorage).toHaveBeenCalledWith("ws-b");
  });

  it("serves cached decisions within the TTL and invalidates on writes", async () => {
    const surface = buildSurface({ cacheTtlMs: 60_000 });
    const claudeSessionId = "cc-cache";

    await surface.postThought({
      claudeSessionId,
      thoughtType: "decision_frame",
      content: "first decision",
    });

    const first = await surface.getDecisions({ claudeSessionId });
    expect((first.body() as { count: number }).count).toBe(1);

    // Bypass the surface: write directly to storage. The cached response
    // must NOT see it (proves the cache is actually serving).
    const sessionId = (first.body() as { sessionId: string }).sessionId;
    await surface.storage.saveThought(sessionId, {
      thought: "direct write",
      thoughtNumber: 2,
      totalThoughts: 2,
      nextThoughtNeeded: true,
      thoughtType: "decision_frame",
      timestamp: new Date().toISOString(),
    });
    const cached = await surface.getDecisions({ claudeSessionId });
    expect((cached.body() as { count: number }).count).toBe(1);

    // A write through the surface invalidates the cache.
    await surface.postThought({
      claudeSessionId,
      thoughtType: "decision_frame",
      content: "second decision",
    });
    const fresh = await surface.getDecisions({ claudeSessionId });
    expect((fresh.body() as { count: number }).count).toBe(3);
  });
});
