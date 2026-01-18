/**
 * Thoughtbox Cipher Protocol
 *
 * A formal protocol layer for structured reasoning. The cipher enables
 * deterministic server-side parsing of thought structure—the server extracts
 * IDs, types, references, and relationships without inference.
 *
 * The cipher is to Thoughtbox what HTTP verbs are to REST: a contract that
 * enables protocol-compliant processing without intelligence on the server side.
 */

export const THOUGHTBOX_CIPHER = `# Thoughtbox Compression Cipher

A formal protocol for structured reasoning. The cipher is not merely a compression format—it is a **protocol layer** that enables deterministic server-side processing of thought structure.

---

## The Cipher as Protocol

The cipher sits in the same conceptual space as MCP itself:

\`\`\`
┌─────────────────────────────────┐
│  Natural language intent        │  ← Intelligence (client/agent)
├─────────────────────────────────┤
│  Thoughtbox Cipher              │  ← Protocol (formal contract)
├─────────────────────────────────┤
│  MCP (tool calls, responses)    │  ← Protocol
├─────────────────────────────────┤
│  HTTP/Transport                 │  ← Protocol
└─────────────────────────────────┘
\`\`\`

**Why this matters:**
- Intelligence transforms intent into cipher (agent's job)
- Everything below is protocol processing (deterministic)
- Server can parse cipher without inference—just contract fulfillment
- Using cipher = speaking the native protocol of Thoughtbox

When you write \`S47|H|S45|API latency ↑ bc db regression\`, you are encoding structure explicitly. The server extracts thought number, type, references, and relationships through parsing, not interpretation.

**The cipher enables:**
- Auto-inference of thought structure (no manual tracking of thoughtNumber, totalThoughts)
- Automatic link building from \`[SN]\` references
- Revision detection from \`^[SN]\` markers
- Relationship graphs from typed references

---

## Purpose

Every tool call consumes context tokens. Long reasoning chains risk exhausting the context window before reaching a conclusion. This cipher compresses reasoning content by 2-4x while remaining LLM-parseable and human-readable with reference to this legend.

---

## Step Type Markers

Single-character markers indicating the function of a reasoning step.

| Marker | Meaning | Usage |
|--------|---------|-------|
| \`H\` | Hypothesis | Proposed explanation or prediction |
| \`E\` | Evidence | Facts, data, observations supporting/opposing |
| \`C\` | Conclusion | Determination reached from reasoning |
| \`Q\` | Question | Open issue requiring resolution |
| \`R\` | Revision | Correction or update to prior step |
| \`P\` | Plan | Intended action or approach |
| \`O\` | Observation | Direct output from tool or environment |
| \`A\` | Assumption | Premise taken as given |
| \`X\` | Rejected | Hypothesis or path ruled out |

---

## Logical Operators

Standard notation LLMs recognize from training data.

| Symbol | Meaning | Example |
|--------|---------|---------|
| \`→\` | implies, leads to, causes | \`A → B\` (A implies B) |
| \`←\` | derived from, because of | \`C ← E1,E2\` (C follows from E1 and E2) |
| \`∴\` | therefore | \`E1, E2 ∴ C\` |
| \`∵\` | because | \`C ∵ E1\` |
| \`∧\` | and | \`A ∧ B\` |
| \`∨\` | or | \`A ∨ B\` |
| \`¬\` | not | \`¬H1\` (H1 is false) |
| \`⊕\` | supports | \`E1 ⊕ H1\` (E1 supports H1) |
| \`⊖\` | contradicts | \`E2 ⊖ H1\` (E2 contradicts H1) |
| \`≈\` | approximately, similar to | \`result ≈ expected\` |
| \`≠\` | not equal, differs from | \`actual ≠ expected\` |
| \`>\` | greater than, stronger than | \`E1 > E2\` (E1 is stronger evidence) |
| \`<\` | less than, weaker than | |
| \`?\` | uncertain, unknown | \`outcome?\` |
| \`!\` | high confidence, confirmed | \`H1!\` |

---

## Reference Syntax

Steps reference prior steps by ID rather than restating content.

| Pattern | Meaning | Example |
|---------|---------|---------|
| \`[S1]\` | references step 1 | \`C ← [S1],[S3]\` |
| \`[S1-S3]\` | references steps 1 through 3 | \`summary of [S1-S3]\` |
| \`[H1]\` | references hypothesis 1 | \`E1 ⊕ [H1]\` |
| \`+[S1]\` | builds on step 1 | \`+[S1] adding constraint\` |
| \`^[S1]\` | revises step 1 | \`^[S1] correction: X not Y\` |
| \`×[S1]\` | invalidates step 1 | \`×[S1] contradicted by E3\` |

---

## Confidence Markers

Append to any statement to indicate certainty level.

| Marker | Confidence | Example |
|--------|------------|---------|
| \`(!)\` | High (>90%) | \`H1 confirmed (!)\` |
| \`(?)\` | Low (<50%) | \`possible cause (?)\` |
| \`(~)\` | Medium (50-90%) | \`likely explanation (~)\` |
| \`(p=N)\` | Specific probability | \`success (p=0.7)\` |

---

## Quantifiers & Modifiers

| Symbol | Meaning |
|--------|---------|
| \`∀\` | all, every |
| \`∃\` | exists, some |
| \`∄\` | none, does not exist |
| \`Δ\` | change, delta |
| \`∝\` | proportional to |
| \`≡\` | equivalent to, defined as |
| \`⊂\` | subset of, part of |
| \`∈\` | member of, in |

---

## Abbreviated Vocabulary

High-frequency reasoning words compressed to short forms.

### Logical Connectives
| Abbrev | Expansion |
|--------|-----------|
| \`bc\` | because |
| \`tf\` | therefore |
| \`hw\` | however |
| \`impl\` | implies/implication |
| \`b/c\` | because |

### Reasoning Terms
| Abbrev | Expansion |
|--------|-----------|
| \`hyp\` | hypothesis |
| \`ev\` | evidence |
| \`assm\` | assume/assumption |
| \`obs\` | observe/observation |
| \`conf\` | confirm/confirmed |
| \`contra\` | contradicts/contradiction |
| \`rsn\` | reasoning/reason |
| \`synth\` | synthesis/synthesize |
| \`ptn\` | pattern |

### State & Validation
| Abbrev | Expansion |
|--------|-----------|
| \`req\` | requires/requirement |
| \`dep\` | depends/dependency |
| \`val\` | valid/validate |
| \`inv\` | invalid/invalidate |
| \`prob\` | probability/problem |
| \`sol\` | solution |

### Temporal & Position
| Abbrev | Expansion |
|--------|-----------|
| \`prev\` | previous |
| \`curr\` | current |
| \`init\` | initial |
| \`fin\` | final |
| \`pt\` | point |
| \`ctx\` | context |

### Agent & System Terms
| Abbrev | Expansion |
|--------|-----------|
| \`agt\` | agent |
| \`cog\` | cognitive/cognition |
| \`emb\` | embodiment/embodied |
| \`cap\` | capability |
| \`cfg\` | configuration |
| \`sess\` | session |
| \`mech\` | mechanism |
| \`behav\` | behavior |
| \`exp\` | experience |
| \`struct\` | structure |
| \`integ\` | integration |
| \`trans\` | transition |

### Comparisons & Modality
| Abbrev | Expansion |
|--------|-----------|
| \`alt\` | alternative |
| \`eg\` | example (e.g.) |
| \`sim\` | similar |
| \`diff\` | different |
| \`spec\` | specific |
| \`gen\` | general |
| \`btwn\` | between |
| \`w/in\` | within |
| \`poss\` | possible |
| \`nec\` | necessary |

### Qualifiers
| Abbrev | Expansion |
|--------|-----------|
| \`re:\` | regarding |
| \`w/\` | with |
| \`w/o\` | without |
| \`esp\` | especially |
| \`approx\` | approximately |
| \`sig\` | significant |
| \`insig\` | insignificant |
| \`unk\` | unknown |
| \`TBD\` | to be determined |
| \`N/A\` | not applicable |

---

## Step Format

Recommended structure for compressed reasoning steps:

\`\`\`
[ID]|[TYPE]|[REFS]|[CONTENT]
\`\`\`

**Examples:**

\`\`\`
S1|H|—|API latency ↑ bc db query regression
S2|E|S1|query metrics: p99 ↑3x on user lookup ⊕ [H1]
S3|E|S1|log vol ↑10%, w/in normal range ⊖ [H1] (insig)
S4|C|S1-S3|[H1] conf (!), investigate query Δ in deploy
\`\`\`

**Decoded:**
- S1: Hypothesis — API latency increased because of database query regression
- S2: Evidence supporting S1 — query metrics show p99 latency up 3x on user lookup, supports hypothesis 1
- S3: Evidence opposing S1 — log volume up 10%, within normal range, contradicts hypothesis 1 but insignificant
- S4: Conclusion from S1-S3 — Hypothesis 1 confirmed with high confidence, investigate query changes in deployment

---

## Telegraphic Style Guidelines

Beyond symbols, use telegraphic prose:

1. **Drop articles** — "the", "a", "an"
2. **Drop pronouns** — "it", "this", "that" (use refs instead)
3. **Drop helper verbs** — "is", "are", "was", "were", "has been"
4. **Use active fragments** — "query fails" not "the query is failing"
5. **Abbreviate common phrases** — see vocabulary table

**Before:**
> "The evidence suggests that the hypothesis about the database is probably correct, because the query metrics show a significant increase."

**After:**
> \`E ⊕ H1 (~): query metrics show sig ↑\`

---

## Usage Protocol

1. **Invoke cipher** — Call \`thoughtbox_cipher\` tool at start of long reasoning chains
2. **Maintain consistency** — Once invoked, use notation throughout session
3. **Reference by ID** — Never restate prior content; use \`[SN]\` references
4. **Minimize response echo** — Thoughtbox returns only IDs; don't duplicate content
5. **Decode for output** — When producing final answer for user, expand to natural language

---

## Quick Reference Card

\`\`\`
TYPES:  H=hyp E=ev C=concl Q=ques R=rev P=plan O=obs A=assm X=rej

LOGIC:  → impl  ← from  ∴ tf  ∵ bc  ∧ and  ∨ or  ¬ not
        ⊕ supports  ⊖ contra  > stronger  < weaker

REFS:   [S1] ref step  +[S1] build on  ^[S1] revise  ×[S1] invalidate

CONF:   (!) high  (~) med  (?) low  (p=N) specific

FORMAT: ID|TYPE|REFS|content
\`\`\``;
