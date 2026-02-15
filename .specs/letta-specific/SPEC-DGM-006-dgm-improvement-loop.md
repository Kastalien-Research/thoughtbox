# SPEC-DGM-006: DGM Self-Improvement Loop

**Status**: Draft  
**Priority**: P0 - Core System Logic  
**Complexity**: Very High  
**Dependencies**: SPEC-DGM-002 (Archive), SPEC-DGM-003 (Reflection), SPEC-DGM-004 (Metrics), SPEC-DGM-007 (Test Gen)  
**Target Codebases**: `letta-code-thoughtbox/`, `thoughtbox/`

## Overview

Implement the complete Darwin Gödel Machine improvement loop that takes improvement proposals from reflection sessions, implements modifications, generates tests, validates changes, and either accepts improvements into the archive or rejects them. This is the core self-referential loop that enables the system to modify its own codebase.

## Motivation

**DGM Algorithm** (from paper):
```
1. Select parent variant from archive
2. Parent self-modifies (generates new capability)
3. Generate tests for modification
4. Run tests and validate
5. Compute performance on metrics
6. If valid and beneficial: add to archive
7. Repeat
```

**Self-Referential**: The agent uses its own capabilities to improve itself, creating a positive feedback loop where better coding ability → better self-improvements → even better coding ability.

## Requirements

### Functional Requirements

#### FR-001: Improvement Proposal Structure
**Priority**: MUST  
**Description**: Standardized format for improvement proposals from reflection

**Schema**:
```typescript
interface ImprovementProposal {
  // Identity
  id: string;                    // "prop-20260115-001"
  title: string;
  description: string;
  
  // Target
  target: 'letta-code' | 'thoughtbox' | 'both';
  files: string[];               // Files expected to be modified
  
  // Justification
  motivation: string;            // Why this improvement is needed
  evidenceTaskIds: string[];    // Tasks that would benefit
  evidenceSessionIds: string[]; // Thoughtbox sessions showing need
  estimatedImpact: number;       // 0.0 - 1.0
  
  // Implementation guidance
  suggestedApproach: string;
  alternativeApproaches?: string[];
  risks: string[];
  
  // Metadata
  proposedAt: string;
  proposedBy: 'reflection' | 'user';
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // Acceptance criteria (from reflection analysis)
  acceptanceCriteria: string[];
}
```

**Example**:
```json
{
  "id": "prop-20260115-001",
  "title": "Add Architecture Trade-off Mental Model",
  "description": "Systematic framework for evaluating architectural decisions with explicit trade-off analysis",
  "target": "thoughtbox",
  "files": [
    "src/mental-models/contents/architecture-tradeoff.ts",
    "src/mental-models/index.ts"
  ],
  "motivation": "3 out of 5 large refactoring tasks failed due to architectural indecision. Agent needs structured approach to evaluate trade-offs.",
  "evidenceTaskIds": ["task-123", "task-145", "task-167"],
  "evidenceSessionIds": ["tbx_sess_abc", "tbx_sess_def"],
  "estimatedImpact": 0.15,
  "suggestedApproach": "Implement mental model similar to trade-off-matrix but specialized for software architecture with dimensions: cost, complexity, maintainability, scalability, etc.",
  "risks": [
    "May make simple decisions unnecessarily complex",
    "Needs good defaults to avoid analysis paralysis"
  ],
  "acceptanceCriteria": [
    "Can analyze architectural decision with >3 options",
    "Identifies non-obvious trade-offs",
    "Provides actionable recommendation",
    "Behavioral test passes"
  ],
  "proposedAt": "2026-01-15T10:30:00Z",
  "proposedBy": "reflection",
  "priority": "high"
}
```

---

#### FR-002: Parent Selection
**Priority**: MUST  
**Description**: Select parent variant from archive using DGM selection algorithm

