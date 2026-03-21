# Patroy I — Architecture Pseudo-Specification

**Working Title:** Patroy I **Status:** Conceptual Draft — v0.1 **Author:**
Aleph (Kastalien Research) **Date:** 2026-03-01

---

## 1. Overview

Patroy I is a cognitive loop architecture for situated AI agents, implemented
entirely using Model Context Protocol (MCP) primitives. It describes a complete,
protocol-native Observe-Orient-Decide-Act (OODA) cycle in which:

- External state flows into the agent via resource subscriptions
- Orientation is performed via sampling, optionally deferred via the Task
  primitive
- Decisions are produced as structured model outputs
- Actions are executed via tools
- Consequences return to the agent through the same subscription channel

The architecture extends prior work on introspective sampling loops (closed
cognitive loops over externalized reasoning state) to include genuinely external
environmental state — making the server a sensorimotor membrane rather than a
scratch pad.

The name Patroy I is a working title and carries no other significance at this
revision.

---

## 2. Motivation

### 2.1 The Gap in Existing Agent Implementations

Most current agent architectures implement a reflex arc: a model receives a
prompt, calls tools, receives results, produces output. This is a single-pass
transaction. There is no persistent orientation state, no mechanism for
variable-tempo cycling, no structured episodic memory, and no protocol-native
feedback path from action consequences back into inference.

### 2.2 MCP as a Sufficient Substrate

The MCP 2025-11-25 specification provides four primitives — resources, tools,
sampling, and tasks (experimental) — whose composition is sufficient to express
a complete, non-blocking, observable OODA loop. This architecture describes that
composition explicitly.

### 2.3 Wire-Level Transport Symmetry

MCP's JSON-RPC 2.0 transport is bidirectional at the wire level: either endpoint
can initiate requests. The client/server labels are administrative boundaries
for capability namespaces and session management, not constraints on message
directionality. This is the load-bearing structural reason the feedback topology
works. Sampling is not a workaround or a hack — it is the server exercising its
native right to initiate a request back through the same transport stream. The
loopback is architecturally first-class, not bolted on. Without this property,
the OODA cycle would require a separate return channel, breaking protocol
nativity.

### 2.4 Relation to Cognitive Architecture

At the functional level, Patroy I is structurally correspondent to the active
inference framework (Friston et al.): a perception-action loop in which an agent
maintains a generative model of its environment, updates beliefs based on
prediction error, and selects actions to minimize expected surprise under
preferences. This correspondence is claimed at the architectural level only, not
at the substrate or learning-algorithm level.

---

## 3. Core Primitives (MCP Mapping)

| OODA Phase | MCP Primitive                                             | Notes                                                         |
| ---------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| Observe    | `resources/subscribe` + `notifications/resources/updated` | Server pushes state changes; agent does not poll              |
| Orient     | `sampling/createMessage` (optionally task-augmented)      | Model performs inference over current state + reasoning layer |
| Decide     | Sampling response (structured output)                     | Model produces action selection as a structured decision      |
| Act        | `tools/call`                                              | Agent executes action against the environment                 |
| Memory     | Resource (append-only, event-sourced)                     | Reasoning layer persists orientation state between cycles     |

### 3.1 The Reasoning Layer

The reasoning layer is a server-side resource that functions as externalized
working memory. It is:

- **Persistent:** survives individual loop cycles
- **Append-only:** new writes do not overwrite prior state; prior beliefs are
  preserved
- **Inspectable:** readable by authorized clients at any point
- **Provenance-bearing:** each write carries a cycle ID, timestamp, source
  observations, and the task handle that produced it

The reasoning layer is the orientation substrate. Its quality at the time
sampling fires is the primary determinant of decision quality.

### 3.2 Episodic Compression

At each cycle boundary, the agent extracts a belief delta rather than carrying
the full cycle context forward. A belief delta is:

- The updated belief state (what the agent now believes, not the full reasoning
  trace)
- The prediction error (what differed from expectation)
- Grounding links (URIs of the resources that justified the update)
- A provenance record (cycle ID, task handle, timestamp, agent ID)

The compression step is treated as a first-class reasoning act, not bookkeeping.
Its quality affects all subsequent cycles.

**Important constraint:** Belief delta compression is not sufficient alone to
prevent semantic drift across arbitrarily many cycles. Patroy I implementations
must also include:

- Periodic re-derivation of beliefs from raw resource sources
- Inconsistency detection (contradiction checks against prior deltas)
- Grounding hooks that link compressed beliefs back to raw observations

---

## 4. The Loop

### 4.1 Single-Cycle Sequence

