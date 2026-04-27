# Spec: Per-Session Type Audit

## Title
SessionType Metadata Affecting Audit Gap Detection

## Status
Draft

## Target State

### SessionType Definition

```typescript
/**
 * Enumerated session types for audit gap detection.
 * Each type has different expected reasoning patterns.
 */
type SessionType = 
  | "research" 
  | "decision" 
  | "implementation" 
  | "debugging" 
  | "exploration";

/**
 * Session creation parameters including type.
 */
interface SessionCreateParams {
  title: string;
  sessionType?: SessionType;
  // ... other params
}

/**
 * Session with type metadata.
 */
interface Session {
  id: string;
  title: string;
  sessionType: SessionType;
  // ... other fields
}
```

### Session Creation with Type

```typescript
const session = await tb.session.create({
  title: "Authentication Security Review",
  sessionType: "debugging"  // Explicit session type
});
```

### Default SessionType

The Thoughtbox SDK exposes one underlying primitive for session creation, plus three convenience factory wrappers (defined in Spec 02). They all forward to the same underlying machinery; they differ only in their default `sessionType` when the caller does not provide one explicitly:

| Entry Point | Default SessionType | Notes |
|-------------|---------------------|-------|
| `tb.session.create()` (primitive) | `"research"` | The general-purpose entry point. Used directly when callers want a non-factory session type. |
| `tb.think()` (factory, Spec 02) | `"exploration"` | Convenience wrapper over `tb.session.create({ sessionType: "exploration" })` |
| `tb.decide()` (factory, Spec 02) | `"decision"` | Convenience wrapper over `tb.session.create({ sessionType: "decision" })` |
| `tb.research()` (factory, Spec 02) | `"research"` | Convenience wrapper over `tb.session.create({ sessionType: "research" })` — same default as the primitive, for symmetry with the other factories |

If a caller provides `sessionType: "..."` explicitly to any of these (factory or primitive), the explicit value wins. The factory defaults apply only in the absence of an explicit value.

For session types not covered by the named factories (`"implementation"`, `"debugging"`), use `tb.session.create({ sessionType: "implementation" })` or `tb.session.create({ sessionType: "debugging" })` directly. The factories exist purely as ergonomic shorthands for the most common cases; they are not the only entry point.

### Audit Gap Detection by SessionType

```typescript
/**
 * Expected patterns and gap detection rules per session type.
 */
const SESSION_TYPE_RULES: Record<SessionType, GapDetectionRule> = {
  research: {
    expectedThoughts: ["belief_snapshot"],
    minCount: 2,
    gapSeverity: "warning",
    description: "Multiple belief snapshots expected; ends with synthesized insight"
  },

  decision: {
    expectedThoughts: ["decision_frame"],
    requiredState: "committed",
    gapSeverity: "error",
    description: "At least one committed decision_frame expected"
  },

  implementation: {
    expectedThoughts: ["action_report"],
    unexpectedThoughts: ["belief_snapshot"],
    gapSeverity: "warning",
    description: "action_report thoughts expected; belief snapshots unexpected"
  },

  debugging: {
    expectedThoughts: ["action_report"],
    requiredContent: "root cause",
    gapSeverity: "error",
    description: "action_report identifying root cause expected"
  },

  exploration: {
    // No strict expectations
    gapSeverity: null,  // No alerts for exploration
    description: "Flexible; minimal constraints"
  }
};

interface GapDetectionRule {
  expectedThoughts?: ThoughtType[];
  unexpectedThoughts?: ThoughtType[];
  minCount?: number;
  requiredState?: "committed";  // For decision frames
  requiredContent?: string;     // Substring that must appear
  gapSeverity: "warning" | "error" | null;
  description: string;
}
```

### Audit Gap Behavior

When a gap is detected:

1. Thought is flagged with `metadata.auditGap: AuditGap`
2. Gap is recorded in session audit metadata
3. Gap does NOT block thought submission (non-blocking)

```typescript
/**
 * Audit gap metadata attached to thoughts that trigger gaps.
 */
interface AuditGap {
  /**
   * Type of gap detected.
   */
  type: AuditGapType;

  /**
   * Severity of the gap.
   */
  severity: "warning" | "error";

  /**
   * Human-readable description of the gap.
   */
  message: string;

  /**
   * The session type that triggered this check.
   */
  sessionType: SessionType;

  /**
   * Expected vs actual counts (if applicable).
   */
  details?: {
    expected?: number;
    actual?: number;
    expectedTypes?: ThoughtType[];
    actualTypes?: ThoughtType[];
  };
}

/**
 * Types of audit gaps that can be detected.
 */
type AuditGapType =
  | "insufficient_belief_snapshots"   // research session
  | "no_committed_decision"            // decision session
  | "unexpected_belief_snapshots"       // implementation session
  | "no_root_cause_identified";         // debugging session
```

### SessionType Change

Session type can be changed mid-session if context shifts:

```typescript
interface SessionOperations {
  /**
   * Update session metadata.
   * Can change sessionType if context shifts.
   */
  update(attrs: { sessionType?: SessionType }): Promise<Session>;
}

// Usage
await tb.session.update({ sessionType: "debugging" });
```

### Usage Example

```typescript
// Start as exploration
const session = await tb.session.create({ 
  title: "Investigating auth failures", 
  sessionType: "exploration" 
});

// Realize it's debugging, update type
await tb.session.update({ sessionType: "debugging" });

// Continue with debugging-appropriate audit expectations
// Gap detection now expects: reasoning chain + action_report with root cause
```

---

## Design Rationale

### Facilitating Useful States

The `SessionType` enables:

- **Adaptive auditing**: Different session types have fundamentally different reasoning shapes
- **Reduced noise**: Uniform audit policy causes false positives (warnings in exploration) or false negatives (missing decisions in decision sessions)
- **Type-specific insights**: The audit system can provide targeted suggestions based on session type

### Making Illegal States Unrepresentable

`SessionType` as a closed union type (`"research" | "decision" | "implementation" | "debugging" | "exploration"`) prevents:
- Typos: `"reseach"` is not a valid SessionType
- Invalid combinations: `"research" | "decision"` doesn't make sense

---

## Validation

1. **Type Assignment**: `tb.session.create()` accepts valid `SessionType` values
2. **Default Inference**: `tb.think()` defaults to `"exploration"`, `tb.decide()` to `"decision"`
3. **Gap Detection research**: Session with type `"research"` and fewer than 2 belief snapshots triggers audit gap
4. **Gap Detection decision**: Session with type `"decision"` and no committed decision_frame triggers audit gap
5. **Gap Detection implementation**: Session with type `"implementation"` and belief_snapshot present triggers audit gap
6. **Gap Detection debugging**: Session with type `"debugging"` and no root cause action_report triggers audit gap
7. **Non-Blocking**: Audit gaps do not prevent thought submission
8. **Type Update**: `tb.session.update({ sessionType })` changes the session type
9. **Type Safety**: Invalid session type strings cause TypeScript compilation errors
