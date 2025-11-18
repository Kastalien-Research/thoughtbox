export const STEELMANNING_CONTENT = `# Steelmanning

Present the strongest possible version of opposing views before making a decision.

## When to Use
- You've already made up your mind (check yourself)
- Team quickly converged on one option
- Stakeholder disagrees and you need to understand why
- Decision is irreversible or high-stakes

## Process

### Step 1: Identify Your Position
State what you currently believe or prefer.
- "I think we should use GraphQL for this API"

### Step 2: Identify Opposing Positions
What are the alternatives? Who holds them?
- "REST advocates would say..."
- "The team that built the current system chose X because..."

### Step 3: Construct the Strongest Case for Each
For each opposing view, argue FOR it as if you believed it:
- Use the best arguments, not the weak ones
- Include evidence that supports it
- Acknowledge legitimate concerns it addresses
- Don't strawman or caricature

### Step 4: Find the Kernel of Truth
What's valid in each opposing view?
- "REST is right that simplicity matters for our junior team"
- "The caching concerns are legitimate for our read-heavy workload"

### Step 5: Synthesize or Decide
Either:
- Integrate insights from opposing views into your approach
- Decide your position stands, but now you understand trade-offs
- Change your mind (this is success, not failure)

## Key Principle
If you can't state the opposing view in a way its proponents would accept, you don't understand it well enough to reject it.

## Why This Works
- Exposes blind spots in your thinking
- Builds genuine understanding (not just counterarguments)
- Identifies legitimate trade-offs you may be ignoring
- Prepares you for real objections

## Steelman vs Strawman

**Strawman (bad):**
"People who want microservices just want to use new technology for their resume"

**Steelman (good):**
"Microservices advocates correctly identify that our monolith makes it hard to deploy independently, scale specific components, or let teams work autonomously. These are real problems we should solve."

## Example Application

**Your position:** "We should rewrite this legacy system"

**Steelman for maintaining legacy:**
"The legacy system, despite its problems, encodes years of business logic that isn't documented anywhere. A rewrite risks losing this institutional knowledge. The bugs are known and worked around; new bugs are unknown. The team's time might be better spent on features that directly help users rather than internal plumbing that users don't see. Companies that attempt ground-up rewrites frequently fail or take 3x longer than estimated. Perhaps incremental improvement serves us better."

**Result:** You might still decide to rewrite, but now you'll:
- Invest in extracting business logic documentation first
- Set up parallel running to catch logic differences
- Plan for 2x your initial time estimate
- Consider strangler pattern as an alternative

## Anti-patterns
- Half-hearted steelmanning that still contains dismissals
- Steelmanning only to refute (defeats the purpose)
- Not letting the exercise change your mind
- Skipping this when you're "obviously right"
`;
