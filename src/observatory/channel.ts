/**
 * Channel - Topic-based message routing
 *
 * Channels provide pub/sub semantics for WebSocket communication.
 * Based on srcbook's channel pattern.
 *
 * Topic patterns support dynamic segments:
 * - Static: "observatory" matches only "observatory"
 * - Dynamic: "reasoning:<sessionId>" matches "reasoning:abc123"
 *
 * Example:
 * ```ts
 * const channel = new Channel("reasoning:<sessionId>");
 * channel.onJoin(({ params, send }) => {
 *   // params.sessionId = "abc123"
 *   send("session:snapshot", { ... });
 * });
 * channel.on("list:thoughts", ThoughtRequestSchema, ({ params, send }) => {
 *   // Handle request
 * });
 * ```
 */

import { z } from "zod";

/**
 * Parsed topic segment
 */
interface TopicSegment {
  value: string;
  isDynamic: boolean;
  paramName?: string;
}

/**
 * Params extracted from matching a topic
 */
export type TopicParams = Record<string, string>;

/**
 * Context passed to event handlers
 */
export interface ChannelContext {
  /** Extracted params from topic pattern */
  params: TopicParams;
  /** The matched topic */
  topic: string;
  /** Send a message back to the client */
  send: (event: string, payload: unknown) => void;
  /** Broadcast to all subscribers of this topic */
  broadcast: (event: string, payload: unknown) => void;
}

/**
 * Handler function for channel events
 */
export type ChannelHandler<T = unknown> = (
  context: ChannelContext,
  payload: T
) => void | Promise<void>;

/**
 * Join handler function
 */
export type JoinHandler = (context: ChannelContext) => void | Promise<void>;

/**
 * Registered event handler with schema
 */
interface RegisteredHandler {
  schema: z.ZodSchema;
  handler: ChannelHandler;
}

/**
 * Channel class for topic-based routing
 */
export class Channel {
  private pattern: string;
  private segments: TopicSegment[];
  private handlers: Map<string, RegisteredHandler> = new Map();
  private joinHandler: JoinHandler | null = null;

  constructor(pattern: string) {
    this.pattern = pattern;
    this.segments = this.parsePattern(pattern);
  }

  /**
   * Get the channel pattern
   */
  getPattern(): string {
    return this.pattern;
  }

  /**
   * Parse a topic pattern into segments
   * Example: "reasoning:<sessionId>" → [
   *   { value: "reasoning", isDynamic: false },
   *   { value: "sessionId", isDynamic: true, paramName: "sessionId" }
   * ]
   */
  private parsePattern(pattern: string): TopicSegment[] {
    return pattern.split(":").map((part) => {
      if (part.startsWith("<") && part.endsWith(">")) {
        const paramName = part.slice(1, -1);
        return { value: part, isDynamic: true, paramName };
      }
      return { value: part, isDynamic: false };
    });
  }

  /**
   * Match a topic against this channel's pattern
   * Returns extracted params if match, null otherwise
   */
  match(topic: string): TopicParams | null {
    const parts = topic.split(":");

    if (parts.length !== this.segments.length) {
      return null;
    }

    const params: TopicParams = {};

    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      const part = parts[i];

      if (segment.isDynamic) {
        // Dynamic segment - extract as param
        params[segment.paramName!] = part;
      } else if (segment.value !== part) {
        // Static segment mismatch
        return null;
      }
    }

    return params;
  }

  /**
   * Register a handler for a specific event
   *
   * @param event Event name to handle
   * @param schema Zod schema for payload validation
   * @param handler Handler function
   */
  on<T extends z.ZodSchema>(
    event: string,
    schema: T,
    handler: ChannelHandler<z.infer<T>>
  ): this {
    this.handlers.set(event, { schema, handler: handler as ChannelHandler });
    return this;
  }

  /**
   * Register a handler called when a client joins (subscribes to) this channel
   */
  onJoin(handler: JoinHandler): this {
    this.joinHandler = handler;
    return this;
  }

  /**
   * Handle a join event
   * @internal
   */
  async handleJoin(context: ChannelContext): Promise<void> {
    if (this.joinHandler) {
      await this.joinHandler(context);
    }
  }

  /**
   * Handle an incoming event
   * @internal
   */
  async handleEvent(
    event: string,
    context: ChannelContext,
    payload: unknown
  ): Promise<boolean> {
    const registered = this.handlers.get(event);
    if (!registered) {
      return false;
    }

    // Validate payload
    const result = registered.schema.safeParse(payload);
    if (!result.success) {
      console.warn(
        `[Channel ${this.pattern}] Invalid payload for ${event}:`,
        result.error.message
      );
      context.send("error", {
        code: "INVALID_PAYLOAD",
        message: result.error.message,
      });
      return true; // Event was recognized but payload invalid
    }

    // Call handler
    try {
      await registered.handler(context, result.data);
    } catch (err) {
      console.error(
        `[Channel ${this.pattern}] Error in ${event} handler:`,
        err
      );
      context.send("error", {
        code: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }

    return true;
  }

  /**
   * Get all registered event names
   */
  getEventNames(): string[] {
    return Array.from(this.handlers.keys());
  }
}
