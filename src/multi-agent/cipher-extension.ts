/**
 * Cipher Logic Extension — Formal Logic Notation for Multi-Agent Reasoning
 *
 * Extends the base Thoughtbox cipher with standard formal logic notation
 * that agents already know from training data. Adds structured claim prefixes
 * for machine-parseable argument extraction.
 *
 * @module src/multi-agent/cipher-extension
 */

/**
 * Extended cipher notation additions for formal logic and claims.
 */
export const CIPHER_LOGIC_EXTENSION = `
---

## Formal Logic Extension (Multi-Agent)

Standard formal logic notation for structured argumentation across agents.

### Derivation Operators

| Symbol | Meaning | Example |
|--------|---------|---------|
| \`⊢\` | proves / syntactic entailment (turnstile) | \`P₁, P₂ ⊢ C\` (premises P₁ and P₂ prove conclusion C) |
| \`⊨\` | semantic entailment / models | \`M ⊨ φ\` (model M satisfies formula φ) |

### Claim Prefixes

Machine-parseable prefixes for structured argumentation:

| Prefix | Meaning | Example |
|--------|---------|---------|
| \`CLAIM:\` | Assert a proposition | \`CLAIM: API latency caused by db regression\` |
| \`PREMISE:\` | Support for a claim | \`PREMISE: [S2] query p99 ↑3x ⊕ CLAIM\` |
| \`REFUTE:\` | Counter a claim | \`REFUTE: ¬CLAIM bc log vol w/in normal range\` |

### Multi-Agent Derivation Format

\`\`\`
CLAIM: proposition text
PREMISE: [ref] supporting evidence
PREMISE: [ref] additional evidence
P₁, P₂ ⊢ C   (formal derivation)
\`\`\`

### Conflict Detection

When agents disagree:
\`\`\`
Agent-A CLAIM: X causes Y
Agent-B CLAIM: ¬(X causes Y)    ← Direct contradiction
Agent-B REFUTE: [S3] ⊖ Agent-A/CLAIM bc counter-evidence
\`\`\`

These are detected automatically by the conflict detection engine.
`;

/**
 * Returns the full cipher content with logic extension appended.
 *
 * @param baseCipher - The base THOUGHTBOX_CIPHER content
 * @returns Combined cipher with logic extension
 */
export function getExtendedCipher(baseCipher: string): string {
  return baseCipher + CIPHER_LOGIC_EXTENSION;
}

/**
 * Notation entries for programmatic access.
 */
export const LOGIC_NOTATION = {
  turnstile: { symbol: '⊢', name: 'turnstile', meaning: 'proves / syntactic entailment' },
  entailment: { symbol: '⊨', name: 'semantic entailment', meaning: 'model satisfies formula' },
  claim: { prefix: 'CLAIM:', meaning: 'Assert a proposition' },
  premise: { prefix: 'PREMISE:', meaning: 'Support for a claim' },
  refute: { prefix: 'REFUTE:', meaning: 'Counter a claim' },
} as const;
