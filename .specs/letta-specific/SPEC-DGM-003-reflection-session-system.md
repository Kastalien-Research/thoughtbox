# SPEC-DGM-003: Reflection Session Framework

**Status**: Draft  
**Priority**: P1 - Core DGM Functionality  
**Complexity**: Medium  
**Dependencies**: SPEC-DGM-001 (MCP Client), SPEC-DGM-005 (Sampling)  
**Target Codebase**: `letta-code-thoughtbox/`

## Overview

Implement a reflection session system where the Letta Code agent periodically analyzes its own performance, identifies capability gaps, and proposes self-improvements. Reflection uses Thoughtbox as the meta-reasoning engine via full MCP session integration.

## Motivation

**DGM Principle**: Self-improvement occurs during dedicated reflection periods, not during task execution. This separation enables:
- Deep analysis without time pressure
- Systematic capability assessment
- Thoughtful improvement proposals
- Learning from patterns across multiple tasks

**Reflection ≠ Task Work**: Agent has two distinct modes:
- **Task Mode**: Solving user problems
- **Reflection Mode**: Analyzing own performance and proposing improvements

## Requirements

### Functional Requirements

#### FR-001: Reflection Trigger System
**Priority**: MUST  
**Description**: Multiple trigger mechanisms (manual, scheduled, performance-based)

**Trigger Types**:

**1. Manual Trigger**:
```bash
letta> /reflect
🔬 Entering Reflection Mode...
📊 Analyzing last 20 tasks and 15 Thoughtbox sessions...
```

**2. Scheduled Trigger**:
```typescript
interface ScheduledTrigger {
  enabled: boolean;
  afterNTasks: number;      // After every 20 tasks
  message: string;          // Notification to user
}

// Example
After completing 20th task:
Agent: "✨ Scheduled reflection checkpoint reached. Begin reflection? [Y/n]"
```

**3. Performance Trigger** (Optional):
```typescript
interface PerformanceTrigger {
  enabled: boolean;
  failureRateThreshold: number;  // >30% failure rate
  reasoningQualityThreshold: number;  // Thoughtbox quality score <0.7
}

// Example
After 3 consecutive task failures:
Agent: "⚠️ Degraded performance detected. Recommend reflection session."
```

**Acceptance Criteria**:
- [ ] `/reflect` command implemented
- [ ] Task counter tracks progress toward scheduled trigger
- [ ] User can configure trigger thresholds in `.letta/dgm-config.json`
- [ ] Triggers can be disabled individually
- [ ] Clear notification when trigger fires

---

#### FR-002: Data Gathering Phase
**Priority**: MUST  
**Description**: Collect comprehensive data for reflection analysis

**Data Sources**:

**1. Thoughtbox Traces** (via MCP):
```typescript
const traces = await thoughtboxClient.call('session', 'list', {
  timeRange: 'last-7-days',
  includeFailures: true
});

for (const sessionId of traces.sessionIds) {
  const analysis = await thoughtboxClient.call('session', 'analyze', {
    sessionId,
    depth: 'comprehensive'
  });
  sessionAnalyses.push(analysis);
}
```

**2. Letta Cloud Metrics** (if available):
```typescript
const lettaMetrics = await lettaClient.agents.getMetrics(agentId, {
  timeRange: 'last-7-days',
  metrics: [
    'task_success_rate',
    'avg_tool_calls_per_task',
    'context_window_usage',
    'error_rate'
  ]
});
```

**3. Local Task History**:
```typescript
// Read from .letta/task-history/
const taskHistory = {
  successes: loadTasks('.letta/task-history/success/'),
  failures: loadTasks('.letta/task-history/failures/'),
  patterns: await analyzePatterns(allTasks)
};
```

**Acceptance Criteria**:
- [ ] All three data sources queried
- [ ] Data normalized into common format
- [ ] Failures to fetch don't block reflection (degrade gracefully)
- [ ] Data cached for analysis phase
- [ ] Privacy: sensitive data redacted before storage

---

#### FR-003: Meta-Analysis via Thoughtbox Session
**Priority**: MUST  
**Description**: Use Thoughtbox itself for meta-reasoning about improvements

