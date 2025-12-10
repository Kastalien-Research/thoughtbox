/**
 * WebSocketServer - Channel-based WebSocket server
 *
 * Based on srcbook's WebSocket architecture, providing:
 * - Topic-based routing via channels
 * - Subscription management
 * - Broadcast capabilities
 * - Auto-reconnection support via snapshot-on-join
 *
 * Message format: [topic, event, payload]
 *
 * Example:
 * ```ts
 * const wss = new WebSocketServer();
 *
 * // Register a channel
 * const reasoningChannel = new Channel("reasoning:<sessionId>");
 * reasoningChannel.onJoin(({ params, send }) => {
 *   send("session:snapshot", getSnapshot(params.sessionId));
 * });
 * wss.registerChannel(reasoningChannel);
 *
 * // Start server
 * wss.start(3001);
 *
 * // Broadcast to subscribers
 * wss.broadcast("reasoning:abc123", "thought:added", { thought: {...} });
 * ```
 */

import { WebSocket, WebSocketServer as WSServer } from "ws";
import type { IncomingMessage } from "http";
import type { Server } from "http";
import { Channel, type TopicParams, type ChannelContext } from "./channel.js";
import { z } from "zod";

/**
 * Connection state for a WebSocket client
 */
interface ClientConnection {
  socket: WebSocket;
  subscriptions: Set<string>;
  id: string;
}

/**
 * Message schema for incoming WebSocket messages
 * Format: [topic, event, payload]
 */
const MessageSchema = z.tuple([
  z.string(), // topic
  z.string(), // event
  z.unknown(), // payload
]);

/**
 * Subscribe payload schema
 */
const SubscribePayloadSchema = z.object({
  id: z.string().optional(),
});

/**
 * WebSocketServer - Manages WebSocket connections and routing
 */
export class WebSocketServer {
  private wss: WSServer | null = null;
  private connections: Map<string, ClientConnection> = new Map();
  private channels: Channel[] = [];
  private connectionCounter = 0;

  /**
   * Register a channel for handling specific topic patterns
   */
  registerChannel(channel: Channel): this {
    this.channels.push(channel);
    return this;
  }

  /**
   * Get a registered channel by pattern
   */
  getChannel(pattern: string): Channel | undefined {
    return this.channels.find((c) => c.getPattern() === pattern);
  }

  /**
   * Find a channel that matches the given topic
   */
  private findChannel(topic: string): { channel: Channel; params: TopicParams } | null {
    for (const channel of this.channels) {
      const params = channel.match(topic);
      if (params !== null) {
        return { channel, params };
      }
    }
    return null;
  }

  /**
   * Start the WebSocket server
   *
   * @param portOrServer Either a port number or an HTTP server to attach to
   */
  start(portOrServer: number | Server): void {
    if (typeof portOrServer === "number") {
      this.wss = new WSServer({ port: portOrServer });
      console.log(`[Observatory] WebSocket server listening on port ${portOrServer}`);
    } else {
      this.wss = new WSServer({ server: portOrServer });
      console.log(`[Observatory] WebSocket server attached to HTTP server`);
    }

    this.wss.on("connection", (socket: WebSocket, request: IncomingMessage) => {
      this.handleConnection(socket, request);
    });

    this.wss.on("error", (err: Error) => {
      console.error("[Observatory] WebSocket server error:", err);
    });
  }

