# Spec: Cipher Mode Toggle

## Title
Session-Level and Per-Thought Cipher Mode Control

## Status
Draft

## Target State

### Session-Level Cipher Mode

Sessions have a `cipherMode` setting that controls how cipher extension operates:

```typescript
type CipherMode = "auto" | "manual" | "off";
```

| Mode | Behavior |
|------|----------|
| `"auto"` | Cipher extension activates automatically based on content sensitivity signals |
| `"manual"` | Cipher extension only activates when explicitly requested per-thought |
| `"off"` | Cipher extension is disabled for the entire session |

### Session Creation with Cipher Mode

```typescript
// Create session with explicit cipher mode
const session = await tb.session.create({
  title: "Security Review",
  cipherMode: "manual"  // Explicit control
});

// Default cipher mode is "auto"
const defaultSession = await tb.session.create({ title: "General Reasoning" });
```

### Per-Thought Cipher Flag (Conditional Override)

The per-thought `cipher` flag is a **conditional override** that only applies when session `cipherMode` is `"manual"`:

```typescript
interface ThoughtInput {
  thought: string;
  thoughtType: ThoughtType;
  nextThoughtNeeded: boolean;

  /**
   * Per-thought cipher override.
   * ONLY effective when session.cipherMode === "manual".
   * Ignored when session.cipherMode is "auto" or "off".
   *
   * - true: Request cipher processing (when session mode is "manual")
   * - false: Explicit opt-out (when session mode is "manual")
   * - undefined: Use session-level setting (when session mode is "manual")
   */
  cipher?: boolean;
}
```

### Semantic Constraint: Making Illegal States Unrepresentable

The combination of `cipherMode: "off"` + `cipher: true` is **semantically contradictory** and MUST be prevented:

```typescript
// This combination is INVALID and must be rejected:
{
  session: { cipherMode: "off" },
  thought: { cipher: true }  // CANNOT override "off" - makes no sense
}
```

**Rule**: Per-thought `cipher` flag is **silently ignored** when `cipherMode` is `"off"`. The `"off"` mode means "cipher is completely disabled for this session, no exceptions."

```typescript
// Behavior matrix:
session.cipherMode = "auto":
  - cipher flag is IGNORED (auto signals control behavior)
  - Server determines cipher based on content sensitivity

session.cipherMode = "manual":
  - cipher: true  → process through cipher
  - cipher: false → skip cipher
  - cipher: undefined → skip cipher (defaults to off)

session.cipherMode = "off":
  - cipher flag is IGNORED (completely disabled)
  - All thoughts skip cipher regardless of per-thought flag
```

### Session Cipher Mode Retrieval

```typescript
const session = await tb.session.getCurrent();
console.log(session.cipherMode);  // "auto" | "manual" | "off"
```

### Type System Enforcement

```typescript
/**
 * Represents the effective cipher decision for a thought.
 * This is computed from session.cipherMode + thought.cipher flag.
 */
type EffectiveCipherDecision =
  | { decision: "cipher"; reason: "auto_signal" | "manual_request" }
  | { decision: "skip"; reason: "auto_signal_clear" | "manual_opt_out" | "mode_off" };

/**
 * Check the effective cipher decision for a thought.
 * Used by the server to determine actual behavior.
 */
function getEffectiveCipherDecision(
  sessionCipherMode: CipherMode,
  thoughtCipherFlag?: boolean
): EffectiveCipherDecision {
  switch (sessionCipherMode) {
    case "off":
      return { decision: "skip", reason: "mode_off" };
    case "auto":
      // In a full implementation, this would consult auto-signals
      return { decision: "skip", reason: "auto_signal_clear" };
    case "manual":
      if (thoughtCipherFlag === true) {
        return { decision: "cipher", reason: "manual_request" };
      }
      return { decision: "skip", reason: "manual_opt_out" };
  }
}
```

---

## Design Rationale

### The Problem with the Original Design

The original spec allowed `cipher: true` on a thought to override `cipherMode: "off"`. This creates a semantic contradiction:

- `"off"` semantically means "cipher is disabled for this session"
- But if a per-thought flag can override it, `"off"` doesn't actually mean "off"
- This violates the principle of **making illegal states unrepresentable** — if a user sets `cipherMode: "off"`, they expect cipher to be off, period

### The Correct Abstraction

By making the per-thought `cipher` flag **conditionally effective only in `"manual"` mode**, we create a clean separation:

| Session Mode | Intent | Per-thought Override |
|--------------|--------|---------------------|
| `"auto"` | Server decides based on content signals | Not applicable (ignored) |
| `"manual"` | User explicitly controls each thought | YES - allows per-thought control |
| `"off"` | Cipher completely disabled | NO - `"off"` is absolute |

### Facilitating Useful States

This design enables the **useful state** of having a "manual override session" where you can selectively enable cipher for specific sensitive thoughts while most thoughts go unencrypted. The `"auto"` mode handles the common case where the server should just figure it out. The `"off"` mode handles the "this session is entirely public" case.

---

## Validation

1. **Mode "off" is Absolute**: `cipherMode: "off"` means all thoughts skip cipher, regardless of per-thought `cipher` flag
2. **Mode "manual" Override**: `cipherMode: "manual"` with `cipher: true` processes through cipher
3. **Mode "manual" Default**: `cipherMode: "manual"` with no `cipher` flag (or `false`) skips cipher
4. **Mode "auto" Ignores Flag**: `cipherMode: "auto"` ignores per-thought `cipher` flag
5. **Session Query**: `tb.session.getCurrent().cipherMode` returns the correct setting
6. **Type Safety**: The `EffectiveCipherDecision` type accurately represents all valid states
7. **No Contradiction**: `cipherMode: "off"` combined with `cipher: true` is handled gracefully (flag ignored, not an error)