**Process**:
```typescript
async function metaAnalysisPhase(data: ReflectionData): Promise<Analysis> {
  // 1. Create Thoughtbox session for reflection
  const sessionId = await thoughtboxClient.call('init', 'start_new', {
    purpose: 'meta-analysis-reflection'
  });
  
  // 2. Process patterns through Thoughtbox
  const patternAnalysis = await thoughtboxClient.call('thoughtbox', 'process', {
    thought: `Analyze these task patterns to identify capability gaps:
              - What types of tasks consistently fail? Why?
              - What reasoning patterns are missing from the toolset?
              - What would have made difficult tasks easier?`,
    context: {
      sessionAnalyses: data.thoughtboxTraces,
      taskHistory: data.taskHistory,
      metrics: data.lettaMetrics
    }
  });
  
  // 3. Identify specific improvement opportunities
  const opportunities = await thoughtboxClient.call('thoughtbox', 'process', {
    thought: `Based on the pattern analysis, propose 3-5 concrete improvements:
              - New tools needed
              - New mental models for Thoughtbox
              - Workflow optimizations
              - Integration enhancements
              For each, specify: what, why, where (client/server/both), estimated impact`,
    context: { patternAnalysis }
  });
  
  // 4. Request critique of proposals
  const critique = await thoughtboxClient.call('thoughtbox', 'process', {
    thought: `Critique these improvement proposals for feasibility and impact`,
    context: { opportunities }
  });
  
  return {
    patterns: patternAnalysis,
    opportunities: parseOpportunities(opportunities),
    critique: critique,
    sessionId  // Can export reasoning trace
  };
}
```

**Acceptance Criteria**:
- [ ] Reflection creates actual Thoughtbox session
- [ ] Session can be reviewed later (`session.export`)
- [ ] Multiple Thoughtbox tools used in analysis
- [ ] Sampling used for critique (dogfooding!)
- [ ] Session persists in Thoughtbox storage

---

#### FR-004: Opportunity Presentation
**Priority**: MUST  
**Description**: Present identified improvements to user with clear decision points

**UI Format**:
```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Reflection Analysis Complete                                 │
├─────────────────────────────────────────────────────────────────┤
│ Analyzed: 20 tasks, 15 Thoughtbox sessions, 7 days             │
│ Meta-reasoning session: tbx_sess_abc123                         │
├─────────────────────────────────────────────────────────────────┤
│ Identified 4 improvement opportunities:                         │
│                                                                 │
│ 1. [HIGH IMPACT] Add architecture trade-off analysis           │
│    Target: Thoughtbox (mental model)                           │
│    Why: 3/5 large refactors failed due to indecision          │
│    Effort: Medium (~2-3 hours)                                │
│    Estimated improvement: +15% on refactoring tasks           │
│    [ ] Select for implementation                               │
│                                                                 │
│ 2. [MEDIUM IMPACT] Enhanced code search tool                   │
│    Target: Letta Code (tool)                                   │
│    Why: Semantic search faster than grep for large codebases  │
│    Effort: Low (~1 hour)                                      │
│    Estimated improvement: +10% task speed                      │
│    [ ] Select for implementation                               │
│                                                                 │
│ 3. [MEDIUM IMPACT] Context window optimizer                    │
│    Target: Letta Code (workflow)                               │
│    Why: 2 tasks hit context limits unnecessarily              │
│    Effort: Medium (~2 hours)                                  │
│    Estimated improvement: +5% capacity                         │
│    [ ] Select for implementation                               │
│                                                                 │
│ 4. [LOW IMPACT] Better error messages                          │
│    Target: Both                                                │
│    Why: User confusion on 3 error cases                       │
│    Effort: Low (~30 min)                                      │
│    Estimated improvement: Better UX, no perf gain             │
│    [ ] Select for implementation                               │
├─────────────────────────────────────────────────────────────────┤
│ Enter numbers to implement (e.g., "1,2"): _                    │
│ [V]iew Thoughtbox session | [S]kip | [C]ancel                 │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria**:
- [ ] Opportunities ranked by estimated impact
- [ ] Each shows target (client/server), effort, why
- [ ] User can select multiple for implementation
- [ ] Can view full Thoughtbox reasoning session
- [ ] Can skip reflection and continue tasks
- [ ] Selection persists in session state

---

#### FR-005: Reflection Session Persistence
**Priority**: SHOULD  
**Description**: Save reflection results for longitudinal analysis

**Storage**:
```
.letta/reflections/
  ├── 2026-01-15-001.json     # Reflection session data
  │   {
  │     "timestamp": "2026-01-15T10:00:00Z",
  │     "trigger": "scheduled",
  │     "dataGathered": { /* ... */ },
  │     "thoughtboxSessionId": "tbx_sess_abc",
  │     "opportunities": [ /* ... */ ],
  │     "selected": [1, 2],
  │     "implemented": [1],
  │     "outcomes": { /* ... */ }
  │   }
  └── 2026-01-22-002.json