**Algorithm** (from SPEC-DGM-002):
```typescript
async function selectParent(): Promise<ArchiveVariant> {
  const archive = await archiveManager.load();
  
  // Filter eligible (not perfect, still functional)
  const eligible = archive.variants.filter(v => 
    v.status === 'active' && 
    v.performance < 1.0 &&
    v.testsPass
  );
  
  if (eligible.length === 0) {
    throw new Error('No eligible parents in archive');
  }
  
  // Apply selection algorithm from SPEC-DGM-002
  const selected = dgmSelection(eligible);
  
  console.log(`Selected parent: ${selected.id} (perf: ${selected.performance})`);
  return selected;
}
```

**Acceptance Criteria**:
- [ ] Uses algorithm from SPEC-DGM-002
- [ ] Logs selection rationale
- [ ] Falls back to best variant if algorithm fails
- [ ] Respects concurrency limits (max 2 parallel)

---

#### FR-003: Modification Implementation
**Priority**: MUST  
**Description**: Agent implements the proposed modification

**Process**:
```typescript
async function implementModification(
  proposal: ImprovementProposal,
  parent: ArchiveVariant
): Promise<Implementation> {
  // 1. Checkout parent variant
  await git.checkout(parent.gitRef);
  
  // 2. Create improvement branch
  const branchName = `dgm/gen-${archive.generation + 1}-${proposal.id}`;
  await git.checkout('-b', branchName);
  
  // 3. Agent implements modification
  const systemPrompt = `You are implementing a self-improvement.
  
  Proposal: ${proposal.title}
  Description: ${proposal.description}
  
  Target: ${proposal.target}
  Expected files: ${proposal.files.join(', ')}
  
  Approach: ${proposal.suggestedApproach}
  
  Requirements:
  ${proposal.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}
  
  Important:
  - Make minimal changes to achieve the goal
  - Preserve all existing functionality
  - Follow existing code style
  - Add appropriate error handling
  - Document new capabilities`;
  
  const result = await agent.sendMessage({
    role: 'user',
    content: systemPrompt,
    metadata: { mode: 'dgm-implementation', proposalId: proposal.id }
  });
  
  // 4. Capture modifications
  const modifiedFiles = await git.diff('--name-only', parent.gitRef);
  const patch = await git.diff(parent.gitRef);
  
  return {
    proposal,
    parent,
    branchName,
    modifiedFiles: modifiedFiles.split('\n'),
    patch,
    success: true
  };
}
```

**Acceptance Criteria**:
- [ ] Agent can modify Letta Code (TypeScript)
- [ ] Agent can modify Thoughtbox (TypeScript)
- [ ] Can modify both simultaneously (coordinated)
- [ ] Changes are atomic (branch-based)
- [ ] Implementation time <30 minutes (timeout)
- [ ] Logs all actions for auditability

---

#### FR-004: Test Generation
**Priority**: MUST  
**Description**: Generate tests using test-generator skill (SPEC-DGM-007)

**Process**:
```typescript
async function generateTests(impl: Implementation): Promise<TestSuite> {
  // Use the test-generator skill
  const testResult = await agent.useSkill('test-generator', {
    modification: {
      target: impl.proposal.target,
      files: impl.modifiedFiles,
      description: impl.proposal.description,
      newFunctions: await extractNewFunctions(impl.patch),
      newClasses: await extractNewClasses(impl.patch)
    },
    options: {
      testTypes: ['unit', 'integration', 'regression'],
      coverageTarget: 0.85,
      generateFixtures: true
    }
  });
  
  // Write generated tests
  for (const test of testResult.tests) {
    await fs.writeFile(test.path, test.content);
    await git.add(test.path);
  }
  
  return {
    tests: testResult.tests,
    fixtures: testResult.fixtures,
    estimatedCoverage: testResult.summary.estimatedCoverage
  };
}
```

**Acceptance Criteria**:
- [ ] Tests generated for all new code
- [ ] Regression tests for modified code
- [ ] Behavioral tests for Thoughtbox capabilities
- [ ] Test quality meets standards
- [ ] Tests committed to branch

---

#### FR-005: Validation Phase
**Priority**: MUST  
**Description**: Run all tests and validate no regressions

