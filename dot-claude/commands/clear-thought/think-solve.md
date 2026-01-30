# Think-Solve

Complete problem-solving pipeline combining sequential thinking, mental models, scientific method, and structured argumentation.

## Usage
```
/think-solve <problem description>
```

## Variables
- `PROBLEM`: $ARGUMENTS (the problem to solve)
- `MAX_ITERATIONS`: 10 (maximum thinking iterations)
- `CONFIDENCE_THRESHOLD`: 0.8 (minimum confidence to proceed)
- `BRANCH_EXPLORATION`: 3 (max alternative approaches to explore)

## Phase 1: Problem Decomposition

### Agent: Sequential Thinker
```mcp
mcp__clear-thought__sequentialthinking({
  "thought": "Breaking down the problem: $PROBLEM",
  "thoughtNumber": 1,
  "totalThoughts": 5,
  "nextThoughtNeeded": true,
  "needsMoreThoughts": true
})
```

Continue sequential thinking until problem is well-understood, allowing for:
- Branching to explore alternative decompositions
- Revision of earlier thoughts based on new insights
- Tracking confidence at each step

## Phase 2: Mental Model Analysis

### Agent: Model Applicator
Apply relevant mental models based on problem characteristics:

```mcp
# First Principles Analysis
mcp__clear-thought__mentalmodel({
  "modelName": "first_principles",
  "problem": "$PROBLEM",
  "steps": ["Identify assumptions", "Break to fundamentals", "Build from basics"],
  "reasoning": "...",
  "conclusion": "..."
})

# Pareto Analysis (if optimization problem)
mcp__clear-thought__mentalmodel({
  "modelName": "pareto_principle",
  "problem": "$PROBLEM",
  "steps": ["Identify all factors", "Measure impact", "Find 20% causing 80%"],
  "reasoning": "...",
  "conclusion": "..."
})
```

## Phase 3: Hypothesis Testing

### Agent: Scientific Investigator
```mcp
mcp__clear-thought__scientificmethod({
  "stage": "hypothesis",
  "inquiryId": "solve-$TIMESTAMP",
  "iteration": 1,
  "nextStageNeeded": true,
  "observation": "From mental model analysis...",
  "question": "How can we solve $PROBLEM?",
  "hypothesis": {
    "statement": "Solution hypothesis from models",
    "variables": [...],
    "assumptions": [...],
    "hypothesisId": "hyp-1",
    "confidence": 0.7,
    "domain": "$PROBLEM domain",
    "iteration": 1,
    "status": "proposed"
  }
})
```

Continue through experiment design, testing, and analysis stages.

## Phase 4: Solution Synthesis

### Agent: Argument Builder
```mcp
mcp__clear-thought__structuredargumentation({
  "claim": "The best solution to $PROBLEM is...",
  "premises": [
    "Evidence from sequential analysis",
    "Insights from mental models",
    "Results from scientific testing"
  ],
  "conclusion": "Synthesized solution with implementation steps",
  "argumentType": "inductive",
  "confidence": 0.85,
  "nextArgumentNeeded": false
})
```

## Phase 5: Metacognitive Review

### Agent: Quality Checker
```mcp
mcp__clear-thought__metacognitivemonitoring({
  "task": "Solving: $PROBLEM",
  "stage": "solution-review",
  "overallConfidence": 0.85,
  "uncertaintyAreas": ["Implementation risks", "Edge cases"],
  "recommendedApproach": "Proceed with solution",
  "monitoringId": "monitor-$TIMESTAMP",
  "iteration": 1,
  "nextAssessmentNeeded": false
})
```

## Memory Storage

### Remember Solution Pattern
```mcp
mcp__mem0__mem0_memory({
  "operation": "add",
  "messages": [{
    "role": "assistant",
    "content": "Problem: $PROBLEM\nSolution: [synthesized solution]\nConfidence: [score]\nKey insights: [list]"
  }],
  "user_id": "clear-thought",
  "metadata": {
    "type": "problem-solution",
    "command": "think-solve",
    "timestamp": "$TIMESTAMP"
  }
})
```

## Output Format

```markdown
# Problem Analysis: $PROBLEM

## Understanding
[Sequential thinking summary]

## Applied Models
[Mental model insights]

## Testing Results
[Scientific method findings]

## Recommended Solution
[Structured argument with steps]

## Confidence: [score]/1.0
## Key Risks: [list]
## Next Steps: [actionable items]
```

## Integration Points

- Chain with `/code-implement` to build the solution
- Use `/think-debug` if solution encounters issues
- Apply `/think-strategy` for implementation planning
- Export to `/document-solution` for documentation

## Example

```
/think-solve How can we optimize the code review process to reduce bottlenecks while maintaining quality?
```

This would:
1. Break down the problem into components (reviewers, code, process, quality metrics)
2. Apply Pareto principle to find key bottlenecks
3. Test hypotheses about process improvements
4. Build argument for recommended changes
5. Monitor confidence and identify risks