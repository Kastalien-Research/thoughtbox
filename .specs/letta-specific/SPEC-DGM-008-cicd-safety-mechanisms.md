# SPEC-DGM-008: CI/CD Safety Mechanisms

**Status**: Draft  
**Priority**: P1 - Critical for Safe Self-Modification  
**Complexity**: Medium  
**Dependencies**: SPEC-DGM-006 (DGM Loop), SPEC-DGM-007 (Test Generator)  
**Target**: GitHub Actions workflows (`.github/workflows/`)

## Overview

Implement comprehensive CI/CD workflows that validate all DGM modifications through automated testing, regression detection, and safety checks. Safety mechanisms leverage existing version control and CI/CD tools to prevent harmful self-modifications.

## Motivation

**Safety Principle**: "A lot of this, if not all of it, is going to live in the version control and in the CI/CD layer."

**Git + CI/CD Advantages**:
- Atomic changes (commits are all-or-nothing)
- Full audit trail (every modification tracked)
- Rollback capability (git revert)
- Automated validation (GitHub Actions)
- Branch protection (require checks to pass)
- Human oversight (PR reviews if desired)

**DGM Safety Requirements** (from paper Section 5):
- Sandboxed execution
- Strict timeouts
- Confined scope (project only)
- Traceable modifications
- Monitoring and alerting

## Requirements

### Functional Requirements

#### FR-001: DGM Validation Workflow
**Priority**: MUST  
**Description**: GitHub Actions workflow triggered on DGM branches

**Trigger**:
```yaml
# .github/workflows/dgm-validation.yml
name: DGM Improvement Validation

on:
  push:
    branches:
      - 'dgm/**'              # All DGM improvement branches
  pull_request:
    branches:
      - 'main'
    paths:
      - 'dgm/**'
```

**Jobs**:
1. **Identify target** (letta-code vs thoughtbox vs both)
2. **Run tests** for modified codebase
3. **Regression detection** (compare against baseline)
4. **Build validation** (ensure it compiles)
5. **Docker validation** (if Thoughtbox modified)
6. **Security scan** (no hardcoded secrets, no system calls)
7. **Performance check** (no catastrophic degradation)
8. **Approve/block** merge

**Acceptance Criteria**:
- [ ] Workflow triggers on all DGM branches
- [ ] Runs in parallel with local validation (belt-and-suspenders)
- [ ] Blocks merge if any check fails
- [ ] Clear failure messages
- [ ] Execution time <5 minutes

---

#### FR-002: Regression Detection
**Priority**: MUST  
**Description**: Automated detection of regressions vs baseline

**Strategy**:
```yaml
jobs:
  regression-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Need history for baseline
      
      # Run tests on baseline (main branch)
      - name: Checkout baseline
        run: git checkout main
      
      - name: Run baseline tests (Letta Code)
        if: contains(github.ref, 'letta-code')
        run: |
          cd letta-code-thoughtbox
          bun install
          bun test --json > baseline-tests.json
      
      - name: Run baseline tests (Thoughtbox)
        if: contains(github.ref, 'thoughtbox')
        run: |
          cd thoughtbox
          npm install
          npm test -- --json > baseline-tests.json
      
      # Run tests on improvement branch
      - name: Checkout improvement branch
        run: git checkout ${{ github.ref }}
      
      - name: Run improvement tests (Letta Code)
        if: contains(github.ref, 'letta-code')
        run: |
          cd letta-code-thoughtbox
          bun install
          bun test --json > improvement-tests.json
      
      - name: Run improvement tests (Thoughtbox)
        if: contains(github.ref, 'thoughtbox')
        run: |
          cd thoughtbox
          npm install
          npm test -- --json > improvement-tests.json
      
      # Compare results
      - name: Compare test results
        run: |
          python3 scripts/compare-test-results.py \
            baseline-tests.json \
            improvement-tests.json \
            --fail-on-regression
      
      # Compare performance
      - name: Performance regression check
        run: |
          python3 scripts/compare-performance.py \
            --baseline main \
            --improvement ${{ github.ref }} \
            --threshold 0.95  # Allow 5% degradation
```

**Acceptance Criteria**:
- [ ] Detects new test failures
- [ ] Detects removed passing tests
- [ ] Detects performance regressions >5%
- [ ] Reports specific regressions
- [ ] Fails workflow if regressions found
- [ ] Generates comparison report

---

#### FR-003: Security Scanning
**Priority**: MUST  
**Description**: Scan modifications for security issues