**Validation Steps**:
```typescript
async function validateModification(impl: Implementation): Promise<ValidationResult> {
  const results = {
    newTestsPass: false,
    regressionTestsPass: false,
    buildsSuccessfully: false,
    dockerBuilds: false,
    performanceAcceptable: false,
    errors: []
  };
  
  try {
    // 1. Run new tests
    console.log("Running new tests...");
    const newTestResult = await runTests(impl.proposal.target, 'new');
    results.newTestsPass = newTestResult.allPass;
    if (!newTestResult.allPass) {
      results.errors.push(`New tests failed: ${newTestResult.failures.join(', ')}`);
    }
    
    // 2. Run regression tests
    console.log("Running regression tests...");
    const regressionResult = await runTests(impl.proposal.target, 'all');
    results.regressionTestsPass = regressionResult.allPass;
    if (!regressionResult.allPass) {
      results.errors.push(`Regressions detected: ${regressionResult.failures.join(', ')}`);
    }
    
    // 3. Build check
    console.log("Verifying build...");
    if (impl.proposal.target === 'letta-code' || impl.proposal.target === 'both') {
      const buildResult = await shell('cd letta-code-thoughtbox && bun run build');
      results.buildsSuccessfully = buildResult.exitCode === 0;
    }
    
    // 4. Docker build (if Thoughtbox modified)
    if (impl.proposal.target === 'thoughtbox' || impl.proposal.target === 'both') {
      console.log("Building Docker image...");
      const dockerResult = await shell('cd thoughtbox && docker build -t thoughtbox:test .');
      results.dockerBuilds = dockerResult.exitCode === 0;
      
      if (results.dockerBuilds) {
        // Start container and health check
        await shell('docker run -d -p 3001:3000 --name thoughtbox-test thoughtbox:test');
        await sleep(5000);
        const healthCheck = await fetch('http://localhost:3001/health');
        results.dockerBuilds = healthCheck.ok;
        await shell('docker stop thoughtbox-test && docker rm thoughtbox-test');
      }
    }
    
    // 5. Performance evaluation
    console.log("Evaluating performance...");
    const perfScore = await metricsManager.evaluate({
      ...impl.parent,
      gitRef: impl.branchName
    });
    results.performanceAcceptable = perfScore.composite >= impl.parent.performance;
    if (!results.performanceAcceptable) {
      results.errors.push(`Performance degraded: ${perfScore.composite} < ${impl.parent.performance}`);
    }
    
  } catch (error) {
    results.errors.push(`Validation error: ${error.message}`);
  }
  
  return results;
}
```

**Acceptance Criteria**:
- [ ] All validation steps execute
- [ ] Failures are specific and actionable
- [ ] Validation logs saved for debugging
- [ ] Timeout after 10 minutes
- [ ] Can skip expensive checks (optional)

---

#### FR-006: Acceptance Decision
**Priority**: MUST  
**Description**: Accept or reject modification based on validation results

**Decision Logic**:
```typescript
async function decideAcceptance(
  impl: Implementation,
  validation: ValidationResult,
  metrics: MetricScores
): Promise<AcceptanceDecision> {
  // MUST pass criteria
  const mustPass = [
    validation.newTestsPass,
    validation.regressionTestsPass,
    validation.buildsSuccessfully
  ];
  
  if (impl.proposal.target === 'thoughtbox' || impl.proposal.target === 'both') {
    mustPass.push(validation.dockerBuilds);
  }
  
  const allMustPass = mustPass.every(x => x);
  
  // Performance check
  const performanceImproved = metrics.composite > impl.parent.performance;
  const performanceMaintained = metrics.composite >= impl.parent.performance * 0.95; // Allow 5% degradation
  
  // Decision
  if (allMustPass && performanceImproved) {
    return {
      decision: 'accept',
      reason: 'All tests pass and performance improved',
      mergeToMain: true  // New best!
    };
  } else if (allMustPass && performanceMaintained) {
    return {
      decision: 'accept',
      reason: 'Tests pass, performance maintained',
      mergeToMain: false  // Add to archive but don't merge
    };
  } else {
    return {
      decision: 'reject',
      reason: validation.errors.join('; '),
      preserveForAnalysis: true
    };
  }
}
```

