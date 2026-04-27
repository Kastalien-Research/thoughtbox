# Spec: Hook Suppression During Active Sessions

## Title
SessionStart Task-Tracking Hook Suppression

## Status
Draft

## Target State

### Hook Behavior

When a SessionStart hook would normally fire a task-tracking nudge, it first checks for an active Thoughtbox session:

```typescript
// Pseudocode for SessionStart hook logic
async function onSessionStart(sessionId: string): Promise<HookResult> {
  // Check if there's an active Thoughtbox session
  const hasActiveSession = await tb.session.isActive();

  if (hasActiveSession) {
    // Suppress the task-tracking nudge
    logger.debug("Active Thoughtbox session detected; suppressing nudge");
    return { suppressed: true, reason: "active_session" };
  }

  // Proceed with normal nudge logic
  return { suppressed: false };
}
```

### `tb.session.isActive()` Method

```typescript
interface SessionOperations {
  /**
   * Check if there is currently an active Thoughtbox session.
   *
   * @returns Promise<boolean> - true if an active session exists, false otherwise
   *
   * A session is considered "active" when:
   * 1. A ThoughtboxSession has been created (via tb.session.create() or tb.think())
   * 2. The configured activity timeout has not been exceeded since the last
   *    thought submission (see "Activity Timeout Configuration" below)
   * 3. The session has not been explicitly ended via tb.session.end()
   */
  isActive(): Promise<boolean>;
}
```

### Active Session Detection

A session is considered "active" when:
1. A `ThoughtboxSession` has been created (via `tb.session.create()` or `tb.think()`)
2. The configured activity timeout has not been exceeded since the last thought submission (see Activity Timeout Configuration below)
3. The session has not been explicitly ended via `tb.session.end()`

### Activity Timeout Configuration

The "active" window is **configurable**, not hardcoded. The effective timeout for a given session is resolved in this order:

1. **Per-session override** — `activityTimeoutMs` provided at session creation:

   ```typescript
   interface SessionCreateParams {
     // ... existing fields
     /**
      * Inactivity threshold (milliseconds) beyond which the session is considered
      * "inactive" for hook-suppression purposes. Affects only the
      * `tb.session.isActive()` boolean response; does not actually close the session.
      *
      * Resolution order:
      *   1. This per-session override (if provided)
      *   2. THOUGHTBOX_ACTIVITY_TIMEOUT_MS environment variable
      *   3. System default: 300_000 (5 minutes)
      */
     activityTimeoutMs?: number;
   }
   ```

2. **Per-deployment default** — the `THOUGHTBOX_ACTIVITY_TIMEOUT_MS` environment variable, parsed as an integer number of milliseconds.

3. **System default** — 300_000 ms (5 minutes), used when neither of the above is set.

### Recommended Values

| Use case | `activityTimeoutMs` | Rationale |
|----------|---------------------|-----------|
| Tight-focus reasoning, agent always active | `60_000` (1 min) | Short pause means the agent is gone; let nudges fire |
| Default mixed-mode (recommended) | `300_000` (5 min) | Tolerates mid-thought tool calls without flapping |
| Research session with subagent dispatch + waiting | `1_800_000` (30 min) | Subagent runs can legitimately take 60-90s; chain re-integration takes longer |
| "Never auto-suppress" — always show nudges | `0` | Treats session as immediately inactive |
| "Always suppress" while session lives | `Number.MAX_SAFE_INTEGER` | Effectively no timeout |

### Reference Implementation

```typescript
async isActive(): Promise<boolean> {
  const session = await getCurrentSession();
  if (!session || session.endedAt) return false;

  const lastThought = await getLastThoughtTimestamp(session.id);
  if (!lastThought) return false;

  const timeout =
    session.activityTimeoutMs
    ?? Number(process.env.THOUGHTBOX_ACTIVITY_TIMEOUT_MS)
    ?? 300_000;

  return Date.now() - lastThought.getTime() < timeout;
}
```

### Return Type

```typescript
/**
 * Result of checking hook suppression condition.
 */
interface HookResult {
  /**
   * Whether the hook/nudge was suppressed.
   */
  suppressed: boolean;

  /**
   * Reason for suppression (if suppressed).
   */
  reason?: "active_session" | "user_preference" | "rate_limited";

  /**
   * The session ID that caused suppression (if applicable).
   */
  sessionId?: string;
}
```

### Nudge Types Suppressed

When an active session is detected, the following nudge types are suppressed:
- "You have N incomplete tasks"
- "Consider updating your task list"
- Session summary requests
- Any hook-triggered notifications that would interrupt flow

### User-Facing Behavior

When nudges are suppressed:
- No visible UI interruption
- Hook fires silently in background (logged for observability)
- User is never informed of suppression (the experience is seamless)

### Observability

The suppression events are logged with:

```typescript
interface SuppressionLogEntry {
  hook: "SessionStart";
  event: "nudge_suppressed";
  reason: "active_session";
  sessionId: string;
  timestamp: string;  // ISO 8601
}
```

---

## Design Rationale

### Explicit Return Type

`isActive(): Promise<boolean>` makes the return type explicit:
- `true` means an active session exists
- `false` means no active session

This clarity prevents confusion about what "active" means and enables simple boolean logic in callers.

### Facilitating Useful States

This feature enables:
- **Uninterrupted flow**: Agents can think through problems without task-nudge interruptions
- **Contextual hooks**: Hooks that know to be quiet when the user is in "thinking mode"
- **Graceful degradation**: If session tracking fails, nudges still fire normally

---

## Validation

1. **Return Type**: `tb.session.isActive()` returns `Promise<boolean>`
2. **Suppression Trigger**: When `tb.session.isActive()` returns `true`, nudges are suppressed
3. **No Suppression**: When `tb.session.isActive()` returns `false`, nudges fire normally
4. **Default Timeout**: With no per-session override and no env var, sessions become inactive after 300_000 ms (5 min) of no thought submissions
5. **Per-Session Override**: A session created with `activityTimeoutMs: 60_000` becomes inactive after 60 seconds, regardless of env var
6. **Env Var Override**: With `THOUGHTBOX_ACTIVITY_TIMEOUT_MS=1800000` set and no per-session override, sessions become inactive after 30 minutes
7. **Resolution Order**: Per-session override takes precedence over env var, which takes precedence over system default
8. **Edge Value: Zero**: `activityTimeoutMs: 0` causes `isActive()` to return `false` immediately after each thought (treats session as instantly inactive for nudge purposes)
9. **Edge Value: Max**: `activityTimeoutMs: Number.MAX_SAFE_INTEGER` causes `isActive()` to return `true` indefinitely while the session is open
10. **Explicit End**: Calling `tb.session.end()` immediately restores nudge behavior regardless of timeout setting
11. **Logging**: Suppression events appear in observability logs with correct metadata
