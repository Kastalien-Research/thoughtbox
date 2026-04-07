import type { Express, Request, Response } from "express";
import type { HubHandler } from "../hub/hub-handler.js";

export interface HubApiSurface {
  mount(app: Express): void;
}

export function createHubApiSurface(
  sharedHubHandler: HubHandler,
): HubApiSurface {
  function mount(app: Express): void {
    app.post("/hub/api", async (req: Request, res: Response) => {
      try {
        const { operation, agentId, ...args } = req.body as {
          operation: string;
          agentId?: string;
          [key: string]: unknown;
        };

        if (!operation) {
          res.status(400).json({ error: "operation is required" });
          return;
        }

        const result = await sharedHubHandler.handle(
          agentId ?? null,
          operation,
          args as Record<string, any>,
        );

        res.json(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        res.status(400).json({ error: message });
      }
    });
  }

  return { mount };
}

export function shouldWarnOnExposedLocalMode(
  host: string | undefined,
  isMultiTenant: boolean,
): boolean {
  if (isMultiTenant) return false;
  return (host ?? "0.0.0.0") === "0.0.0.0";
}