**Acceptance Criteria**:
- [ ] Decision is deterministic given inputs
- [ ] Rationale logged
- [ ] Rejected modifications preserved (for learning)
- [ ] User notified of decision
- [ ] Statistics tracked (acceptance rate)

---

#### FR-007: Archive Integration
**Priority**: MUST  
**Description**: Add accepted variants to archive, handle rejections

**Acceptance Flow**:
```typescript
async function acceptVariant(impl: Implementation, metrics: MetricScores) {
  // 1. Commit modification
  await git.add('.');
  await git.commit(`feat(dgm): ${impl.proposal.title}\n\n${impl.proposal.description}`);
  
  // 2. Create tag
  const tag = `archive/gen-${archive.generation + 1}-${impl.id}`;
  await git.tag(tag);
  
  // 3. Add to archive metadata
  const variant: ArchiveVariant = {
    id: impl.id,
    generation: archive.generation + 1,
    gitRef: impl.branchName,
    gitTag: tag,
    parent: impl.parent.id,
    children: [],
    lineage: [...impl.parent.lineage, impl.id],
    performance: metrics.composite,
    metrics: metrics.individual,
    capabilities: [...impl.parent.capabilities, ...extractCapabilities(impl)],
    modifications: {
      target: impl.proposal.target,
      files: impl.modifiedFiles,
      description: impl.proposal.description,
      proposalRef: impl.proposal.id
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    evaluatedAt: new Date().toISOString(),
    testsPass: true,
    regressions: []
  };
  
  await archiveManager.add(variant);
  
  // 4. Update parent's children list
  await archiveManager.addChild(impl.parent.id, variant.id);
  
  // 5. Merge to main if new best
  if (metrics.composite > archive.bestPerformance) {
    await git.checkout('main');
    await git.merge(impl.branchName);
    await archiveManager.updateBest(variant.id);
    
    console.log(`✅ NEW BEST! ${variant.id} (${metrics.composite})`);
  } else {
    console.log(`✅ Accepted to archive: ${variant.id} (${metrics.composite})`);
  }
}
```

**Rejection Flow**:
```typescript
async function rejectVariant(impl: Implementation, validation: ValidationResult) {
  // 1. Tag as rejected (preserve for analysis)
  const tag = `rejected/gen-${archive.generation + 1}-${impl.id}`;
  await git.tag(tag);
  
  // 2. Log rejection
  await fs.writeFile(`.dgm/rejections/${impl.id}.md`, `
# Rejected: ${impl.proposal.title}

**Reason**: ${validation.errors.join('\n- ')}

**Proposal**: ${impl.proposal.id}

**Parent**: ${impl.parent.id}

**Modified Files**: ${impl.modifiedFiles.join(', ')}

**Validation Results**:
- New tests pass: ${validation.newTestsPass}
- Regression tests pass: ${validation.regressionTestsPass}
- Builds successfully: ${validation.buildsSuccessfully}
- Docker builds: ${validation.dockerBuilds}

**Learnings**: [TODO: Extract learnings from failure]
  `);
  
  // 3. Cleanup branch (optional, keep for debugging)
  // await git.branch('-D', impl.branchName);
  
  // 4. Checkout main
  await git.checkout('main');
  
  console.log(`❌ Rejected: ${impl.proposal.title}`);
  console.log(`   Reason: ${validation.errors[0]}`);
}
```

**Acceptance Criteria**:
- [ ] Accepted variants added to archive
- [ ] Best variant triggers main merge
- [ ] Rejected variants preserved with analysis
- [ ] Git state always consistent
- [ ] Archive.json updated atomically
- [ ] Notifications clear and actionable

---

#### FR-008: Docker Rebuild (for Thoughtbox modifications)
**Priority**: MUST  
**Description**: Automatically rebuild and restart Thoughtbox when modified