```

**Acceptance Criteria**:
- [ ] Each reflection saved with unique ID
- [ ] Link to Thoughtbox session preserved
- [ ] Outcomes tracked (did implementation succeed?)
- [ ] Historical analysis possible (trends over time)
- [ ] Exportable for sharing/analysis

---

### Non-Functional Requirements

#### NFR-001: Performance
- Data gathering: <30 seconds
- Thoughtbox meta-analysis: <3 minutes
- Total reflection session: <5 minutes
- Non-blocking UI during analysis

#### NFR-002: User Experience
- Clear progress indicators
- Ability to cancel mid-reflection
- Skip option if no improvements found
- Notifications when reflection triggers

#### NFR-003: Reliability
- Failures in data gathering don't abort reflection
- Partial data still produces recommendations
- Can resume interrupted reflections

---

## Architecture

### Reflection Session Manager

```typescript
// letta-code-thoughtbox/src/reflection/session-manager.ts
export class ReflectionSessionManager {
  private triggers: TriggerManager;
  private gatherer: DataGatherer;
  private analyzer: MetaAnalyzer;
  
  async begin(trigger: TriggerType): Promise<ReflectionResult> {
    console.log("🔬 Entering Reflection Mode...");
    
    // Phase 1: Gather
    const data = await this.gatherer.collect({
      thoughtboxTraces: true,
      lettaMetrics: true,
      localHistory: true,
      timeRange: '7d'
    });
    
    // Phase 2: Analyze (via Thoughtbox)
    const analysis = await this.analyzer.analyze(data);
    
    // Phase 3: Present
    const opportunities = this.rankOpportunities(analysis.opportunities);
    const selected = await this.presentToUser(opportunities);
    
    // Phase 4: Persist
    await this.saveReflection({
      trigger,
      data,
      analysis,
      opportunities,
      selected,
      thoughtboxSessionId: analysis.sessionId
    });
    
    return { opportunities, selected, sessionId: analysis.sessionId };
  }
  
  // Trigger registration
  registerTriggers() {
    this.triggers.on('manual', () => this.begin('manual'));
    this.triggers.on('scheduled', () => this.begin('scheduled'));
    this.triggers.on('performance', () => this.begin('performance'));
  }
}
```

---

## Integration Points

### With Task Execution
```typescript
// After each task completes
async function afterTask(task: Task, result: TaskResult) {
  // 1. Log task outcome
  await taskHistory.log(task, result);
  
  // 2. Increment counter
  taskCounter.increment();
  
  // 3. Check triggers
  if (taskCounter.shouldTriggerReflection()) {
    const approved = await promptUser("Begin reflection? [Y/n]");
    if (approved) {
      await reflectionManager.begin('scheduled');
    }
  }
}
```

### With DGM Loop
```typescript
// After reflection selects improvements
async function afterReflection(result: ReflectionResult) {
  for (const opportunityId of result.selected) {
    const opportunity = result.opportunities.find(o => o.id === opportunityId);
    
    // Enter DGM improvement loop
    await dgmLoop.improve(opportunity);
  }
}
```

---

## Configuration

```json
// .letta/dgm-config.json
{
  "reflection": {
    "triggers": {
      "manual": {
        "enabled": true,
        "command": "/reflect"
      },
      "scheduled": {
        "enabled": true,
        "afterNTasks": 20,
        "promptUser": true
      },
      "performance": {
        "enabled": false,
        "failureRateThreshold": 0.3,
        "reasoningQualityThreshold": 0.7
      }
    },
    "dataGathering": {
      "thoughtboxTraces": {
        "enabled": true,
        "maxSessions": 50,
        "timeRange": "7d"
      },
      "lettaMetrics": {
        "enabled": true,
        "endpoint": "https://api.letta.com"
      },
      "localHistory": {
        "enabled": true,
        "maxTasks": 100
      }
    },
    "thoughtboxSession": {
      "createSession": true,
      "exportAfter": true,
      "saveToArchive": true
    }
  }
}
```

---

## Testing Strategy

### Unit Tests
```typescript
test('TriggerManager fires after N tasks', () => {
  const triggers = new TriggerManager({ afterNTasks: 3 });
  
  triggers.afterTask();
  triggers.afterTask();
  expect(triggers.shouldTrigger()).toBe(false);
  
  triggers.afterTask();
  expect(triggers.shouldTrigger()).toBe(true);
});

