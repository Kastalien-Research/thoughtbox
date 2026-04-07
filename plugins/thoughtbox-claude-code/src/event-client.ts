/**
 * Thoughtbox Event SSE Client
 *
 * Connects to the Thoughtbox /events SSE endpoint and emits
 * parsed ThoughtboxEvent objects. Reconnects with exponential backoff.
 */

import type { ThoughtboxEvent } from "./event-types.js";

export interface EventClientConfig {
  baseUrl: string;
  workspaceId: string;
  onEvent: (event: ThoughtboxEvent) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
}

const MIN_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;
const BACKOFF_MULTIPLIER = 2;

export class EventClient {
  private config: EventClientConfig;
  private controller: AbortController | null = null;
  private backoffMs = MIN_BACKOFF_MS;
  private closed = false;

  constructor(config: EventClientConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.closed = false;
    await this.doConnect();
  }

  close(): void {
    this.closed = true;
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  private async doConnect(): Promise<void> {
    if (this.closed) return;

    this.controller = new AbortController();
    const url = `${this.config.baseUrl}/events?workspace_id=${encodeURIComponent(this.config.workspaceId)}`;

    try {
      const response = await fetch(url, {
        headers: { Accept: "text/event-stream" },
        signal: this.controller.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("SSE response has no body");
      }

      this.backoffMs = MIN_BACKOFF_MS;
      this.config.onConnect?.();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!this.closed) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6)) as ThoughtboxEvent;
              this.config.onEvent(event);
            } catch {
              // Ignore unparseable events
            }
          }
        }
      }
    } catch (error) {
      if (this.closed) return;
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.name !== "AbortError") {
        this.config.onError?.(err);
      }
    }

    if (!this.closed) {
      const delay = this.backoffMs;
      this.backoffMs = Math.min(this.backoffMs * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS);
      await new Promise(resolve => setTimeout(resolve, delay));
      await this.doConnect();
    }
  }
}
