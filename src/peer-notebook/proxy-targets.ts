import type { BrokerProxyTarget } from "./broker-proxy.js";
import type { JsonObject, JsonValue } from "./types.js";
import { PeerNotebookError } from "./types.js";

export const KNOWLEDGE_QUERY_GRAPH_TARGET = "thoughtbox.knowledge.queryGraph";
export const SESSION_GET_TARGET = "thoughtbox.session.get";

/**
 * MCP-style handler result: content blocks where the first text block
 * carries the operation result (or `{ error }`) as JSON.
 */
interface HandlerContentResult {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
}

/** Structural slice of src/knowledge KnowledgeHandler used by the broker proxy. */
export interface KnowledgeProxyHandler {
  processOperation(args: { operation: "query_graph" } & JsonObject): Promise<HandlerContentResult>;
}

/** Structural slice of src/sessions SessionHandler used by the broker proxy. */
export interface SessionProxyHandler {
  processTool(operation: string, args: JsonObject): Promise<HandlerContentResult>;
}

export interface BrokerProxyTargetDeps {
  /** Absent when knowledge storage failed to initialize at server creation. */
  knowledgeHandler?: KnowledgeProxyHandler;
  /** Captured knowledge init failure, surfaced in the target_unavailable error. */
  knowledgeUnavailableReason?: string;
  /** Absent only in reduced test harnesses; always wired by the server factory. */
  sessionHandler?: SessionProxyHandler;
}

/**
 * Builds the broker proxy outbound target map. Every target is always
 * registered so the manifest allowlist remains the only gate; a target whose
 * backing handler is absent throws a `target_unavailable` PeerNotebookError,
 * which surfaces through the broker's existing invocation error path.
 */
export function createBrokerProxyTargets(
  deps: BrokerProxyTargetDeps = {},
): Record<string, BrokerProxyTarget> {
  return {
    [KNOWLEDGE_QUERY_GRAPH_TARGET]: async (args: JsonObject) => {
      const handler = deps.knowledgeHandler;
      if (!handler) {
        throw new PeerNotebookError(
          "target_unavailable",
          `${KNOWLEDGE_QUERY_GRAPH_TARGET} is unavailable: ` +
            `${deps.knowledgeUnavailableReason ?? "knowledge handler is not configured for this server"}`,
        );
      }
      return unwrapHandlerResult(
        KNOWLEDGE_QUERY_GRAPH_TARGET,
        await handler.processOperation({ ...args, operation: "query_graph" }),
      );
    },
    [SESSION_GET_TARGET]: async (args: JsonObject) => {
      const handler = deps.sessionHandler;
      if (!handler) {
        throw new PeerNotebookError(
          "target_unavailable",
          `${SESSION_GET_TARGET} is unavailable: session handler is not configured for this server`,
        );
      }
      return unwrapHandlerResult(SESSION_GET_TARGET, await handler.processTool("get", args));
    },
  };
}

function unwrapHandlerResult(target: string, raw: HandlerContentResult): JsonValue {
  const textBlock = raw.content.find(block => block.type === "text" && typeof block.text === "string");
  let parsed: JsonValue = textBlock?.text ?? null;
  if (textBlock?.text) {
    try {
      parsed = JSON.parse(textBlock.text) as JsonValue;
    } catch {
      parsed = textBlock.text;
    }
  }

  if (raw.isError) {
    const message =
      parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) &&
      typeof parsed.error === "string"
        ? parsed.error
        : "handler reported an error without a message";
    throw new PeerNotebookError("target_failed", `${target} failed: ${message}`);
  }
  return parsed;
}
