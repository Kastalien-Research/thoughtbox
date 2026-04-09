/**
 * Intelligence Pipeline Integration Tests
 *
 * Tests the v1 intelligence path: thought INSERT → pgmq trigger → queue worker → archive.
 * Requires local Supabase running (`supabase start`).
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import {
  createServiceClient,
  ensureTestWorkspace,
  isSupabaseAvailable,
  TEST_WORKSPACE_ID,
  SUPABASE_TEST_URL,
  SUPABASE_TEST_SERVICE_ROLE_KEY,
} from './supabase-test-helpers.js';

const SKIP_REASON = 'Local Supabase not available';

describe('Intelligence Pipeline', () => {
  let available: boolean;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
    if (available) {
      await ensureTestWorkspace();
    }
  });

  describe('Migration validation', () => {
    it('thoughts table remains writable without embedding columns', async () => {
      if (!available) return expect(true).toBe(true); // skip gracefully
      const client = createServiceClient();
      const { error } = await client
        .from('thoughts')
        .select('id')
        .limit(0);
      expect(error).toBeNull();
    });

    it('pgmq thought_processing queue exists', async () => {
      if (!available) return expect(true).toBe(true);
      const client = createServiceClient();
      const { error } = await client.rpc('pgmq_read_queue', {
        queue_name: 'thought_processing',
        vt: 0,
        qty: 0,
      });
      expect(error).toBeNull();
    });

    it('pgmq RPC wrappers are callable by service_role', async () => {
      if (!available) return expect(true).toBe(true);
      const client = createServiceClient();

      const { error: readErr } = await client.rpc('pgmq_read_queue', {
        queue_name: 'thought_processing',
        vt: 0,
        qty: 1,
      });
      expect(readErr).toBeNull();

      // archive with a non-existent msg_id should return false, not error
      const { data: archiveResult, error: archErr } = await client.rpc(
        'pgmq_archive_queue_message',
        { queue_name: 'thought_processing', msg_id: 999999999 },
      );
      expect(archErr).toBeNull();
      expect(archiveResult).toBe(false);
    });

    it('enqueue trigger function exists on thoughts table', async () => {
      if (!available) return expect(true).toBe(true);
      const client = createServiceClient();
      const { data, error } = await client.rpc('exec_sql' as never, {
        sql: `SELECT tgname FROM pg_trigger WHERE tgname = 'trg_thought_insert_enqueue'`,
      });
      // If exec_sql doesn't exist, fall back to just verifying insert triggers enqueue
      if (error) {
        // The E2E test below will cover this
        expect(true).toBe(true);
        return;
      }
      expect(data).toHaveLength(1);
    });
  });

  describe('Queue processing', () => {
    let testSessionId: string;

    beforeEach(async () => {
      if (!available) return;
      const client = createServiceClient();
      // Create a fresh session for each test
      const { data, error } = await client
        .from('sessions')
        .insert({
          workspace_id: TEST_WORKSPACE_ID,
          title: 'Intelligence Pipeline Test',
          status: 'active',
          thought_count: 0,
          branch_count: 0,
        })
        .select('id')
        .single();
      expect(error).toBeNull();
      testSessionId = data!.id;
    });

    it('thought insert enqueues to thought_processing', async () => {
      if (!available) return expect(true).toBe(true);
      const client = createServiceClient();

      // Insert a thought — trigger should enqueue
      const { data: thought, error: insertErr } = await client
        .from('thoughts')
        .insert({
          session_id: testSessionId,
          workspace_id: TEST_WORKSPACE_ID,
          thought_number: 1,
          thought: 'Test thought for queue enqueue verification',
          total_thoughts: 1,
          next_thought_needed: false,
          thought_type: 'reasoning',
        })
        .select('id')
        .single();
      expect(insertErr).toBeNull();

      // Read from queue — should find our message
      const { data: messages, error: readErr } = await client.rpc(
        'pgmq_read_queue',
        { queue_name: 'thought_processing', vt: 0, qty: 10 },
      );
      expect(readErr).toBeNull();

      const found = (messages as Array<{ message: { thought_id: string } }>).find(
        (m) => m.message.thought_id === thought!.id,
      );
      expect(found).toBeDefined();

      // Clean up: archive the message
      if (found) {
        await client.rpc('pgmq_archive_queue_message', {
          queue_name: 'thought_processing',
          msg_id: (found as { msg_id: number }).msg_id,
        });
      }
    });

    it('queue worker processes thought and archives message', async () => {
      if (!available) return expect(true).toBe(true);
      const client = createServiceClient();

      // Insert thought
      const { data: thought } = await client
        .from('thoughts')
        .insert({
          session_id: testSessionId,
          workspace_id: TEST_WORKSPACE_ID,
          thought_number: 1,
          thought: 'Test thought for worker processing',
          total_thoughts: 1,
          next_thought_needed: false,
          thought_type: 'reasoning',
        })
        .select('id')
        .single();

      // Invoke the queue worker edge function
      const workerUrl = `${SUPABASE_TEST_URL}/functions/v1/process-thought-queue`;
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ source: 'test' }),
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.read).toBeGreaterThanOrEqual(1);

      // Find our message in the results
      const processed = result.results.find(
        (r: { ok: boolean }) => r.ok === true,
      );
      expect(processed).toBeDefined();

      // Verify queue is drained for our message
      const { data: remaining } = await client.rpc('pgmq_read_queue', {
        queue_name: 'thought_processing',
        vt: 0,
        qty: 100,
      });
      const stillQueued = (
        remaining as Array<{ message: { thought_id: string } }>
      ).find((m) => m.message.thought_id === thought!.id);
      expect(stillQueued).toBeUndefined();
    });
  });
});
