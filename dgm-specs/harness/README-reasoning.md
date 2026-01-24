# Reasoning Quality Evaluation

A framework for evaluating whether Thoughtbox improves agent reasoning quality through controlled A/B comparison.

## Overview

This system tests reasoning improvements by running the same task twice:
- **Control**: Agent WITHOUT Thoughtbox (baseline reasoning)
- **Treatment**: Agent WITH Thoughtbox (enhanced reasoning)

By keeping everything else constant (same model, prompt, task, token budget), we isolate Thoughtbox's contribution to reasoning quality.

## Quick Start

```bash
# List available reasoning tasks
npm run benchmark:reasoning-list

# Establish baseline
npm run benchmark:reasoning-baseline

# Run comparison
npm run benchmark:reasoning

# Generate detailed report
npm run benchmark:reasoning-report
```

## Metrics

The evaluation uses a **multi-layered scoring system**:

### 1. Correctness (70% weight)
- **What**: Did the agent get the right answer?
- **How**: Exact match for single-answer tasks, rubric scoring for open-ended tasks
- **Range**: 0-100

### 2. LLM-as-Judge Quality (20% weight)
- **What**: How good was the reasoning process?
- **Dimensions**:
  - Thoroughness: How complete is the reasoning?
  - Coherence: How well-structured and logical?
  - Insight: How deep is the analysis?
  - Specificity: How concrete vs generic?
- **How**: Claude Haiku evaluates each dimension (1-10), normalized to 0-100
- **Cost**: ~$0.001 per judgment (2 per task)

### 3. Process Transparency (10% weight)
- **What**: How structured and visible was the reasoning?
- **For Control**: Message count, structure (bullets, numbering), detail level
- **For Treatment**: Same + Thoughtbox usage (thoughts recorded, mental models, branches)
- **Range**: 0-100

### Overall Score
```
overall = 0.70 × correctness + 0.20 × quality + 0.10 × process
```

## Task Categories

The prototype includes 5 tasks across 4 categories:

### Complex Reasoning
Tasks requiring multi-step logic, puzzles, or proofs
- **Example**: Five People Seating Arrangement (logic puzzle)
- **Example**: Mathematical Proof Verification

### Debugging
Root cause analysis and troubleshooting
- **Example**: API Timeout Investigation

### Planning
System design and architecture decisions
- **Example**: Rate-Limited API Client Architecture

### Decision Making
Trade-off analysis and option evaluation
- **Example**: Database Selection for Analytics Dashboard

## Usage Examples

### Establishing a Baseline

```bash
# Run all prototype tasks and establish baseline
npm run benchmark:reasoning-baseline
```

Expected output:
```
============================================================
REASONING QUALITY EVALUATION
Run ID: reasoning-run-2025-01-24T12-00-00-abc123
Tasks: 5
============================================================

Task: Five People Seating Arrangement (logic-puzzle-01)
...
Results:
  Control:   75.3
  Treatment: 82.1
  Delta:     +6.8
  ✓ Thoughtbox improved

...

Overall Results:
  Total Tasks: 5
  Thoughtbox Improved: 3 (60.0%)
  Thoughtbox Regressed: 0
  No Significant Change: 2

Average Gains (Treatment - Control):
  Correctness: +5.20
  Quality:     +8.40
  Process:     +12.30
  Overall:     +6.50

✓ Reasoning baseline established: reasoning-run-2025-01-24T12-00-00-abc123
```

### Running Comparisons

```bash
# Compare to baseline
npm run benchmark:reasoning
```

If baseline exists, compares current run to baseline:
- **PASS**: No task shows >10 point decrease in Thoughtbox advantage
- **FAIL**: At least one task regressed significantly

### Detailed Reports

```bash
# Generate comprehensive report
npm run benchmark:reasoning-report
```

Includes:
- Full task-by-task breakdown
- Delta analysis (treatment - control)
- Baseline comparison
- Regression/improvement detection

## Cost Estimates

### Prototype (5 tasks)
- Per task: ~$0.177
  - Agent runs (2×): $0.175 (Sonnet 4.5)
  - Judge calls (2×): $0.002 (Haiku)
- **Total**: ~$0.89 per run

### Full Suite (20 tasks)
- **Total**: ~$3.54 per run
- **Monthly** (daily runs): ~$106/month

## Files & Directory Structure

```
dgm-specs/
├── harness/
│   ├── reasoning-types.ts           # Type definitions
│   ├── reasoning-runner.ts          # Core orchestration (dual-run comparison)
│   ├── reasoning-tasks.ts           # Task loader and validator
│   ├── reasoning-metrics.ts         # Metrics calculation
│   ├── reasoning-judge.ts           # LLM-as-judge evaluation
│   ├── reasoning-baseline.ts        # Baseline tracking
│   ├── cli.ts                       # Extended with reasoning commands
│   └── README-reasoning.md          # This file
├── tasks/
│   └── reasoning/
│       └── prototype/
│           ├── logic-puzzle-01.json
│           ├── root-cause-01.json
│           ├── system-design-01.json
│           ├── trade-off-01.json
│           └── proof-01.json
├── validation/
│   └── reasoning-baseline.json      # Current baseline (created at runtime)
└── history/
    └── reasoning-runs/
        └── run-{timestamp}.json     # Historical run data
```

## Task Definition Format

Tasks are defined in JSON:

