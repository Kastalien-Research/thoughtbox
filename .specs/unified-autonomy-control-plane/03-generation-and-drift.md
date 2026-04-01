<!--
AUTO-GENERATED — DO NOT EDIT MANUALLY.
Source: automation-self-improvement/control-plane/manifest.yaml
-->
# 03-generation-and-drift

## Drift Rules

| Rule ID | Severity | Matcher | Failure Message |
| --- | --- | --- | --- |
| no-legacy-root-paths | high | legacy-prefix-list: .specs/self-improvement-loop/, agentops/, benchmarks/, dgm-specs/ | Authoritative control-plane paths must not use legacy root-level paths as canonical references |
| no-missing-paths | high | manifest-path-existence | All manifest paths must exist in repository at check time |
| no-stale-generated-artifacts | high | generated-output-stale | Generated markdown and JSON artifacts must be up to date with manifest output |
| no-undeclared-test-surfaces | high | undeclared-test-surface | Code-based test files must be declared in the manifest tests section |

## Generated Artifacts

### control-plane-json
- kind: json
- path: `automation-self-improvement/control-plane/generated/control-plane.json`
- produced by: `scripts/generate-control-plane.ts`
- consumed by: `check:control-plane`, `ci`

### control-plane-spec-drift
- kind: markdown
- path: `.specs/unified-autonomy-control-plane/03-generation-and-drift.md`
- produced by: `scripts/generate-control-plane.ts`
- consumed by: `check:control-plane`

### control-plane-spec-index
- kind: markdown
- path: `.specs/unified-autonomy-control-plane/00-index.md`
- produced by: `scripts/generate-control-plane.ts`
- consumed by: `check:control-plane`, `ci`

### control-plane-spec-systems
- kind: markdown
- path: `.specs/unified-autonomy-control-plane/01-systems.md`
- produced by: `scripts/generate-control-plane.ts`
- consumed by: `review`

### control-plane-spec-test-truth
- kind: markdown
- path: `.specs/unified-autonomy-control-plane/04-test-truth.md`
- produced by: `scripts/generate-control-plane.ts`
- consumed by: `check:control-plane`, `ci`

### control-plane-spec-workflows
- kind: markdown
- path: `.specs/unified-autonomy-control-plane/02-workflows-and-state.md`
- produced by: `scripts/generate-control-plane.ts`
- consumed by: `review`

### test-truth-json
- kind: json
- path: `automation-self-improvement/control-plane/generated/test-truth.json`
- produced by: `scripts/generate-control-plane.ts`
- consumed by: `check:control-plane`, `ci`

### Generator

- manifest: `automation-self-improvement/control-plane/manifest.yaml`
- generated output by: `scripts/generate-control-plane.ts`
- generated from: `automation-self-improvement/control-plane/manifest.yaml`

