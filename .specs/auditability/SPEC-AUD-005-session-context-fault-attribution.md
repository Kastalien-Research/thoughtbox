# SPEC-AUD-005: Session Context — Fault Attribution in 30 Seconds

> **Status**: Draft
> **Priority**: HIGH (Auditability MVP)
> **Phase**: 3AM Auditability
> **Estimated Effort**: 4-6 hours
> **GitHub Issue**: #141
> **Source**: pain/3am-auditability.md — Thing #5

## Summary

Surface session context alongside the reasoning chain and provide a fault attribution guide that helps engineers distinguish agent bugs, data bugs, and instruction bugs in under 30 seconds.

## Problem Statement

When something breaks, the first question after "what happened?" is "whose fault is it?" The agent may have reasoned wrong (agent bug), reasoned correctly on bad data (data bug), or followed bad instructions correctly (instruction bug). Currently, session context is captured at init but isn't visible alongside the thought chain. The engineer has to reconstruct the agent's operating environment manually.

## Scope

### In Scope
- Observatory UI: session context panel visible alongside thought chain
- Operations mode: instruct agent to capture initial belief_snapshot with system context
- Observatory UI: tool inventory view (what tools available, what stage)
- Observatory UI: fault attribution checklist
- API: session context retrieval

### Out of Scope
- Automated fault classification (future ML work)
- Cross-session context comparison
- System prompt capture (depends on MCP client capabilities)

## Requirements

### R1: Session Context Panel

A persistent side panel or header in the Observatory showing:
- Session title, tags, creation time
- Agent identity (agentId, agentName) if present
- Tools available at time of failure (progressive disclosure stage)
- Duration and thought count

### R2: Initial Context Capture

The operations mode template should instruct the agent to record a `belief_snapshot` as thought #1 (or early in the session) capturing:
- ENTITIES: what systems/services/data the agent is working with
- CONSTRAINTS: what rules it's operating under
- What instructions it was given (summarized — the agent can report its own system prompt)
- What tools it has available

This is already part of the operations mode Phase 1 (Tooling Inventory) and Phase 2 (Constraint Assessment). Ensure these produce `belief_snapshot` thoughts.

### R3: Tool Inventory View

Show what tools were available to the agent and what progressive disclosure stage the session reached:
- Stage 0: Entry (gateway only)
- Stage 1: Init (session management)
- Stage 2: Active (thought, notebook, etc.)

This data is already tracked by the tool registry. Surface it in the Observatory.

### R4: Fault Attribution Checklist

A guided checklist in the Observatory that the engineer walks through:

```
1. INSTRUCTIONS CHECK
   - View the initial belief_snapshot / context capture
   - Did the agent understand its task correctly?
   - Were the instructions ambiguous or wrong?
   → If yes: INSTRUCTION BUG

2. DATA CHECK
   - View what data/observations the agent had
   - Was the data correct and complete?
   - Did the agent have access to information it needed?
   → If data was wrong/missing: DATA BUG

3. REASONING CHECK
   - View the decision_frames leading to the failure
   - Given correct instructions and correct data, did the agent reason correctly?
   - Check confidence trail (SPEC-AUD-003) — was it uncertain?
   → If reasoning was wrong: AGENT BUG
```

### R5: Fault Attribution Summary

At the end of the checklist, record the attribution:

```typescript
interface FaultAttribution {
  sessionId: string;
  faultType: 'agent_bug' | 'data_bug' | 'instruction_bug' | 'unknown';
  evidence: string; // brief explanation
  thoughtNumber: number; // the thought where the fault originated
  attributedBy: string; // engineer who made the call
  timestamp: string;
}
```

This can be stored as a session annotation or a special thought.

## Files to Modify

| File | Change |
|------|--------|
| `src/observatory/ui/*.html` | Context panel, tool inventory view, fault attribution checklist |
| `src/prompts/contents/interleaved-template.ts` | Ensure operations mode Phase 1-2 produce belief_snapshots |
| `src/observatory/reasoning.ts` | Session context data in events |
| `src/tool-registry.ts` | Expose current stage for Observatory consumption |

## Verification

1. Start an operations mode session — verify initial belief_snapshot is captured
2. Verify Observatory shows session context panel
3. Verify tool inventory reflects actual progressive disclosure stage
4. Walk through fault attribution checklist on a test session
5. Verify fault attribution can be recorded and persisted

## Dependencies

- SPEC-AUD-001 (belief_snapshot card rendering)
- SPEC-AUD-003 (confidence trail for reasoning check)
- Operations mode (implemented)
- Progressive disclosure / tool registry (existing)
