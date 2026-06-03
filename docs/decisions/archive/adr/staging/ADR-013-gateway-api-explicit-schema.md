# ADR-013 — Domain-Specific Gateway Tools with Explicit Schemas

## Status

Proposed

## Context

The `thoughtbox_gateway` tool currently exposes a single monolithic entry point for all 41 operations. Historically, this monolithic design was introduced as a **temporary workaround** because early or non-compliant MCP clients (especially those using streaming HTTP) failed to handle `notifications/tools/list_changed` events properly. To prevent these clients from getting stuck when new tools were unlocked, all operations were stuffed into a single "always-on" tool, and progressive disclosure was simulated via internal runtime error rejection.

This temporary workaround became a permanent fixture, leading to two severe issues:
1. **Agent Friction:** Because a single tool couldn't strictly type 41 operations without blowing up the token context, we used an Opaque Schema (`args: z.record()`). This forced the agent to guess arguments and fail on its first turn to discover the schema.
2. **Architectural Drift:** It violated the core intent of Progressive Disclosure, which was supposed to genuinely hide tools from the LLM until they were relevant.

We are now deprecating this workaround. We will build for fully compliant MCP clients, restoring True Progressive Disclosure and explicitly typing our tools to eliminate Agent Friction.

Rather than trying to pack 40+ operations into a single massive Zod discriminated union (which risks confusing the model and creating a heavily bloated single tool definition), we will decompose the monolithic gateway into a handful of domain-specific tools. Research into LLM limits shows that models perform best with 10-20 well-scoped tools, and breaking up a massive schema mitigates context overload and improves natural tool selection.

**Progressive Disclosure:** With discrete tools, we will return to **native MCP dynamic tool registration**. The server will only expose tools in `tools/list` that are appropriate for the current stage, emitting the `notifications/tools/list_changed` event whenever a stage changes (e.g., from Stage 0 to Stage 1) to reveal new tools.

**Mental Models:** The `mental_models` operations were deemed ineffective and are being removed entirely from the system.

## Decision

We will break the single `thoughtbox_gateway` tool into 5 domain-specific tools.
Each of these new tools will use an explicit schema (e.g., smaller discriminated unions) so the agent knows the exact arguments required for every operation without a "Friction Turn".

Proposed tools:
1. `thoughtbox_init`
2. `thoughtbox_session`
3. `thoughtbox_thought`
4. `thoughtbox_notebook`
5. `thoughtbox_knowledge`

The `mental_models` subsystem will be deleted.

Progressive disclosure will be enforced by dynamically registering/unregistering these tools based on the active session's stage and emitting `notifications/tools/list_changed`.

## Consequences

### Positive
* **Zero-Friction Tool Calls:** Agents know exact arguments upfront via native MCP `tools/list`.
* **Better Cognitive Scaffolding:** Models select tools more accurately when grouped by logical domains instead of trying to understand one giant switch statement.
* **True Progressive Disclosure:** Agents won't be distracted by tools they cannot use yet. Advanced schemas are kept completely out of the context window until the agent unlocks them.
* **Streamlined Codebase:** Removing the unused `mental_models` reduces maintenance overhead.

### Negative / Tradeoffs
* **Increased tools/list Count:** We are increasing the number of tools from 1 to 5, but this aligns better with LLM best practices.
* **Refactoring Cost:** The gateway router logic needs to be split into multiple handler registrations, and the MCP server must now track state to fire `list_changed` events correctly.

## Validation Criteria

Implementation complete when:
1. `tools/list` dynamically returns only the domain-specific tools unlocked for the active session.
2. Tool schemas strictly define their `args` using native JSON Schema configurations.
3. `mental_models` code and endpoints are removed.

## Hypotheses Validated

### Hypothesis 1: First-Turn Success Rate Increases
**Prediction**: The LLM will successfully format operations with correct params on its very first try.
**Outcome**: PENDING

### Hypothesis 2: LLM Tool Selection Remains Accurate
**Prediction**: Breaking the gateway into 5 tools will not degrade the agent's ability to pick the right tool for the job.
**Outcome**: PENDING

### Hypothesis 3: Dynamic Progressive Disclosure Prevents Hallucination
**Prediction**: Because advanced tools are not listed in `tools/list` until unlocked, the agent will not hallucinate calls to Stage 2 tools while in Stage 0.
**Outcome**: PENDING

## Links

- Spec: `.specs/gateway-api-explicit-schema.md`
- Related ADRs: ADR-011 (Schema Embedding Payload), ADR-012 (Gateway API Consistency)
