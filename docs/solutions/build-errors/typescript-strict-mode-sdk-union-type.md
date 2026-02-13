---
title: "Phase 2 Evaluation System — TypeScript Compilation, EventEmitter Safety, Code Duplication"
date: 2026-02-12
category: build-errors
tags:
  - typescript
  - evaluation-system
  - langsmith
  - event-emitter
  - code-duplication
  - type-safety
  - strict-mode
severity: high
component: evaluation
spec: SPEC-EVAL-001
symptoms:
  - "TypeScript compilation failed with implicit 'any' errors from union type destructuring in evaluator function signatures"
  - "trace-listener detach() called removeAllListeners() which removed ALL listeners from the shared ThoughtEmitter singleton"
  - "~120 lines of duplicated utility code (clamp01, asNumber, extractRunContext) across 4 evaluator files"
  - "DatasetManager had inconsistent error handling patterns with duplicated try-catch boilerplate"
root_causes:
  - "EvaluatorT union type in langsmith/evaluation required runtime narrowing that TypeScript couldn't infer, causing destructured parameters to have implicit 'any'"
  - "trace-listener detach() used EventEmitter.removeAllListeners() instead of EventEmitter.off() with tracked handler references"
  - "No shared utility module existed for common evaluator operations, leading to copy-paste across 4 files"
---

# Phase 2 Evaluation System — TypeScript Compilation, EventEmitter Safety, Code Duplication

## Problem Statement

The Phase 2 evaluation system implementation (SPEC-EVAL-001) had three categories of issues discovered during post-implementation compound review:

1. **BLOCKER — TypeScript compilation failure**: `npx tsc --noEmit` failed with implicit `any` type errors in all four evaluator files. The build was broken.

2. **HIGH — trace-listener detach() destroyed other listeners**: `detach()` used `emitter.removeAllListeners("event")` which removed ALL listeners for each event type, not just the trace listener's own handlers.

3. **MEDIUM — Code duplication across evaluators**: Three utility functions were copy-pasted into all four evaluator files: `clamp01`, `asNumber`, and run context extraction logic.

## Root Cause Analysis

### TypeScript Union Type Destructuring

LangSmith SDK's `EvaluatorT` is a union type with multiple function signatures:

```typescript
type EvaluatorT =
  | ((args: { run: Run; example: Example }) => EvaluationResult)
  | ((args: { run: Run; example: Example; inputs: KV; outputs: KV }) => EvaluationResult)
  | ((args: { run: Run; example: Example; inputs: KV; outputs: KV; referenceOutputs?: KV }) => EvaluationResult)
  // ... more arms
```

When evaluator functions destructured parameters like `({ run, outputs })`, TypeScript couldn't determine which arm of the union applied. Since some arms don't include `outputs`, TypeScript inferred it as implicit `any`, triggering errors under `strict: true`.

### Event Listener Removal Anti-Pattern

The original `detach()` used `emitter.removeAllListeners("session:started")` etc., which is a Node.js EventEmitter method that removes ALL handlers for the specified event, regardless of who registered them. In a multi-consumer architecture (Observatory dashboard + trace listener), calling `detach()` on one listener silently destroyed all others.

### No Shared Utilities Module

Phase 2 added four evaluator files simultaneously. Without a prior utilities module, helpers were inlined into each file.

## Solution

### Fix 1: Concrete Evaluator Type

**Created** `src/evaluation/evaluators/utils.ts` with a single concrete type that explicitly declares all parameters:

```typescript
export interface EvaluatorArgs {
  run: Run;
  example: Example;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  referenceOutputs?: Record<string, any>;
  attachments?: Record<string, any>;
}

export type Evaluator = (args: EvaluatorArgs) => EvaluationResult;
```

Updated all evaluators to use `Evaluator` instead of `EvaluatorT`. TypeScript no longer needs to resolve a union — all evaluators receive the same signature. The concrete type is assignment-compatible with `EvaluatorT` (it matches one arm of the union).

### Fix 2: Handler Map + emitter.off()

**Modified** `src/evaluation/trace-listener.ts` to store handler references in a `Map` during `attach()`, then remove only those specific handlers during `detach()`:

