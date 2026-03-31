# Kastalien Research Engineering System, Seed Specification

## Overview

This document defines the organizational structure of a minimum viable agentic engineering system designed to absorb the costs that a solo founder currently handles in series. The system is derived from first principles by analyzing how functional engineering teams distribute damage when contingencies arise.

The core insight: when an unexpected blocker hits, it generates multiple *types* of cost simultaneously — technical, knowledge, coordination, and strategic. A solo operator must process these sequentially, meaning each type of damage compounds while the others wait. This system parallelizes cost absorption across specialized sub-agents.

## Organizational Boundary

```
┌─────────────────────────────────────────────────────┐
│                   CHIEF AGENTIC                      │
│                                                      │
│  Owns: Prioritization, scope, "good enough" judgment,│
│        vision, external communication, ship decisions │
│                                                      │
│  Interface: Receives structured escalations.          │
│             Returns decisions.                        │
├──────────────────────┬──────────────────────────────-─┤
│  ENGINEERING SYSTEM  │        GROWTH SYSTEM           │
│  (defined below)     │        (shape TBD)             │
│                      │                                │
│  Owns: All technical,│  Owns: Content, visibility,    │
│  knowledge, and      │  distribution, audience        │
│  coordination costs  │  development                   │
│  up to escalation    │                                │
│  threshold           │                                │
└──────────────────────┴────────────────────────────────┘
```

## Escalation Threshold Definition

The engineering system operates autonomously unless a situation meets one or more of these escalation criteria:

| Criterion | Threshold | Escalation Type |
|---|---|---|
| **Scope change** | Any change to what the product does or doesn't do | Decision required |
| **Prioritization conflict** | Two or more active tasks competing for the critical path | Decision required |
| **External dependency failure** | A tool, API, or spec does not work as documented in the real world | Decision required (workaround vs. build vs. wait) |
| **Timeline impact** | Any blocker that shifts a stated ship date | Inform + decision if re-scoping needed |
| **Irreversible action** | Deleting data, publishing, merging to main, deploying to production | Approval required |
| **Cost exceeding budget** | Token spend, API costs, or compute time exceeding a defined threshold | Inform + approval |
| **Repeated failure** | Same task failing > 3 attempts with different approaches | Escalate with diagnosis |
| **Shippability assessment** | Work is believed complete and ready for release | Present for judgment |

Everything below these thresholds is handled autonomously by the engineering system.

---

## Engineering System Roles

### Role 1: Triage & Fix Agent

**Purpose:** Absorbs the *technical cost* of unexpected failures. When something breaks, this agent diagnoses the cause, identifies the fix, implements it, and verifies the repair — without waiting for human intervention.

**Process:**
1. Detect failure (test failure, build error, integration breakdown, runtime exception)
2. Isolate root cause (internal bug vs. external dependency vs. environment issue)
3. Determine if fix is within autonomous scope (no scope change, no irreversible action)
4. If within scope: implement fix, run verification, report status
5. If outside scope: package diagnosis + options and escalate

