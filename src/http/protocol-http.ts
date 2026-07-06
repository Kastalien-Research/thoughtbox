import type { Express, Request, Response } from "express";
import type {
  ProtocolEnforcementInput,
  ProtocolEnforcementResult,
} from "../protocol/types.js";

export interface ProtocolEnforcementHandler {
  checkEnforcement(
    input: ProtocolEnforcementInput,
  ): Promise<ProtocolEnforcementResult>;
}

export interface ProtocolHttpSurfaceOptions {
  /**
   * Enforcement handlers to consult for a decision.
   *
   * Local mode returns one handler per live MCP session (protocol state can
   * be per-session there when the in-memory backend is active); the surface
   * aggregates across them — a block from ANY active protocol session wins,
   * so a second concurrent session can never mask an enforcement decision.
   *
   * Hosted (multi-tenant) mode returns a single storage-backed handler that
   * resolves protocol state per-workspace from Supabase; no live in-process
   * session handler is required for enforcement.
   */
  getHandlers: () => ProtocolEnforcementHandler[];
  /**
   * Hosted (multi-tenant) mode: resolve the workspace from the request's
   * Authorization credentials (tbx_* API key or OAuth JWT). When provided,
   * unauthenticated requests are rejected with 401 and any workspaceId in
   * the request body is ignored — the caller's credentials, not its claims,
   * decide the enforcement scope.
   */
  resolveWorkspaceId?: (req: Request) => Promise<string>;
}

export interface ProtocolHttpSurface {
  mount(app: Express): void;
}

export function createProtocolHttpSurface(
  options: ProtocolHttpSurfaceOptions,
): ProtocolHttpSurface {
  function mount(app: Express): void {
    app.post("/protocol/enforcement", async (req: Request, res: Response) => {
      const body = (req.body ?? {}) as {
        mutation?: unknown;
        targetPath?: unknown;
        workspaceId?: unknown;
      };

      let workspaceId: string | undefined;
      if (options.resolveWorkspaceId) {
        try {
          workspaceId = await options.resolveWorkspaceId(req);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Authentication failed";
          res.status(401).json({ error: message });
          return;
        }
      } else if (typeof body.workspaceId === "string" && body.workspaceId) {
        workspaceId = body.workspaceId;
      }

      try {
        const handlers = options.getHandlers();

        const input: ProtocolEnforcementInput = {
          mutation: Boolean(body.mutation),
          targetPath:
            typeof body.targetPath === "string" ? body.targetPath : undefined,
          workspaceId,
        };

        // Blocked-wins aggregation: the first blocking decision is returned
        // immediately; otherwise prefer an enforcing (allow) decision over
        // "no active protocol session".
        let aggregate: ProtocolEnforcementResult = { enforce: false };
        for (const handler of handlers) {
          const result = await handler.checkEnforcement(input);
          if (result.blocked) {
            res.json(result);
            return;
          }
          if (result.enforce && !aggregate.enforce) {
            aggregate = result;
          }
        }
        res.json(aggregate);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: message });
      }
    });
  }

  return { mount };
}