```
1. OBSERVE
   - Agent receives notifications/resources/updated for subscribed URIs
   - Agent calls resources/read to retrieve current state

2. ORIENT
   - Agent issues sampling/createMessage with:
       - Current resource state (observations)
       - Current reasoning layer contents (prior beliefs)
       - Prediction from prior cycle (expected state)
   - If Orient is non-blocking: request is task-augmented (tasks/create)
     and agent may proceed to monitor or act on prior decisions
     while awaiting completion
   - Model produces orientation output: updated beliefs + prediction error

3. DECIDE
   - Model output includes structured action selection:
       - Tool name
       - Parameters
       - Rationale (written to reasoning layer)
       - Expected consequence (written to reasoning layer as prediction)

4. ACT
   - Agent calls tools/call with selected tool and parameters
   - Tool result is returned synchronously or via task handle

5. COMPRESS
   - Agent extracts belief delta from cycle
   - Delta is written to reasoning layer resource with full provenance
   - Raw observations are retained as grounding links (not discarded)

6. LOOP
   - Agent returns to OBSERVE
   - Cycle tempo is set by agent policy (see Section 5)
```

### 4.2 Non-Blocking Orient

When Orient is deferred via a task, the sequence becomes:

```
OBSERVE → issue sampling task → ACT on prior decision → poll tasks/result
→ receive orientation → DECIDE → ACT → COMPRESS → LOOP
```

This allows the agent to remain active while the model is processing. It is the
recommended pattern for time-sensitive environments.

---

## 5. Tempo Control

### 5.1 Agent-Controlled Cycle Rate

Patroy I agents control their own loop tempo as a policy decision made during
the Orient phase. The agent may reason about:

- Rate of incoming resource updates (environment velocity)
- Depth of orientation required (complexity of current state)
- Latency of pending tasks (current computational load)
- Recency of prior cycle's prediction error (surprise level)

High surprise / high environment velocity → tighter loop (shallower Orient,
faster cycle). Low surprise / stable environment → looser loop (deeper Orient,
richer compression).

### 5.2 Tempo as a Metacognitive Act

Tempo selection is not a fixed parameter. It is itself an output of orientation.
The agent's assessment of "how fast should I be cycling right now" is part of
what orientation produces, making tempo a first-class metacognitive variable.

### 5.3 Multi-Agent Tempo Dynamics

When multiple Patroy I agents share a server:

- Each agent independently controls its own tempo
- The shared reasoning layer and resource state constitute a stigmergic
  coordination substrate
- Coordination dynamics emerge under coupling conditions:
  - Overlapping goals or shared utility
  - Shared writable state (resources/tools)
  - Observable state changes (subscriptions)

Tempo variance between agents is a contributing factor to behavioral
differentiation but is not sufficient alone. Coupling conditions must be present
for meaningful emergent coordination.

---

## 6. Memory Architecture

### 6.1 Hierarchy

```
┌─────────────────────────────────────┐
│         Raw Observations            │  ← resources/read output, retained as
│         (grounding layer)           │    links in belief deltas
├─────────────────────────────────────┤
│         Belief Deltas               │  ← per-cycle compressed extractions,
│         (episodic layer)            │    append-only, provenance-bearing
├─────────────────────────────────────┤
│         Orientation State           │  ← current working beliefs, derived
│         (working layer)             │    from episodic layer + grounding
└─────────────────────────────────────┘
```

### 6.2 Provenance Schema (Belief Delta)

Each belief delta written to the reasoning layer resource should carry:

```json
{
    "cycle_id": "string (monotonic)",
    "timestamp": "ISO 8601",
    "agent_id": "string",
    "task_handle": "string (sampling task ID)",
    "prior_cycle_id": "string",
    "observations": ["resource URI", "..."],
    "prediction_prior": "string (what was expected)",
    "prediction_error": "string (what differed)",
    "updated_belief": "string (what the agent now believes)",
    "action_taken": "string (tool name + params)",
    "expected_consequence": "string (what action should produce)"
}
```

This schema satisfies the event-sourcing and W3C PROV-compatible requirements
for an auditable belief trajectory.

---

## 7. Auditability

A Patroy I implementation produces an auditable cognitive history as a natural
byproduct of correct operation. The reasoning layer resource, if maintained with
event-sourcing discipline, allows:

- Reconstruction of agent belief state at any prior cycle
- Attribution of actions to specific observations and beliefs
- Detection of belief drift over time
- Inspection of prediction accuracy (expected vs actual consequences)

This property is not incidental. For regulated industry applications, the belief
trajectory is the compliance artifact.

---

## 8. Open Questions and Known Constraints

### 8.1 Drift Bound

