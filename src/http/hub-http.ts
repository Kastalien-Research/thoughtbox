import type { Express, Request, Response } from "express";
import type { HubEvent, HubHandler } from "../hub/hub-handler.js";

interface SseClient {
  res: Response;
  workspaceId: string;
}

export interface HubHttpSurface {
  mount(app: Express): void;
  broadcastHubEvent(event: HubEvent): void;
}

export function createHubHttpSurface(sharedHubHandler: HubHandler): HubHttpSurface {
  const sseClients = new Set<SseClient>();

  function broadcastHubEvent(event: HubEvent): void {
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of sseClients) {
      if (client.workspaceId === event.workspaceId || client.workspaceId === "*") {
        try {
          client.res.write(payload);
        } catch {
          sseClients.delete(client);
        }
      }
    }
  }

  function mount(app: Express): void {
    app.get("/hub/events", (req: Request, res: Response) => {
      const workspaceId = (req.query.workspace_id as string) || "*";

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write(": connected\n\n");

      const client: SseClient = { res, workspaceId };
      sseClients.add(client);

      req.on("close", () => {
        sseClients.delete(client);
      });
    });

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
        const message = error instanceof Error ? error.message : String(error);
        res.status(400).json({ error: message });
      }
    });
  }

  return {
    mount,
    broadcastHubEvent,
  };
}

export function shouldWarnOnExposedLocalMode(host: string | undefined, isMultiTenant: boolean): boolean {
  if (isMultiTenant) return false;
  return (host ?? "0.0.0.0") === "0.0.0.0";
}
