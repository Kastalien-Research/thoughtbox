<!--
AUTO-GENERATED — DO NOT EDIT MANUALLY.
Source: automation-self-improvement/control-plane/manifest.yaml
-->
# 01-systems

| System ID | Name | Maturity | Owner Workflows | Upstream artifacts | Downstream artifacts |
| --- | --- | --- | --- | --- | --- |
| decision-plane | Decision Plane | partial | daily_dev_brief, proposal_approval | control-plane-spec-index | control-plane-spec-drift, control-plane-spec-systems, control-plane-spec-test-truth, control-plane-spec-workflows |
| execution-plane | Execution Plane | partial | improvement_loop | control-plane-spec-workflows | control-plane-spec-drift |
| governance-plane | Governance and Drift Plane | implemented | daily_dev_brief, improvement_loop, prompt_refinement_batch, proposal_approval, tool_pedagogy_batch | control-plane-spec-index | control-plane-json, test-truth-json |
| learning-plane | Learning and Refinement Plane | partial | prompt_refinement_batch, tool_pedagogy_batch | control-plane-spec-test-truth | test-truth-json |

## Paths

### Decision Plane

- `.adr/staging/ADR-017-unified-autonomy-control-plane.md`
- `.specs/unified-autonomy-control-plane`
- `automation-self-improvement/agentops`
- `automation-self-improvement/control-plane`
- `automation-self-improvement/self-improvement`

### Execution Plane

- `src/http`
- `src/hub`
- `src/knowledge`
- `src/multi-agent`
- `src/observability`
- `src/persistence`
- `src/protocol`

### Governance and Drift Plane

- `.github/workflows/ci.yml`
- `.specs/unified-autonomy-control-plane`
- `.specs/unified-autonomy-loop`
- `automation-self-improvement/control-plane`
- `scripts`

### Learning and Refinement Plane

- `automation-self-improvement/agentic-dev-team`
- `automation-self-improvement/agentops`
- `automation-self-improvement/agentops/tests`
- `automation-self-improvement/self-improvement`
- `automation-self-improvement/self-improvement/SPEC-index.md`
- `docs/system-interconnection-map.md`


## Entrypoints

### Decision Plane

- `.adr/staging/ADR-017-unified-autonomy-control-plane.md`
- `.github/workflows/ci.yml`
- `automation-self-improvement/control-plane/manifest.yaml`
- `package.json`
- `scripts/check-control-plane.ts`
- `scripts/generate-control-plane.ts`

### Execution Plane

- `src/http`
- `src/hub`
- `src/index.ts`
- `src/observability/index.ts`
- `src/persistence/index.ts`
- `src/protocol/index.ts`

### Governance and Drift Plane

- `.github/workflows/ci.yml`
- `package.json`
- `scripts/check-control-plane.ts`
- `scripts/generate-control-plane.ts`

### Learning and Refinement Plane

- `automation-self-improvement/agentops/runner/cli.ts`
- `automation-self-improvement/agentops/runner/daily-dev-brief.ts`
- `automation-self-improvement/agentops/runner/implement.ts`
- `automation-self-improvement/self-improvement/PLAN-cost-effective-self-improvement-loop.md`
- `scripts/agentic-test.ts`


