# Thoughtbox Product Intent And Divergence

Status: living interview artifact
Created: 2026-05-26
Last updated: 2026-05-26

## Purpose

Collapse uncertainty of intent across Thoughtbox until this document can answer:

- What product Thoughtbox is meant to be.
- Who it is for.
- What outcomes it must make possible.
- Which current code/docs/specs support that intended shape.
- Which current code/docs/specs diverge from it.
- Which cooked-but-misaligned systems should be kept, reshaped, or removed.

This document is not a cleanup plan yet. It is the intent source that cleanup
plans should obey.

## Operating Method

We will use an interview loop:

1. Ask a small set of intent questions.
2. Record the user's answers as settled intent, open uncertainty, or rejected
   direction.
3. Map settled intent to current code/docs/spec divergence.
4. Ask the next question set based on remaining uncertainty.

## Evidence Base

Initial implementation maps:

- `temps/scratch/codebase-maps/README.md`
- `temps/scratch/codebase-maps/runtime-and-tool-surface.md`
- `temps/scratch/codebase-maps/models-and-persistence.md`
- `temps/scratch/codebase-maps/web-docs-tests-cleanup.md`

These maps are ignored scratch artifacts. They are evidence, not product
intent.

Additional source artifacts consulted during intent interview:

- `.specs/agentic-runbooks.md`
- `.specs/mcp-peer-notebooks/README.md`
- `.specs/mcp-peer-notebooks/NEXT-IMPLEMENTATION-HANDOFF.md`
- `automation-self-improvement/`
- `.specs/product-shape/branches/001-merge-evidence-notebooks.md`

## Settled Intent

- Thoughtbox is a reasoning workstation for agents.
- The primary optimization target is agent-users: autonomous agents using
  Thoughtbox directly.
- Thoughtbox exists because agents need durable, externalized reasoning over
  long and complex problems.
- The core thought tool is meant to address the inaccessibility of durable prior
  reasoning over long and complex problems.
- The Git-like Hub and the core thought tool should be the same essential
  product object: a better compound tool for durable, versioned reasoning.
- Code Mode is the right interaction model for agents.
- Hub remains a product concept, but it should look like what happens when
  multiple agents collaborate with Thoughtbox rather than a separate chat or
  coordination add-on.
- The single mandatory control plane is the long-term north star for Thoughtbox
  itself.
- The web app should show the multi-agent reasoning structure as a graph growing
  in the UI. The exact primary view is not settled.
- The intended Git-like primitive set is broad: branch, merge, hash, diff,
  commit, review, conflict, blame/provenance, tags, and releases/checkpoints are
  all desirable if they can be made coherent.
- If an actual Git layer can be used to represent or back the reasoning
  collaboration model, that would be ideal.
- A merge of reasoning means a finalized decision or "collapse to certainty."
- Reasoning history is immutable: a merge can be superseded or reverted by new
  commits on top, but prior history should not be rewritten.
- Merge evidence likely branches through notebooks. This is now tracked in
  `.specs/product-shape/branches/001-merge-evidence-notebooks.md`.

## Rejected Directions

Nothing recorded yet.

## Terms Requiring Expansion

### Agent-Users

Agent-users are autonomous agents using Thoughtbox directly. Humans may inspect,
configure, or benefit from Thoughtbox, but the first product affordances should
be designed around the agent as the active user.

### Hub / Thought Graph / Knowledge Graph Naming

Naming is not settled.

Current direction:

- "Thought graph" is descriptively useful for the versioned reasoning object,
  but risks confusion with "knowledge graph."
- "Hub" may be the better product/workspace name for the unified object,
  including single-user interaction models.
- The knowledge graph should likely remain a distinct semantic memory surface,
  not the name for the active reasoning collaboration object.

Agent-user recommendation:

- Use `Hub` for the product/workspace object an agent enters and works inside.
- Use `thought graph` for the internal/versioned reasoning structure within a
  Hub.
