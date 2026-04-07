---
date: 2026-04-07
topic: unified-events-plugin
---

# Unified Event Stream + Thoughtbox Plugin

## What We're Building

A unified event system that carries both Hub coordination events and protocol state events (Ulysses/Theseus) through a single SSE endpoint. A Claude Code plugin that consumes these events via a channel and enforces protocol gates via PreToolUse hooks calling `/protocol/enforcement`.

The plugin is the product's integration layer — it's how Thoughtbox stops being a passive store and becomes an active participant in every Claude Code session.

## Why This Approach

The five-capability vision (plugin_vision.md) requires:
- **Self-Governance**: PreToolUse hooks call Thoughtbox to gate mutations (Ulysses S=2 block, Theseus scope guard)
- **Ambient Intelligence**: PostToolUse hooks send every tool call to Thoughtbox as OTLP
- **Persistent Reasoning**: Channel pushes protocol state changes so agents stay aware across compactions
- **External Integration**: Channel is the nervous system — Thoughtbox pushes, agent reacts

A unified event stream is cleaner than separate Hub + protocol endpoints. One connection, one type hierarchy, one channel server.

## Key Decisions

### 1. `ThoughtboxEvent` replaces `HubEvent`

```typescript
// src/events/types.ts (new file)
export type ThoughtboxEvent =
  | HubEvent       // existing: problem_created, message_posted, etc.
  | ProtocolEvent;  // new: ulysses_surprise, ulysses_reflect_required, theseus_scope_violation, etc.

interface BaseEvent {
  workspaceId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

interface HubEvent extends BaseEvent {
  type: 'problem_created' | 'problem_status_changed' | 'message_posted'
      | 'proposal_created' | 'proposal_merged' | 'consensus_marked'
      | 'workspace_created';
}

interface ProtocolEvent extends BaseEvent {
  type: 'ulysses_init' | 'ulysses_surprise' | 'ulysses_reflect_required'
      | 'ulysses_reflect_completed' | 'ulysses_complete'
      | 'theseus_init' | 'theseus_scope_violation' | 'theseus_visa_granted'
      | 'theseus_checkpoint' | 'theseus_complete';
  protocol: 'ulysses' | 'theseus';
  sessionId: string;
}
```

### 2. `/events` endpoint (new, replaces `/hub/events`)

- New `createEventStreamSurface()` in `src/http/event-stream.ts`
- Accepts both hub and protocol events via `broadcast(event: ThoughtboxEvent)`
- `/hub/events` stays as a deprecated alias (or removed if nothing external depends on it)

### 3. ProtocolHandler gets `onEvent` callback

Same pattern as hub-handler.ts line 46-57. Events emitted at:
- `ulyssesOutcome()` when S changes (especially S→2)
- `ulyssesReflect()` when reflect completes
- `ulyssesInit()` / `ulyssesComplete()` for lifecycle
- `theseusCheckpoint()` when checkpoint passes/fails
- `theseusVisa()` when visa granted
- `theseusInit()` / `theseusComplete()` for lifecycle

### 4. Channel server becomes `thoughtbox-channel.ts`

Rename from `hub-channel.ts`. Connects to `/events` instead of `/hub/events`. Formats both hub and protocol events. Protocol events get severity and actionable guidance:

```xml
<channel source="thoughtbox" protocol="ulysses" event="reflect_required" S="2" session_id="abc">
S=2: Two consecutive surprises. REFLECT required before further mutations.
Use tb.ulysses({ operation: "reflect", hypothesis: "...", falsification: "..." })
</channel>
```

### 5. Plugin PreToolUse hook calls `/protocol/enforcement`

Same read-before-write pattern. Plugin hook script calls Thoughtbox server, blocks if protocol says no. State lives in Thoughtbox (Supabase), not local sentinel files.

## Plugin Structure (final)

```
plugins/thoughtbox-claude-code/
  .claude-plugin/
    plugin.json
  hooks/
    hooks.json              # All hook wiring
  scripts/
    otlp_tool_capture.sh    # PostToolUse: OTLP capture (exists)
    session_tracker.sh      # PostToolUse: session binding (exists)
    protocol_gate.sh        # PreToolUse: calls /protocol/enforcement (new)
  .mcp.json                 # Channel server config (new)
```

### Plugin hooks.json

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/protocol_gate.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/otlp_tool_capture.sh"
          }
        ]
      },
      {
        "matcher": "mcp__thoughtbox-cloud-run__thoughtbox_execute",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/session_tracker.sh"
          }
        ]
      }
    ]
  }
}
```

## Server Changes Required

| File | Change |
|------|--------|
| `src/events/types.ts` | New: unified ThoughtboxEvent type |
| `src/http/event-stream.ts` | New: SSE surface accepting ThoughtboxEvent |
| `src/protocol/handler.ts` | Add onEvent callback, emit at state transitions |
| `src/protocol/in-memory-handler.ts` | Same onEvent pattern for local mode |
| `src/hub/hub-handler.ts` | Re-export HubEvent, import ThoughtboxEvent |
| `src/index.ts` | Wire protocol onEvent, replace hub SSE with unified |
| `src/channel/thoughtbox-channel.ts` | Rename from hub-channel, connect to /events, format protocol events |
| `src/channel/event-client.ts` | Rename from hub-event-client, use ThoughtboxEvent |
| `src/channel/event-filter.ts` | Accept ThoughtboxEvent instead of HubEvent |

## Open Questions

- Should `/hub/events` remain as a backward-compatible alias, or can we remove it?
- Should the channel server live in the plugin directory or stay in src/channel/?
- Does the protocol_gate.sh hook need a timeout shorter than the default 600s? (2s max-time on curl seems right)

## Next Steps

1. Create `src/events/types.ts` with ThoughtboxEvent
2. Create `src/http/event-stream.ts`
3. Add onEvent to ProtocolHandler
4. Wire in index.ts
5. Rename channel server, connect to unified endpoint
6. Add protocol_gate.sh to plugin
7. Update plugin hooks.json
8. Test end-to-end
