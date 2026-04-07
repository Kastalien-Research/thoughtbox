import express from "express";
import { describe, expect, it } from "vitest";
import { createEventStreamSurface } from "../event-stream.js";
import type { ThoughtboxEvent } from "../../events/types.js";

function listRoutes(app: express.Express): string[] {
  const router = (app as express.Express & {
    router?: { stack?: Array<{ route?: { path?: string } }> };
  }).router;

  return (router?.stack ?? [])
    .map((layer) => layer.route?.path)
    .filter((path): path is string => typeof path === "string");
}

describe("event stream surface", () => {
  it("mounts /events route", () => {
    const app = express();
    const surface = createEventStreamSurface();
    surface.mount(app);

    expect(listRoutes(app)).toContain("/events");
  });

  it("does not mount when not called", () => {
    const app = express();
    createEventStreamSurface();

    expect(listRoutes(app)).not.toContain("/events");
  });

  it("broadcast does not throw with no clients", () => {
    const surface = createEventStreamSurface();
    const event: ThoughtboxEvent = {
      source: "hub",
      type: "problem_created",
      workspaceId: "ws-1",
      timestamp: new Date().toISOString(),
      data: { title: "test" },
    };

    expect(() => surface.broadcast(event)).not.toThrow();
  });
});
