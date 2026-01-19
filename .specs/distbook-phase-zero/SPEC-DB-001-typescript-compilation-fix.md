# SPEC-DB-001: TypeScript Compilation Fix

> **Status**: Draft
> **Priority**: BLOCKING
> **Phase**: 0.1 (Foundation)
> **Estimated Effort**: 1-2 hours

## Summary

Fix the 121+ TypeScript compilation errors in the Distbook MCP module to unblock all subsequent work.

## Problem Statement

The `packages/api/mcp/` directory has accumulated TypeScript errors that prevent compilation:
- 63 errors in production code
- 58 errors in test files

**Root causes** (likely):
- MCP SDK version mismatches after upgrades
- Incomplete type definitions
- Stale imports after partial refactoring

This blocks ALL other Distbook Phase 0 work since no code changes can be built.

## Scope

### In Scope
- Fix TypeScript errors in `packages/api/mcp/**/*.ts`
- Update imports/types as needed for MCP SDK compatibility
- Ensure `pnpm --filter @srcbook/api build` succeeds
- Verify existing tests compile (may still fail runtime, but must compile)

### Out of Scope
- New feature implementation
- Test fixes (runtime failures)
- MCP SDK version upgrades (unless required for type compatibility)
- Changes to non-MCP code

## Requirements

### R1: Clean Compilation
- `pnpm --filter @srcbook/api build` must exit 0
- No TypeScript errors in `packages/api/mcp/` directory
- All imports resolve correctly

### R2: Type Safety Preserved
- Do not use `any` to silence errors unless absolutely necessary
- Document any `// @ts-expect-error` with reasoning
- Maintain existing type contracts where possible

### R3: Backward Compatibility
- Existing API contracts unchanged
- No breaking changes to tool schemas
- Test files must compile (runtime behavior tested separately)

## Technical Approach

### Step 1: Error Inventory
```bash
cd kastalien-srcbook/srcbook
pnpm --filter @srcbook/api tsc --noEmit 2>&1 | head -200
```

Categorize errors by:
1. Import errors (missing modules, wrong paths)
2. Type mismatches (SDK version changes)
3. Missing properties/methods
4. Generic type errors

### Step 2: SDK Compatibility Check
```bash
# Check installed MCP SDK version
cat packages/api/package.json | grep "@modelcontextprotocol"

# Compare with expected types
# Look for breaking changes in MCP SDK changelog
```

### Step 3: Fix by Category
1. **Import errors**: Update paths, add missing dependencies
2. **Type mismatches**: Update to match SDK types, add type assertions where safe
3. **Missing properties**: Add required properties or update interfaces
4. **Generic errors**: Review and fix individually

### Step 4: Verification
```bash
# Build must succeed
pnpm --filter @srcbook/api build

# Types must be clean
pnpm --filter @srcbook/api tsc --noEmit
```

## Files

### Primary Files
| File | Expected Changes |
|------|------------------|
| `packages/api/mcp/server/index.mts` | Import fixes, type updates |
| `packages/api/mcp/server/tools.mts` | Tool type definitions |
| `packages/api/mcp/client/index.mts` | Client type alignment |
| `packages/api/mcp/tasks/index.mts` | Task interface types |

### Test Files
| File | Expected Changes |
|------|------------------|
| `packages/api/mcp/**/*.test.mts` | Type-only fixes (no behavior changes) |

## Acceptance Criteria

- [ ] `pnpm --filter @srcbook/api build` exits with code 0
- [ ] `pnpm --filter @srcbook/api tsc --noEmit` reports 0 errors
- [ ] No new `any` types added without documented justification
- [ ] Git diff shows only type-related changes (no logic changes)

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Errors require SDK upgrade | Medium | High | Time-box fix attempts, escalate after 1h |
| Cascading type changes | Medium | Medium | Fix in layers, commit incrementally |
| Hidden breaking changes | Low | High | Run tests after compilation fix |

## Dependencies

- None (this is the foundation spec)

## Blocked By

- None

## Blocks

- SPEC-DB-002 (Session Accessor)
- SPEC-DB-003 (Buffered Execution)
- SPEC-DB-004 (Cell Execute Wiring)
- SPEC-DB-005 (MCP Client Transport)

---

**Created**: 2026-01-19
**Source**: plans/feat-distbook-phase-zero-mcp-execution.md (Gap 5)