**Checks**:
```yaml
jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Check for secrets
      - name: Scan for hardcoded secrets
        run: |
          # Fail if API keys, passwords, tokens found
          if git diff main...${{ github.ref }} | grep -E 'sk-|pk_|ghp_|AKIA'; then
            echo "❌ Hardcoded secret detected!"
            exit 1
          fi
      
      # Check for dangerous operations
      - name: Scan for dangerous code
        run: |
          # Check for system calls, eval(), exec()
          python3 scripts/security-scan.py \
            --diff main...${{ github.ref }} \
            --rules scripts/security-rules.json
      
      # Check file permissions
      - name: Verify scope restriction
        run: |
          # Ensure modifications only within project
          git diff main...${{ github.ref }} --name-only | while read file; do
            if [[ "$file" == ../* ]]; then
              echo "❌ Modification outside project scope: $file"
              exit 1
            fi
          done
      
      # Static analysis
      - name: Run static analysis
        run: |
          cd letta-code-thoughtbox && bun run lint
          cd thoughtbox && npm run lint
```

**Acceptance Criteria**:
- [ ] No hardcoded secrets in diff
- [ ] No unsafe operations (eval, child_process without sandbox)
- [ ] All modifications within project directory
- [ ] Static analysis passes (no new errors)
- [ ] Dependency changes audited

---

#### FR-004: Docker Validation
**Priority**: MUST (for Thoughtbox modifications)  
**Description**: Validate Docker build and runtime

**Workflow**:
```yaml
jobs:
  docker-validation:
    runs-on: ubuntu-latest
    if: contains(github.ref, 'thoughtbox')
    steps:
      - uses: actions/checkout@v4
      
      # Build image
      - name: Build Docker image
        run: |
          cd thoughtbox
          docker build -t thoughtbox:test .
      
      # Start container
      - name: Start Thoughtbox container
        run: |
          docker run -d --name thoughtbox-test \
            -p 3000:3000 \
            -e THOUGHTBOX_TRANSPORT=http \
            -e OBSERVATORY_ENABLED=false \
            thoughtbox:test
      
      # Health check
      - name: Wait for healthy
        run: |
          timeout 30s bash -c 'until curl -f http://localhost:3000/health; do sleep 1; done'
      
      # Basic MCP protocol test
      - name: Test MCP protocol
        run: |
          # Test initialize
          curl -X POST http://localhost:3000/mcp \
            -H "Content-Type: application/json" \
            -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
            | jq '.result.capabilities'
      
      # Cleanup
      - name: Stop container
        if: always()
        run: docker stop thoughtbox-test && docker rm thoughtbox-test
```

**Acceptance Criteria**:
- [ ] Docker build succeeds
- [ ] Container starts within 30s
- [ ] Health endpoint responds
- [ ] MCP protocol initialization works
- [ ] No crashes in logs

---

#### FR-005: Approval Gates
**Priority**: SHOULD  
**Description**: Configurable approval requirements for merging to main

**Gate Types**:

**Automatic Approval** (if all checks pass):
```yaml
jobs:
  auto-merge:
    needs: [regression-check, security-scan, docker-validation]
    if: |
      github.event_name == 'push' &&
      success() &&
      github.ref == 'refs/heads/dgm/best-variant'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Merge to main
        run: |
          git config user.name "DGM Bot"
          git config user.email "dgm@letta.local"
          git checkout main
          git merge --no-ff ${{ github.ref }}
          git push origin main
```

**Human Approval** (for critical changes):
```yaml
jobs:
  request-review:
    needs: [regression-check, security-scan]
    if: |
      contains(github.ref, 'thoughtbox') ||
      contains(github.event.head_commit.message, 'BREAKING')
    runs-on: ubuntu-latest
    steps:
      - name: Create PR for review
        run: |
          gh pr create \
            --base main \
            --head ${{ github.ref }} \
            --title "DGM: $(git log -1 --format=%s)" \
            --body "**Automated DGM improvement**\n\n..."
```

**Acceptance Criteria**:
- [ ] Low-risk changes auto-merge
- [ ] High-risk changes require human review
- [ ] Risk classification automated
- [ ] Clear criteria for each gate
- [ ] User can override auto-merge

---

#### FR-006: Rollback Mechanism
**Priority**: MUST  
**Description**: Automatic rollback on post-merge issues

**Strategy**:
```yaml
# Separate workflow: .github/workflows/dgm-monitor.yml
name: DGM Post-Merge Monitoring

on:
  push:
    branches:
      - main
    paths:
      - 'letta-code-thoughtbox/**'
      - 'thoughtbox/**'

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Run extended test suite
      - name: Run full test suite
        id: full-tests
        run: |
          # More comprehensive than PR checks
          cd letta-code-thoughtbox && bun test --coverage
          cd thoughtbox && npm test -- --coverage
      
      # If tests fail, auto-revert
      - name: Rollback on failure
        if: failure()
        run: |
          echo "❌ Post-merge tests failed. Reverting..."
          git revert HEAD --no-edit
          git push origin main
          
          # Notify
          gh issue create \
            --title "🚨 DGM auto-rollback triggered" \
            --body "Commit ${{ github.sha }} failed post-merge validation"
```

