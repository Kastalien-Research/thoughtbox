/**
 * Observability Gateway Handler
 *
 * Routes operations for the tb.observability() SDK call.
 * Queries OTEL events via OtelEventStorage + Thoughtbox session data.
 */

import { z } from 'zod';
import { checkHealth, type HealthArgs } from './operations/health.js';
import { listSessions, getSessionInfo, type SessionsArgs, type SessionInfoArgs } from './operations/sessions.js';
import { OtelEventStorage, type OtelStorageConfig } from '../otel/otel-storage.js';
import type { ThoughtboxStorage } from '../persistence/types.js';

// =============================================================================
// Input Schemas
// =============================================================================

export const ObservabilityOperationSchema = z.enum([
  'health',
  'sessions',
  'session_info',
  'session_timeline',
  'session_cost',
]);

export type ObservabilityOperation = z.infer<typeof ObservabilityOperationSchema>;

export const ObservabilityArgsSchema = z.object({
  sessionId: z.string().optional(),
  limit: z.number().optional(),
  status: z.enum(['active', 'idle', 'all']).optional(),
  services: z.array(z.string()).optional(),
  model: z.string().optional(),
}).optional();

export const ObservabilityInputSchema = z.object({
  operation: ObservabilityOperationSchema,
  args: ObservabilityArgsSchema,
});

export type ObservabilityInput = z.infer<typeof ObservabilityInputSchema>;

export const observabilityToolInputSchema = {
  operation: {
    type: 'string',
    enum: ['health', 'sessions', 'session_info', 'session_timeline', 'session_cost'],
    description: 'The observability operation to perform',
  },
  args: {
    type: 'object',
    description: 'Operation-specific arguments',
    properties: {
      sessionId: { type: 'string', description: 'Session ID for timeline, cost, or session_info' },
      limit: { type: 'number', description: 'Maximum number of results' },
      status: { type: 'string', enum: ['active', 'idle', 'all'], description: 'Filter sessions by status' },
      services: { type: 'array', items: { type: 'string' }, description: 'Filter health check to specific services' },
      model: { type: 'string', description: 'Filter cost by model name' },
    },
  },
} as const;

// =============================================================================
// Tool Response Types
// =============================================================================

interface TextContent {
  type: 'text';
  text: string;
}

interface ToolResult {
  content: TextContent[];
  isError?: boolean;
}

// =============================================================================
// Configuration
// =============================================================================

export interface ObservabilityGatewayConfig {
  storage: ThoughtboxStorage;
  workspaceId?: string;
  supabaseUrl?: string;
  serviceRoleKey?: string;
  thoughtboxUrl?: string;
}

// =============================================================================
// Handler Implementation
// =============================================================================

export class ObservabilityGatewayHandler {
  private readonly thoughtboxUrl: string;
  private readonly storage: ThoughtboxStorage;
  private readonly workspaceId: string;
  private readonly otelStorage: OtelEventStorage | null;

  constructor(config: ObservabilityGatewayConfig) {
    this.thoughtboxUrl = config.thoughtboxUrl ?? 'http://thoughtbox:1731';
    this.storage = config.storage;
    this.workspaceId = config.workspaceId ?? '00000000-0000-4000-a000-000000000001';

    if (config.supabaseUrl && config.serviceRoleKey) {
      this.otelStorage = new OtelEventStorage({
        supabaseUrl: config.supabaseUrl,
        serviceRoleKey: config.serviceRoleKey,
      });
    } else {
      this.otelStorage = null;
    }
  }

  async handle(input: unknown): Promise<ToolResult> {
    try {
      const validated = ObservabilityInputSchema.parse(input);
      const { operation, args = {} } = validated;

      let result: unknown;

      switch (operation) {
        case 'health':
          result = await this.handleHealth(args as HealthArgs);
          break;
        case 'sessions':
          result = await this.handleSessions(args as SessionsArgs);
          break;
        case 'session_info':
          result = await this.handleSessionInfo(args as SessionInfoArgs);
          break;
        case 'session_timeline':
          result = await this.handleSessionTimeline(args);
          break;
        case 'session_cost':
          result = await this.handleSessionCost(args);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: message }, null, 2),
        }],
        isError: true,
      };
    }
  }

  private async handleHealth(args: HealthArgs) {
    return checkHealth(args, this.thoughtboxUrl, this.otelStorage);
  }

  private async handleSessions(args: SessionsArgs) {
    return listSessions(args, this.storage);
  }

  private async handleSessionInfo(args: SessionInfoArgs) {
    return getSessionInfo(args, this.storage);
  }

  private async handleSessionTimeline(
    args: { sessionId?: string; limit?: number },
  ) {
    if (!this.otelStorage) {
      return { error: 'OTEL queries require Supabase configuration' };
    }
    if (!args.sessionId) {
      return { error: 'sessionId is required for session_timeline' };
    }
    return this.otelStorage.querySessionTimeline(
      this.workspaceId,
      args.sessionId,
      { limit: args.limit },
    );
  }

  private async handleSessionCost(
    args: { sessionId?: string },
  ) {
    if (!this.otelStorage) {
      return { error: 'OTEL queries require Supabase configuration' };
    }
    return this.otelStorage.querySessionCost(
      this.workspaceId,
      args.sessionId,
    );
  }
}
