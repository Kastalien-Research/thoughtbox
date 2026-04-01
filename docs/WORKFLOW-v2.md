# How We Work (v2)

This document describes the complete workflow for building, from ideation to merge-to-main, including the environmental learning loop that enables the project to improve its own structure over time. It supersedes the original `docs/WORKFLOW-MASTER-DESCRIPTION.md` by incorporating Thoughtbox as the intention ledger, a protocol for handling unplanned work, and the feedback mechanism by which the environment learns from agent behavior.

## Foundational Premise

Agents are ephemeral. They arrive, do work, and leave. Compaction erases context. Sessions end. New agents start cold. You cannot calibrate an agent — you can only shape the environment it lands in.

The project is the memory-bearing organism. Its file structure, hooks, conventions, specs, tooling, and connected services (Supabase, GCP, etc.) constitute the environment. The goal is for this environment to evolve so that an agent's locally cheapest action — the thing it would naturally do — produces the globally correct outcome.

Enforcement (hooks, guards, blockers) is a fail-safe for when the environment's learning is incomplete. Running into enforcement is a signal about the environment, not about the agent. In an ideal system, enforcement exists but is never triggered.

## Organizational Boundary

```
┌─────────────────────────────────────────────────────┐
│                   CHIEF AGENTIC (glassBead)          │
│                                                      │
│  Owns: Intentions, prioritization, scope,            │
│        "good enough" judgment, vision, ship decisions │
│                                                      │
│  Interface: Reviews PRs. Receives structured          │
│             escalations. Returns decisions.            │
│             Defines the project constitution.          │
├──────────────────────────────────────────────────────┤
│                 ENGINEERING SYSTEM                    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ ORCHESTRATOR (observer, never modifies)       │    │
│  │                                               │    │
│  │ Dispatches sub-agents. Observes outcomes.     │    │
│  │ Records reasoning to Thoughtbox.              │    │
│  │ Evaluates sub-agent summaries against specs.  │    │
│  │ Reports environmental friction.               │    │
│  │                                               │    │
│  │ Tools: Read, Glob, Grep, Bash (read-only),   │    │
│  │        Agent (dispatch), Thoughtbox            │    │
│  │ NOT: Edit, Write, git commit                  │    │
│  ├──────────────────────────────────────────────┤    │
│  │ SUB-AGENTS (workers, modify the environment)  │    │
│  │                                               │    │
│  │ Each operates in an isolated worktree.        │    │
│  │ Writes code, runs tests, returns summary.     │    │
│  │ Does NOT use Thoughtbox.                      │    │
│  │                                               │    │
│  │ Tools: All tools except Thoughtbox            │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  Produces: PRs, thought trails, environment patches. │
└──────────────────────────────────────────────────────┘
```

The Chief Agentic's goal is to move from directing and correcting agents to:
1. Defining intentions (what outcomes matter)
2. Reviewing results (PR-level, not session-level)
3. Occasionally updating intentions as the product evolves

This is achieved by the environment learning to produce correct agent behavior without human intervention.

## The Observer/Worker Separation

The orchestrator agent and sub-agents have strictly separated roles:

**The orchestrator observes but never modifies.** It dispatches sub-agents, reads their summaries, compares results against specs and hypotheses, identifies environmental friction, and records all of this to Thoughtbox. It does not write code, edit files, or commit. Its tools are limited to reading, dispatching, and recording.

**Sub-agents modify but never observe.** They receive a task, a worktree, and a spec. They write code, run tests, and return a structured summary. They do not use Thoughtbox. Their job is to do the work and report what they did.

This separation exists because observation and action are different cognitive modes. An agent in the middle of debugging a test failure produces low-quality observations — it's narrating while working, which incentivizes either performative journaling or skipping the journal entirely. An agent whose entire job is to watch outcomes and evaluate them produces high-quality observations, because observation *is* its work. There is no context switch.