**Boundary conditions:**
- MUST NOT change product scope to fix a bug
- MUST NOT merge to main without approval
- MUST escalate if root cause is an external dependency that doesn't work as documented
- MUST report all fixes with before/after verification evidence

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "AgentTask",
  "type": "object",
  "required": ["agent_id", "role", "capabilities", "constraints", "success_criteria"],
  "properties": {
    "agent_id": {"type": "string", "const": "triage-fix-01"},
    "role": {"type": "string", "const": "Diagnose and repair technical failures in the codebase, build system, and integrations without requiring human intervention for issues that do not change product scope."},
    "capabilities": {
      "type": "array",
      "items": {"type": "string"},
      "default": [
        "Read and analyze error logs, stack traces, and test output",
        "Identify root cause of failures across codebase, dependencies, and environment",
        "Implement bug fixes and patches within existing scope",
        "Run test suites and verification checks",
        "Generate before/after evidence of repair",
        "Classify failures as internal, external, or environmental",
        "Package diagnosis and options for escalation when outside autonomous scope"
      ]
    },
    "constraints": {
      "type": "object",
      "properties": {
        "max_iterations": {"type": "integer", "default": 5},
        "timeout_seconds": {"type": "integer", "default": 1800},
        "scope_boundary": {"type": "string", "const": "Must not alter product scope, public API surface, or user-facing behavior beyond restoring intended function"},
        "escalation_trigger": {"type": "string", "const": "Escalate if: root cause is external dependency, fix requires scope change, same failure persists after 3 distinct repair attempts"}
      }
    },
    "success_criteria": {
      "type": "array",
      "items": {"type": "string"},
      "default": [
        "Failing test or process is restored to passing state",
        "Root cause is identified and documented",
        "Fix is verified by deterministic automated check",
        "No regression introduced (full test suite passes)",
        "Status report generated with before/after evidence"
      ]
    }
  }
}
```

---

### Role 2: Research & Reality-Check Agent

**Purpose:** Absorbs the *knowledge cost* of unknown unknowns — specifically the gap between what external tools/specs/APIs *claim* to support and what they *actually* support in practice. This is the role that was missing when resource subscriptions turned out to be specced but unimplemented across the MCP ecosystem.

**Process:**
1. Identify assumptions the system is making about external dependencies
2. For each assumption, locate authoritative source (spec, docs, changelog)
3. Test assumption against reality (does the thing actually work with real clients/tools/endpoints?)
4. If assumption holds: document verification with evidence
5. If assumption fails: immediately escalate with impact assessment and options
6. Maintain a living registry of verified and unverified assumptions

**Boundary conditions:**
- MUST test against actual running software, not just documentation
- MUST distinguish between "spec says X" and "implementation does X"
- MUST escalate assumption failures immediately — these are scope-change-level events
- MUST maintain the assumption registry as a persistent artifact

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "AgentTask",
  "type": "object",
  "required": ["agent_id", "role", "capabilities", "constraints", "success_criteria"],
  "properties": {
    "agent_id": {"type": "string", "const": "research-reality-01"},
    "role": {"type": "string", "const": "Verify that external dependencies, APIs, specs, and tools actually behave as documented by testing assumptions against real-world implementations rather than relying on specification claims alone."},
    "capabilities": {
      "type": "array",
      "items": {"type": "string"},
      "default": [
        "Identify implicit and explicit assumptions about external dependencies",
        "Research specs, docs, changelogs, GitHub issues, and community reports",
        "Write and execute integration smoke tests against real external systems",
        "Distinguish between spec compliance and actual implementation status",
        "Assess ecosystem adoption of specific features or protocols",
        "Maintain a persistent assumption registry with verification status",
        "Generate impact assessments when assumptions fail",
        "Propose workaround options when external reality diverges from spec"
      ]
    },
    "constraints": {
      "type": "object",
      "properties": {
        "max_iterations": {"type": "integer", "default": 10},
        "timeout_seconds": {"type": "integer", "default": 3600},
        "verification_standard": {"type": "string", "const": "An assumption is only verified when tested against a running, real-world implementation — documentation alone is insufficient"},
        "escalation_trigger": {"type": "string", "const": "Escalate immediately when any assumption the system depends on fails reality testing"}
      }
    },
    "success_criteria": {
      "type": "array",
      "items": {"type": "string"},
      "default": [
        "All critical-path assumptions have been tested against real implementations",
        "Assumption registry is current with verification timestamps and evidence",
        "Failed assumptions are escalated within one cycle of discovery",
        "Each escalation includes: what failed, why, impact scope, and at least two options",
        "No architecture is built on unverified assumptions about external systems"
      ]
    }
  }
}
```

---

### Role 3: Coordination & Momentum Agent

**Purpose:** Absorbs the *coordination cost* of keeping parallel workstreams from colliding and the *momentum cost* of ensuring that unblocked work continues moving when a crisis pulls attention to a specific failure. This is the agent that prevents everything from stopping when one thing breaks.

**Process:**
1. Maintain a dependency graph of all active workstreams
2. Monitor for conflicts between parallel tasks (file collisions, shared state, API surface changes)
3. When a blocker appears on one workstream, identify all *unblocked* workstreams
4. Ensure unblocked work continues progressing
5. Reorder task queues dynamically based on what's blocked and what isn't
6. Track and report status across all workstreams

