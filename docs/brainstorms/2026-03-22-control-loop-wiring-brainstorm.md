# Control Loop Wiring — Brainstorm

**Date:** 2026-03-22
**Status:** Captured
**Audit Reference:** `.specs/codebase-control/audit-summary.md`

## What We're Building

Wire existing Thoughtbox subsystems into a closed control loop so that agents operating in this codebase stop thrashing — no more repeating fixes, looping without progress, or losing context across sessions.

This is not a new product feature. It's making the codebase run itself well. Thoughtbox (the MCP server) becomes the central control substrate for agents operating in this project.

## Why This Approach

The 12-subsystem audit found that individual pieces are strong (anti-instability 60%, hub 55%, safety 45%) but disconnected. The gap isn't missing primitives — it's missing wiring between them. Bottom-up wiring:

- Ships fast (each piece is independently useful)
- Uses battle-tested code (Ulysses, Theseus, bead workflow, hub)
- Teaches us what shape the control layer needs before building abstractions
- Avoids YAGNI — we build only what the closed loop actually needs

## Key Decisions

1. **Wire, don't build** — Connect existing subsystems before creating new ones
2. **Server is the substrate** — Thoughtbox MCP server maintains state, not just the harness
3. **Codebase-first, product-second** — Optimize for agents running in THIS project
4. **Short-term convergence, long-term optimization** — Fix thrashing now; QD/SOAP/learned optimization later

## Three Wiring Projects

### 1. Post-Action Receipts

**What exists:** PostToolUse hooks log git operations. ThoughtData has `actionResult` with `success`/`reversible`. Observatory emits events.

**What to wire:** After every tool call, verify state actually changed as expected. Write a receipt (expected vs actual) as a structured thought. If mismatch, feed residual into belief state.

**Connects:** Safety Shield (post-verification) → Belief State (prediction error) → Anti-Instability (surprise detection)

### 2. Tool Reliability Tracking

**What exists:** Ulysses counts consecutive surprises. Evaluation gatekeeper tracks cost per tier. SamplingHandler has model preference hints.

**What to wire:** Track success/failure per tool in Supabase. Expose via MCP resource. SamplingHandler queries reliability before choosing model. Hooks reference reliability before allowing retries.

**Connects:** Execution Runtime (receipts) → World Model (tool reliability) → Meta-Control (model selection) → Anti-Instability (retry budgets)

### 3. Cross-Session Learning

**What exists:** Knowledge graph with entities/observations/relations. Session exports with audit manifests. Handoff JSON. Bead workflow.

**What to wire:** When a bead closes, extract what worked (the hypothesis that held, the fix that passed tests) into knowledge graph as a Decision entity with provenance. When a new bead opens on a similar topic, retrieve related decisions and present them. Prevent re-discovery of known solutions.

**Connects:** Memory (episodic → semantic) → Learning (trajectory → knowledge) → Task Specification (prior art retrieval)

## Open Questions

1. Where should tool reliability data live — new Supabase table or existing protocol_sessions?
2. How to measure "similar topic" for cross-session retrieval without embeddings?
3. Should receipts be a new thoughtType or a separate storage primitive?
4. What's the right granularity for post-action verification — every tool call or only risky ones?

## Long-Term Vision (Not This Sprint)

- Quality-diversity (MAP-Elites) over workflow compositions
- SOAP-style online policy optimization from trajectories
- Learned meta-controller for model/compute allocation
- Digital twin for pre-action simulation
- Automated failure attribution (which subsystem broke?)

## Next Steps

Run `/workflows:plan` to decompose the three wiring projects into implementable tasks.