This also solves the Thoughtbox adoption problem. Sub-agents don't need to be convinced to use Thoughtbox — they don't use it. The orchestrator uses it naturally because recording observations is its primary function. The thought trail is higher signal because it comes from the perspective of someone evaluating outcomes, not someone in the middle of producing them.

The separation is enforced structurally: the orchestrator's tool set excludes Edit, Write, and git commit. If the orchestrator needs something changed, it dispatches a sub-agent. This is not a discipline requirement — it is a capability constraint.

## Thoughtbox: The Intention Ledger

Thoughtbox is used throughout every stage of this workflow. It serves two functions:

### Forensic Audit Trail

When something goes wrong — a production failure, a bad architectural decision, a PR that had to be split — Thoughtbox provides the record of what an agent was reasoning about when it made the decision. An engineer can reconstruct what information was at the front of the agent's context window at the time of the failure-producing action.

### Environmental Learning Signal

The thought trail and knowledge graph accumulate patterns about what works and what doesn't. This data feeds into the Environmental Learning Loop (described below), enabling the project to evolve its own structure.

### Ergonomic Constraint

Thoughtbox must be a subsidy, not a tax. Agents should find it easier to complete tasks using Thoughtbox, not harder. If it adds friction, agents skip it or use it performatively, and both the audit trail and the learning signal degrade.

Concretely: defaults must be sensible (thoughtType defaults to "reasoning", nextThoughtNeeded should default to true), micro-thoughts must be cheap, and the agent's attention should be on its work, not on the tool.

## Branching Strategy

We use **GitHub Flow**: one long-lived branch (`main`), all work on short-lived feature branches, PR review before merge, delete after merge.

### The Model

- `main` is the only long-lived branch. It is always the source of truth.
- All work happens on short-lived branches created from `main`.
- Every branch gets a PR. Every PR gets reviewed (by human and/or code review agents). Every PR merges via rebase (no merge commits — `required_linear_history` is enforced on `main`).
- Branches are deleted immediately after merge.



### Branch Lifecycle

```
1. Create    git checkout main && git pull origin main && git checkout -b <type>/<name>
2. Work      Commits on the branch (atomic, conventional commit format)
3. Push      git push -u origin <type>/<name>
4. PR        Open PR against main. Review happens here.
5. Merge     Rebase onto main (required_linear_history enforced)
6. Delete    Branch deleted locally and on remote immediately after merge
```

### Branch Naming

- `feat/<name>` — New feature
- `fix/<name>` — Bug fix
- `docs/<name>` — Documentation only
- `refactor/<name>` — Code restructuring, no behavior change
- `chore/<name>` — Maintenance, tooling, config
- `test/<name>` — Test-only changes
- `investigate/<name>` — Exploratory work that may not result in a merge

Agents MUST NOT create branches with timestamps or random suffixes (e.g., `implement-X-1769019707`). Branch names must be human-readable and describe the work.

### One Branch = One Unit of Work

A branch corresponds to exactly one logical change. If work on a branch reveals a separate issue, that issue gets its own branch — it does not get committed to the current branch.

**This rule is enforced structurally, not just by instruction.** Each unit of work is assigned a worktree, so the agent is physically isolated to its branch's scope. It cannot commit to the wrong branch because it is not on it. See "Scope Isolation via Worktrees" below.

### Scope Isolation via Worktrees

When an agent claims a task and begins work, the environment provisions a git worktree for that task's branch. The agent works in the worktree, not in the main checkout. This means:

- The agent can only commit to the branch it was assigned.
- Discovering an unrelated issue mid-work requires creating a new task, which provisions a new worktree on a new branch. The agent records the discovery as a Thoughtbox thought (type: `context_snapshot`) and tracks it as a new issue, then does the actual fix in the new worktree.
- The orchestrator's main checkout remains clean.

This is the primary structural mechanism for preventing the mixed-concern PR problem. The enforcement hook (checking commit scope against branch name) exists as a fail-safe but should rarely trigger.