**Process**:
```typescript
async function rebuildThoughtbox(impl: Implementation): Promise<void> {
  if (impl.proposal.target !== 'thoughtbox' && impl.proposal.target !== 'both') {
    return; // No rebuild needed
  }
  
  console.log("🐳 Rebuilding Thoughtbox Docker image...");
  
  // 1. Build image
  const buildResult = await shell(
    'cd thoughtbox && docker build -t thoughtbox:latest -t thoughtbox:${impl.id} .',
    { timeout: 300000 } // 5 minute timeout
  );
  
  if (buildResult.exitCode !== 0) {
    throw new Error(`Docker build failed: ${buildResult.stderr}`);
  }
  
  // 2. Stop old container (if running)
  await shell('docker stop thoughtbox 2>/dev/null || true');
  await shell('docker rm thoughtbox 2>/dev/null || true');
  
  // 3. Start new container
  await shell(`docker run -d --name thoughtbox -p 3000:3000 \
    -e THOUGHTBOX_TRANSPORT=http \
    -e OBSERVATORY_ENABLED=false \
    thoughtbox:latest`);
  
  // 4. Wait for health check
  await waitForHealthy('http://localhost:3000/health', { timeout: 30000 });
  
  console.log("✅ Thoughtbox rebuilt and running");
}
```

**Acceptance Criteria**:
- [ ] Rebuild triggered only when Thoughtbox modified
- [ ] Health check before considering success
- [ ] Rollback to previous version on failure
- [ ] Zero-downtime updates (start new, stop old)
- [ ] Build logs saved for debugging

---

#### FR-009: Iteration Loop
**Priority**: MUST  
**Description**: Main DGM loop iterates continuously (or until stopped)

**Loop Structure**:
```typescript
async function dgmMainLoop(config: DGMConfig) {
  let generation = archive.generation;
  let iterations = 0;
  
  while (iterations < config.maxIterations || config.maxIterations === -1) {
    console.log(`\n🔄 DGM Iteration ${iterations + 1} (Generation ${generation})\n`);
    
    try {
      // 1. Check for pending proposals from reflection
      const proposals = await loadPendingProposals();
      
      if (proposals.length === 0) {
        console.log("No pending proposals. Waiting for next reflection...");
        break;
      }
      
      // 2. Select proposal (if multiple)
      const proposal = proposals[0]; // FIFO for now, could prioritize
      
      // 3. Select parent
      const parent = await selectParent();
      
      // 4. Implement
      const impl = await implementModification(proposal, parent);
      
      // 5. Generate tests
      const tests = await generateTests(impl);
      
      // 6. Validate
      const validation = await validateModification(impl);
      
      // 7. Evaluate metrics
      const metrics = await metricsManager.evaluate(impl);
      
      // 8. Decide
      const decision = await decideAcceptance(impl, validation, metrics);
      
      // 9. Accept or reject
      if (decision.decision === 'accept') {
        await acceptVariant(impl, metrics);
        
        // Rebuild if needed
        if (impl.proposal.target === 'thoughtbox' || impl.proposal.target === 'both') {
          await rebuildThoughtbox(impl);
        }
      } else {
        await rejectVariant(impl, validation);
      }
      
      // 10. Mark proposal as processed
      await markProposalProcessed(proposal.id, decision);
      
      iterations++;
      if (decision.decision === 'accept') {
        generation++;
      }
      
    } catch (error) {
      console.error(`❌ DGM iteration failed: ${error.message}`);
      await logError(error);
      
      // Continue to next iteration
      continue;
    }
  }
  
  console.log(`\n🎉 DGM Loop Complete: ${iterations} iterations, generation ${generation}`);
}
```

**Acceptance Criteria**:
- [ ] Loop can run indefinitely (-1 max iterations)
- [ ] Failures don't terminate loop
- [ ] Progress visible in real-time
- [ ] Can pause/resume loop
- [ ] Statistics tracked per iteration

---

### Non-Functional Requirements

#### NFR-001: Performance
- Single iteration: <10 minutes (excluding long-running tests)
- Parallel iterations: 2 concurrent (configurable)
- Non-blocking UI

#### NFR-002: Reliability
- Crash recovery (resume from last checkpoint)
- Atomic operations (variant fully added or not at all)
- Rollback on any failure in acceptance flow

