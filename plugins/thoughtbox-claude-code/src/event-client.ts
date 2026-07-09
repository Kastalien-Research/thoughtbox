/**
 * Thoughtbox Event SSE Client
 *
 * Connects to the Thoughtbox /events SSE endpoint and emits
 * parsed ThoughtboxEvent objects. Reconnects with exponential backoff.
 */

import {
  extractSessionId,
  type ThoughtboxEvent,
  type WireThoughtboxEvent,
} from "./event-types.js";

export interface EventClientConfig {
  baseUrl: string;
  apiKey: string;
  sessionId?: string;
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

  setSessionId(sessionId: string): void {
    this.config.sessionId = sessionId;
  }

  private async doConnect(): Promise<void> {
    if (this.closed) return;

    this.controller = new AbortController();
    const params = new URLSearchParams();
    if (this.config.sessionId) params.set("session_id", this.config.sessionId);
    const qs = params.toString();
    const url = `${this.config.baseUrl}/events${qs ? `?${qs}` : ""}`;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "text/event-stream",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
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
              // Server events are workspace-scoped (top-level workspaceId,
              // session id inside data.session_id) — normalize to the
              // sessionId the EventFilter and formatters key on.
              const raw = JSON.parse(line.slice(6)) as WireThoughtboxEvent;
              this.config.onEvent({
                source: raw.source,
                type: raw.type,
                sessionId: extractSessionId(raw),
                timestamp: raw.timestamp,
                data: raw.data ?? {},
              });
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