### Staleness Rule

Any branch not updated in 14 days is considered stale. Stale branches should be either:
- Rebased onto current main and continued, or
- Deleted (capturing what was learned, if anything)

### Merge Flow (Rebase-Only)

```bash
# Before opening PR or if PR shows conflicts:
git fetch origin
git rebase origin/main
git push --force-with-lease   # force-with-lease, NEVER --force

# After PR is approved:
gh pr merge <number> --rebase --delete-branch
```

- `--force-with-lease` is safe: it only force-pushes if no one else has pushed to the branch since your last fetch. This is the standard pattern for rebased branches.
- `--force` is NEVER allowed.

## The Planned Work Workflow

This is the workflow for intentional units of work — features, bug fixes, refactors — that enter through ideation.

### Ideation to Dev-Time Documentation

It all starts with an idea. Sometimes this idea is the Chief Agentic's alone, sometimes it is generated by an agentic workflow, and sometimes it's a back-and-forth between these two processes. In any case, the workflow begins once we have chosen to turn our attention to a given idea.

Once we are considering a specific idea, we must first decide whether the idea is worth working on. To do that, we must ask some questions, including:

1. What outcomes are we striving to achieve in a world where we decide to implement it? Put another way, what outcome is this idea "proposed instrumentation" for achieving?

2. What outcomes can we reasonably determine we will ACTUALLY get in a world where we decide to implement the idea? From reading the code, the design docs, and what we get back from any research that we run on web data: what can we say with 90-95% confidence WILL happen if we implement this idea?

3. If we review our answers to both questions, then compare the answers to the first question with the answers to the second one:

3a. Is the outcome we're hoping to achieve aligned with our goals?
3b. If so, is there a simpler/existing way to achieve the goal-aligned outcome?
3c. If not, what existing work will we need to edit/revise/reconsider as a result of implementing the idea?
3d. Considering the answer to 3c, is executing that process more valuable than anything else we could be doing with that time?

If we get all the way to 3d and the answer is a confident "no", we should turn our attention to whatever *is* the most valuable use of our time. If the answer is anything else (i.e. either "yes" or "we can't say for sure"), we should continue working on what we're working on and come up with a spec and an ADR.

Note that we should use our compound learnings and accepted ADRs at this stage to determine if we have answered any of these questions before, whether those learnings and prior decisions still hold if they are found, and if they do not but we still feel that we should continue, what is different about this situation than the one that produced the learning or decision we are referencing.

**Thoughtbox use**: The ideation process should be captured in a Thoughtbox session. This creates a retrievable record of the reasoning behind the decision to pursue (or not pursue) an idea, which is available to future agents evaluating related ideas.

### Dev-Time Documentation

In this section, we are defining a spec (WHAT are we implementing?) and an ADR (WHY are we implementing it?). In this stage, we have a back-and-forth between the chief orchestrator agent (Claude Code, Letta Code, Codex, etc. — whatever agent will be spinning off subagents later) to arrive at these documents.

Initial drafts of both should be relatively trivial, since we already defined our expectations and the files/processes that would be touched by our implementation in the previous stage.

This is where the Hypothesis-Driven Development (HDD) process comes in. While HDD may have other definitions, this is a process invented by the Chief Agentic and we should use his definition.

Reference `.claude/commands/hdd/hdd.md` for an operational description of HDD.

In short, Hypothesis-driven development (HDD) is a workflow that treats **ADRs (Architecture Decision Records) as the source of truth** rather than code. Before writing any code, we form testable hypotheses about what we expect to happen, document them in staging ADRs, implement, validate, and then either accept or reject based on whether reality matched our predictions.

#### ADR Reconciliation (Primary Gate)

During HDD Phase 1 (Research), the codebase discovery step scans `.adr/accepted/` for related ADRs. This scan serves two purposes: gathering context for the new work, and **checking whether the reasoning in those accepted ADRs still holds**. For each accepted ADR that relates to the domain being researched, the agent applies the following reconciliation signals. If any signal fires, the ADR must be flagged in the Phase 1 research findings presented to the user. The flag should identify which specific signal(s) fired and why. See "ADR Reconciliation Outcomes" in the Revision Stage for what happens next.