#### NFR-003: Observability
- Real-time progress display
- Detailed logs per iteration
- Statistics dashboard (success rate, avg performance gain)
- Alert on unexpected patterns

#### NFR-004: Safety
- Modification scope limited to project
- No system-wide changes possible
- Sandboxed execution (Docker for Thoughtbox)
- User can abort at any point

---

## Architecture

### DGM Loop Manager

```typescript
// letta-code-thoughtbox/src/dgm/loop-manager.ts
export class DGMLoopManager {
  private archive: ArchiveManager;
  private metrics: MetricsManager;
  private testGen: TestGeneratorSkill;
  private git: GitOperations;
  
  async runIteration(proposal: ImprovementProposal): Promise<IterationResult> {
    // Implements one DGM iteration
  }
  
  async runLoop(config: DGMConfig): Promise<void> {
    // Main loop (FR-009)
  }
  
  pause(): void {
    // Graceful pause
  }
  
  resume(): Promise<void> {
    // Resume from checkpoint
  }
  
  getStatistics(): DGMStatistics {
    // Return performance stats
  }
}
```

---

## CLI Interface

```bash
# Start DGM loop (after reflection)
letta /dgm start

# Start with specific proposals
letta /dgm start --proposals=prop-001,prop-002

# Run N iterations
letta /dgm start --iterations=5

# Pause running loop
letta /dgm pause

# Resume paused loop
letta /dgm resume

# Show status
letta /dgm status
# Output:
#   Status: Running
#   Current iteration: 3/10
#   Generation: 5
#   Best variant: gen-5-variant-b (0.87)
#   Elapsed: 32 minutes

# Show statistics
letta /dgm stats
# Output:
#   Total iterations: 23
#   Accepted: 15 (65%)
#   Rejected: 8 (35%)
#   Avg improvement: +0.03 per accepted variant
#   Best performance: 0.87 (gen-5-variant-b)
```

---

## Testing Strategy

### Unit Tests
```typescript
test('decideAcceptance accepts when all criteria met', () => {
  const validation = { allPass: true, regressions: [] };
  const metrics = { composite: 0.85, parent: 0.80 };
  
  const decision = decideAcceptance(impl, validation, metrics);
  
  expect(decision.decision).toBe('accept');
  expect(decision.mergeToMain).toBe(true);
});

test('decideAcceptance rejects on test failure', () => {
  const validation = { newTestsPass: false, errors: ['...'] };
  
  const decision = decideAcceptance(impl, validation, metrics);
  
  expect(decision.decision).toBe('reject');
});
```

### Integration Tests
```typescript
test('Full DGM iteration completes', async () => {
  const proposal = createTestProposal();
  const loopManager = new DGMLoopManager(config);
  
  const result = await loopManager.runIteration(proposal);
  
  expect(result.decision).toBeDefined();
  expect(result.variant).toBeDefined();
  // Archive updated
  const archive = await archiveManager.load();
  if (result.decision === 'accept') {
    expect(archive.variants).toContainEqual(result.variant);
  }
});
```

---

## Success Criteria

- [ ] Complete DGM iteration executes end-to-end
- [ ] Variants added to archive correctly
- [ ] Best variant merges to main automatically
- [ ] Rejected variants preserved with rationale
- [ ] Git history clean and auditable
- [ ] Loop can run continuously
- [ ] Crash recovery works
- [ ] Performance meets NFR-001 targets
- [ ] All integration tests pass

---

## References

- [DGM Paper - Algorithm 1](https://arxiv.org/pdf/2505.22954) - Pseudocode
- [DGM Paper - Section 4.1](https://arxiv.org/pdf/2505.22954) - Experimental setup
- [Thoughtbox Agentic Tests](../../thoughtbox/scripts/agentic-test.ts) - Test pattern

---

**Previous**: [SPEC-DGM-004: Metrics Co-Evolution](./SPEC-DGM-004-metrics-co-evolution.md)  
**Next**: [SPEC-DGM-008: CI/CD Safety](./SPEC-DGM-008-cicd-safety-mechanisms.md)