**Acceptance Criteria**:
- [ ] Monitors main branch after merges
- [ ] Runs extended validation
- [ ] Auto-reverts on failures
- [ ] Creates issue for investigation
- [ ] Preserves failed commit (for debugging)

---

### Non-Functional Requirements

#### NFR-001: Performance
- CI/CD workflow: <10 minutes per run
- Parallel job execution where possible
- Cached dependencies (don't reinstall each time)

#### NFR-002: Reliability
- Flaky test detection (retry 3x before failing)
- Timeouts prevent hung workflows
- Partial failures reported clearly

#### NFR-003: Observability
- Real-time status in GitHub UI
- Slack/Discord notifications (optional)
- Detailed logs for debugging
- Metrics: pass rate, avg duration, failure reasons

---

## Safety Guarantees

### Multi-Layer Validation

```
Layer 1: Local (in DGM loop)
  ├── Test generation
  ├── Test execution
  ├── Build validation
  └── Metric evaluation

Layer 2: CI/CD (in GitHub Actions)
  ├── Regression detection
  ├── Security scanning
  ├── Docker validation
  └── Performance checks

Layer 3: Post-Merge (monitoring)
  ├── Extended test suite
  ├── Performance monitoring
  └── Auto-rollback

Layer 4: Human (optional)
  └── PR review for critical changes
```

**Acceptance Criteria**:
- [ ] All layers active
- [ ] Any layer can block acceptance
- [ ] Failures at any layer are recoverable
- [ ] Audit trail complete

---

## Configuration

```json
// .github/dgm-ci-config.json
{
  "validation": {
    "regression": {
      "enabled": true,
      "threshold": 0.95,        // Allow 5% degradation
      "compareAgainst": "main"
    },
    "security": {
      "enabled": true,
      "secretScan": true,
      "dangerousOpsCheck": true,
      "scopeRestriction": true
    },
    "docker": {
      "enabled": true,
      "healthCheckTimeout": 30,
      "protocolTest": true
    }
  },
  "approval": {
    "autoMerge": {
      "enabled": true,
      "onlyIfBestVariant": true,
      "requireAllChecks": true
    },
    "humanReview": {
      "required": false,
      "requiredFor": ["BREAKING", "security"],
      "reviewers": ["@b.c.nims"]
    }
  },
  "monitoring": {
    "postMerge": {
      "enabled": true,
      "extendedTests": true,
      "autoRollback": true
    },
    "notifications": {
      "slack": {
        "enabled": false,
        "webhook": "${SLACK_WEBHOOK}"
      }
    }
  }
}
```

---

## Testing Strategy

### Workflow Tests

```bash
# Test DGM validation workflow locally
act -W .github/workflows/dgm-validation.yml

# Test with specific branch
act -W .github/workflows/dgm-validation.yml \
  -e test/events/dgm-push.json

# Test rollback workflow
act -W .github/workflows/dgm-monitor.yml
```

### Integration Tests

```typescript
test('CI rejects modification with failing tests', async () => {
  // Create branch with failing test
  await git.checkout('-b', 'dgm/test-failure');
  await fs.writeFile('test.ts', 'test("fail", () => { expect(true).toBe(false); });');
  await git.commit('Add failing test');
  await git.push('origin', 'dgm/test-failure');
  
  // Wait for CI
  const ciResult = await waitForCI('dgm/test-failure');
  
  expect(ciResult.status).toBe('failure');
  expect(ciResult.failedJobs).toContain('regression-check');
});
```

---

## Success Criteria

- [ ] All DGM branches run through CI validation
- [ ] Regressions detected automatically
- [ ] Security issues block merge
- [ ] Docker validation works
- [ ] Auto-merge works for safe changes
- [ ] Human review enforced for risky changes
- [ ] Post-merge monitoring active
- [ ] Rollback works on failures
- [ ] Audit trail complete

---

## References

- [DGM Paper - Safety Discussion](https://arxiv.org/pdf/2505.22954) - Section 5
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

**Previous**: [SPEC-DGM-006: DGM Loop](./SPEC-DGM-006-dgm-improvement-loop.md)  
**Next**: [SPEC-DGM-009: Docker Automation](./SPEC-DGM-009-docker-automation.md)