##### Reconciliation Signals

These are the specific checks applied to each accepted ADR encountered during the workflow. An ADR warrants review when any of these signals fire.

1. **Context mismatch**: The ADR's Context section describes a state of the codebase that no longer matches reality. The ADR says "we currently use X" but the codebase no longer uses X, or the problem the ADR was solving has changed shape.

2. **Broken references**: Files, modules, or functions that the ADR mentions by name have been moved, deleted, or substantially rewritten. The ADR references `src/gateway-handler.ts` but that file has been split, renamed, or removed.

3. **Dependency drift**: The ADR's reasoning relied on a specific dependency's behavior, and that dependency has had a major version change. An ADR written against MCP SDK 1.12 may not hold at 1.25.

4. **Contradicting direction**: The current work — whether a new staging ADR or the implementation at hand — is moving in a direction that directly conflicts with what the accepted ADR decided.

5. **Unrealized consequences**: The ADR's Consequences section predicted specific outcomes that observably have not happened. "This enables feature Y" but feature Y was never built. "This reduces latency by 30%" but no measurement confirms it.

6. **Rejected alternative resurfacing**: One of the alternatives that the ADR explicitly rejected in its reasoning is now being proposed or implemented. This does not necessarily mean the ADR is wrong — circumstances may have changed — but the reasoning behind the original rejection needs re-examination.

7. **Orphaned dependency chain**: The ADR depends on another accepted ADR that has since been retired, superseded, or invalidated. If ADR-003 says "Depends on: ADR-001" and ADR-001 is in `.adr/retired/`, ADR-003's foundation has been removed.

To reiterate:

- The **SPEC** is the declarative definition of WHAT we are implementing. These are descriptions of implementation details, not the project-level sources of truth that we will be using when running other HDD processes in the future. Mistakes in these specs are low-impact and easily corrected: we expect to be wrong somewhat frequently about our pre-testing, pre-usage expectations with regard to what we think will work to satisfy our WHY.

- The **ADR** is the description of WHY we have chosen to implement what we are implementing versus some other thing. The ADR should include a description of the state of the codebase and the state of the project as a whole at the time that we are writing it, our reasoning concerning why the current state is insufficient, descriptions of any alternatives that we rejected in steps 3a-3d above and our reasoning for doing so, our expectations for outcomes post-implementation and how these outcomes bring us closer to our goals, and finally a series of SPECIFIC, TESTABLE hypotheses whose confirmation or refutation post-implementation will strongly suggest that we have succeeded or failed in our implementation.

#### File Locations

| Artifact | Staging Location | Accepted Location |
|----------|-----------------|-------------------|
| ADRs | `.adr/staging/` | `.adr/accepted/` (also `docs/ADR/`) |
| Rejected ADRs | — | `.adr/rejected/` |
| Retired ADRs | — | `.adr/retired/` |
| Specs | `.adr/staging/` (alongside ADR) | `.specs/` |

See `.claude/commands/hdd/hdd.md` for the complete HDD lifecycle including staging, acceptance, and rejection workflows.

### Planning Stage

At this stage, the chief orchestrator agent uses the /plan workflow from the compound-engineering plugin to decide HOW to implement the spec produced in the previous stage.

This is well-documented enough in the plugin itself to avoid rehashing here, but it should be noted that agents performing the workflow should be in PLAN MODE while doing so if the Chief Agentic is in the loop.

The Chief Agentic, assuming that he is in the loop, will review the plan and make any necessary changes. If the plan is determined to be sufficient, we will move to implementation.

### Implementation Stage

At this stage, the chief orchestrator agent uses the /work workflow from the compound-engineering plugin to implement the plan generated in the previous stage.

