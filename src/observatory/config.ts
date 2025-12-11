/**
 * Observatory Configuration
 *
 * Configuration types and defaults for the Observatory module.
 * Observatory provides real-time observability into reasoning processes
 * via WebSocket streaming.
 */

import { z } from "zod";

/**
 * Observatory configuration schema
 */
export const ObservatoryConfigSchema = z.object({
  /** Enable the observatory server (default: false) */
  enabled: z.boolean().default(false),

  /** Port for WebSocket server (default: 1729 - the taxicab number) */
  port: z.number().int().positive().default(1729),

  /** Allowed CORS origins (default: ['*']) */
  cors: z.array(z.string()).optional().default(["*"]),

  /** WebSocket path (default: '/ws') */
  path: z.string().default("/ws"),

  /** Maximum concurrent connections (default: 100) */
  maxConnections: z.number().int().positive().default(100),

  /** Enable HTTP REST API alongside WebSocket (default: true) */
  httpApi: z.boolean().default(true),
});

export type ObservatoryConfig = z.infer<typeof ObservatoryConfigSchema>;

/**
 * Load observatory configuration from environment variables
 */
export function loadObservatoryConfig(): ObservatoryConfig {
  return ObservatoryConfigSchema.parse({
    enabled: process.env.THOUGHTBOX_OBSERVATORY_ENABLED === "true",
    port: process.env.THOUGHTBOX_OBSERVATORY_PORT
      ? parseInt(process.env.THOUGHTBOX_OBSERVATORY_PORT, 10)
      : undefined,
    cors: process.env.THOUGHTBOX_OBSERVATORY_CORS?.split(",").map((s) =>
      s.trim()
    ),
    path: process.env.THOUGHTBOX_OBSERVATORY_PATH,
    maxConnections: process.env.THOUGHTBOX_OBSERVATORY_MAX_CONN
      ? parseInt(process.env.THOUGHTBOX_OBSERVATORY_MAX_CONN, 10)
      : undefined,
    httpApi: process.env.THOUGHTBOX_OBSERVATORY_HTTP_API !== "false",
  });
}
