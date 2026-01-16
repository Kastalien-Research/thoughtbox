/**
 * Session Analysis Guide Resource Template
 *
 * Provides a process guide for qualitative session analysis.
 * Accessed via resource template: thoughtbox://session-analysis-guide
 */

/**
 * Session analysis process guide content
 *
 * This guide teaches the calling agent how to perform qualitative analysis
 * on a reasoning session. The server provides objective structural metrics;
 * this guide helps the client identify key moments and extract learnings.
 */
export const SESSION_ANALYSIS_GUIDE = `# Session Analysis Process

You have received structural metrics for a reasoning session. To perform qualitative analysis and extract learnings, follow this process:

## Step 1: Review Session Content

Use \`get_session\` to retrieve the full session with all thoughts if you haven't already.

## Step 2: Identify Key Moments

Scan through the thoughts looking for:

1. **Pivots**: Where did reasoning direction change significantly?
2. **Decisions**: Which thoughts resolved uncertainty or chose between options?
3. **Insights**: Where did synthesis or "aha moments" occur?
4. **Revisions**: What corrections were made? (Check \`isRevision\` field)
5. **Branch Points**: Where did exploration diverge? (Check \`branchFromThought\` field)

## Step 3: Assess Significance

For each key moment identified, consider:
- **Impact**: How much did this thought influence the outcome?
- **Novelty**: Was this a new approach or standard reasoning?
- **Transferability**: Could this pattern apply to other problems?

## Step 4: Extract Learnings

Use \`extract_learnings\` with your identified key moments:

\`\`\`json
{
  "sessionId": "<session-id>",
  "keyMoments": [
    {
      "thoughtNumber": 5,
      "type": "decision",
      "significance": 8,
      "summary": "Chose hybrid approach over pure options"
    }
  ],
  "targetTypes": ["pattern", "anti-pattern", "signal"]
}
\`\`\`

## Step 5: Generate Artifacts

The extract_learnings tool will generate:
- **Patterns**: From decisions and insights (for DGM experiments)
- **Anti-patterns**: From revisions (what didn't work)
- **Signals**: Session-level success/failure metrics

## Quality Indicators in Metrics

Use the structural metrics to guide your analysis:

| Metric | Interpretation |
|--------|----------------|
| High \`revisionRate\` | Look for anti-patterns - what needed correction |
| Low \`linearityScore\` | Look for branch exploration patterns |
| \`critiqueRequests\` > 0 | Check critique responses for quality signals |
| \`isComplete\` = true | Session reached natural conclusion |
| \`hasConvergence\` = true | Branching resolved to a decision |

## Key Moment Detection Heuristics

When scanning thoughts, look for these signals:

### Pivot Indicators
- Phrases like "actually", "wait", "on second thought"
- Significant shift in topic or approach
- Abandoning one line of reasoning for another

### Decision Indicators
- Explicit choices: "I'll go with", "choosing", "decided"
- Comparison conclusions: "X is better because"
- Commitment statements

### Insight Indicators
- Synthesis: "This means that", "so the pattern is"
- Connections: "This is related to", "similar to"
- Realizations: "I see now", "the key insight"

## Writing Effective Learnings

When providing key moments to \`extract_learnings\`:

1. **Be specific**: Include the exact thought number
2. **Rate significance**: 1-10 scale helps prioritize
3. **Summarize why**: Brief explanation aids future retrieval
4. **Choose correct type**: decision, pivot, insight, revision, or branch

## Evolution Integration

Extracted learnings feed into the DGM evolution system:

- **Patterns** become experimental entries in \`.claude/rules/evolution/experiments/\`
- **Anti-patterns** document what to avoid
- **Signals** append to \`.claude/rules/evolution/signals.jsonl\`

Over time, successful patterns gain fitness and may be promoted to main rules.

---

*This guide is available via the thoughtbox://session-analysis-guide resource.*
`;

/**
 * Returns the resource template definition for session analysis guide
 * Used by the ListResourceTemplatesRequestSchema handler
 */
export function getSessionAnalysisResourceTemplates() {
  return {
    resourceTemplates: [
      {
        uriTemplate: "thoughtbox://session-analysis-guide",
        name: "session-analysis-guide",
        title: "Session Analysis Process Guide",
        description:
          "Process guide for qualitative analysis of reasoning sessions. Teaches how to identify key moments and extract learnings for the DGM evolution system.",
        mimeType: "text/markdown",
        annotations: {
          audience: ["assistant"],
          priority: 0.8,
        },
      },
    ],
  };
}

/**
 * Resolves a thoughtbox://session-analysis-guide URI to its content
 *
 * @param uri - The resource URI to resolve
 * @returns Resource content with metadata
 */
export function getSessionAnalysisGuideContent(uri: string) {
  if (uri !== "thoughtbox://session-analysis-guide") {
    throw new Error(
      `Invalid session analysis guide URI: ${uri}. Expected: thoughtbox://session-analysis-guide`
    );
  }

  return {
    uri,
    mimeType: "text/markdown",
    text: SESSION_ANALYSIS_GUIDE,
  };
}
