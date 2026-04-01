# SPEC-SIL-011: GitHub Actions Workflow

> **Status**: Draft
> **Priority**: MEDIUM
> **Week**: 4 (Autonomous Loop)
> **Phase**: Automation
> **Estimated Effort**: 4-6 hours

## Summary

Create GitHub Actions workflow to run the autonomous improvement loop on schedule, with manual trigger support, PR creation for improvements, and cost/result reporting.

## Problem Statement

Manual loop execution is:
- Inconsistent (human has to remember)
- Not auditable (no run history)
- Hard to track (no PR trail)
- Not scalable (requires human attention)

GitHub Actions provides:
- Scheduled daily runs
- Manual trigger with parameters
- Automatic PR creation
- Run history and logs
- Secrets management

## Scope

### In Scope
- Workflow definition (`.yml`)
- Scheduled trigger (daily)
- Manual trigger with inputs
- Environment setup
- Loop execution
- PR creation on improvements
- Summary reporting

### Out of Scope
- Multi-repo orchestration
- Custom runners
- Cost optimization via spot instances

## Requirements

### R1: Workflow Triggers
```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:
    inputs:
      max_iterations:
        type: number
        default: 5
      budget_tokens:
        type: number
        default: 5000000
```

### R2: Environment Setup
```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### R3: PR Creation
Create PR with:
- Improvement summary
- Changed files
- Benchmark results
- Cost report

### R4: Summary Output
```yaml
outputs:
  improvements_found: boolean
  total_cost: number
  iterations: number
```

## Technical Approach

### Implementation

```yaml
# .github/workflows/improvement-loop.yml

name: Autonomous Improvement Loop

on:
  schedule:
    # Daily at 2 AM UTC
    - cron: '0 2 * * *'

  workflow_dispatch:
    inputs:
      max_iterations:
        description: 'Maximum iterations to run'
        type: number
        default: 5
      budget_tokens:
        description: 'Token budget for this run'
        type: number
        default: 5000000
      dry_run:
        description: 'Dry run (no PR creation)'
        type: boolean
        default: false

env:
  NODE_VERSION: '20'

jobs:
  improvement-loop:
    name: Run Improvement Loop
    runs-on: ubuntu-latest
    timeout-minutes: 120

    outputs:
      improvements_found: ${{ steps.run-loop.outputs.improvements_found }}
      total_cost: ${{ steps.run-loop.outputs.total_cost }}
      iterations: ${{ steps.run-loop.outputs.iterations }}
      branch_name: ${{ steps.run-loop.outputs.branch_name }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for diff

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Setup Docker (for proctored execution)
        uses: docker/setup-buildx-action@v3

      - name: Build sandbox image
        run: |
          docker build -t thoughtbox-sandbox:latest -f docker/sandbox/Dockerfile .

      - name: Run improvement loop
        id: run-loop
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # Run the improvement loop
          npx tsx scripts/run-improvement-loop.ts \
            --max-iterations ${{ inputs.max_iterations || 5 }} \
            --budget-tokens ${{ inputs.budget_tokens || 5000000 }} \
            --output-file results.json

          # Parse results and set outputs
          if [ -f results.json ]; then
            IMPROVEMENTS=$(jq '.improvements' results.json)
            TOTAL_COST=$(jq '.totalCost' results.json)
            ITERATIONS=$(jq '.iterations' results.json)

            echo "improvements_found=$([[ $IMPROVEMENTS -gt 0 ]] && echo 'true' || echo 'false')" >> $GITHUB_OUTPUT
            echo "total_cost=$TOTAL_COST" >> $GITHUB_OUTPUT
            echo "iterations=$ITERATIONS" >> $GITHUB_OUTPUT

            if [[ $IMPROVEMENTS -gt 0 ]]; then
              BRANCH="improvement/$(date +%Y%m%d)-$(echo $GITHUB_SHA | head -c 7)"
              echo "branch_name=$BRANCH" >> $GITHUB_OUTPUT
            fi
          fi

      - name: Create improvement branch
        if: steps.run-loop.outputs.improvements_found == 'true' && !inputs.dry_run
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          BRANCH=${{ steps.run-loop.outputs.branch_name }}
          git checkout -b $BRANCH

          # Stage all changes from improvements
          git add -A

          git commit -m "$(cat <<'EOF'
          feat: Autonomous improvements from loop run

          Iteration count: ${{ steps.run-loop.outputs.iterations }}
          Total cost: ${{ steps.run-loop.outputs.total_cost }} tokens

          Co-Authored-By: Thoughtbox Self-Improvement <noreply@kastalien.research>
          EOF
          )"

          git push origin $BRANCH

      - name: Upload results artifact
        uses: actions/upload-artifact@v4
        with:
          name: improvement-results-${{ github.run_id }}
          path: |
            results.json
            improvement-logs/

  create-pr:
    name: Create Pull Request
    runs-on: ubuntu-latest
    needs: improvement-loop
    if: needs.improvement-loop.outputs.improvements_found == 'true' && !inputs.dry_run

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Download results
        uses: actions/download-artifact@v4
        with:
          name: improvement-results-${{ github.run_id }}

      - name: Generate PR body
        id: pr-body
        run: |
          # Generate summary from results
          cat > pr-body.md << 'EOF'
          ## Autonomous Improvement Summary

          This PR was generated by the self-improvement loop.

          ### Metrics

          | Metric | Value |
          |--------|-------|
          | Iterations | ${{ needs.improvement-loop.outputs.iterations }} |
          | Cost (tokens) | ${{ needs.improvement-loop.outputs.total_cost }} |
          | Run ID | ${{ github.run_id }} |

          ### Changes

          $(jq -r '.changes | .[] | "- " + .file + ": " + .description' results.json 2>/dev/null || echo "See diff for details")

          ### Benchmark Results

          $(jq -r '.benchmarkResults | to_entries | .[] | "- " + .key + ": " + (.value | tostring)' results.json 2>/dev/null || echo "See artifacts for details")

          ### Review Checklist

          - [ ] Changes make sense and improve capability
          - [ ] No obvious regressions introduced
          - [ ] Cost/benefit ratio is favorable
          - [ ] Tests pass

          ---
          *Generated by [Self-Improvement Loop](/.github/workflows/improvement-loop.yml)*
          EOF

      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          branch: ${{ needs.improvement-loop.outputs.branch_name }}
          base: main
          title: "feat: Autonomous improvements from ${{ github.run_id }}"
          body-path: pr-body.md
          labels: |
            automated
            improvement-loop
          reviewers: |
            # Add default reviewers

  report:
    name: Post Summary
    runs-on: ubuntu-latest
    needs: improvement-loop
    if: always()

    steps:
      - name: Post job summary
        run: |
          cat >> $GITHUB_STEP_SUMMARY << 'EOF'
          ## Improvement Loop Results

          | Metric | Value |
          |--------|-------|
          | Status | ${{ needs.improvement-loop.result }} |
          | Improvements Found | ${{ needs.improvement-loop.outputs.improvements_found || 'N/A' }} |
          | Iterations | ${{ needs.improvement-loop.outputs.iterations || 'N/A' }} |
          | Total Cost (tokens) | ${{ needs.improvement-loop.outputs.total_cost || 'N/A' }} |

          ${{ needs.improvement-loop.outputs.improvements_found == 'true' && format('🎉 Improvements found! PR: {0}', needs.improvement-loop.outputs.branch_name) || '📊 No improvements this run' }}
          EOF
