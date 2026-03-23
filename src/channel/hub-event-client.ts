/**
 * Hub Event SSE Client
 *
 * Connects to the Thoughtbox HTTP server's /hub/events SSE endpoint
 * and emits parsed HubEvent objects to a callback.
 * Reconnects with exponential backoff on disconnection.
 */

import type { HubEvent } from "../hub/hub-handler.js";

export interface HubEventClientConfig {
  /** Base URL of the Thoughtbox HTTP server (e.g., http://localhost:1731) */
  baseUrl: string;
  /** Workspace ID to filter events for */
  workspaceId: string;
  /** Callback invoked for each Hub event */
  onEvent: (event: HubEvent) => void;
  /** Callback invoked on connection errors */
  onError?: (error: Error) => void;
  /** Callback invoked when connection is established */
  onConnect?: () => void;
}

const MIN_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;
const BACKOFF_MULTIPLIER = 2;

export class HubEventClient {
  private config: HubEventClientConfig;
  private controller: AbortController | null = null;
  private backoffMs = MIN_BACKOFF_MS;
  private closed = false;

  constructor(config: HubEventClientConfig) {
    this.config = config;
  }

  /**
   * Start the SSE connection. Reconnects automatically on failure.
   */
  async connect(): Promise<void> {
    this.closed = false;
    await this.doConnect();
  }

  /**
   * Close the SSE connection and stop reconnecting.
   */
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
    const url = `${this.config.baseUrl}/hub/events?workspace_id=${encodeURIComponent(this.config.workspaceId)}`;

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

      // Reset backoff on successful connection
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
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            try {
              const event = JSON.parse(jsonStr) as HubEvent;
              this.config.onEvent(event);
            } catch {
              // Ignore unparseable events (e.g., heartbeat comments)
            }
          }
        }
      }
    } catch (error) {
      if (this.closed) return;

      const err = error instanceof Error ? error : new Error(String(error));
      // Don't report abort errors (normal close)
      if (err.name !== "AbortError") {
        this.config.onError?.(err);
      }
    }

    // Reconnect with backoff
    if (!this.closed) {
      const delay = this.backoffMs;
      this.backoffMs = Math.min(this.backoffMs * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS);
      await new Promise(resolve => setTimeout(resolve, delay));
      await this.doConnect();
    }
  }
}
