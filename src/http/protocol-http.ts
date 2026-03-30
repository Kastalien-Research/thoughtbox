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

export interface ProtocolHttpSurface {
  mount(app: Express): void;
}

export function createProtocolHttpSurface(
  getHandler: () => ProtocolEnforcementHandler | null,
): ProtocolHttpSurface {
  function mount(app: Express): void {
    app.post("/protocol/enforcement", async (req: Request, res: Response) => {
      try {
        const handler = getHandler();
        if (!handler) {
          res.json({ enforce: false });
          return;
        }

        const body = (req.body ?? {}) as {
          mutation?: unknown;
          targetPath?: unknown;
          workspaceId?: unknown;
        };

        const input: ProtocolEnforcementInput = {
          mutation: Boolean(body.mutation),
          targetPath:
            typeof body.targetPath === "string" ? body.targetPath : undefined,
          workspaceId:
            typeof body.workspaceId === "string" ? body.workspaceId : undefined,
        };

        const result = await handler.checkEnforcement(input);
        res.json(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(400).json({ error: message });
      }
    });
  }

  return { mount };
}