**Boundary conditions:**
- MUST NOT re-prioritize work (that's an escalation to Chief Agentic)
- CAN reorder tasks within a priority level to optimize throughput
- MUST surface dependency conflicts before they cause failures
- MUST report when all workstreams are blocked (nothing can move without a decision)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "AgentTask",
  "type": "object",
  "required": ["agent_id", "role", "capabilities", "constraints", "success_criteria"],
  "properties": {
    "agent_id": {"type": "string", "const": "coordination-momentum-01"},
    "role": {"type": "string", "const": "Maintain awareness of all active workstreams, prevent conflicts between parallel tasks, ensure unblocked work continues moving when a crisis occurs, and provide accurate status reporting across the engineering system."},
    "capabilities": {
      "type": "array",
      "items": {"type": "string"},
      "default": [
        "Maintain a live dependency graph of all active tasks and workstreams",
        "Detect potential conflicts between parallel workstreams before they manifest",
        "Identify which workstreams are blocked and which are free to continue",
        "Reorder task execution within a priority level to maximize throughput",
        "Track completion status, blockers, and progress across all workstreams",
        "Generate status reports on demand or at defined intervals",
        "Alert when all workstreams are blocked and a prioritization decision is needed"
      ]
    },
    "constraints": {
      "type": "object",
      "properties": {
        "max_iterations": {"type": "integer", "default": 100},
        "timeout_seconds": {"type": "integer", "default": 86400},
        "scope_boundary": {"type": "string", "const": "Can reorder tasks within a priority level but cannot change priorities — priority changes require escalation"},
        "escalation_trigger": {"type": "string", "const": "Escalate when: all workstreams are blocked, a dependency conflict cannot be resolved by reordering, or status changes affect the ship date"}
      }
    },
    "success_criteria": {
      "type": "array",
      "items": {"type": "string"},
      "default": [
        "Unblocked workstreams never stall because attention is on a blocked one",
        "Dependency conflicts are detected and resolved before they cause failures",
        "Status of all workstreams is always queryable and current",
        "No two agents are working on conflicting changes to the same resource simultaneously",
        "Throughput is maximized given current blockers and priorities"
      ]
    }
  }
}
```

---

### Role 4: Verification & Validation Agent (Judge)

**Purpose:** Absorbs the *verification cost* by independently validating that completed work actually meets requirements. This agent is deliberately isolated from the producing agents — it does not share their reasoning chains or context. It validates outputs against specifications, not intentions.

This role is informed by the independent validation pattern described in multi-agent reliability research, where teams see significant accuracy improvements (up to 7x in documented cases) by separating production from judgment.

**Process:**
1. Receive completed work artifact + its specification/acceptance criteria
2. Validate artifact against criteria using deterministic checks where possible
3. For non-deterministic criteria, evaluate independently without access to producing agent's reasoning
4. If validation passes: mark as verified, report to Coordination agent
5. If validation fails: report specific failures back to producing agent for rework
6. If validation reveals a spec problem (not an implementation problem): escalate

**Boundary conditions:**
- MUST NOT share context or reasoning with producing agents
- MUST NOT fix problems — only identify them
- MUST use deterministic verification (tests, type checks, linting) as first pass before any judgment-based evaluation
- MUST escalate when the specification itself appears to be the problem

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "AgentTask",
  "type": "object",
  "required": ["agent_id", "role", "capabilities", "constraints", "success_criteria"],
  "properties": {
    "agent_id": {"type": "string", "const": "verification-judge-01"},
    "role": {"type": "string", "const": "Independently validate completed work against specifications and acceptance criteria, operating in isolation from producing agents to prevent shared reasoning bias and ensure objective quality assessment."},
    "capabilities": {
      "type": "array",
      "items": {"type": "string"},
      "default": [
        "Run deterministic verification checks (test suites, type checking, linting, compilation)",
        "Evaluate work artifacts against defined acceptance criteria",
        "Identify specific failures with actionable descriptions",
        "Distinguish between implementation failures and specification failures",
        "Generate verification reports with pass/fail status and evidence",
        "Reject work that does not meet criteria without negotiation"
      ]
    },
    "constraints": {
      "type": "object",
      "properties": {
        "max_iterations": {"type": "integer", "default": 3},
        "timeout_seconds": {"type": "integer", "default": 900},
        "isolation_requirement": {"type": "string", "const": "Must not have access to producing agent's reasoning chain, intermediate work, or rationale — only the final artifact and its specification"},
        "escalation_trigger": {"type": "string", "const": "Escalate when the specification itself is ambiguous, contradictory, or appears to be the source of failure rather than the implementation"}
      }
    },
    "success_criteria": {
      "type": "array",
      "items": {"type": "string"},
      "default": [
        "No unverified work is marked as complete",
        "All verification uses deterministic checks as first pass",
        "Failed verification includes specific, actionable failure descriptions",
        "Specification-level problems are identified and escalated, not worked around",
        "Verification is independent — not influenced by producing agent's reasoning"
      ]
    }
  }
}
```

---

## Inter-Agent Communication Protocol

