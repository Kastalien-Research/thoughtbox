---
name: thoughtbox:refactor
description: Friction-gated refactoring using the Theseus protocol. Prevents scope creep and refactoring fugue state by enforcing file scope boundaries, visa-based expansion, checkpoint audits, and a brittleness counter. Use when refactoring code, restructuring modules, renaming across files, or any task where "structure changes but behavior must stay the same". Triggers on "refactor", "restructure", "rename across", "extract module", "move code", or when a change touches 3+ files without adding features.
user-invocable: true
argument-hint: [files to refactor and description of structural change]
---

# Theseus Refactoring Protocol

Refactoring has a failure mode: scope creep. You start renaming one function and end up restructuring three modules. Theseus prevents this by locking your file scope upfront, requiring explicit justification to expand it, and tracking how often your changes break tests.

## Core Mechanics

- **Scope**: declared file list at init — you can only touch these files
- **Visa**: explicit request to touch an out-of-scope file (requires justification)
- **Checkpoint**: submit each logical change for audit before proceeding
- **B-counter**: tracks test failures — high B means your refactor is causing breakage
- **Terminal state**: completed, abandoned, or rolled back

## Workflow

### Phase 1: Declare Scope

Identify every file you expect to touch. Be specific — this is your contract.

```javascript
// thoughtbox_execute
async () => {
  return await tb.theseus({
    operation: "init",
    scope: ["src/auth/handler.ts", "src/auth/types.ts", "src/auth/middleware.ts"],
    description: "Extract token validation into standalone module"
  });
}
```

The session starts with B=0 (no test failures yet).

### Phase 2: Work Within Scope

Make changes to declared files. After each logical unit of work:

1. **Checkpoint** the change:
```javascript
async () => {
  return await tb.theseus({
    operation: "checkpoint",
    diffHash: "abc123",  // git diff hash or commit SHA
    commitMessage: "refactor(auth): extract TokenValidator class",
    approved: true,
    feedback: "Clean extraction, no behavior change"
  });
}
```

2. **Run tests and record outcome**:
```javascript
async () => {
  return await tb.theseus({
    operation: "outcome",
    testsPassed: true,
    details: "All 47 auth tests pass"
  });
}
```

If tests fail, B increments. If B reaches 3, stop and reassess — your refactor is causing too much breakage.

### Phase 3: Expand Scope (If Needed)

If you discover you need to touch a file outside your declared scope, request a visa:

```javascript
async () => {
  return await tb.theseus({
    operation: "visa",
    filePath: "src/routes/login.ts",
    justification: "Login route imports TokenValidator directly — need to update import path",
    antiPatternAcknowledged: true
  });
}
```

Setting `antiPatternAcknowledged: true` is required — it forces you to recognize that scope expansion is a code smell. If you're requesting many visas, your initial scope was wrong.

### Phase 4: Check Status

Monitor your session state anytime:

```javascript
async () => {
  return await tb.theseus({ operation: "status" });
}
// Returns: B counter, scope list, visa count, audit count
```

### Phase 5: Complete

```javascript
async () => {
  return await tb.theseus({
    operation: "complete",
    terminalState: "completed",
    summary: "Extracted TokenValidator into src/auth/token-validator.ts. 3 files changed, 1 visa (login route import). B=0."
  });
}
```

Terminal states: `"completed"`, `"abandoned"`, `"rolled_back"`

## Discipline Rules

| Signal | Action |
|--------|--------|
| B = 0 after all checkpoints | Refactor is clean — proceed to complete |
| B = 1-2 | Fix the failing tests before continuing |
| B >= 3 | Stop. Your approach is causing too much breakage. Consider abandoning or reducing scope. |
| Visa count > 2 | Reassess your scope declaration — it was too narrow |
| Visa count > 5 | Your "refactor" is probably a rewrite. Stop and re-scope. |

## When NOT to Use Theseus

- Adding new features (use regular development workflow)
- Bug fixes (use `thoughtbox:debug` / Ulysses instead)
- One-file changes (overkill — just make the change)
- Exploratory prototyping (scope locking kills exploration)