Prior to beginning work, the chief orchestrator agent should define units of work that each sub-agent will perform: the number of units and subagents should match. Importantly, the chief orchestrator agent should refrain from doing any manual work themselves, choosing instead to deploy either sub-agents or an agent team to implement the work instead. This protects the chief orchestrator's context from unnecessary work-time tokens best abstracted away in a subagent's summary.

Each sub-agent receives:
1. The work workflow from the compound engineering plugin
2. A worktree provisioned for its task's branch
3. Instructions to use Thoughtbox throughout implementation

The sub-agents should be following a test-driven development process.

This means that wherever possible any code generated by one of the task agents or team members should be accompanied with a deterministic test through which we can programmatically verify and make visible certain aspects of the code being generated, including: does it work? What are we actually testing for in the tests that are generated? We should be able to review, where feasible without direct application/tool use, whether our hypotheses themselves are validated or refuted by testing. So if one of the sub-agents generates a test that, for example, simply validates that the code that it implemented **exists**, that will not satisfy our hypotheses, and we will need to revise the tests and possibly the code itself in the later stages.

**Thoughtbox use**: Each sub-agent uses Thoughtbox to capture its reasoning during implementation. Key decision points — "I chose approach A over approach B because..." — are recorded as thoughts. This is not a reporting requirement; it's a tool the agent uses to structure its own thinking. The forensic value is a side effect of genuine use.

#### Atomic Commits

Each sub-agent's unit of work comprises exactly one commit. This commit is made at the end of the review stage, upon being validated — not during implementation. Until review validates the work, the changes are uncommitted working state.

- One sub-agent = one worktree = one unit of work = one commit
- The commit message follows conventional commit format
- The commit includes both the code changes AND any spec updates in the same commit
- If review rejects the work, there is nothing to revert because nothing was committed

#### Structured Output Format for Sub-Agent Summaries

Each sub-agent must return its summary in the following format. This format is designed so the orchestrator can feed it directly to review sub-agents without reading the implementation code.

```markdown
## Sub-Agent Work Summary

### Task
- Task: <task-id>
- Branch: <current branch>
- Worktree: <worktree path>
- Spec: .specs/<spec-file>.md
- ADR: .adr/staging/<adr-file>.md (if applicable)
- Thoughtbox Session: <session-id>

### Changes
- Files modified: [list with paths]
- Files created: [list with paths]
- Files deleted: [list with paths]
- Lines: +N / -N

### Claims
Specific, testable statements about what the implementation does.
Review sub-agents verify these claims rather than reading all the code.

1. "[Function/module X] handles [case Y] by [doing Z]"
   - Verifiable by: [test name or command]
2. "[Component A] now [behaves in way B] when [condition C]"
   - Verifiable by: [test name or command]
3. ...

### Hypothesis Alignment
For each ADR hypothesis that this unit of work touches:

- H1 "[hypothesis text]": [SUPPORTS | REFUTES | NO EVIDENCE] — [brief evidence]
- H2 "...": ...

### Tests
- Tests written: N
- Tests passing: N/N
- Commands: `[exact test command to reproduce]`
- Coverage: [files/functions covered by tests]

### Known Gaps
- [anything not completed, deferred, or uncertain]
- [any divergence from spec with justification]

### Accepted ADR Conflicts
- [any previously accepted ADR whose reasoning is contradicted or undermined by this work]
- [leave empty if none found]

### Risks
- [anything that could break other parts of the system]
- [any assumptions made that should be verified]

### Environmental Friction Observed
- [any point where the agent had to work around the environment rather than with it]
- [any rule or convention that was unclear, contradictory, or missing]
- [any tool that was present-at-hand rather than ready-to-hand]
- [leave empty if none]
```

The **Claims** section is the critical bridge between implementation and review. Instead of review sub-agents reading every line of changed code, they verify specific claims against the codebase. This maps directly to the hypothesis validation in the HDD workflow: claims should reflect the expectations set by the ADR hypotheses.

