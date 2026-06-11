/**
 * Unit tests for ObservabilityGatewayHandler.
 *
 * Verifies the honest-error contract (SPEC-V1-INITIATIVE:c6): operations
 * either do the real thing or return an MCP error result — no soft success.
 */

import { describe, it, expect, vi } from 'vitest';
import { ObservabilityGatewayHandler } from '../gateway-handler.js';
import { InMemoryStorage } from '../../persistence/index.js';

interface ToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

function parsePayload(result: ToolResult): Record<string, unknown> {
  return JSON.parse(result.content[0].text);
}

describe('ObservabilityGatewayHandler', () => {
  describe('OTEL operations without Supabase', () => {
    it('session_timeline returns an error result when Supabase is not configured', async () => {
      const handler = new ObservabilityGatewayHandler({ storage: new InMemoryStorage() });

      const result = await handler.handle({
        operation: 'session_timeline',
        args: { sessionId: 'abc-123' },
      });

      expect(result.isError).toBe(true);
      expect(parsePayload(result).error).toBe('OTEL queries require Supabase configuration');
    });

    it('session_cost returns an error result when Supabase is not configured', async () => {
      const handler = new ObservabilityGatewayHandler({ storage: new InMemoryStorage() });

      const result = await handler.handle({
        operation: 'session_cost',
        args: { sessionId: 'abc-123' },
      });

      expect(result.isError).toBe(true);
      expect(parsePayload(result).error).toBe('OTEL queries require Supabase configuration');
    });

    it('session_timeline returns an error result when sessionId is missing', async () => {
      const handler = new ObservabilityGatewayHandler({
        storage: new InMemoryStorage(),
        supabaseUrl: 'http://localhost:54321',
        serviceRoleKey: 'test-service-role-key',
      });

      const result = await handler.handle({ operation: 'session_timeline' });

      expect(result.isError).toBe(true);
      expect(parsePayload(result).error).toBe('sessionId is required for session_timeline');
    });
  });

  describe('health', () => {
    it('reports thoughtbox healthy from a storage probe and supabase unknown when unconfigured', async () => {
      const handler = new ObservabilityGatewayHandler({ storage: new InMemoryStorage() });

      const result = await handler.handle({ operation: 'health' });

      expect(result.isError).toBeUndefined();
      const payload = parsePayload(result) as {
        status: string;
        services: Record<string, { status: string; error?: string }>;
      };
      expect(payload.services['thoughtbox'].status).toBe('healthy');
      expect(payload.services['supabase'].status).toBe('unknown');
      expect(payload.status).toBe('degraded');
    });

    it('reports thoughtbox unhealthy when the storage probe fails', async () => {
      const storage = new InMemoryStorage();
      vi.spyOn(storage, 'listSessions').mockRejectedValue(new Error('storage backend unavailable'));
      const handler = new ObservabilityGatewayHandler({ storage });

      const result = await handler.handle({ operation: 'health' });

      const payload = parsePayload(result) as {
        status: string;
        services: Record<string, { status: string; error?: string }>;
      };
      expect(payload.services['thoughtbox'].status).toBe('unhealthy');
      expect(payload.services['thoughtbox'].error).toBe('storage backend unavailable');
      expect(payload.status).toBe('unhealthy');
    });
  });
});
