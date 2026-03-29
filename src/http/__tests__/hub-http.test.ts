import express from "express";
import { describe, expect, it, vi } from "vitest";
import { createHubHttpSurface, shouldWarnOnExposedLocalMode } from "../hub-http.js";
import type { HubHandler } from "../../hub/hub-handler.js";

function listRoutes(app: express.Express): string[] {
  const router = (app as express.Express & {
    router?: { stack?: Array<{ route?: { path?: string } }> };
  }).router;

  return (router?.stack ?? [])
    .map((layer) => layer.route?.path)
    .filter((path): path is string => typeof path === "string");
}

describe("hub HTTP surface", () => {
  it("mounts hub routes for local fs/memory mode", () => {
    const app = express();
    app.use(express.json());

    const handler: HubHandler = {
      handle: vi.fn(async () => ({ ok: true })),
    };

    createHubHttpSurface(handler).mount(app);

    expect(listRoutes(app)).toContain("/hub/events");
    expect(listRoutes(app)).toContain("/hub/api");
  });

  it("leaves hub routes absent when not mounted for supabase mode", () => {
    const app = express();
    app.use(express.json());

    expect(listRoutes(app)).not.toContain("/hub/events");
    expect(listRoutes(app)).not.toContain("/hub/api");
  });
});

describe("shouldWarnOnExposedLocalMode", () => {
  it("warns for local mode on 0.0.0.0", () => {
    expect(shouldWarnOnExposedLocalMode("0.0.0.0", false)).toBe(true);
    expect(shouldWarnOnExposedLocalMode(undefined, false)).toBe(true);
  });

  it("does not warn for supabase mode or loopback host", () => {
    expect(shouldWarnOnExposedLocalMode("0.0.0.0", true)).toBe(false);
    expect(shouldWarnOnExposedLocalMode("127.0.0.1", false)).toBe(false);
    expect(shouldWarnOnExposedLocalMode("localhost", false)).toBe(false);
  });
});