```

### Runner Script

```typescript
// scripts/run-improvement-loop.ts

import { createImprovementLoop } from '../src/improvement/loop';
import { writeFileSync } from 'fs';

interface CLIOptions {
  maxIterations: number;
  budgetTokens: number;
  outputFile: string;
}

async function main() {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    maxIterations: 5,
    budgetTokens: 5000000,
    outputFile: 'results.json'
  };

  // Parse CLI args
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--max-iterations' && args[i + 1]) {
      options.maxIterations = parseInt(args[i + 1], 10);
    }
    if (args[i] === '--budget-tokens' && args[i + 1]) {
      options.budgetTokens = parseInt(args[i + 1], 10);
    }
    if (args[i] === '--output-file' && args[i + 1]) {
      options.outputFile = args[i + 1];
    }
  }

  console.log('Starting improvement loop with options:', options);

  const loop = createImprovementLoop({
    maxIterations: options.maxIterations,
    budgetTokens: options.budgetTokens
  });

  const results = await loop.run();
  const stats = loop.getStats();

  const output = {
    improvements: stats.improvements,
    iterations: stats.iterations,
    totalCost: stats.totalCost,
    improvementRate: stats.improvementRate,
    history: results,
    timestamp: new Date().toISOString()
  };

  writeFileSync(options.outputFile, JSON.stringify(output, null, 2));
  console.log(`Results written to ${options.outputFile}`);

  // Exit with success if any improvements found
  process.exit(stats.improvements > 0 ? 0 : 1);
}

main().catch(err => {
  console.error('Improvement loop failed:', err);
  process.exit(1);
});
```

## Files

### New Files
| File | Purpose |
|------|---------|
| `.github/workflows/improvement-loop.yml` | GitHub Actions workflow |
| `scripts/run-improvement-loop.ts` | CLI runner script |
| `docker/sandbox/Dockerfile` | Sandbox container definition |

## Acceptance Criteria

- [ ] Scheduled trigger runs daily at 2 AM
- [ ] Manual trigger works with custom inputs
- [ ] Environment properly configured
- [ ] Loop executes successfully
- [ ] PR created when improvements found
- [ ] Summary posted to job output
- [ ] Artifacts uploaded
- [ ] Dry run mode works

## Test Cases

```yaml
# Test workflow locally with act
act workflow_dispatch \
  -e .github/test-events/improvement-dispatch.json \
  --secret ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
```

## Gates

### Entry Gate
- SPEC-SIL-010 (Main Loop) complete
- GitHub secrets configured
- Docker available in workflow

### Exit Gate
- Successful scheduled run
- PR creation verified
- Cost reporting accurate

## Dependencies

- SPEC-SIL-010 (Main Loop Orchestrator)
- GitHub Actions runners
- Docker for proctored execution

## Blocked By

- SPEC-SIL-010

## Blocks

- None (this is a terminal spec)

---

**Created**: 2026-01-19
**Source**: PLAN Week 4, Section 4.2
