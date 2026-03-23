---
name: delphi-protocol
description: >
  Discrimination-gated epistemic inquiry protocol for autonomous agents.
  Use when facing a question that requires structured investigation —
  evaluating competing hypotheses against finite evidence, not just
  "doing more research." Prevents unbounded exploration via pre-committed
  adversarial challenges, finite discriminants with closure rules, and
  forced synthesis when probes stop discriminating. Converges to one of
  four terminal states: SUPPORTED_THESIS, REFINED_QUESTION,
  CAPABILITY_GAP, or IRREDUCIBLE_UNCERTAINTY.
argument-hint: <question to investigate>
user-invocable: true
allowed-tools: Bash, Read, Glob, Grep, Write, Agent, mcp__thoughtbox__thoughtbox_delphi, mcp__thoughtbox__thoughtbox_init
---

# Delphi Protocol

Structured epistemic inquiry that prevents the "Research Fugue State" — where
an agent keeps gathering information without converging on an answer. While
Ulysses gates on *surprise* and Theseus gates on *scope*, Delphi gates on
*discrimination*: if your probes aren't changing the hypothesis landscape,
you must synthesize what you have and stop.

## Why Delphi Converges

Four bounded mechanisms guarantee termination:

1. **Finite live hypotheses** — session cannot exceed 4 candidates
2. **Finite discriminants with closure rules** — progress means filling
   declared evidence slots, not "doing more research" (max 5 discriminants,
   1-3 slots each)
3. **Non-discrimination counter (N)** — one non-discriminating probe forces
   the pre-committed challenge. Two in a row force terminal synthesis.
   N never exceeds 2.
4. **No silent frame expansion** — if the question was wrong, the session
   ends as REFINED_QUESTION rather than escaping into a larger research loop

## Quick Start

Parse $ARGUMENTS as the question to investigate. If no arguments, ask the
user what they want to investigate.

### Phase 1: Frame the Question

1. **Initialize** the Thoughtbox session:
   ```
   thoughtbox_init { operation: "start_new", task: "delphi-inquiry", aspect: "protocol-session" }
   thoughtbox_init { operation: "cipher" }
   ```

2. **Operationalize the question** — determine what kind of answer counts:
   ```
   thoughtbox_delphi { operation: "init",
     question: "<the question>",
     resolutionClass: "<decisive|corroborative|experimental|evaluative>",
     questionType: "<causal|comparative|descriptive|evaluative>",
     scope: "<what's in/out of scope>",
     admissibleEvidenceClasses: ["<code>", "<docs>", "<empirical>", ...],
     inadmissibleEvidenceClasses: ["<hearsay>", "<speculation>", ...]
   }
   ```

   **Resolution classes:**
   - `decisive` — one hypothesis can be conclusively established or ruled out
   - `corroborative` — multiple lines of evidence converge to support/weaken
   - `experimental` — answer requires running an experiment to observe
   - `evaluative` — answer is a judgment call grounded in evidence

3. **Declare hypotheses** (2-4, structurally distinct):
   ```
   thoughtbox_delphi { operation: "hypothesize",
     hypotheses: [
       { statement: "...", supportPattern: "what evidence would look like",
         falsificationCriteria: "what would disprove this" },
       { statement: "Null: insufficient evidence to determine",
         supportPattern: "no discriminating evidence found",
         falsificationCriteria: "any discriminating evidence found" },
       ...
     ]
   }
   ```
   One hypothesis SHOULD represent the null/uncertainty case.

4. **Declare discriminants** (1-5, finite closure rules):
   ```
   thoughtbox_delphi { operation: "discriminate",
     discriminants: [
       { id: "D1", essential: true,
         closureRule: { slots: [
           { id: "S1", description: "primary measurement",
             requiredSourceClass: "empirical" },
           { id: "S2", description: "corroborating measurement",
             requiresIndependence: true }
         ]},
         bearingOn: ["H1", "H2"] },
       ...
     ]
   }
   ```
   After this call, the session enters **INQUIRE** phase. No new discriminants
   may be added for the rest of the session.

### Phase 2: Investigate (INQUIRE → DESTABILIZE loop)

5. **Probe** — every probe MUST target a specific discriminant + slot and
   pre-commit an adversarial challenge:
   ```
   thoughtbox_delphi { operation: "probe",
     description: "Check whether X holds by examining Y",
     targetDiscriminant: "D1",
     targetSlot: "S1",
     interpretationMap: { "H1": "expect r > 0.5", "H2": "expect r < 0.1" },
     probeType: "observational",
     bound: "10 minutes / 3 file reads",
     challengeProbe: {
       description: "Check for confounding variable Z",
       type: "observational"
     }
   }
   ```

6. **Execute the probe** — do the actual investigation work.

7. **Assess** — record what happened and whether it discriminated:
   ```
   thoughtbox_delphi { operation: "assess",
     finding: "<what was actually observed>",
     source: "<where the evidence came from — CANNOT be empty>",
     sourceClass: "code",
     independenceClass: "independent",
     admissible: true,
     contaminated: false,
     filledSlots: ["S1"],
     hypothesisEffects: { "H1": "supports", "H2": "weakens" },
     materialChange: true
   }
   ```

   **What happens based on `materialChange`:**
   - `true` → N resets to 0, stay in INQUIRE, continue probing
   - `false` → N increments. If N=1, enter DESTABILIZE. If N=2, enter SYNTHESIZE.

