<!--
AUTO-GENERATED — DO NOT EDIT MANUALLY.
Source: automation-self-improvement/control-plane/manifest.yaml
-->
# 04-test-truth

Source of truth: `automation-self-improvement/control-plane/manifest.yaml`

## Vitest Inclusion Surface

- include: `agentops/tests/**/*.test.ts`, `demo/**/*.ts`, `src/**/__tests__/**/*.test.ts`
- exclude: `agentops/tests/integration.test.ts`, `agentops/tests/phase1.2.test.ts`

## Summary by classification

| Classification | Suite count |
| --- | --- |
| ci-executed | 1 |
| ci-declared-but-empty | 0 |
| local-integration | 2 |
| local-only | 2 |
| stale-or-unreferenced | 0 |

## Suites

| Suite | Runner | Manifest profile | Computed profile | Declared files | CI files | Uses real services |
| --- | --- | --- | --- | --- | --- | --- |
| automation_agentops_suite | vitest | local-integration | local-integration | 8 | 0 | yes |
| mental_models_smoke_suite | vitest | local-only | local-only | 1 | 0 | no |
| observability_sidecar_suite | vitest | local-integration | local-integration | 1 | 0 | yes |
| src_unit_suite | vitest | ci-executed | ci-executed | 69 | 66 | yes |
| tests_unit_suite | vitest | local-only | local-only | 14 | 0 | no |

## Explicit Gaps

- tests/unit/*.ts is out-of-band relative to current Vitest include config
- automation-self-improvement/agentops/tests/**/*.ts is out-of-band relative to current Vitest include config
- local Supabase integration tests skip when Supabase is unavailable, so they are not reliable CI coverage
- there is no end-to-end suite spanning workflow trigger -> runtime/persistence -> evaluation/integration
- automation-self-improvement/agentops/tests/*.ts is out-of-band relative to current Vitest include config
- moved tests use local and external dependencies
- not part of current CI include list
- local-only in CI because no legacy sidecar compose path in this config
- local Supabase integration tests may skip when Supabase is unavailable
- no guarantee of full end-to-end chain coverage

## Declared test files

| Suite | File | CI executed | Uses real services | Covered components |
| --- | --- | --- | --- | --- |
| automation_agentops_suite | automation-self-improvement/agentops/tests/cross-layer-sources.test.ts | no | yes | agentops, integration, proposal, workflow |
| automation_agentops_suite | automation-self-improvement/agentops/tests/extract.test.ts | no | yes | agentops, integration, proposal, workflow |
| automation_agentops_suite | automation-self-improvement/agentops/tests/integration.test.ts | no | yes | agentops, integration, proposal, workflow |
| automation_agentops_suite | automation-self-improvement/agentops/tests/phase1.2.test.ts | no | yes | agentops, integration, proposal, workflow |
| automation_agentops_suite | automation-self-improvement/agentops/tests/sources.test.ts | no | yes | agentops, integration, proposal, workflow |
| automation_agentops_suite | automation-self-improvement/agentops/tests/synthesis.test.ts | no | yes | agentops, integration, proposal, workflow |
| automation_agentops_suite | automation-self-improvement/agentops/tests/template.test.ts | no | yes | agentops, integration, proposal, workflow |
| automation_agentops_suite | automation-self-improvement/agentops/tests/xml-parsing.test.ts | no | yes | agentops, integration, proposal, workflow |
| mental_models_smoke_suite | tests/mental-models.test.ts | no | no | behavior, mental models, session contracts |
| observability_sidecar_suite | observability/mcp-sidecar-observability/test/integration.test.ts | no | yes | observability, runtime, runtime integration |
| src_unit_suite | src/__tests__/api-key-auth.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/__tests__/architecture.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/__tests__/persistence-roundtrip.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/__tests__/supabase-test-helpers.ts | no | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/__tests__/supabase-wiring.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/audit/__tests__/manifest-generator.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/code-mode/__tests__/execute-tool.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/code-mode/__tests__/search-tool.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/code-mode/__tests__/server-surface.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/http/__tests__/hub-http.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/http/__tests__/protocol-hook-integration.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/http/__tests__/protocol-http.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/agent-identity.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/artifact-refs.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/attribution.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/channel-resources.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/channel-subscription.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/channels.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/concurrent.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/consensus.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/dependencies.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/errors.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/hub-event-callback.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/hub-handler.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/hub-task-store.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/hub-tool-wiring.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/identity-profiles.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/identity.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/integration.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/isolation.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/per-session-identity.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/proactive-conflicts.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/problems.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/profile-prompt.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/profiles-extended.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/profiles-integration.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/profiles-registry.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/proposals.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/proxy.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/quick-join.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/storage.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/sub-problems.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/terminal-state.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/test-helpers.ts | no | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/thought-priming.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/thought-store-adapter.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/wiring-integration.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/workspace-digest.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/hub/__tests__/workspace.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/knowledge/__tests__/supabase-knowledge-storage.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/multi-agent/__tests__/cipher-extension.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/multi-agent/__tests__/claim-parser.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/multi-agent/__tests__/conflict-detection.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/multi-agent/__tests__/content-hash.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/multi-agent/__tests__/identity-resilience.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/multi-agent/__tests__/multi-agent-integration.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/multi-agent/__tests__/runtime-wiring.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/multi-agent/__tests__/test-helpers.ts | no | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/multi-agent/__tests__/thought-attribution.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/multi-agent/__tests__/thought-diff.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/observatory/__tests__/server-historical.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/observatory/__tests__/storage-adapter.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/operations-tool/__tests__/handler.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/otel/__tests__/otel-storage.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/otel/__tests__/parser.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/otel/__tests__/routes.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/persistence/__tests__/supabase-storage.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/protocol/__tests__/enforcement.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| src_unit_suite | src/protocol/__tests__/handler.test.ts | yes | yes | knowledge, observability, persistence, runtime, server |
| tests_unit_suite | tests/unit/config-loader.test.ts | no | no | behavior, contracts, tooling |
| tests_unit_suite | tests/unit/contamination.test.ts | no | no | behavior, contracts, tooling |
| tests_unit_suite | tests/unit/dataset-manager.test.ts | no | no | behavior, contracts, tooling |
| tests_unit_suite | tests/unit/evaluation-gatekeeper.test.ts | no | no | behavior, contracts, tooling |
| tests_unit_suite | tests/unit/evaluators.test.ts | no | no | behavior, contracts, tooling |
| tests_unit_suite | tests/unit/experiment-runner.test.ts | no | no | behavior, contracts, tooling |
| tests_unit_suite | tests/unit/improvement-store.test.ts | no | no | behavior, contracts, tooling |
| tests_unit_suite | tests/unit/improvement-tracker.test.ts | no | no | behavior, contracts, tooling |
| tests_unit_suite | tests/unit/online-monitor.test.ts | no | no | behavior, contracts, tooling |
| tests_unit_suite | tests/unit/proctor.test.ts | no | no | behavior, contracts, tooling |
| tests_unit_suite | tests/unit/sampler.test.ts | no | no | behavior, contracts, tooling |
| tests_unit_suite | tests/unit/scorecard-aggregator.test.ts | no | no | behavior, contracts, tooling |
| tests_unit_suite | tests/unit/sil-integration.test.ts | no | no | behavior, contracts, tooling |
| tests_unit_suite | tests/unit/tiered-evaluator.test.ts | no | no | behavior, contracts, tooling |

## Unknown test files

- None