```typescript
private handlers = new Map<string, (...args: any[]) => void>();

attach(emitter: ThoughtEmitter): void {
  if (this.attached) return;
  this.attached = true;

  const onSessionStarted = (data: any) => this.onSessionStarted(data);
  // ... create handlers for all 5 events

  this.handlers.set("session:started", onSessionStarted);
  // ... store all 5

  emitter.on("session:started", onSessionStarted);
  // ... subscribe all 5
}

detach(emitter: ThoughtEmitter): void {
  if (!this.attached) return;
  for (const [event, handler] of this.handlers) {
    emitter.off(event as any, handler);
  }
  this.handlers.clear();
  this.sessionRuns.clear();
  this.attached = false;
}
```

### Fix 3: Shared Utilities + DatasetManager Consolidation

Extracted `clamp01`, `asNumber`, and `extractRunContext` to `utils.ts`. Consolidated DatasetManager error handling into a single `private safe<T>()` helper that handles disabled-client no-op and consistent error logging.

## Verification

```bash
npx tsc --noEmit --project tsconfig.json  # Zero errors
npx tsx tests/unit/evaluators.test.ts      # 6/6 pass
npx tsx tests/unit/dataset-manager.test.ts # 6/6 pass
```

**Commit**: `2e065d5` — `fix(eval): resolve Phase 2 review issues — compilation, detach safety, deduplication`

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `src/evaluation/evaluators/utils.ts` | Created | +34 |
| `src/evaluation/evaluators/session-quality.ts` | Modified | +47 |
| `src/evaluation/evaluators/memory-quality.ts` | Modified | +44 |
| `src/evaluation/evaluators/dgm-fitness.ts` | Modified | +41 |
| `src/evaluation/evaluators/reasoning-coherence.ts` | Modified | +42 |
| `src/evaluation/evaluators/index.ts` | Modified | +42 |
| `src/evaluation/trace-listener.ts` | Modified | +11/-14 |
| `src/evaluation/dataset-manager.ts` | Modified | +196 |
| `src/evaluation/index.ts` | Modified | +10/-5 |

## Prevention Strategies

### TypeScript Strict Mode + SDK Union Types

- **Before destructuring from library types**: check if the type is a union using IDE hover
- **Define concrete internal types** that mirror one arm of the union
- **Always use** `npx tsc --noEmit --project tsconfig.json` (NOT `tsc --noEmit src/file.ts` which bypasses tsconfig)

### EventEmitter Cleanup

- **Never use** `removeAllListeners(event)` on shared emitters
- **Always store handler references** in a Map during `attach()`
- **Use** `emitter.off(event, specificHandler)` for targeted cleanup

### Code Duplication

- **Extract shared utils before the second copy** — don't wait for three
- **Co-locate** utils with consumers (`evaluators/utils.ts` not distant `lib/`)

### Git Workflow with Auto-Sync

- **Commit beads changes before pull**: `bd sync && git add .beads/ && git commit` before `git pull --rebase`

## Pre-Flight Checklist

- [ ] Are imported types unions? If yes, define concrete wrappers
- [ ] Run `npx tsc --noEmit --project tsconfig.json` after type changes
- [ ] Store handler references in Map/Set before attaching to emitters
- [ ] Use `emitter.off(event, handler)` not `removeAllListeners()`
- [ ] Grep for similar function names before writing: avoid duplication
- [ ] Commit auto-sync files before `git pull --rebase`

## Related Documentation

- [SPEC-EVAL-001: Unified Evaluation System](.specs/SPEC-EVAL-001-unified-evaluation-system.md)
- [Phase 1 Solution: Unify Evaluation Subsystems](docs/solutions/integration-issues/unify-evaluation-subsystems-langsmith.md)
- [SPEC-SIL-004: Tiered Evaluator](.specs/self-improvement-loop/SPEC-SIL-004-tiered-evaluator.md)
- Implementation status: `dgm-specs/implementation-status.json`
- Commit `2e065d5` — fix implementation
- Commit `56159d1` — review findings filed as beads issues