8. **Destabilize** (when N=1) — execute the pre-committed challenge:
   ```
   thoughtbox_delphi { operation: "destabilize",
     challengeResult: "<what the challenge probe found>",
     materialChange: <true|false>
   }
   ```
   - If challenge discriminated: N resets, back to INQUIRE
   - If challenge also didn't discriminate: N=2, forced into SYNTHESIZE

### Phase 3: Terminal State

9. **Iron Witness** — REQUIRED before SUPPORTED_THESIS or
   IRREDUCIBLE_UNCERTAINTY. Invoke a separate challenger (ideally a forked
   sub-agent) to adversarially test the conclusion:
   ```
   thoughtbox_delphi { operation: "witness",
     witnessType: "adversarial",
     challenge: "<strongest objection found>",
     response: "<how it was answered with admissible evidence>"
   }
   ```

   To invoke the Iron Witness as a sub-agent:
   ```
   Agent { subagent_type: "general-purpose", model: "sonnet",
     prompt: "You are the Iron Witness. Review this Delphi inquiry state
     and attempt: (1) present strongest alternative hypothesis,
     (2) identify missing discriminants, (3) challenge evidence
     admissibility/independence, (4) challenge whether probes can
     discriminate, (5) challenge whether synthesis is premature.
     Be specific. Cite evidence entries. If no weakness, say so.

     [paste current delphi status output here]"
   }
   ```

10. **Complete** — declare terminal state:
    ```
    thoughtbox_delphi { operation: "complete",
      terminalState: "<supported_thesis|refined_question|capability_gap|irreducible_uncertainty>",
      strength: "verified|supported",
      assurance: "witnessed|reduced-assurance",
      summary: "<one-paragraph synthesis>",
      report: { question, hypotheses, discriminants, evidenceCount, probeCount, nCounterHistory }
    }
    ```

## Terminal States

| State | Meaning | Requirements |
|-------|---------|-------------|
| `supported_thesis` | One hypothesis survived all probes | Witness invoked, exactly 1 live hypothesis |
| `refined_question` | Original question was inadequate | No witness required (question itself is the finding) |
| `capability_gap` | Cannot answer because a capability is missing | At least 1 essential discriminant blocked |
| `irreducible_uncertainty` | Multiple hypotheses survive, further probing won't help | Witness invoked, explain why probes can't discriminate |

## State Machine

```
pre_frame ──[hypothesize + discriminate]──→ INQUIRE
                                              │
                                    probe + assess
                                              │
                              ┌───────────────┼───────────────┐
                     materialChange=true   materialChange=false
                              │               │
                          N=0, stay      N++ → if N=1:
                          in INQUIRE     DESTABILIZE
                                              │
                                    destabilize result
                                              │
                              ┌───────────────┼───────────────┐
                     materialChange=true   materialChange=false
                              │               │
                          N=0, back      N=2 → SYNTHESIZE
                          to INQUIRE          │
                                         complete only
```

## Composability

When a Delphi probe reveals prerequisite work:

- **Bug discovered**: Spawn Ulysses sub-session (`/ulysses-protocol init`).
  Terminal state becomes probe result via `assess`.
- **Refactoring needed**: Spawn Theseus sub-session (`/theseus-protocol init`).
  Same pattern.
- **Nested question**: Spawn child Delphi session. Child's terminal state
  becomes evidence in the parent.

Sub-sessions are encapsulated. The parent treats sub-session completion as a
capability-acquiring probe targeting a specific discriminant.

## Protocol Invariants

These are enforced by the handler — violations produce clear error messages:

1. No probe without a targeted discriminant and slot
2. No probe without a pre-committed challenge probe
3. N never exceeds 2
4. No discriminant without a finite closure rule (1-3 slots)
5. No new discriminants added mid-session
6. No evidence slot filled by agent's own unsupported synthesis (source required)
7. No SUPPORTED_THESIS without witness and single live hypothesis
8. No IRREDUCIBLE_UNCERTAINTY without witness
9. No CAPABILITY_GAP without a blocked essential discriminant

## thoughtType Mapping (Session Bridge)

| Operation | thoughtType | Content Pattern |
|-----------|-------------|-----------------|
| `init` | `action_report` | `[Delphi:init] Question: ... Resolution: ...` |
| `hypothesize` | `reasoning` | `[Delphi:hypothesize] N hypotheses declared: ...` |
| `discriminate` | `reasoning` | `[Delphi:discriminate] N discriminants: ... Essential: ...` |
| `probe` | `action_report` | `[Delphi:probe] type targeting D.S: ... Challenge: ...` |
| `assess` | `reasoning` | `[Delphi:assess] DISCRIMINATING/NON-DISCRIMINATING. Finding: ...` |
| `destabilize` | `decision_frame` | `[Delphi:destabilize] Challenge executed. Landscape changed/N→2` |
| `witness` | `decision_frame` | `[Delphi:witness] Challenge: ... Response: ...` |
| `complete` | `action_report` | `[Delphi:complete] terminal_state (strength, assurance): summary` |

## Resource Reference

- **Full specification**: `references/protocol-spec.md` — deep theoretical background
- **Implementation proposal**: `.specs/operational-epistemics/delphi/implementation-proposal.md`
- **MCP tool source**: `src/protocol/delphi-tool.ts`