- Use `knowledge graph` only for extracted durable semantic memory and
  learnings.

## Intended Affordance Groups

### Core Thought Tool

The main tool for any agent using Thoughtbox.

Intended shape:

- Reasoning is externalized into durable thought nodes.
- Locally, this was envisioned as a doubly-linked list where each thought
  occupies a node.
- Branches, revisions, and navigation should preserve graph/list semantics
  rather than behaving like unrelated flat records.
- The agent should be able to keep track of complex reasoning processes over
  time in a Git-like reasoning repository.

Product meaning:

- The agent must decide what internal reasoning is worth externalizing.
- Thoughtbox should support that active inference process rather than merely
  logging every token or storing arbitrary notes.
- The core tool should make prior reasoning addressable, revisable,
  branchable, comparable, and durable.
- The core thought tool and Git-like Hub should converge into one essential
  product object: versioned reasoning for one or many agents.

Failure/friction addressed:

- Durable prior reasoning is inaccessible during long or complex work.
- Agents lose the shape of previous decisions, branches, revisions, and
  assumptions.

### Hub / Git-Like Multi-Agent Reasoning

The Hub was designed so multiple agents can collaborate on reasoning tasks the
way software developers collaborate on software: through version control,
hashes, branch-like structures, review, and merge semantics.

Product meaning:

- This may be worth reconsidering as a flagship feature.
- The core utility is not "chat between agents"; it is version-controlled
  reasoning and problem solving.
- The same principle matters for a single agent-user, but the Hub makes the
  value easier to see.
- Hub is still a product concept in its own right, but should present as the
  multi-agent manifestation of Thoughtbox reasoning.
- The likely product visualization is multiple AIs working together through the
  shared versioned reasoning structure.
- Single-user interaction models may also use the Hub. This needs naming/design
  clarification, because "Hub" may refer to the product/workspace even when only
  one agent is active.
- The web app visualization should feel like a graph growing as agents work.
- A future implementation may use an actual Git layer if it can fit the
  reasoning model without distorting it.

Open question:

- What exact visual and interaction primitives should show multiple AIs working
  together: branch graph, timeline, proposals, merge commits, thought nodes,
  live sessions, or another representation?
- What should "collapse to certainty" require before a reasoning merge is
  allowed?
- What branch lifecycle policy should Thoughtbox use: pressure every branch
  toward merge/abandon, permit long-lived unresolved branches, or classify
  branch types with different pressure rules?

### Operational Epistemics

Operational epistemics are executable workflows that, if followed precisely in a
sealed environment, tend to inevitably yield the desired information in a
problem space.

Ulysses Protocol is the example:

- Repeated precise execution should lead to a non-failure outcome.
- Non-failure means one of: the bug source is found, the agent discovers it
  lacks the means to access the necessary information, or the environment
  crashes.

Product meaning:

- Thoughtbox should serve as an active state machine and harness for epistemic
  algorithms.
- Protocols should not be just prose instructions; Thoughtbox should track and
  enforce their state.

Open question:

- How should Thoughtbox learn about and define changes to "game state" for such
  workflows?

### Stateless Machine Learning / Control-Plane Learning

The model weights do not update during ordinary agent work, but the agent's
environment can learn how to shape itself for future agents.

Product meaning:

- At the end of each agent session, the environment should change so good
  surprises become more likely and bad surprises become less likely.
- The knowledge graph was intended to serve this, but is not sufficient by
  itself.
- The deeper product shape is a single control plane through which agents
  interact with permissioned domains: code repos, company docs, managed
  infrastructure, and similar environments.
- A single mandatory, intelligent, whitelisted MCP control plane could replace
  broad low-level tools such as Bash for many agent workflows.
- Learning would happen at the level of the control plane through improved
  abstractions, observability, permissions, and context engineering.
- The single mandatory control plane is the long-term north star for Thoughtbox
  itself, not a separate product line.