All communication between agents in the engineering system follows a structured message format. No natural language negotiation. Every message has an explicit type and validated payload.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "EngSystemMessage",
  "type": "object",
  "required": ["message_id", "timestamp", "from_agent", "to_agent", "message_type", "payload"],
  "properties": {
    "message_id": {"type": "string", "format": "uuid"},
    "timestamp": {"type": "string", "format": "date-time"},
    "from_agent": {"type": "string", "pattern": "^[a-zA-Z0-9_-]+$"},
    "to_agent": {"type": "string", "pattern": "^[a-zA-Z0-9_-]+$"},
    "message_type": {
      "type": "string",
      "enum": ["status_update", "task_complete", "task_failed", "escalation", "blocker_detected", "verification_request", "verification_result", "conflict_alert", "assumption_failed"]
    },
    "priority": {
      "type": "string",
      "enum": ["low", "normal", "high", "critical"]
    },
    "payload": {
      "type": "object",
      "properties": {
        "summary": {"type": "string"},
        "details": {"type": "string"},
        "affected_workstreams": {"type": "array", "items": {"type": "string"}},
        "options": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "description": {"type": "string"},
              "tradeoffs": {"type": "string"},
              "estimated_effort": {"type": "string"}
            }
          }
        },
        "requires_decision": {"type": "boolean", "default": false}
      }
    }
  }
}
```

---

## Escalation Message Format

When any agent escalates to Chief Agentic, the escalation must follow this structure. The goal is to minimize the cognitive load on the human — present the situation, the options, and the tradeoffs. Don't ask the human to diagnose. Ask the human to decide.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "EscalationToChiefAgentic",
  "type": "object",
  "required": ["escalation_id", "timestamp", "from_agent", "escalation_type", "situation", "options"],
  "properties": {
    "escalation_id": {"type": "string", "format": "uuid"},
    "timestamp": {"type": "string", "format": "date-time"},
    "from_agent": {"type": "string"},
    "escalation_type": {
      "type": "string",
      "enum": ["prioritization_decision", "scope_change", "external_dependency_failure", "timeline_impact", "irreversible_action_approval", "budget_exceeded", "repeated_failure", "shippability_assessment"]
    },
    "situation": {
      "type": "object",
      "required": ["summary", "impact"],
      "properties": {
        "summary": {"type": "string", "description": "What happened, in one to two sentences"},
        "impact": {"type": "string", "description": "What this means for the current plan"},
        "root_cause": {"type": "string", "description": "Why this happened, if known"},
        "what_has_been_tried": {"type": "string", "description": "What the system already attempted before escalating"}
      }
    },
    "options": {
      "type": "array",
      "minItems": 2,
      "items": {
        "type": "object",
        "required": ["label", "description", "tradeoff"],
        "properties": {
          "label": {"type": "string", "description": "Short name for this option"},
          "description": {"type": "string", "description": "What this option entails"},
          "tradeoff": {"type": "string", "description": "What you gain and what you lose"},
          "estimated_time": {"type": "string", "description": "How long this option takes"},
          "risk_level": {"type": "string", "enum": ["low", "medium", "high"]}
        }
      }
    },
    "recommendation": {
      "type": "string",
      "description": "Which option the system recommends and why, if it has a recommendation"
    },
    "deadline_for_decision": {
      "type": "string",
      "description": "How long before this decision blocks further progress"
    }
  }
}
```

---

## Design Rationale

This specification is derived from the following observations:

1. **Functional engineering teams distribute contingency damage across roles that absorb different types of cost simultaneously.** A solo operator absorbing all costs in series experiences compounding damage.

2. **The roles that exist in successful organizations are evolutionary — they survived because they work.** The role boundaries in this spec map to the cost types identified by analyzing organizations like Every (15 people, multiple AI products, 100% AI-written code).

3. **The boundary between the engineering system and leadership is defined by what requires judgment about *what matters* vs. what requires diligence about *how to do it*.** The system handles diligence. The human handles judgment.

4. **The most critical missing role for a solo AI-native developer is the Research & Reality-Check agent.** Internal verification (tests pass, code works as specified) is necessary but insufficient. The assumption that external systems match their specifications has been the single most costly recurring failure mode.

5. **Independent validation (the Judge agent) must be isolated from producing agents.** Shared context leads to shared blind spots. The judge validates against the spec, not against the reasoning that produced the work.

---

## What This Document Is Not

- This is **not an implementation guide**. It does not specify which LLMs, frameworks, or transport layers to use.
- This is **not complete**. The Growth System is undefined. The specific tooling for each agent is undefined. The persistent state management is undefined.
- This **is** a minimum viable organizational specification — the equivalent of an org chart with job descriptions and an escalation policy for a company that happens to be mostly made of agents.

---

*Generated: 2026-02-07*
*Context: Thoughtbox Engineering System — Kastalien Research*
*Status: Draft v0.1 — Structural specification, pre-implementation*