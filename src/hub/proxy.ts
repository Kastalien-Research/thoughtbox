/**
 * Proxy Module — Capability detection and task/direct routing
 *
 * ADR-002 Section 4: Proxy Specification
 */

import type { ClientCapabilities, ProxyCapabilities } from './hub-types.js';

export interface ToolCallRequest {
  operation: string;
  args: Record<string, unknown>;
}

export interface ToolCallResult {
  type: 'task' | 'direct';
  status?: string;
  operation: string;
  args: Record<string, unknown>;
}

export interface Proxy {
  capabilities: ProxyCapabilities;
  handleToolCall(request: ToolCallRequest): ToolCallResult;
}

export function createProxy(clientCapabilities: ClientCapabilities): Proxy {
  const supportsTasks = Boolean(clientCapabilities.tasks);
  const supportsSubscribe = Boolean(clientCapabilities.resources?.subscribe);

  const capabilities: ProxyCapabilities = {
    supportsTasks,
    supportsSubscribe,
  };

  return {
    capabilities,

    handleToolCall(request) {
      if (supportsTasks) {
        return {
          type: 'task',
          status: 'working',
          operation: request.operation,
          args: request.args,
        };
      }

      return {
        type: 'direct',
        operation: request.operation,
        args: request.args,
      };
    },
  };
}