  /**
   * Stop the WebSocket server
   */
  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.wss) {
        resolve();
        return;
      }

      // Close all connections
      for (const conn of this.connections.values()) {
        conn.socket.close(1000, "Server shutting down");
      }
      this.connections.clear();

      this.wss.close((err?: Error) => {
        if (err) {
          reject(err);
        } else {
          this.wss = null;
          resolve();
        }
      });
    });
  }

  /**
   * Handle a new WebSocket connection
   */
  private handleConnection(socket: WebSocket, request: IncomingMessage): void {
    const connectionId = `conn_${++this.connectionCounter}`;
    const connection: ClientConnection = {
      socket,
      subscriptions: new Set(),
      id: connectionId,
    };
    this.connections.set(connectionId, connection);

    console.log(`[Observatory] Client connected: ${connectionId}`);

    socket.on("message", (data: WebSocket.RawData) => {
      this.handleMessage(connection, data);
    });

    socket.on("close", (code: number, reason: Buffer) => {
      this.connections.delete(connectionId);
      console.log(
        `[Observatory] Client disconnected: ${connectionId} (code: ${code})`
      );
    });

    socket.on("error", (err: Error) => {
      console.error(`[Observatory] Client error (${connectionId}):`, err);
    });
  }

  /**
   * Handle an incoming message from a client
   */
  private async handleMessage(
    connection: ClientConnection,
    data: WebSocket.RawData
  ): Promise<void> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data.toString());
    } catch {
      this.sendTo(connection, "error", "error", {
        code: "INVALID_PAYLOAD",
        message: "Invalid JSON",
      });
      return;
    }

    // Validate message format
    const result = MessageSchema.safeParse(parsed);
    if (!result.success) {
      this.sendTo(connection, "error", "error", {
        code: "INVALID_PAYLOAD",
        message: "Message must be [topic, event, payload]",
      });
      return;
    }

    const [topic, event, payload] = result.data;

    // Handle built-in events
    if (event === "subscribe") {
      await this.handleSubscribe(connection, topic, payload);
      return;
    }

    if (event === "unsubscribe") {
      this.handleUnsubscribe(connection, topic);
      return;
    }

    // Route to channel handler
    const match = this.findChannel(topic);
    if (!match) {
      this.sendTo(connection, topic, "error", {
        code: "INTERNAL_ERROR",
        message: `No channel matches topic: ${topic}`,
      });
      return;
    }

    const context = this.createContext(connection, topic, match.params);
    const handled = await match.channel.handleEvent(event, context, payload);

    if (!handled) {
      console.warn(`[Observatory] Unhandled event: ${event} on ${topic}`);
    }
  }

  /**
   * Handle subscription request
   */
  private async handleSubscribe(
    connection: ClientConnection,
    topic: string,
    payload: unknown
  ): Promise<void> {
    const parseResult = SubscribePayloadSchema.safeParse(payload);
    const subscriptionId = parseResult.success ? parseResult.data.id : undefined;

    const match = this.findChannel(topic);
    if (!match) {
      this.sendTo(connection, topic, "error", {
        code: "INTERNAL_ERROR",
        message: `No channel matches topic: ${topic}`,
      });
      return;
    }

    // Add to subscriptions
    connection.subscriptions.add(topic);

    // Send subscription confirmation
    this.sendTo(connection, topic, "subscribed", { id: subscriptionId });

    // Call join handler to send initial state
    const context = this.createContext(connection, topic, match.params);
    await match.channel.handleJoin(context);

    console.log(`[Observatory] ${connection.id} subscribed to ${topic}`);
  }

  /**
   * Handle unsubscription request
   */
  private handleUnsubscribe(connection: ClientConnection, topic: string): void {
    connection.subscriptions.delete(topic);
    this.sendTo(connection, topic, "unsubscribed", {});
    console.log(`[Observatory] ${connection.id} unsubscribed from ${topic}`);
  }

  /**
   * Create a channel context for handlers
   */
  private createContext(
    connection: ClientConnection,
    topic: string,
    params: TopicParams
  ): ChannelContext {
    return {
      params,
      topic,
      send: (event, payload) => this.sendTo(connection, topic, event, payload),
      broadcast: (event, payload) => this.broadcast(topic, event, payload),
    };
  }

  /**
   * Send a message to a specific connection
   */
  private sendTo(
    connection: ClientConnection,
    topic: string,
    event: string,
    payload: unknown
  ): void {
    if (connection.socket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify([topic, event, payload]);
      connection.socket.send(message);
    }
  }

  /**
   * Broadcast a message to all subscribers of a topic
   */
  broadcast(topic: string, event: string, payload: unknown): void {
    const message = JSON.stringify([topic, event, payload]);
    let count = 0;

    for (const connection of this.connections.values()) {
      if (
        connection.subscriptions.has(topic) &&
        connection.socket.readyState === WebSocket.OPEN
      ) {
        connection.socket.send(message);
        count++;
      }
    }

    if (count > 0) {
      console.log(`[Observatory] Broadcast ${event} to ${count} subscribers on ${topic}`);
    }
  }

  /**
   * Get count of active connections
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get count of subscribers for a topic
   */
  getSubscriberCount(topic: string): number {
    let count = 0;
    for (const connection of this.connections.values()) {
      if (connection.subscriptions.has(topic)) {
        count++;
      }
    }
    return count;
  }
}
