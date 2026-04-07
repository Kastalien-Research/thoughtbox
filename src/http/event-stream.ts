import type { Express, Request, Response } from "express";
import type { ThoughtboxEvent } from "../events/types.js";

interface SseClient {
  res: Response;
  workspaceId: string;
  sourceFilter: "all" | "hub" | "protocol";
}

export interface EventStreamSurface {
  mount(app: Express): void;
  broadcast(event: ThoughtboxEvent): void;
}

export function createEventStreamSurface(): EventStreamSurface {
  const clients = new Set<SseClient>();

  function broadcast(event: ThoughtboxEvent): void {
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of clients) {
      const workspaceMatch =
        client.workspaceId === "*" ||
        client.workspaceId === event.workspaceId;
      const sourceMatch =
        client.sourceFilter === "all" ||
        client.sourceFilter === event.source;

      if (workspaceMatch && sourceMatch) {
        try {
          client.res.write(payload);
        } catch {
          clients.delete(client);
        }
      }
    }
  }

  function mount(app: Express): void {
    app.get("/events", (req: Request, res: Response) => {
      const workspaceId =
        (req.query.workspace_id as string) || "*";
      const sourceFilter =
        (req.query.source as "all" | "hub" | "protocol") ||
        "all";

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write(": connected\n\n");

      const client: SseClient = {
        res,
        workspaceId,
        sourceFilter,
      };
      clients.add(client);

      req.on("close", () => {
        clients.delete(client);
      });
    });
  }

  return { mount, broadcast };
}