```json
{
  "id": "task-id",
  "category": "complex-reasoning",
  "name": "Human-Readable Name",
  "prompt": "The task prompt...",
  "correctAnswer": "Expected answer",  // OR
  "scoringRubric": {                   // Use rubric for open-ended
    "dimension-1": 2,
    "dimension-2": 3
  },
  "expectedThoughtboxBenefit": "Why Thoughtbox should help",
  "estimatedTokens": 35000
}
```

## Interpretation Guide

### Understanding Deltas

- **Positive delta**: Treatment (Thoughtbox) scored higher than control
- **Negative delta**: Treatment scored lower (potential regression)
- **Near-zero delta**: No significant difference

### Win Rate
```
Win Rate = (Improvement Count / Total Tasks) × 100%
```

- **>60%**: Strong evidence Thoughtbox helps
- **40-60%**: Mixed results, investigate task-specific patterns
- **<40%**: Consider refining tasks or Thoughtbox prompts

### Regression Detection

A task is flagged as regressed if:
```
(current_advantage - baseline_advantage) < -10 points
```

This catches cases where Thoughtbox's benefit decreased significantly.

## Baseline Philosophy

### When to Establish Baseline

1. **Initial setup**: First time running reasoning evaluation
2. **After Thoughtbox changes**: Modified prompts, mental models, or logic
3. **After framework changes**: Updated metrics, scoring, or task definitions
4. **Periodic refresh**: Monthly or quarterly to account for drift

### When NOT to Update Baseline

- Transient failures (network issues, API errors)
- Single task regressions (investigate first)
- Minor fluctuations (<5 points)

### Baseline Validation

Before establishing baseline:
1. Run 2-3 times to check consistency
2. Verify all tasks completed successfully
3. Spot-check that scores make sense
4. Review 2-3 full traces manually

## Extending the Framework

### Adding New Tasks

1. Create JSON file in `dgm-specs/tasks/reasoning/prototype/`
2. Follow the task definition format
3. Validate with `npm run benchmark:reasoning-list`
4. Test with single task run
5. Update baseline after adding tasks

### Adding Task Categories

1. Update `ReasoningCategory` type in `reasoning-types.ts`
2. Add validation in `reasoning-tasks.ts`
3. Document expected Thoughtbox benefits

### Adjusting Metric Weights

Current weights in `reasoning-metrics.ts`:
```typescript
const weights = {
  correctness: 0.70,
  quality: 0.20,
  process: 0.10,
};
```

To change:
1. Modify weights (must sum to 1.0)
2. Document rationale
3. Re-establish baseline
4. Update this README

## Troubleshooting

### "No baseline found"

**Solution**: Run `npm run benchmark:reasoning-baseline` first

### "Agent error: max_turns_exceeded"

**Cause**: Task too complex for maxTurns limit (25)

**Solution**: Simplify task or increase maxTurns in `reasoning-runner.ts`

### Thoughtbox not being used

**Expected**: Agent may choose not to use Thoughtbox (valid data)

**To encourage usage**: Add explicit instruction in system prompt or task prompt

### Inconsistent results

**Causes**:
- Temperature = 1.0 (intentional variance)
- Task ambiguity
- Judge model variance

**Solutions**:
- Run multiple times (variance testing)
- Clarify task requirements
- Check judge consistency on same inputs

### High costs

**Mitigations**:
- Start with prototype (5 tasks)
- Lower estimatedTokens if tasks are simpler
- Consider running subset of tasks
- Use variance testing sparingly

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Reasoning Evaluation
  run: npm run benchmark:reasoning
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

- name: Check Verdict
  run: |
    if [ $? -ne 0 ]; then
      echo "❌ Reasoning evaluation regressed"
      exit 1
    fi
```

### JSON Output

For programmatic access:

```bash
npm run benchmark:reasoning -- --json > results.json
```

Exits with:
- **0**: PASS (no regressions)
- **1**: FAIL (regressions detected)

## Design Decisions

### Why dual-run comparison?

Clean causal attribution - only variable is Thoughtbox availability. Self-normalizing for task difficulty.

### Why multi-layered metrics?

Correctness alone misses poor reasoning that gets lucky. Quality + process capture reasoning depth.

### Why LLM-as-judge with Haiku?

Human evaluation doesn't scale. Haiku is 10× cheaper than Sonnet (~$0.001 vs ~$0.015 per judgment), good enough for dimensional scoring.

### Why prototype first?

Validates approach before investing in 20 tasks. Faster feedback loop, lower cost, easier to debug.

### Why these metric weights (70/20/10)?

- Correctness is primary success measure
- Quality matters for reasoning depth
- Process transparency is valuable but secondary
- Weights can be adjusted based on team priorities

## Next Steps

After prototype validation:

1. **Expand task set**: Add 15 more tasks (4-5 per category)
2. **Variance testing**: Run each task 3× to measure statistical significance
3. **Human calibration**: Spot-check LLM judge alignment with human evaluators
4. **CI integration**: Add to GitHub Actions for regression detection
5. **Publish findings**: Share insights about Thoughtbox's impact on reasoning

## References

- Main Plan: See commit message for full implementation plan
- Existing Harness: `dgm-specs/harness/` (baseline tracking patterns)
- Claude Agent SDK: Used for dual-run orchestration
- Thoughtbox MCP: `http://localhost:1731/mcp`
