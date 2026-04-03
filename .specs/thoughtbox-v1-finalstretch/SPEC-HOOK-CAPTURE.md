# SPEC-HOOK-CAPTURE: Hook-Based Tool Event Capture

## Status: DRAFT

## Summary

A `post_tool_use` hook script for Claude Code that passively captures every tool invocation (Read, Edit, Write, Bash, Grep, Glob) and sends it to the Thoughtbox server as an OTLP log event. The agent requires zero cooperation — it uses its native tools normally while the hook observes and records. This is the foundational data layer for all downstream analysis (blast radius, scope drift, session replay).

## Requirements

1. The hook script reads tool event JSON from stdin (fields: `tool_name`, `tool_input`, `tool_result`).
2. The hook formats each event as an OTLP log record with attributes: `tool.name`, `tool.input` (JSON-encoded arguments), `tool.result` (JSON-encoded result or truncated if over 4KB), `tool.timestamp` (ISO 8601), `file.path` (extracted from tool_input when present).
3. The hook POSTs the OTLP JSON to the existing Thoughtbox `/v1/logs` endpoint. No new server endpoint is needed.
4. Authentication uses the user's Thoughtbox API key, passed via the hook's environment configuration in `.claude/settings.json`. The key resolves to workspace via the existing auth pipeline.
5. The hook is non-blocking: it sends the event asynchronously (background curl) so it does not slow down the agent's tool execution.
6. The hook captures all tool types. For Edit: `old_string`, `new_string`, `file_path`. For Bash: `command`, exit code. For Read: `file_path`, line range. For Grep/Glob: `pattern`, matched files.
7. Events are tagged with a `connection_id` (see SPEC-CONNECTION-TRACKING) when available, falling back to a per-session UUID generated at hook first-invocation.

## Acceptance Criteria

- [ ] Hook script receives tool events from Claude Code's post_tool_use mechanism and sends them to `/v1/logs`
- [ ] Events appear in the Thoughtbox observability timeline within 2 seconds of the tool call completing
- [ ] Hook does not add more than 50ms latency to any tool call (async send)
- [ ] API key authentication works: events are scoped to the correct workspace
- [ ] Hook handles network failures gracefully (silent drop, no agent interruption)
- [ ] All six tool types (Read, Edit, Write, Bash, Grep, Glob) produce correctly formatted OTLP log records

## Dependencies

- Existing OTEL `/v1/logs` ingestion endpoint (done, 16 tests passing)
- Existing auth pipeline: API key → workspace resolution (done)
- SPEC-CONNECTION-TRACKING for connection_id tagging (can ship without, falls back to session UUID)

## Open Questions

- Should the hook also capture MCP tool calls (e.g., thoughtbox_execute), or only built-in Claude Code tools?
- What is the maximum payload size the `/v1/logs` endpoint should accept per event? Large Write/Edit diffs could be substantial.
- Should the hook buffer and batch events (e.g., flush every 5 seconds) or send each individually?