The **Environmental Friction Observed** section feeds into the Environmental Learning Loop. It is not a complaint box — it is structured data about where the environment's topology diverged from what the agent needed.

### Review Stage

At this stage, the chief orchestrator agent uses the /review workflow from the compound-engineering plugin to review the work done by the subagents or team members in the previous stage.

As an expansion on the original /review workflow, sub-agents will be the driving forces behind this stage. While it is not necessary for each review sub-agent to have a one-to-one connection to their predecessors in the previous stage, it should be noted that there should be a division of concerns between each sub-agent. That is to say, perhaps one sub-agent compares the work done in the previous stage to the original specification. Perhaps one validates against the ADR. Perhaps one does research on web sources to resolve ambiguities. It could be any number of things depending on context.

What is important is that the orchestrator should be able to use the output from the Task agents or team members in the Implementation Stage to produce a list of specific claims about the post-implementation stage codebase that can be refuted or confirmed, which reflect the expectations of the hypotheses generated at the start of the HDD-compliant sections of our workflow.

### Revision Stage (Conditional)

If our review stage reveals that anything in our implementation does not align with our stated aim of validating our hypotheses, or if anything in our implementation diverges with our spec in a way that is not justified by the environment that is implemented within (i.e. the codebase behaved in a way we did not originally account for), then we will need to perform revisions.

These should also be done with subagents or team members, not by the orchestrator itself. The process will strongly resemble the previous two stages of implementation and review. We should consider this stage to be repeated on a loop until we get full alignment with our stated aim of validating our hypotheses.

If a hypothesis is refuted, then at that stage we will need to revisit the spec and perhaps the ADR itself. If we need to update the spec but nothing in the ADR is refuted, we simply update the spec. If something in the ADR itself is refuted (that is, our reasoning was wrong), we will go to the ADR and consider what to do in a process that will be documented in full in a separate doc. In short, we will need to run the initial steps (1 through 3d) again using the information that we have post-review.

If, however, we are along the happy path and everything has been implemented as we expected and our hypotheses are correct and validated, then we should either move the staging docs over into our main docs folder, or if one of our docs in staging or more renders something in the existing main docs outdated, that information should be revised to align with the current state of the codebase.

#### ADR Reconciliation Outcomes

The revision stage also handles a second class of problem: **previously accepted ADRs whose reasoning no longer holds**, as surfaced by the ADR Reconciliation gate in HDD Phase 1 or by the Accepted ADR Conflicts field in a sub-agent's work summary. When an accepted ADR is flagged as stale, the outcome is one of four dispositions:

1. **STILL VALID**: The flag was a false positive. The ADR's reasoning holds. Update the ADR's `lastValidated` date and continue.

2. **NEEDS AMENDMENT**: The core decision is still correct, but the context, consequences, or supporting reasoning needs updating to reflect the current state of the codebase. Amend the ADR in place (do not create a new ADR). The amendment should note what changed and when.

3. **SUPERSEDED**: Another ADR (whether the one currently being worked on or a different accepted one) has implicitly or explicitly replaced this ADR's decision. Move the old ADR to `.adr/retired/` with a forward reference to its replacement. The replacement ADR should note that it supersedes the retired one.

4. **INVALIDATED**: The reasoning no longer holds and there is no replacement. The decision was once correct but the world changed. Move the ADR to `.adr/retired/` with a description of what invalidated it. If the domain still needs a decision, create a new staging ADR to address it — this re-enters the workflow at the Dev-Time Documentation stage.

### Compound Stage

At this stage, the chief orchestrator agent uses the /compound workflow from the compound-engineering plugin to document learnings from the work just completed.

Learnings are captured in two forms:
1. **Compound documents** (for human and agent consumption) — what we learned about the domain, the approach, the tools.
2. **Environmental friction reports** (for the learning loop) — aggregated from the Environmental Friction Observed sections of sub-agent summaries and from Thoughtbox session analysis.