test('DataGatherer handles missing sources gracefully', async () => {
  const gatherer = new DataGatherer(config);
  mockThoughtbox.fail(); // Simulate Thoughtbox unavailable
  
  const data = await gatherer.collect();
  
  expect(data.thoughtboxTraces).toEqual([]);
  expect(data.lettaMetrics).toBeDefined(); // Other sources still work
});
```

### Integration Tests
```typescript
test('Full reflection session completes', async () => {
  const session = new ReflectionSessionManager(config);
  
  const result = await session.begin('manual');
  
  expect(result.opportunities.length).toBeGreaterThan(0);
  expect(result.sessionId).toBeDefined();
  expect(result.selected).toBeInstanceOf(Array);
});

test('Reflection creates Thoughtbox session', async () => {
  const thoughtbox = await connectToThoughtbox();
  const initialSessions = await thoughtbox.call('session', 'list');
  
  await reflectionManager.begin('manual');
  
  const afterSessions = await thoughtbox.call('session', 'list');
  expect(afterSessions.length).toBe(initialSessions.length + 1);
});
```

---

## Success Criteria

- [ ] Manual trigger (`/reflect`) works
- [ ] Scheduled trigger after N tasks works
- [ ] Data gathering completes in <30s
- [ ] Thoughtbox session created for analysis
- [ ] Opportunities ranked by impact
- [ ] User can select improvements
- [ ] Reflection persists to `.letta/reflections/`
- [ ] Can resume interrupted reflections
- [ ] No impact on task execution performance

---

## User Experience

### Example Flow

```bash
letta> /reflect
🔬 Entering Reflection Mode...

📥 Gathering data...
  ✓ Thoughtbox traces (15 sessions)
  ✓ Letta Cloud metrics (7 days)
  ✓ Local task history (20 tasks)

🤔 Analyzing with Thoughtbox...
  Creating meta-analysis session...
  Session ID: tbx_sess_refl_20260115_001
  
  Thoughtbox: Analyzing task patterns...
  Thoughtbox: Identifying capability gaps...
  Thoughtbox: Generating improvement proposals...
  Thoughtbox: Critiquing proposals...

📊 Reflection Complete!

Identified 4 improvement opportunities:
[Opportunity list displayed as in FR-004]

Select improvements to implement (e.g., "1,2"): 1,3

Selected: architecture-tradeoff-analysis, context-optimizer

⚙️ Entering DGM improvement loop for 2 capabilities...
[DGM loop begins]
```

---

## References

- [DGM Paper - Section 3](https://arxiv.org/pdf/2505.22954)
- [Thoughtbox Session Analysis](../../thoughtbox/src/sessions/operations.ts)
- [Letta Cloud Metrics API](../../ai_docs/letta-docs/) (if available)

---

**Previous**: [SPEC-DGM-002: Archive System](./SPEC-DGM-002-dgm-archive-system.md)  
**Next**: [SPEC-DGM-004: Co-Evolving Metrics](./SPEC-DGM-004-metrics-co-evolution.md)
