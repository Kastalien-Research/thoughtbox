/**
 * Parallel Verification Prompt Content
 *
 * Guides agents through parallel hypothesis exploration using Thoughtbox branching.
 */

export const PARALLEL_VERIFICATION_CONTENT = `# Parallel Verification Workflow

Execute this workflow NOW using thoughtbox to investigate the given task through parallel hypothesis exploration.

## Variables

TASK: $TASK
MAX_BRANCHES: $MAX_BRANCHES (default: 3)

## EXECUTE NOW

You are being asked to use the \`thoughtbox_execute\` tool — writing code that calls \`tb.thought\` — to work through the TASK using parallel verification. This is not documentation to read — this is a workflow to execute immediately.

### Phase 1: Branch (Thoughts 1-4)

**DO THIS NOW:** Use \`tb.thought\` to identify 2-4 distinct hypotheses about the TASK.

1. Call \`tb.thought\` with thought 1: State the problem/question clearly
2. Call \`tb.thought\` with thought 2: Generate hypothesis H1
3. Call \`tb.thought\` with thought 3: Generate hypothesis H2 (must be genuinely different from H1)
4. Call \`tb.thought\` with thought 4: Generate hypothesis H3 if needed

Use \`tb.thought\` branching parameters:
- \`branchFromThought: 1\`
- \`branchId: "h1"\`, \`"h2"\`, \`"h3"\`

### Phase 2: Verify Each Branch (Thoughts 5-10)

**DO THIS NOW:** For each hypothesis, use available tools to gather evidence, then reflect.

For each branch:
1. **Factual Grounding**: Use search/retrieval tools (Grep, Read, WebSearch, MCP tools) to find concrete evidence
2. **Contextual Reflection**: Call \`tb.thought\` to evaluate: Does this hypothesis hold given the evidence?

Document findings in each branch's thought chain.

### Phase 3: Cross-Verify (Thoughts 11-13)

**DO THIS NOW:** Use \`tb.thought\` to compare branches.

Call \`tb.thought\` with thoughts that explicitly compare:
- H1 vs H2: Where do they agree? Contradict?
- H1 vs H3: Where do they agree? Contradict?
- H2 vs H3: Where do they agree? Contradict?

### Phase 4: Prune (Thought 14)

**DO THIS NOW:** Use \`tb.thought\` to eliminate hypotheses that:
- Were contradicted by factual evidence
- Are logically inconsistent
- Are strictly dominated by another hypothesis

Call \`tb.thought\` with \`isRevision: true\` to mark pruned branches.

### Phase 5: Converge (Thought 15)

**DO THIS NOW:** Use \`tb.thought\` with \`nextThoughtNeeded: false\` to:
1. Select the surviving hypothesis (or synthesize compatible survivors)
2. State your confidence level (high/medium/low)
3. Provide the rationale for your conclusion
4. Answer the original TASK based on your conclusion

## Begin Execution

Start Phase 1 NOW. Call \`thoughtbox_execute\` with code:

\`\`\`javascript
async () => tb.thought({
  thought: "Analyzing task: [restate TASK]. Identifying distinct hypotheses...",
  thoughtType: "reasoning",
  thoughtNumber: 1,
  totalThoughts: 15,
  nextThoughtNeeded: true,
  sessionTitle: "Parallel Verification: [TASK summary]"
})
\`\`\`
`;

/**
 * Parse input string for task and max_branches parameter
 */
export function parseParallelParams(input: string): {
  task: string;
  maxBranches: number;
} {
  let task = input;
  let maxBranches = 3;

  // Check for explicit param format: max_branches:N or max_branches=N
  const branchMatch = input.match(/\bmax_branches\s*[:=]\s*(\d+)/i);
  if (branchMatch) {
    maxBranches = parseInt(branchMatch[1], 10);
    task = task.replace(branchMatch[0], "").trim();
  } else {
    // Check for natural language: "with N branches" or "N hypotheses"
    const naturalMatch = input.match(/\b(?:with\s+)?(\d+)\s+(?:branches|hypotheses)\b/i);
    if (naturalMatch) {
      maxBranches = parseInt(naturalMatch[1], 10);
      task = task.replace(naturalMatch[0], "").trim();
    }
  }

  // Clamp to reasonable range
  maxBranches = Math.max(2, Math.min(maxBranches, 6));

  return { task: task.trim(), maxBranches };
}

/**
 * Get parallel verification prompt content with variable substitution
 */
export function getParallelVerificationContent(args: { input: string }): string {
  let content = PARALLEL_VERIFICATION_CONTENT;
  const { task, maxBranches } = parseParallelParams(args.input);

  const variablesSection = `## Variables

TASK: $TASK
MAX_BRANCHES: $MAX_BRANCHES (default: 3)`;

  const substitutedVariables = `## Variables

TASK: ${task}
MAX_BRANCHES: ${maxBranches}`;

  content = content.replace(variablesSection, substitutedVariables);
  return content;
}