### Reflection

Finally, we will reflect on the process that we have just executed. If the Chief Agentic is in the loop, he will perform a separate reflection which will be included in the final document produced, which itself will be added to a larger collection of reflections from which we will periodically aggregate insights.

## The Unplanned Work Protocol

The planned work workflow assumes work enters through ideation. But agents routinely discover issues while working on something else — a bug in an unrelated file, a stale convention, a missing test. The original workflow states "that issue gets its own branch" but does not specify how.

This protocol makes the correct behavior structural rather than instructional.

### Discovery

An agent working in its worktree encounters something outside the scope of its current task. Examples:
- A bug in a file unrelated to the current feature
- A convention violation that predates the current work
- A missing test for existing functionality
- A stale or incorrect comment/doc

### Response

1. **Record the discovery in Thoughtbox** as a `context_snapshot` thought: what was found, where, and why it matters. This takes seconds and costs nothing.

2. **Create a new issue** to track the discovered work. This puts it in the backlog with provenance.

3. **Continue working on the current task.** Do not fix the discovered issue in the current worktree.

4. **If the discovery is blocking** (the current work literally cannot proceed without fixing it), escalate to the orchestrator, which provisions a new worktree for the blocking fix and sequences the work.

### Why This Works

The agent does not need to decide whether the fix "belongs" on the current branch. The environment makes the question moot: the agent is in a worktree, so the only branch it can commit to is the one it was assigned. Creating an issue and moving on is cheaper than trying to context-switch, and the Thoughtbox record ensures the discovery isn't lost.

The fail-safe hook (checking commit scope against branch name) exists for cases where worktrees are not used — but the goal is that worktrees are always used, making the hook a dead letter.

## The Environmental Learning Loop

This is the mechanism by which the project learns from agent behavior and evolves its own structure. It operates on a longer timescale than the planned work workflow — not per-session, but across sessions.

### Inputs

The learning loop consumes four types of signal:

1. **Environmental Friction Reports** from sub-agent summaries (the "Environmental Friction Observed" field).
2. **Thoughtbox session analysis** — patterns in agent reasoning that indicate environmental misalignment. Example: multiple agents across sessions recording thoughts like "I found a bug but I'm going to fix it here because switching branches is too expensive."
3. **Hook trigger logs** — when enforcement hooks fire, that's a signal that the environment didn't prevent the violation structurally.
4. **Post-merge audits** — automated analysis of merged PRs for mixed concerns, scope violations, or other structural issues that made it through review.

### Classification

Each friction signal is classified by type:

| Type | Description | Example |
|------|-------------|---------|
| `scope-leak` | Work committed to the wrong branch/PR | Bug fix on a feature branch |
| `convention-gap` | No convention exists for a situation | Agent didn't know where to put a new file type |
| `convention-violation` | Convention exists but agent didn't follow it | Commit message format wrong |
| `tooling-friction` | Tool exists but is harder to use than the workaround | Switching branches harder than fixing in-place |
| `missing-default` | A sensible default would have prevented the issue | thoughtType requiring explicit value |
| `enforcement-false-positive` | Hook blocked legitimate work | Write guard blocking a valid spec edit |
| `enforcement-miss` | Hook should have caught something but didn't | Off-scope commit not blocked |

### Patch Proposal

For each classified friction signal (or cluster of related signals), the system proposes a typed, reversible environment patch:

```
Patch: ENV-<number>
Type: <worktree-policy | hook-change | convention-update | default-change | file-structure>
Signal: <reference to friction report(s) that motivated this>
Description: <what changes>
Reversibility: <how to undo this if it makes things worse>
Constitution check: <which constitutional principle this serves>
```

Patches are not code changes to the product. They are changes to the environment that agents work in: hook rules, worktree policies, default values, file layout conventions, branching rules, tooling configuration.

### Promotion State Machine

Patches move through a deterministic lifecycle:

```
PROPOSED → TESTING → PROMOTED → OBSERVED
                  ↘ REVERTED
```

- **PROPOSED**: A friction signal has been classified and a patch written. Awaiting review.
- **TESTING**: The patch is applied for a bounded trial (N sessions or N days). The specific friction signal is monitored for recurrence.
- **PROMOTED**: The friction signal did not recur during testing. The patch becomes part of the environment permanently.
- **REVERTED**: The patch caused new friction (enforcement-false-positive or tooling-friction) during testing. It is rolled back, and the original friction signal is re-examined with the new information.
- **OBSERVED**: The promoted patch is monitored long-term. If the friction signal recurs despite the patch, the patch is re-evaluated.

The Chief Agentic reviews patches at the PROPOSED → TESTING transition. This is the human-in-the-loop checkpoint. Once a patch is in TESTING, promotion or reversion is determined by data, not by human judgment.

### Relationship to the Planned Work Workflow

The environmental learning loop is not a separate process that competes for attention with feature work. It runs alongside it:

- Friction signals are generated as a side effect of normal work (the sub-agent summary field, Thoughtbox sessions, hook logs).
- Patch proposals are generated during the Compound stage, when the orchestrator aggregates friction reports.
- Patch review happens asynchronously — the Chief Agentic reviews proposed patches during PR review or at a regular cadence.
- Patch testing happens automatically as agents do their normal work in subsequent sessions.

The loop does not require dedicated "improvement sessions." It learns from the work that's already happening.

## The Project Constitution

The constitution defines the invariant intentions of the project — the things that are true regardless of what feature is being built or what agent is doing the building. Environment patches must serve a constitutional principle; patches that don't trace back to the constitution are rejected.

The constitution is maintained as a separate document (`.specs/product/constitution.md`) and is loaded into every agent's context at session start. It is not a rules document — it is a statement of intentions that the environment should serve.

Constitutional principles are updated only by the Chief Agentic. They change rarely.

Example principles (to be defined by the Chief Agentic):

- Every unit of work is traceable from intention to implementation to outcome.
- An agent's locally cheapest action should produce the globally correct outcome.
- Enforcement exists as a fail-safe; the environment should make enforcement unnecessary.
- The thought trail is honest — it captures what actually happened, not a cleaned-up narrative.
- Unplanned discoveries are captured and tracked, not lost or incorrectly scoped.

## Periodic ADR Reconciliation

The workflow stages above handle ADR reconciliation as a byproduct of ongoing work — ADRs are reviewed when agents naturally encounter them. But some ADRs may sit in `.adr/accepted/` without being touched by any active work for extended periods. Periodic reconciliation catches these.

### Mechanism

A scheduled GitHub Action runs weekly. The action scans all accepted ADRs and applies the seven reconciliation signals defined above. When signals fire, the action opens a GitHub issue tagged `adr-reconciliation` with the findings.

### Cadence

Weekly (Monday mornings). This is frequent enough to catch drift before it compounds, and infrequent enough to avoid noise.

### Integration with the Development Workflow

Issues opened by the periodic reconciliation action are handled like any other work item. They enter the workflow at the Ideation stage — the team evaluates whether the flagged ADR actually needs attention (the agent may have false positives), and if so, whether to amend, retire, or replace it. The four dispositions defined in "ADR Reconciliation Outcomes" in the Revision Stage apply.

## Periodic Environmental Learning Review

In addition to ADR reconciliation, a weekly review aggregates friction signals from the previous week's work:

1. Collect all Environmental Friction Observed fields from merged PRs' sub-agent summaries.
2. Collect hook trigger logs.
3. Collect post-merge audit findings (if any PRs were split or had scope issues).
4. Query Thoughtbox knowledge graph for recurring friction patterns.
5. Classify, propose patches, and present to Chief Agentic for review.

This review can be performed by an agent with access to the Thoughtbox knowledge graph and git history. It does not require the Chief Agentic to be in the loop until the review is complete and patches are proposed.
