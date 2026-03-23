# Code Mode: Hosted Alignment Target State

> **Status**: Proposed
> **Created**: 2026-03-23
> **Branch**: `feat/code-mode`
> **Depends on**: `.specs/SPEC-CORE-002-code-mode-thoughtbox.md`

## Intent

This document defines the desired state of the Thoughtbox codebase after it has been brought into alignment with the current Code Mode direction.

The target is deliberately pragmatic:

- optimize for hosted agent usability first
- minimize refactoring of existing handlers and persistence
- remove progressive-disclosure gating as a runtime concern
- expose the real tool surface directly instead of routing agents through `thoughtbox_gateway`

This is a near-term alignment document, not a grand rewrite spec.

## Target Outcome

When this work is complete, the hosted Thoughtbox deployment presents a Code Mode interface as the primary agent-facing surface.

In that end state:

- the full Thoughtbox tool surface is available immediately at connection start
- progressive disclosure no longer hides tools behind staged unlocking
- Code Mode wraps the actual MCP tools already implemented in the server
- resources and prompts are treated primarily as embedded guidance and searchable documentation
- existing domain handlers remain the source of behavior
- raw MCP remains available as a compatibility surface

## Architectural Position

### 1. Full-surface exposure is the default

The server no longer assumes that staged tool revelation is beneficial for the hosted deployment. Agents connecting to the hosted service should be able to discover and use all supported functionality immediately.

The tool families expected to be visible from the start are:

- `thoughtbox_session`
- `thoughtbox_thought`
- `thoughtbox_notebook`
- `thoughtbox_knowledge`
- `thoughtbox_theseus`
- `thoughtbox_ulysses`
- `thoughtbox_operations`
- `observability_gateway`
- `thoughtbox_hub` when hub storage is configured

### 2. `thoughtbox_gateway` is not the primary abstraction

The gateway may remain for compatibility, migration, or operational fallback, but it is not the intended primary interface for agents.

The desired agent experience is:

- discover capabilities through Code Mode search and typed tool metadata
- execute against first-class tool methods
- compose workflows in code without nested gateway envelopes

### 3. Code Mode is a thin transport layer, not a semantic rewrite

This phase does not require a new canonical IR, a new persistence model, or a new domain-specific authoring language before hosted usability improves.

The implementation should favor:

- reusing existing MCP handlers
- reusing existing tool schemas
- adding a Code Mode facade at the transport/server edge

It should avoid:

- redesigning core session storage
- replacing existing handlers with a new internal DSL
- introducing a speculative intermediate representation as a prerequisite

## Desired Codebase State

### Hosted transport

The hosted server exposes both:

- a raw MCP endpoint for compatibility
- a Code Mode endpoint for primary agent use

Authentication, workspace resolution, and hosted routing are shared between these entry points rather than duplicated.

### Server construction

`src/server-factory.ts` is the source of truth for Thoughtbox behavior and does not couple tool visibility to workflow stage.

In the current state:

- all implemented tools are registered and enabled for hosted use
- stale startup instructions that assumed gateway-first operation have been removed
- runtime tool availability does not depend on `sendToolListChanged()` notifications

### Progressive disclosure collapse

The former progressive-disclosure layer has been removed. `src/tool-registry.ts` and `src/tool-descriptions.ts` are deleted.

Specifically:

- `ToolRegistry` no longer exists to disable tools based on stage
- stage progression no longer determines whether a tool exists
- "call cipher first to unlock tools" has been removed as a transport/runtime requirement
- tool descriptions may still explain recommended sequencing, but sequencing is advisory rather than enforced by visibility

### Code Mode surface

The Code Mode layer exposes a small agent-facing surface, expected to include:

- `execute` for code-based orchestration against the Thoughtbox tool set
- `search` for discovery over tools, operations, and embedded guidance

Inside `execute`, agents interact with a typed namespace representing the real server capabilities rather than a new speculative API.

That namespace should map to the existing tool surface directly, for example:

- `tb.thoughtbox_session(...)`
- `tb.thoughtbox_thought(...)`
- `tb.thoughtbox_notebook(...)`

Grouped namespaces are acceptable if they are derived from the same underlying tools, but the core requirement is that Code Mode reflects the existing server behavior rather than inventing a second behavioral layer.

## Prompts and Resources

For this phase, prompts and resources are treated primarily as knowledge assets rather than as the defining interface shape.

Because much of the prompt and resource content overlaps, the aligned codebase should:

- deduplicate equivalent prompt/resource bodies where practical
- embed relevant guidance into Code Mode discoverability
- attach canonical guidance text to tool metadata or search results

This means Code Mode does not depend on resources and prompts remaining first-class runtime primitives in order to be useful.

Raw MCP resources and prompts may still exist for compatibility, inspection, and non-Code-Mode clients, but the hosted Code Mode path should not require agents to understand that distinction to use Thoughtbox effectively.

## Search Behavior

The search surface should unify the information an agent actually needs to operate:

- tool names
- tool descriptions
- tool schemas
- operation catalogs
- embedded prompt/resource guidance
- canonical examples where available

`thoughtbox_operations` and the operation catalog resources remain useful inputs to this search index, but agents should not have to manually traverse multiple disconnected discovery paths to understand how to act.

## Expected File-Level State

After alignment, the codebase should look conceptually like this:

- `src/index.ts`
  - shared hosted route/auth setup
  - raw MCP endpoint
  - Code Mode endpoint
- `src/server-factory.ts`
  - canonical tool/handler assembly
  - no visibility gating for hosted tool exposure
  - updated startup instructions aligned with direct-tool and Code Mode usage
- `src/tool-registry.ts` — deleted (progressive disclosure removed)
- `src/tool-descriptions.ts` — deleted (progressive disclosure removed)
- `src/codemode/`
  - thin wrapper layer exposing search and execute over the real tool surface

## Acceptance Criteria

The codebase is aligned with this target state when all of the following are true:

1. A fresh hosted Code Mode client can discover the full supported Thoughtbox tool surface without staged unlocking.
2. A hosted agent no longer needs to rely on `thoughtbox_gateway` as the primary interface to reach real functionality.
3. Code Mode discoverability includes relevant prompt/resource guidance without forcing agents to treat prompts and resources as separate conceptual systems.
4. Existing underlying handlers continue to back the behavior of both raw MCP and Code Mode access paths.
5. Hosted documentation and startup guidance reflect Code Mode and full-surface tool access as the intended path.
6. Removing progressive disclosure does not break compatibility for raw MCP clients that still consume the existing tool set.

## Explicit Non-Goals

This target state does not require:

- a full Canonical IR migration
- TBX-C1 rollout as a prerequisite
- a rewrite of storage or persistence
- a new semantic builder DSL before hosted usability is fixed
- elimination of raw MCP support

## Relationship to Existing Code Mode Work

`.specs/SPEC-CORE-002-code-mode-thoughtbox.md` describes a larger, longer-horizon design space.

This document narrows the near-term objective:

- get the hosted deployment into a shape that agents can use effectively now
- do so by simplifying exposure rather than redesigning the whole system
- treat Code Mode as a pragmatic wrapper over the real tool surface

## Summary

The intended end state is not "Thoughtbox, but with a prettier gateway."

It is:

- hosted Thoughtbox with full tool visibility
- progressive disclosure removed as a runtime gate
- Code Mode layered directly over the real server capabilities
- prompt/resource knowledge folded into discoverability
- minimal refactor of the underlying behavioral code
