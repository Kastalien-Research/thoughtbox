/**
 * LangSmith tracing integration
 */

import type { TracingConfig, TraceSpan } from '../types.js';

export class TracingClient {
  private config: TracingConfig;
  private enabled: boolean;
  private spans: Map<string, TraceSpan>;

  constructor(config: TracingConfig) {
    this.config = config;
    this.enabled = !!config.apiKey;
    this.spans = new Map();

    if (!this.enabled) {
      console.warn('LangSmith tracing disabled: no API key provided');
    }
  }

  /**
   * Start a new trace span
   */
  startSpan(name: string, attributes?: Record<string, unknown>): TraceSpan {
    const span: TraceSpan = {
      name,
      startTime: Date.now(),
      attributes: attributes || {},
    };

    this.spans.set(name, span);

    if (this.enabled) {
      console.log(`[TRACE] Started span: ${name}`);
    }

    return span;
  }

  /**
   * End a trace span
   */
  endSpan(
    name: string,
    status: 'ok' | 'error' = 'ok',
    statusMessage?: string
  ): void {
    const span = this.spans.get(name);
    if (!span) {
      console.warn(`[TRACE] Span not found: ${name}`);
      return;
    }

    span.endTime = Date.now();
    span.status = status;
    span.statusMessage = statusMessage;

    if (this.enabled) {
      const duration = span.endTime - span.startTime;
      console.log(
        `[TRACE] Ended span: ${name} (${duration}ms, status=${status})`
      );
    }
  }

  /**
   * Generate trace URL for LangSmith
   */
  getTraceUrl(runId: string): string {
    if (!this.enabled) {
      return 'https://smith.langchain.com (tracing disabled)';
    }

    const org = process.env.LANGSMITH_ORG || 'your-org';
    const project = this.config.projectName;
    return `https://smith.langchain.com/o/${org}/projects/p/${project}/r/${runId}`;
  }

  /**
   * Log event to trace
   */
  logEvent(spanName: string, event: string, data?: Record<string, unknown>): void {
    const span = this.spans.get(spanName);
    if (!span) {
      console.warn(`[TRACE] Span not found for event: ${spanName}`);
      return;
    }

    if (this.enabled) {
      console.log(`[TRACE] Event in ${spanName}: ${event}`, data || {});
    }
  }

  /**
   * Get summary of all spans
   */
  getSummary(): Array<{
    name: string;
    duration: number;
    status: string;
  }> {
    return Array.from(this.spans.values()).map((span) => ({
      name: span.name,
      duration: span.endTime
        ? span.endTime - span.startTime
        : Date.now() - span.startTime,
      status: span.status || 'running',
    }));
  }
}

/**
 * Create tracing client from environment
 */
export function createTracingClient(runId: string): TracingClient {
  const config: TracingConfig = {
    projectName:
      process.env.LANGSMITH_PROJECT || 'agentops-thoughtbox-dev',
    apiKey: process.env.LANGSMITH_API_KEY,
    tags: [
      process.env.GITHUB_JOB || 'unknown-job',
      process.env.GITHUB_SHA?.substring(0, 7) || 'unknown-sha',
      runId,
    ],
    metadata: {
      github_run_id: process.env.GITHUB_RUN_ID,
      github_ref: process.env.GITHUB_REF,
      github_actor: process.env.GITHUB_ACTOR,
    },
  };

  return new TracingClient(config);
}