The drift horizon under delta-only compression without grounding refresh is
currently unknown. Empirical measurement of drift rates under regimes (a)
delta-only, (b) delta + periodic refresh is a priority for early implementation
work.

### 8.2 Coordination Conditions

The specific coupling conditions required to produce emergent multi-agent
coordination in a Patroy I mesh have not been formally characterized. This is an
open experimental question.

### 8.3 Orient Quality as Bottleneck

The architecture's performance ceiling is determined by the quality of the
Orient phase. What constitutes a high-quality orientation prompt — the right
balance of prior beliefs, raw observations, and prediction error — is not
specified here and is likely task-dependent.

### 8.4 Tasks Are Experimental

The MCP Task primitive is labeled experimental in the 2025-11-25 spec.
Non-blocking Orient depends on this primitive. Implementations should negotiate
task capability and provide a blocking fallback.

### 8.5 Subscription Delivery Semantics

MCP resource subscriptions do not guarantee ordered, exactly-once, or durable
delivery. Implementations must account for missed notifications, out-of-order
delivery, and reconnection scenarios.

---

## 9. Threat Model

### 9.1 Stigmergic Belief Poisoning

The primary threat vector is stigmergic belief poisoning — a stateful,
multi-stage attack that proceeds as follows:

1. An adversary embeds malicious instructions in an external resource the agent
   is subscribed to
2. The agent observes the resource normally during the Observe phase
3. During episodic compression, the compression reasoning treats the adversarial
   content as legitimate environmental signal and crystallizes it into a belief
   delta
4. That delta is written to the reasoning layer with full provenance, giving it
   apparent legitimacy
5. On subsequent cycles, the poisoned belief shapes orientation and therefore
   action selection
6. Because the reasoning layer is a shared stigmergic substrate, subscribing
   agents may ingest the compromised belief state, propagating the attack across
   the mesh

The properties that make this attack dangerous: it is **durable** (persists
across cycles), **slow** (does not trigger anomaly detection on the first
cycle), and **provenance-bearing** (the poison carries legitimate-looking
attribution metadata).

This threat model applies with greater severity in multi-agent deployments than
single-agent ones, because the stigmergic propagation mechanism that enables
emergent coordination also enables emergent infection.

### 9.2 Mitigations

The ESAA deterministic orchestrator pattern (Meijer et al., arXiv 2602.23193)
provides a partial defense by validating cognitive intentions against boundary
contracts before they mutate state — a compromised belief that produces an
out-of-contract action gets blocked at execution. However, this does not prevent
the belief itself from being stored.

Additional mitigations include:

- **Semantic validation of belief deltas before write** — not just structural
  schema validation, but content-level plausibility checks against the current
  belief state
- **Cross-agent belief consistency checks** — agents compare belief states and
  flag divergence that cannot be explained by legitimate environmental
  difference
- **Tombstone mechanisms** — invalidating and excluding compromised belief
  cartridges from future orientation without deleting the audit trail

---

## 10. Relation to Prior Work

| Concept                                          | Relation to Patroy I                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OODA Loop (Boyd)                                 | Structural template for the cycle; tempo control extends Boyd's agility concept to endogenous agent policy                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Active Inference (Friston)                       | Functional correspondence at architectural level; Patroy I does not implement the FEP learning rule                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| MemGPT                                           | Shares external memory hierarchy motivation; Patroy I is protocol-native and audit-first                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Introspective Sampling Loops                     | Direct predecessor; Patroy I extends closed cognitive loops to include external environmental state                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Stigmergy (multi-agent literature)               | Shared reasoning layer as stigmergic coordination substrate                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ESAA (Meijer et al., arXiv 2602.23193, Feb 2026) | Parallel development of event-sourced audit trail from the implementation side. ESAA's deterministic orchestrator pattern — intercepting LLM-generated intentions, validating against contracts, persisting to append-only log before executing side effects — is a concrete implementation of what the Patroy I provenance schema requires to be auditable in practice rather than aspirationally. Candidate implementation reference for the reasoning layer's write path, not prior art that anticipates Patroy I's full architecture |

---

## 11. Status and Next Steps

This document is a first conceptual pass. The following are priorities before
any claim of validation:

1. **Implement assumptions 1–3** as protocol sufficiency proofs (client-driven
   and server-driven OODA variants)
2. **Run drift experiment** across memory regimes to bound assumption 7
3. **Characterize coordination conditions** required for assumption 5 to hold
4. **Formalize the belief delta schema** as a concrete implementation artifact
5. **Stress test the active inference correspondence** against Friston's
   framework directly

---

_Patroy I is a working title. This document is a private conceptual artifact.
Not for distribution._
