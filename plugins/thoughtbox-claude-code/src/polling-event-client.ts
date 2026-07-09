/**
 * Thoughtbox Event Polling Client (SPEC-REASONING-CHANNEL-HOSTED c4).
 *
 * Hosted (multi-tenant) Cloud Run cannot serve the in-process /events SSE
 * stream across replicas, so against a hosted server the channel pulls the
 * tenant-scoped protocol event log via `GET /protocol/events?changed_since=`.
 * Same config surface as EventClient so the channel selects a transport
 * without other code changes.
 *
 * On connect the client primes its cursor to the current tail without
 * emitting, so a fresh channel reacts to NEW protocol events rather than
 * replaying completed sessions.
 */

import { extractSessionId, type ThoughtboxEvent } from "./event-types.js";

export interface PollingEventClientConfig {
  baseUrl: string;
  apiKey: string;
  sessionId?: string;
  onEvent: (event: ThoughtboxEvent) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  pollIntervalMs?: number;
}

interface PulledEvent {
  cursor: number;
  type: ThoughtboxEvent["type"];
  source: ThoughtboxEvent["source"];
  timestamp: string;
  data: Record<string, unknown>;
}

interface PullResponse {
  events: PulledEvent[];
  cursor: number;
}

const DEFAULT_POLL_INTERVAL_MS = 3000;
const PAGE_LIMIT = 200;
const MIN_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;
const BACKOFF_MULTIPLIER = 2;

export class PollingEventClient {
  private config: PollingEventClientConfig;
  private cursor = 0;
  private closed = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private backoffMs = MIN_BACKOFF_MS;

  constructor(config: PollingEventClientConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.closed = false;
    this.backoffMs = MIN_BACKOFF_MS;
    await this.prime();
    if (this.closed) return;
    this.config.onConnect?.();
    this.backoffMs = MIN_BACKOFF_MS;
    this.scheduleNext(this.config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS);
  }

  close(): void {
    this.closed = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  setSessionId(sessionId: string): void {
    this.config.sessionId = sessionId;
  }

  private scheduleNext(delayMs: number): void {
    if (this.closed) return;
    this.timer = setTimeout(() => void this.poll(), delayMs);
  }

  private async poll(): Promise<void> {
    if (this.closed) return;
    try {
      let page = await this.fetchPage(this.cursor);
      while (page.events.length > 0) {
        for (const event of page.events) this.emit(event);
        this.cursor = page.cursor;
        if (page.events.length < PAGE_LIMIT) break;
        page = await this.fetchPage(this.cursor);
      }
      this.backoffMs = MIN_BACKOFF_MS;
      this.scheduleNext(this.config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS);
    } catch (error) {
      this.reportError(error);
      const delay = this.backoffMs;
      this.backoffMs = Math.min(this.backoffMs * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS);
      this.scheduleNext(delay);
    }
  }

  private emit(event: PulledEvent): void {
    const sessionId = extractSessionId(event);
    this.config.onEvent({
      source: event.source,
      type: event.type,
      sessionId,
      timestamp: event.timestamp,
      data: event.data,
    });
  }

  private async prime(): Promise<void> {
    while (!this.closed) {
      try {
        await this.primeOnce();
        return;
      } catch (error) {
        this.reportError(error);
        const delay = this.backoffMs;
        this.backoffMs = Math.min(this.backoffMs * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private async primeOnce(): Promise<void> {
    while (true) {
      const page = await this.fetchPage(this.cursor);
      if (page.events.length === 0) break;
      this.cursor = page.cursor;
      if (page.events.length < PAGE_LIMIT) break;
    }
  }

  private async fetchPage(cursor: number): Promise<PullResponse> {
    const params = new URLSearchParams();
    if (cursor > 0) params.set("changed_since", String(cursor));
    if (this.config.sessionId) params.set("session_id", this.config.sessionId);
    params.set("limit", String(PAGE_LIMIT));
    const url = `${this.config.baseUrl}/protocol/events?${params.toString()}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
    });
    if (!response.ok) {
      throw new Error(
        `protocol/events poll failed: ${response.status} ${response.statusText}`,
      );
    }
    const body = (await response.json()) as PullResponse;
    return { events: body.events ?? [], cursor: body.cursor ?? cursor };
  }

  private reportError(error: unknown): void {
    if (this.closed) return;
    const err = error instanceof Error ? error : new Error(String(error));
    this.config.onError?.(err);
  }
}
