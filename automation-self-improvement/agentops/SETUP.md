# AgentOps Day-0 Setup Guide

Complete guide for setting up the AgentOps autonomous development workflow.

## Overview

AgentOps generates daily development digests with 2-3 proposals, opens GitHub issues with machine-readable payloads, waits for human approval via labels, executes approved proposals, and posts evidence comments with full traceability.

**Two Operating Modes:**

1. **SMOKE mode** (`smoke:proposal-N` label): Validates workflow without touching code
2. **REAL mode** (`approved:proposal-N` label): Actually implements the proposal

## Prerequisites

- Node.js >= 20.0.0
- npm or pnpm
- GitHub repository with Actions enabled
- GitHub Personal Access Token (PAT) with `repo` and `workflow` scopes

## Installation

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `@octokit/rest` - GitHub API client
- `tsx` - TypeScript execution (already installed)
- Other existing dependencies

### 2. Configure GitHub Secrets

Go to: **Repository Settings → Secrets and variables → Actions**

#### Required Secrets

```bash
# GitHub token (auto-provided by Actions, but can override)
GITHUB_TOKEN

# Optional: LangSmith tracing
LANGSMITH_API_KEY       # Your LangSmith API key
LANGSMITH_ORG           # Your LangSmith organization slug
```

#### Optional Secrets (Future)

```bash
ANTHROPIC_API_KEY       # For real proposal generation
OPENAI_API_KEY          # Alternative LLM provider
```

### 3. Create GitHub Labels

```bash
# Core labels
gh label create agentops --color 0e8a16 --description "AgentOps automation"
gh label create dev-brief --color 1d76db --description "Daily development brief"

# SMOKE mode labels (workflow validation only)
gh label create smoke:proposal-1 --color fef2c0 --description "SMOKE: Test proposal 1"
gh label create smoke:proposal-2 --color fef2c0 --description "SMOKE: Test proposal 2"
gh label create smoke:proposal-3 --color fef2c0 --description "SMOKE: Test proposal 3"

# REAL mode labels (actual implementation)
gh label create approved:proposal-1 --color 2cbe4e --description "APPROVED: Implement proposal 1"
gh label create approved:proposal-2 --color 2cbe4e --description "APPROVED: Implement proposal 2"
gh label create approved:proposal-3 --color 2cbe4e --description "APPROVED: Implement proposal 3"

# Control labels
gh label create hold --color fbca04 --description "Hold implementation"
gh label create rejected --color d93f0b --description "Reject proposal"
```

### 4. Verify Workflow Permissions

Both workflows require these permissions (already configured in YAML):

```yaml
permissions:
  contents: write        # Create branches, commit files
  issues: write          # Create issues, post comments, manage labels
  actions: write         # Upload artifacts
  pull-requests: write   # Open draft PRs
```

## Usage

### Local Testing (Recommended First)

#### 1. Test Daily Dev Brief

```bash
# Dry run (no GitHub issue created)
npm run agentops:daily -- --dry-run

# Check output
ls -la agentops/runs/run_*/
cat agentops/runs/run_*/run_summary.json
```

#### 2. Test Implementation (SMOKE mode)

```bash
# Create a test issue first (manually or via CLI)
gh issue create --title "Test Issue" --body "Test" --label dev-brief

# Run implementation in SMOKE mode
npm run agentops:implement -- \
  --proposal-id proposal-1 \
  --issue-number <issue-number> \
  --mode SMOKE \
  --dry-run

# Check output
ls -la agentops/runs/impl_*/
cat agentops/runs/impl_*/implementation_result.json
```

#### 3. Test Implementation (REAL mode)

```bash
# Run implementation in REAL mode
npm run agentops:implement -- \
  --proposal-id proposal-1 \
  --issue-number <issue-number> \
  --mode REAL \
  --dry-run

# Verify branch was created and changes committed
git branch -a | grep agent/
git log --oneline -5
```

### GitHub Actions Usage

#### 1. Trigger Daily Workflow Manually

```bash
# Via CLI
gh workflow run agentops_daily_thoughtbox_dev.yml

# Via web interface
# Go to Actions → AgentOps - Daily Thoughtbox Dev Brief → Run workflow
```

#### 2. Wait for Issue Creation

The workflow runs at **06:30 AM America/Chicago** daily. Check:

```bash
gh issue list --label dev-brief
```

#### 3. Apply Approval Label

**For SMOKE test** (validates workflow without code changes):

```bash
gh issue edit <issue-number> --add-label smoke:proposal-1
```

**For REAL implementation**:

```bash
gh issue edit <issue-number> --add-label approved:proposal-1
```

#### 4. Monitor Implementation

```bash
# Check workflow runs
gh run list --workflow agentops_on_approval_label.yml

# View logs
gh run view <run-id> --log

# Check draft PRs (REAL mode only)
gh pr list --draft
```

## Verification Checklist

### Daily Workflow ✅

