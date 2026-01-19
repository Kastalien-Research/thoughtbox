/**
 * Observability Gateway Handler
 *
 * Routes operations for the observability_gateway MCP tool.
 * No session initialization required - direct query access.
 */

import { z } from 'zod';
import { PrometheusClient, type PrometheusConfig } from './prometheus-client.js';
import { checkHealth, type HealthArgs } from './operations/health.js';
import { queryMetrics, queryMetricsRange, type MetricsArgs, type MetricsRangeArgs } from './operations/metrics.js';
import { listSessions, getSessionInfo, type SessionsArgs, type SessionInfoArgs } from './operations/sessions.js';
import { getAlerts, type AlertsArgs } from './operations/alerts.js';
import type { ThoughtboxStorage } from '../persistence/types.js';

// =============================================================================
// Input Schemas
// =============================================================================

export const ObservabilityOperationSchema = z.enum([
  'health',
  'metrics',
  'metrics_range',
  'sessions',
  'session_info',
  'alerts',
  'dashboard_url',
]);

export type ObservabilityOperation = z.infer<typeof ObservabilityOperationSchema>;

export const ObservabilityArgsSchema = z.object({
  // Metrics operations
  query: z.string().optional(),
  time: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  step: z.string().optional(),

  // Session operations
  sessionId: z.string().optional(),
  limit: z.number().optional(),
  status: z.enum(['active', 'idle', 'all']).optional(),

  // Health operations
  services: z.array(z.string()).optional(),

  // Alerts operations
  state: z.enum(['firing', 'pending', 'all']).optional(),

  // Dashboard operations
  dashboard: z.string().optional(),
}).optional();

export const ObservabilityInputSchema = z.object({
  operation: ObservabilityOperationSchema,
  args: ObservabilityArgsSchema,
});

export type ObservabilityInput = z.infer<typeof ObservabilityInputSchema>;

// Tool input schema for MCP registration
export const observabilityToolInputSchema = {
  operation: {
    type: 'string',
    enum: ['health', 'metrics', 'metrics_range', 'sessions', 'session_info', 'alerts', 'dashboard_url'],
    description: 'The observability operation to perform',
  },
  args: {
    type: 'object',
    description: 'Operation-specific arguments',
    properties: {
      query: { type: 'string', description: 'PromQL query for metrics operations' },
      time: { type: 'string', description: 'Evaluation timestamp (RFC3339 or Unix timestamp)' },
      start: { type: 'string', description: 'Range query start time' },
      end: { type: 'string', description: 'Range query end time' },
      step: { type: 'string', description: 'Query resolution step (e.g., 15s, 1m)' },
      sessionId: { type: 'string', description: 'Session ID for session_info operation' },
      services: { type: 'array', items: { type: 'string' }, description: 'Filter health check to specific services' },
      limit: { type: 'number', description: 'Maximum number of results' },
      status: { type: 'string', enum: ['active', 'idle', 'all'], description: 'Filter sessions by status' },
      state: { type: 'string', enum: ['firing', 'pending', 'all'], description: 'Filter alerts by state' },
      dashboard: { type: 'string', description: 'Dashboard name for URL generation' },
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
  prometheusUrl?: string;
  grafanaUrl?: string;
  thoughtboxUrl?: string;
}

// =============================================================================
// Handler Implementation
// =============================================================================

export class ObservabilityGatewayHandler {
  private readonly prometheusClient: PrometheusClient;
  private readonly grafanaUrl: string;
  private readonly thoughtboxUrl: string;
  private readonly storage: ThoughtboxStorage;

  constructor(config: ObservabilityGatewayConfig) {
    const prometheusConfig: PrometheusConfig = {
      url: config.prometheusUrl ?? process.env.PROMETHEUS_URL ?? 'http://prometheus:9090',
      timeout: 10000,
    };
    this.prometheusClient = new PrometheusClient(prometheusConfig);
    this.grafanaUrl = config.grafanaUrl ?? process.env.GRAFANA_URL ?? 'http://localhost:3001';
    this.thoughtboxUrl = config.thoughtboxUrl ?? 'http://thoughtbox:1731';
    this.storage = config.storage;
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
        case 'metrics':
          result = await this.handleMetrics(args as MetricsArgs);
          break;
        case 'metrics_range':
          result = await this.handleMetricsRange(args as MetricsRangeArgs);
          break;
        case 'sessions':
          result = await this.handleSessions(args as SessionsArgs);
          break;
        case 'session_info':
          result = await this.handleSessionInfo(args as SessionInfoArgs);
          break;
        case 'alerts':
          result = await this.handleAlerts(args as AlertsArgs);
          break;
        case 'dashboard_url':
          result = this.handleDashboardUrl(args.dashboard);
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
    return checkHealth(args, this.prometheusClient, this.thoughtboxUrl);
  }

  private async handleMetrics(args: MetricsArgs) {
    return queryMetrics(args, this.prometheusClient);
  }

  private async handleMetricsRange(args: MetricsRangeArgs) {
    return queryMetricsRange(args, this.prometheusClient);
  }

  private async handleSessions(args: SessionsArgs) {
    return listSessions(args, this.storage);
  }

  private async handleSessionInfo(args: SessionInfoArgs) {
    return getSessionInfo(args, this.storage);
  }

  private async handleAlerts(args: AlertsArgs) {
    return getAlerts(args, this.prometheusClient);
  }

  private handleDashboardUrl(dashboard?: string) {
    const dashboardName = dashboard ?? 'thoughtbox-mcp';
    const url = `${this.grafanaUrl}/d/${dashboardName}/${dashboardName}`;
    return { url, dashboard: dashboardName };
  }
}
