# ADR-017: Unified Autonomy Control Plane and Verified Test Truth

**Status**: Proposed
**Date**: 2026-03-31
**Branch**: feat/unified-autonomy-control-plane
**Owner**: Automation Architecture Workstream

## Context

Thoughtbox currently has narrative-only self-improvement architecture specs and fragmented tooling that do not enforce a single source of truth. In addition, CI test surface reporting is implicit:

- `src/**/__tests__/**/*.test.ts` runs in CI.
- `tests/unit/*.ts` is included in `tests/` but is not executed by current Vitest include configuration.
- `automation-self-improvement/agentops/tests/*.ts` is not currently on the CI include path because Vitest still points at the old `agentops/tests/**` location.
- There is no canonical artifact that states all executable suites and declared gaps, so CI drift is possible and hard to detect.

## Decision

We will add a **control-plane manifest** at
`automation-self-improvement/control-plane/manifest.yaml` and generate all canonical documentation and machine-readable inventories from it.

The ADR establishes these hard rules for V1:

1. one manifest, one authoritative truth for control-plane structure and test contracts;
2. generator-produced spec markdown and JSON artifacts under `.specs/unified-autonomy-control-plane/` and `automation-self-improvement/control-plane/generated/`;
3. CI fails on stale generated outputs, unknown or undeclared test surfaces, missing referenced paths, and legacy-path references in canonical surfaces;
4. no runtime MCP API changes in v1.

No runtime implementation will be generated in this phase.

## Decision Summary

- **Source of truth**: `automation-self-improvement/control-plane/manifest.yaml`
- **Generation outputs**:
  - `.specs/unified-autonomy-control-plane/*.md`
  - `automation-self-improvement/control-plane/generated/control-plane.json`
  - `automation-self-improvement/control-plane/generated/test-truth.json`
- **Controls**: new scripts `generate:control-plane` and `check:control-plane`.
- **Cutover**:
  - archive `.specs/unified-autonomy-loop/` as legacy;
  - canonical references now live only under `.specs/unified-autonomy-control-plane/` and manifest surfaces.

## Consequences

- Spec prose becomes reproducible and drift-checkable.
- CI truth for test coverage becomes explicit and machine-readable.
- Legacy architecture narratives are preserved but marked non-authoritative via archive location.
- This establishes the first deliverable for a control-plane layer that can later orchestrate execution and enforcement.

## Hypotheses

### Hypothesis 1: Single-source control-plane manifest generation is deterministic
**Prediction**: Re-running `pnpm generate:control-plane` on unchanged manifest and repo returns byte-identical outputs.

### Hypothesis 2: CI can reject drift without false positives
**Prediction**: `pnpm check:control-plane` fails when:
- a referenced manifest path is missing,
- stale generated artifacts differ from generated output,
- or a code-based test file is not declared in manifest tests.

### Hypothesis 3: Test truth reports the current gap explicitly
**Prediction**: `automation-self-improvement/control-plane/generated/test-truth.json` and `.specs/unified-autonomy-control-plane/04-test-truth.md` include explicit entries for:
- `tests/unit/*.ts` out-of-band vs Vitest include,
- `automation-self-improvement/agentops/tests/*.ts` out-of-band,
- Supabase integration tests being skip-gated locally,
- no existing end-to-end workflow test chain in current suite inventory.

## Spec

**Spec**: [Unified Autonomy Control Plane](/.specs/unified-autonomy-control-plane/00-index.md)

## Links

- manifest: `automation-self-improvement/control-plane/manifest.yaml`
- generated artifacts: `automation-self-improvement/control-plane/generated/`