Failure/friction addressed:

- Agent memory and intelligence are split across different systems.
- Broad tools are token-inefficient, poorly observable, and hard to shape
  programmatically.
- Surprise-driven learning has no stable substrate if every tool acts outside a
  common control plane.

### Notebooks

Notebooks are prose plus executable code.

Intended uses:

- Executable scripts with gates.
- Runbooks with enforced gating.
- Cloud-backed simulations, including Monte Carlo.
- Open-ended quality-diversity processes inspired by Jeff Clune / Sakana-style
  exploration.
- Skill documentation and serving.
- Executable evidence for agentic reasoning.

Product meaning:

- Notebooks are an underutilized primitive in AI-driven development.
- Simulations are an underutilized resource for agentic reasoning.
- Notebooks can become durable, inspectable work units and possibly
  tool-serving peers.

Current source alignment:

- `.specs/agentic-runbooks.md` already frames the notebook subsystem as a
  Notebook Evidence Engine with modes for runbooks, simulations, evals, failure
  capsules, ADR evidence, skill certification, scenario factories, and system
  audits.
- `.specs/mcp-peer-notebooks/README.md` frames peer notebooks as
  manifest-governed, brokered notebook runtimes that expose typed MCP
  tools/resources and call approved MCP tools through a control-plane broker.

### Scaffolding / Self-Improvement

`automation-self-improvement/` is a separate body of workflow designs intended
to implement self-improving processes on the codebase itself.

Product meaning:

- This is its own thing.
- It may inform Thoughtbox's control-plane learning and surprise-driven
  environment shaping, but it should not automatically be treated as core
  product without further intent clarification.

## Open Questions

### Product Identity

- What is the exact compound name/concept for the unified Core Thought Tool +
  Git-like Hub?
- Should "Hub" be the top-level product object for both single-agent and
  multi-agent use?

### Primary User

- How should secondary human-facing surfaces be shaped if the primary user is
  an autonomous agent?

### Core Outcomes

- What must a user/agent be able to accomplish with Thoughtbox that would make
  the product worth existing?
- Which current systems are essential to those outcomes?
- What must the multiple-agent visualization prove or make visible?
- What makes a reasoning decision sufficiently finalized to count as a merge?
- What unresolved-branch architecture best supports agent reasoning without
  allowing unbounded sprawl?

### Public Surface

- Code Mode is the intended public interaction model for agents.
- How should Code Mode expose the unified thought graph / Hub object so agents
  can use it naturally?
- Should old direct tools be removed, retained as internal implementation
  details, or kept as compatibility surfaces?

### Web App Role

- Is `apps/web` a core product surface, a supporting inspection UI, a marketing
  shell with some operational pages, or something to narrow/remove?

### Persistence And Deployment

- Is the intended product local-first, hosted multi-tenant, both with clear
  boundaries, or something else?

### Governance And Workflow

- Should HDD/ADRs/protocol gates remain product-defining, or are they mostly
  repo-internal development process?

### Operational Epistemics

- What counts as "game state" for Ulysses-like workflows?
- Which game-state transitions must Thoughtbox detect itself versus receive
  from tools/notebooks/control-plane integrations?

### Control Plane

- What are the first permissioned domains Thoughtbox should mediate: code repo,
  docs, infrastructure, memory/knowledge, agent teams, or something else?
- Is replacing Bash a literal product goal, a direction of travel, or a useful
  metaphor?

## Divergence Register

### Known From Initial Map

- README claims the public MCP surface is two tools; implementation exposes
  three.
- README/docs claim Hub is available through Code Mode; implementation has no
  verified `tb.hub`.
- `thoughtbox_operations` is documented/tested in places but not registered in
  the current server.
- `thoughtbox://gateway/operations` appears listed but likely lacks a read
  handler.
- Generated Supabase types appear stale against migrations.
- `apps/web` implements real auth/API key/billing/session surfaces while its
  README says those are not implemented.