- [ ] Runs at 06:30 AM CT (or manual trigger works)
- [ ] Issue created with 2-3 proposals
- [ ] Issue body includes `AGENTOPS_META_BEGIN` block
- [ ] Proposals JSON is valid and extractable
- [ ] Artifacts uploaded to Actions
- [ ] LangSmith trace created (if API key configured)

### SMOKE Mode ✅

- [ ] Triggered by `smoke:proposal-N` label
- [ ] No branch created
- [ ] No PR opened
- [ ] Evidence comment posted with "Mode: SMOKE"
- [ ] Recommendation: "DO NOT MERGE"
- [ ] Artifacts uploaded (marked SMOKE)

### REAL Mode ✅

- [ ] Triggered by `approved:proposal-N` label
- [ ] Branch created: `agent/proposal-{id}/{run_id}`
- [ ] Changes touch `src/**` or `agentops/evals/**`
- [ ] Draft PR opened (if tests pass)
- [ ] Evidence comment posted with "Mode: REAL"
- [ ] Recommendation: "MERGE" or "NEEDS DECISION"
- [ ] Artifacts uploaded with real diff

## Troubleshooting

### Issue: "GITHUB_TOKEN not found"

**Solution**: Run locally with token:

```bash
export GITHUB_TOKEN=your_token_here
npm run agentops:daily -- --dry-run
```

### Issue: "Template contains unreplaced placeholders"

**Solution**: Check template rendering in `daily-dev-brief.ts` - ensure all placeholders have values.

### Issue: "No AGENTOPS_META_BEGIN block found"

**Solution**: Verify issue template includes the meta block. Check `agentops/templates/daily_thoughtbox_dev_brief_issue.md`.

### Issue: Workflow fails with permission error

**Solution**: Verify workflow permissions in `.github/workflows/*.yml` and repository settings.

### Issue: LangSmith traces not created

**Solution**: This is optional. Add `LANGSMITH_API_KEY` secret if you want tracing.

### Issue: Branch creation fails

**Solution**: Ensure `contents: write` permission is set and git user is configured:

```yaml
- name: Configure git
  run: |
    git config --global user.name "github-actions[bot]"
    git config --global user.email "github-actions[bot]@users.noreply.github.com"
```

## File Structure

```
agentops/
├── runner/
│   ├── cli.ts                    # CLI entry point
│   ├── daily-dev-brief.ts        # Daily digest command
│   ├── implement.ts              # Implementation command
│   ├── types.ts                  # Shared interfaces
│   └── lib/
│       ├── github.ts             # GitHub API wrapper
│       ├── template.ts           # Template rendering
│       ├── trace.ts              # LangSmith integration
│       └── state.ts              # Bootstrap state
├── tests/
│   ├── template.test.ts          # Template tests
│   └── extract.test.ts           # JSON extraction tests
├── fixtures/
│   └── proposals.example.json    # Day-0 proposals
├── templates/
│   ├── daily_thoughtbox_dev_brief_issue.md
│   └── implementation_evidence_comment.md
└── SETUP.md                      # This file

.github/workflows/
├── agentops_daily_thoughtbox_dev.yml      # Daily workflow
└── agentops_on_approval_label.yml         # Implementation workflow
```

## Day-0 Limitations

1. **Proposal generation**: Uses fixtures (not real LLM analysis)
2. **Implementation**: Creates marker file only (not real code changes)
3. **Evaluation**: Stubbed (not running benchmarks)
4. **Digest**: Hardcoded bullets (not scanning real sources)

## Next Steps (Post-Day-0)

### Week 2: Real Proposal Generation
- Use Claude Agent SDK to analyze git log, issues, PRs
- Extract signals from test failures and performance metrics
- Prioritize by impact + effort

### Week 3-4: Real Implementation
- Use Claude Agent SDK for actual code changes
- Run test suite and iterate on failures
- Generate real diffs and implementation reports

### Week 5: Evaluation Integration
- Run existing benchmark harness
- Compare against baseline
- Block merges on regressions

### Week 6+: Advanced Orchestration
- Multiple proposal approval (batch implementation)
- Proposal dependencies
- Progressive rollout with feature flags
- Automatic rollback on test failures

## Support

For issues or questions:
1. Check this SETUP.md
2. Review workflow logs: `gh run view <run-id> --log`
3. Check artifacts: Go to Actions → workflow run → Artifacts
4. Open issue: `gh issue create`

## Success Criteria

Day-0 implementation is successful when:

1. ✅ Daily workflow runs without errors
2. ✅ Issue created with correct format
3. ✅ SMOKE mode validates without code changes
4. ✅ REAL mode creates branch and commits
5. ✅ Evidence comments posted with all sections
6. ✅ Artifacts complete and downloadable
7. ✅ All unit tests pass

Run tests:

```bash
npm run test:agentops
```

Expected output:

```
✅ All template tests passed
✅ All extraction tests passed
```
