import type { Request, Response } from "express";
import express from "express";
import { describe, expect, it, vi } from "vitest";
import { createProtocolHttpSurface } from "../protocol-http.js";

function listRoutes(app: express.Express): string[] {
  const router = (app as express.Express & {
    router?: { stack?: Array<{ route?: { path?: string } }> };
  }).router;

  return (router?.stack ?? [])
    .map((layer) => layer.route?.path)
    .filter((path): path is string => typeof path === "string");
}

function getRouteHandler(
  app: express.Express,
  routePath: string,
): ((req: Request, res: Response) => Promise<void>) | undefined {
  const router = (app as express.Express & {
    router?: {
      stack?: Array<{
        route?: {
          path?: string;
          stack?: Array<{ handle?: (req: Request, res: Response) => Promise<void> }>;
        };
      }>;
    };
  }).router;

  return router?.stack
    ?.find((layer) => layer.route?.path === routePath)
    ?.route?.stack?.[0]?.handle;
}

describe("protocol HTTP surface", () => {
  it("mounts protocol enforcement route", () => {
    const app = express();
    app.use(express.json());

    const handler = {
      checkEnforcement: vi.fn(async () => ({ enforce: false })),
    };

    createProtocolHttpSurface(() => handler).mount(app);

    expect(listRoutes(app)).toContain("/protocol/enforcement");
  });

  it("returns enforcement response from the shared handler", async () => {
    const app = express();
    app.use(express.json());

    const handler = {
      checkEnforcement: vi.fn(async () => ({
        enforce: true,
        blocked: true,
        protocol: "ulysses",
        required_action: "reflect",
      })),
    };

    createProtocolHttpSurface(() => handler).mount(app);
    const routeHandler = getRouteHandler(app, "/protocol/enforcement");
    expect(routeHandler).toBeTypeOf("function");

    const req = {
      body: {
        mutation: true,
        targetPath: "src/protocol/handler.ts",
      },
    } as Request;

    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;

    await routeHandler!(req, res);

    expect(res.json).toHaveBeenCalledWith({
      enforce: true,
      blocked: true,
      protocol: "ulysses",
      required_action: "reflect",
    });
    expect(handler.checkEnforcement).toHaveBeenCalledWith({
      mutation: true,
      targetPath: "src/protocol/handler.ts",
      workspaceId: undefined,
    });
  });
});