- Root tests do not include `apps/web` tests.
- Current code contains thought nodes and branch/revision fields, but the live
  public surface may not yet make the intended doubly-linked/Git-like reasoning
  repository explicit.
- Hub concepts align with intended Git-like reasoning collaboration, but Hub is
  not currently exposed through Code Mode or a public MCP tool.
- Ulysses exists as a protocol tool/state machine, but the intended generalized
  "operational epistemics" category and game-state learning model are not yet
  fully defined.
- Knowledge graph exists, but product intent says it is insufficient without a
  broader control plane.
- Notebook evidence engine and peer notebook specs align strongly with intent,
  but production runtime, secure isolation, web inspection, and manifest
  lifecycle remain incomplete.
- `automation-self-improvement/` contains extensive scaffolding, but its
  intended product relationship is not yet settled.

## Next Interview Batch

Batch 1 focused on product identity and center of gravity:

1. What is Thoughtbox, in one sentence, if we strip away everything accidental?
2. Who is the primary user we should optimize for first?
3. What is the one outcome Thoughtbox must make materially better than a normal
   agent/chat/code workflow?
4. Which current surface feels closest to the intended product: MCP server,
   notebooks, Hub/team coordination, protocol gates, web app, observability, or
   something else?
5. Which current surface is most likely a distraction even if parts of it are
   good?

Batch 2 focuses on agent-user affordances:

1. What does "agent-user" mean in this product: an autonomous agent using tools,
   a human directing agents, an agent team, or another role boundary?
2. What are the product affordances you have designed, implemented, or
   envisioned for those agent-users?
3. For each affordance, what agent failure/friction is it meant to reduce?
4. Which affordances already exist in the codebase, even if partially cooked?
5. Which affordances are only envisioned and should not be treated as current
   product reality?

Batch 3 focuses on hierarchy and flagship shape:

1. If we have to name one flagship affordance, is it the durable thought graph,
   Git-like Hub, operational epistemics, control-plane learning, notebooks, or
   a compound phrase that binds them?
2. Should the Core Thought Tool be direct and first-class in the public MCP
   surface, or is Code Mode the right public interaction model?
3. Is Hub still a product concept, or should its best ideas be absorbed into
   the thought graph/control-plane model?
4. Should "single mandatory control plane" be the long-term north star for
   Thoughtbox, or a separate product line/research direction?
5. Which affordance should cleanup protect most aggressively even if the current
   implementation is messy?

Batch 4 focuses on the unified thought graph / Hub product object:

1. What should we call the unified object: thought graph, reasoning repo,
   cognitive repo, Hub, workspace, or something else?
2. In the web app, what is the primary view of multiple AIs working together:
   graph, timeline, board, commit history, branch explorer, live activity feed,
   or a composed view?
3. What are the must-have Git-like primitives: branch, merge, hash, diff,
   commit, review, conflict, blame/provenance, tags, releases/checkpoints?
4. What is a "merge" of reasoning supposed to mean in Thoughtbox?
5. What should an autonomous agent be able to ask Code Mode to do with this
   unified object in one command?

Batch 5 focuses on merge semantics and Code Mode verbs:

1. When a merge is a finalized decision or collapse to certainty, what evidence
   must be attached: tests, citations, validator results, reviewer approval,
   confidence, dissenting branches, or something else?
2. Can a merge be later reverted or superseded, or is it immutable history with
   new commits on top?
3. Should Thoughtbox support unresolved competing branches as a normal state,
   or should every branch eventually pressure toward merge/abandon?
4. Should Code Mode expose Hub verbs like `branch`, `commit`, `diff`, `review`,
   `merge`, `revert`, `tag`, and `checkpoint`?
5. What is the smallest useful Code Mode API for Hub v1?

Architecture branch notes:

- `branches/001-merge-evidence-notebooks.md`
