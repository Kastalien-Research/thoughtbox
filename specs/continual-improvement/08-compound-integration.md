# Spec 08: Compound Engineering Integration

**Status**: Draft v0.1
**Generated**: 2026-02-11
**Context**: Continual Self-Improvement System -- Spec 08 of 09
**Parent**: [00-overview.md](./00-overview.md) (Gap 8: Compound Engineering Not Integrated)
**Plugin Version**: compound-engineering v2.31.1 (Every Marketplace)
**Plugin Location**: `~/.claude/plugins/cache/every-marketplace/compound-engineering/2.31.1/`

---

## 1. Problem Statement

The Compound Engineering plugin from Every provides 29 specialized agents, 25 commands, 16 skills, and an MCP server (Context7) -- all installed and available at `~/.claude/plugins/cache/every-marketplace/compound-engineering/2.31.1/`. These tools are designed for a PLOW cycle (Plan, Work, Review, Compound) that systematically compounds engineering knowledge. None of them are wired into the SIL, AgentOps, or the improvement loop infrastructure.

### What is available but unused

| Category | Count | Examples | Current Usage |
|----------|-------|---------|---------------|
| **Review agents** | 15 | `kieran-typescript-reviewer`, `security-sentinel`, `performance-oracle`, `architecture-strategist`, `pattern-recognition-specialist`, `code-simplicity-reviewer` | Available for interactive `/workflows:review` only |
| **Research agents** | 5 | `framework-docs-researcher`, `learnings-researcher`, `best-practices-researcher`, `git-history-analyzer`, `repo-research-analyst` | Available for interactive `/workflows:plan` only |
| **Workflow agents** | 5 | `bug-reproduction-validator`, `spec-flow-analyzer`, `pr-comment-resolver`, `lint`, `every-style-editor` | Available for interactive commands only |
| **Design agents** | 3 | `design-implementation-reviewer`, `design-iterator`, `figma-design-sync` | Not applicable to this project |
| **Docs agents** | 1 | `ankane-readme-writer` | Not applicable to this project |
| **Context7 MCP** | 1 | `resolve-library-id`, `get-library-docs` | Available but not invoked by any pipeline |
| **Workflow commands** | 5 | `/workflows:plan`, `/workflows:work`, `/workflows:review`, `/workflows:compound`, `/workflows:brainstorm` | Interactive use only |
| **Compound-docs skill** | 1 | Structured solution documentation with YAML frontmatter | Interactive use only |

### Concrete failure modes today

1. **SIL Evaluate phase has no specialized reviewers.** The SIL runs `sil-010-main-loop-orchestrator.ts`, which evaluates experimental code changes with a single LLM call. It does not invoke `security-sentinel`, `performance-oracle`, or `kieran-typescript-reviewer`. A change that passes the SIL's generic evaluation might contain a security vulnerability, a performance regression, or a TypeScript anti-pattern that any of these specialized agents would catch.

2. **AgentOps signal collection ignores institutional learnings.** The `collectSignals()` function in `agentops/runner/lib/sources/collect.ts` collects from four external sources (repo, arXiv, RSS, HTML). It does not invoke `learnings-researcher` to search `docs/solutions/` for patterns that relate to the collected signals. It does not invoke `best-practices-researcher` to contextualize signals against current best practices.

3. **Improvement proposals are not validated against architecture.** When AgentOps or the SIL proposes a code change, there is no `architecture-strategist` review to check whether the change aligns with the project's architectural decisions (ADRs, specs). There is no `pattern-recognition-specialist` to identify whether the proposed change introduces an anti-pattern.

4. **Solved problems do not compound.** The `/workflows:compound` command creates structured documentation in `docs/solutions/` with YAML frontmatter. But no pipeline ever invokes it. When the SIL or AgentOps implements a fix, the solution is captured only in a git commit message and a PR description. It never becomes a searchable compound document that future improvement loops can reference.

5. **Context7 documentation lookups are unavailable to headless agents.** The Context7 MCP server provides `resolve-library-id` and `get-library-docs` tools for looking up framework documentation. The SIL's Discovery phase could use this to research external framework patterns, but it has no mechanism to invoke MCP tools.

6. **The PLOW cycle and OODA cycle are not mapped.** The project uses OODA (Observe, Orient, Decide, Act) as its foundational cognitive loop. Compound Engineering uses PLOW (Plan, Work, Review, Compound). These are complementary but their relationship is undefined. Agents do not know when to use which, or how they compose.

### The cost

Each improvement loop iteration rediscovers problems that specialized agents could catch in seconds. Each resolved issue loses its institutional value because no compounding step runs. Each proposal lacks the depth that five research agents running in parallel would provide. The 29 agents are free to run (they are local plugin agents, not API-billed) but they sit idle while the improvement loops reinvent their capabilities from scratch.

---

## 2. Current State Audit

### 2.1 Compound Engineering Plugin Structure

```
~/.claude/plugins/cache/every-marketplace/compound-engineering/2.31.1/
├── .claude-plugin/
│   └── plugin.json              # name, version, mcpServers (context7)
├── agents/
│   ├── review/                  # 15 specialized reviewers
│   │   ├── kieran-typescript-reviewer.md
│   │   ├── security-sentinel.md
│   │   ├── performance-oracle.md
│   │   ├── architecture-strategist.md
│   │   ├── pattern-recognition-specialist.md
│   │   ├── code-simplicity-reviewer.md
│   │   ├── data-integrity-guardian.md
│   │   ├── agent-native-reviewer.md
│   │   ├── schema-drift-detector.md
│   │   ├── data-migration-expert.md
│   │   ├── deployment-verification-agent.md
│   │   ├── kieran-rails-reviewer.md
│   │   ├── kieran-python-reviewer.md
│   │   ├── dhh-rails-reviewer.md
│   │   └── julik-frontend-races-reviewer.md
│   ├── research/                # 5 research agents
│   │   ├── framework-docs-researcher.md
│   │   ├── learnings-researcher.md
│   │   ├── best-practices-researcher.md
│   │   ├── git-history-analyzer.md
│   │   └── repo-research-analyst.md
│   ├── workflow/                # 5 workflow agents
│   │   ├── bug-reproduction-validator.md
│   │   ├── spec-flow-analyzer.md
│   │   ├── pr-comment-resolver.md
│   │   ├── lint.md
│   │   └── every-style-editor.md
│   ├── design/                  # 3 design agents (not relevant)
│   └── docs/                    # 1 docs agent (not relevant)
├── commands/
│   └── workflows/
│       ├── plan.md              # PLOW: Plan phase
│       ├── work.md              # PLOW: Work phase
│       ├── review.md            # PLOW: Review phase
│       ├── compound.md          # PLOW: Compound phase
│       └── brainstorm.md        # Pre-plan exploration
├── skills/
│   ├── compound-docs/           # Structured solution documentation
│   ├── orchestrating-swarms/    # Multi-agent swarm patterns
│   └── ... (14 more skills)
└── README.md
```

### 2.2 Integration Points in the Improvement System

| Integration Point | Current Code | What Compound Agents Could Do |
|-------------------|-------------|-------------------------------|
| **SIL Discovery** | `sil-010-main-loop-orchestrator.ts` calls a discovery agent LLM prompt | `repo-research-analyst` + `learnings-researcher` + `git-history-analyzer` in parallel |
| **SIL Evaluate** | Single LLM evaluation with tier gates | `kieran-typescript-reviewer` + `security-sentinel` + `performance-oracle` + `architecture-strategist` in parallel |
| **AgentOps signal collection** | `collect.ts` gathers from 4 external sources | `best-practices-researcher` + `framework-docs-researcher` to contextualize signals |
| **AgentOps proposal synthesis** | `synthesis.ts` uses single LLM call | `spec-flow-analyzer` to validate proposal completeness |
| **Interactive session post-fix** | No compounding step | `/workflows:compound` to document the solution |
| **PR review in SIL** | PR created, no automated review | `/workflows:review` pipeline with 12+ parallel agents |

### 2.3 PLOW vs OODA Relationship

| PLOW Phase | OODA Phase(s) | When to Use |
|------------|---------------|-------------|
| **Plan** | Observe + Orient | Starting new work. PLOW's Plan is more structured (research agents, spec-flow analysis). Use PLOW when the task has clear deliverables. |
| **Work** | Decide + Act | Executing the plan. PLOW's Work includes worktree isolation and progressive completion. Use PLOW for implementation; use OODA's inner loops for micro-decisions during implementation. |
| **Review** | Observe (of output) | Evaluating completed work. PLOW's Review runs 12+ parallel specialized agents. Use PLOW for comprehensive quality gates; use OODA's single-pass loops for fast iteration feedback. |
| **Compound** | Orient (updating mental model) | After work is done and reviewed. PLOW's Compound creates persistent documentation. Use PLOW whenever a non-trivial problem was solved. Not in OODA -- this is PLOW's unique contribution. |

The key distinction: OODA is a continuous sense-making loop that runs at any speed. PLOW is a sequential workflow for discrete engineering tasks. They compose naturally: PLOW provides the macro-workflow; OODA runs nested inside each PLOW phase for micro-level decisions.

---

## 3. Agent-to-Loop-Phase Mapping

This is the core reference table for which compound agents serve which improvement loop phase.

### 3.1 SIL Integration Map

| SIL Phase | Compound Agent(s) | Role | Invocation Mode |
|-----------|-------------------|------|-----------------|
| **Discovery** | `repo-research-analyst` | Scan codebase for improvement targets using plugin's structured analysis | Parallel with existing discovery agent |
| **Discovery** | `learnings-researcher` | Search `docs/solutions/` for previously documented patterns | Parallel |
| **Discovery** | `git-history-analyzer` | Analyze commit history for recurring fix patterns and hot spots | Parallel |
| **Filter** | `architecture-strategist` | Validate candidate improvements against architectural decisions | Sequential gate |
| **Filter** | `pattern-recognition-specialist` | Identify whether candidates duplicate existing patterns or introduce anti-patterns | Sequential gate |
| **Experiment** | (none -- SIL generates code itself) | -- | -- |
| **Evaluate** | `kieran-typescript-reviewer` | TypeScript-specific code quality review of experimental changes | Parallel review panel |
| **Evaluate** | `security-sentinel` | Security audit of experimental changes | Parallel review panel |
| **Evaluate** | `performance-oracle` | Performance analysis of experimental changes | Parallel review panel |
| **Evaluate** | `code-simplicity-reviewer` | Simplicity and minimalism check | Parallel review panel |
| **Evaluate** | `architecture-strategist` | Architectural alignment check | Parallel review panel |
| **Post-merge** | `/workflows:compound` pattern | Document the improvement as a compound solution | Sequential |

### 3.2 AgentOps Integration Map

| AgentOps Phase | Compound Agent(s) | Role | Invocation Mode |
|----------------|-------------------|------|-----------------|
| **Signal collection** | `best-practices-researcher` | Contextualize external signals against current best practices | Parallel with existing sources |
| **Signal collection** | `framework-docs-researcher` | Enrich signals with framework documentation via Context7 | Parallel |
| **Proposal synthesis** | `spec-flow-analyzer` | Validate proposal completeness and identify gaps | Sequential gate before proposal finalization |
| **Implementation** | `bug-reproduction-validator` | Validate that the problem described in the proposal is reproducible | Pre-implementation gate |
| **Implementation** | `lint` | Run linting on implementation changes | Post-implementation check |
| **Post-implementation** | `/workflows:compound` pattern | Document the implemented proposal as a compound solution | Sequential |

### 3.3 Interactive Session Integration Map

| Session Event | Compound Agent(s) | Role | Trigger |
|---------------|-------------------|------|---------|
| **Problem solved** | `/workflows:compound` pipeline | Document the solution with parallel subagents | Auto-detect "it's fixed" / "working now" or manual invocation |
| **Pre-commit review** | `kieran-typescript-reviewer` + `security-sentinel` | Quick parallel review of staged changes | `pre-commit` hook or manual `/workflows:review` |
| **Research task** | `framework-docs-researcher` + `best-practices-researcher` | Parallel external research | Manual `/workflows:plan` or `/deepen-plan` |
| **Bug investigation** | `bug-reproduction-validator` + `learnings-researcher` | Structured reproduction + institutional knowledge search | Manual `/reproduce-bug` |

---

## 4. Implementation Design

### 4.1 Compound Agent Invocation Layer

The core challenge: compound agents are defined as markdown agent definition files in the plugin directory. They are designed to be invoked by Claude Code's `Task` tool during interactive sessions. The SIL and AgentOps run as headless Agent SDK scripts -- they cannot directly invoke `Task` to spawn a compound agent.

**Approach: Wrapper functions that read agent definitions and inject them as system prompts into Agent SDK calls.**

```typescript
// src/compound/agent-invoker.ts

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '@anthropic-ai/claude-agent-sdk';

const PLUGIN_ROOT = join(
  process.env.HOME || '~',
  '.claude/plugins/cache/every-marketplace/compound-engineering/2.31.1'
);

interface AgentSpec {
  name: string;
  category: 'review' | 'research' | 'workflow' | 'design' | 'docs';
  definitionPath: string;
}

const AGENTS: Record<string, AgentSpec> = {
  'kieran-typescript-reviewer': {
    name: 'kieran-typescript-reviewer',
    category: 'review',
    definitionPath: 'agents/review/kieran-typescript-reviewer.md',
  },
  'security-sentinel': {
    name: 'security-sentinel',
    category: 'review',
    definitionPath: 'agents/review/security-sentinel.md',
  },
  'performance-oracle': {
    name: 'performance-oracle',
    category: 'review',
    definitionPath: 'agents/review/performance-oracle.md',
  },
  'architecture-strategist': {
    name: 'architecture-strategist',
    category: 'review',
    definitionPath: 'agents/review/architecture-strategist.md',
  },
  'pattern-recognition-specialist': {
    name: 'pattern-recognition-specialist',
    category: 'review',
    definitionPath: 'agents/review/pattern-recognition-specialist.md',
  },
  'code-simplicity-reviewer': {
    name: 'code-simplicity-reviewer',
    category: 'review',
    definitionPath: 'agents/review/code-simplicity-reviewer.md',
  },
  'repo-research-analyst': {
    name: 'repo-research-analyst',
    category: 'research',
    definitionPath: 'agents/research/repo-research-analyst.md',
  },
  'learnings-researcher': {
    name: 'learnings-researcher',
    category: 'research',
    definitionPath: 'agents/research/learnings-researcher.md',
  },
  'best-practices-researcher': {
    name: 'best-practices-researcher',
    category: 'research',
    definitionPath: 'agents/research/best-practices-researcher.md',
  },
  'framework-docs-researcher': {
    name: 'framework-docs-researcher',
    category: 'research',
    definitionPath: 'agents/research/framework-docs-researcher.md',
  },
  'git-history-analyzer': {
    name: 'git-history-analyzer',
    category: 'research',
    definitionPath: 'agents/research/git-history-analyzer.md',
  },
  'bug-reproduction-validator': {
    name: 'bug-reproduction-validator',
    category: 'workflow',
    definitionPath: 'agents/workflow/bug-reproduction-validator.md',
  },
  'spec-flow-analyzer': {
    name: 'spec-flow-analyzer',
    category: 'workflow',
    definitionPath: 'agents/workflow/spec-flow-analyzer.md',
  },
  'lint': {
    name: 'lint',
    category: 'workflow',
    definitionPath: 'agents/workflow/lint.md',
  },
};

/**
 * Load a compound agent's definition from the plugin directory.
 */
export function loadAgentDefinition(agentName: string): string {
  const spec = AGENTS[agentName];
  if (!spec) {
    throw new Error(`Unknown compound agent: ${agentName}. Available: ${Object.keys(AGENTS).join(', ')}`);
  }
  const fullPath = join(PLUGIN_ROOT, spec.definitionPath);
  return readFileSync(fullPath, 'utf-8');
}

/**
 * Invoke a compound agent with a task prompt.
 * Returns the agent's text response.
 */
export async function invokeCompoundAgent(
  agentName: string,
  taskPrompt: string,
  opts: { maxTokens?: number; budget?: number } = {}
): Promise<string> {
  const definition = loadAgentDefinition(agentName);

  const response = await query({
    system: definition,
    prompt: taskPrompt,
    maxTokens: opts.maxTokens ?? 4096,
    maxBudgetUsd: opts.budget ?? 0.50,
  });

  return response.text;
}

/**
 * Invoke multiple compound agents in parallel.
 * Returns a map of agent name to response.
 */
export async function invokeCompoundAgentsParallel(
  agents: Array<{ name: string; taskPrompt: string }>,
  opts: { maxTokensPerAgent?: number; budgetPerAgent?: number } = {}
): Promise<Record<string, string>> {
  const results = await Promise.allSettled(
    agents.map(async ({ name, taskPrompt }) => {
      const response = await invokeCompoundAgent(name, taskPrompt, {
        maxTokens: opts.maxTokensPerAgent,
        budget: opts.budgetPerAgent,
      });
      return { name, response };
    })
  );

  const output: Record<string, string> = {};
  for (const result of results) {
    if (result.status === 'fulfilled') {
      output[result.value.name] = result.value.response;
    } else {
      output[(result as any).reason?.agentName ?? 'unknown'] =
        `ERROR: ${result.reason?.message ?? 'Unknown error'}`;
    }
  }
  return output;
}
```

### 4.2 SIL Evaluate Phase Enhancement

The SIL's Evaluate phase currently runs a single LLM evaluation. This enhancement adds a parallel compound agent review panel.

**Location**: Modified `scripts/agents/sil-010-main-loop-orchestrator.ts`

```typescript
// In runEvaluatePhase, after the existing single-agent evaluation:

import { invokeCompoundAgentsParallel } from '../../src/compound/agent-invoker.js';

async function runCompoundReviewPanel(
  experimentDiff: string,
  affectedFiles: string[]
): Promise<CompoundReviewResult> {
  const fileList = affectedFiles.join('\n');

  const reviewPrompts = [
    {
      name: 'kieran-typescript-reviewer',
      taskPrompt: `Review the following code changes for TypeScript best practices, type safety, and coding standards.\n\n## Changed Files\n${fileList}\n\n## Diff\n${experimentDiff}`,
    },
    {
      name: 'security-sentinel',
      taskPrompt: `Perform a security audit of the following code changes. Check for injection vulnerabilities, authentication/authorization issues, data exposure, and common security anti-patterns.\n\n## Changed Files\n${fileList}\n\n## Diff\n${experimentDiff}`,
    },
    {
      name: 'performance-oracle',
      taskPrompt: `Analyze the following code changes for performance implications. Check for N+1 queries, unnecessary allocations, blocking operations, and performance anti-patterns.\n\n## Changed Files\n${fileList}\n\n## Diff\n${experimentDiff}`,
    },
    {
      name: 'architecture-strategist',
      taskPrompt: `Evaluate the following code changes for architectural alignment. Check module boundaries, dependency directions, separation of concerns, and adherence to the project's architectural decisions.\n\n## Changed Files\n${fileList}\n\n## Diff\n${experimentDiff}`,
    },
    {
      name: 'code-simplicity-reviewer',
      taskPrompt: `Review the following code changes for simplicity and minimalism. Is there unnecessary complexity? Can the solution be expressed more simply?\n\n## Changed Files\n${fileList}\n\n## Diff\n${experimentDiff}`,
    },
  ];

  const results = await invokeCompoundAgentsParallel(reviewPrompts, {
    maxTokensPerAgent: 2048,
    budgetPerAgent: 0.25,
  });

  // Parse each reviewer's response for pass/fail signals
  const verdicts = Object.entries(results).map(([agent, response]) => {
    const hasBlocker = /\b(CRITICAL|BLOCKS?\s*MERGE|P1|VULNERABILITY|SECURITY\s*ISSUE)\b/i.test(response);
    const hasWarning = /\b(WARNING|IMPORTANT|P2|CONCERN|SHOULD\s*FIX)\b/i.test(response);
    return {
      agent,
      passed: !hasBlocker,
      hasWarnings: hasWarning,
      summary: response.slice(0, 500),
      fullResponse: response,
    };
  });

  const allPassed = verdicts.every(v => v.passed);
  const blockingAgents = verdicts.filter(v => !v.passed).map(v => v.agent);

  return {
    passed: allPassed,
    verdicts,
    blockingAgents,
    reviewCost: reviewPrompts.length * 0.25,
  };
}
```

### 4.3 AgentOps Signal Enrichment

The `collectSignals()` function gains a new internal source: compound research agents that contextualize collected signals.

**Location**: Modified `agentops/runner/lib/sources/collect.ts`

```typescript
// === 5. Compound Research Enrichment ===
// After external signal collection, enrich with institutional context

if (allSignals.length > 0) {
  const enrichStart = Date.now();
  sourcesAttempted.push('compound-research');
  try {
    const { invokeCompoundAgentsParallel } = await import(
      '../../../../src/compound/agent-invoker.js'
    );

    const signalSummary = allSignals
      .slice(0, 10)
      .map(s => `- ${s.title}: ${s.summary?.slice(0, 100) ?? ''}`)
      .join('\n');

    const enrichmentResults = await invokeCompoundAgentsParallel([
      {
        name: 'learnings-researcher',
        taskPrompt: `Given these recent development signals, search docs/solutions/ for any previously documented patterns that relate. Return only relevant matches.\n\nSignals:\n${signalSummary}`,
      },
      {
        name: 'best-practices-researcher',
        taskPrompt: `Given these recent development signals, provide brief context about current best practices that relate to each signal. Focus on actionable insights.\n\nSignals:\n${signalSummary}`,
      },
    ], { budgetPerAgent: 0.25 });

    // Convert enrichment results into internal signals
    for (const [agentName, response] of Object.entries(enrichmentResults)) {
      if (!response.startsWith('ERROR:') && response.length > 50) {
        allSignals.push({
          source: `compound:${agentName}`,
          title: `Institutional context from ${agentName}`,
          url: `internal:compound-enrichment`,
          summary: response.slice(0, 500),
          published_at: new Date().toISOString(),
          tags: ['compound-enrichment', 'internal'],
        });
      }
    }

    sourcesSucceeded.push('compound-research');
    signalsBySource['compound-research'] = Object.keys(enrichmentResults).length;
    elapsedMsBySource['compound-research'] = Date.now() - enrichStart;
    console.log(`  ✓ compound-research: ${Object.keys(enrichmentResults).length} enrichments`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    sourcesFailed.push({ source: 'compound-research', error: msg });
    elapsedMsBySource['compound-research'] = Date.now() - enrichStart;
    console.warn(`  ✗ compound-research: ${msg}`);
  }
}
```

### 4.4 Compound Knowledge Compounding

When any improvement loop implements a non-trivial change, automatically run the compound documentation pattern to capture the solution.

**Location**: New file `src/compound/compound-after-merge.ts`

```typescript
// src/compound/compound-after-merge.ts

import { invokeCompoundAgentsParallel, invokeCompoundAgent } from './agent-invoker.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface MergeContext {
  source: 'sil' | 'agentops' | 'interactive';
  prNumber?: number;
  title: string;
  diff: string;
  filesChanged: string[];
  discoveryContext?: string;
  evaluationResult?: string;
}

/**
 * Run the compound documentation pattern after a successful improvement merge.
 * Mirrors /workflows:compound but adapted for headless execution.
 */
export async function compoundAfterMerge(ctx: MergeContext): Promise<string> {
  // Phase 1: Parallel research (mirrors /workflows:compound's Phase 1)
  const researchResults = await invokeCompoundAgentsParallel([
    {
      name: 'learnings-researcher',
      taskPrompt: `A ${ctx.source} improvement was just merged: "${ctx.title}"\n\nFiles changed: ${ctx.filesChanged.join(', ')}\n\nSearch docs/solutions/ for related documented patterns. Return any relevant cross-references.`,
    },
    {
      name: 'repo-research-analyst',
      taskPrompt: `Analyze this merged improvement for its context within the codebase.\n\nTitle: ${ctx.title}\nDiff:\n${ctx.diff.slice(0, 3000)}\n\nIdentify: the problem that was solved, the approach taken, and which modules/patterns were affected.`,
    },
    {
      name: 'pattern-recognition-specialist',
      taskPrompt: `Analyze this code change for patterns. Is this a new pattern? Does it modify an existing one? Could it apply to other parts of the codebase?\n\nTitle: ${ctx.title}\nDiff:\n${ctx.diff.slice(0, 3000)}`,
    },
  ], { budgetPerAgent: 0.25 });

  // Phase 2: Assemble compound document
  const category = detectCategory(ctx);
  const slug = ctx.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-${slug}.md`;
  const dirPath = join('docs', 'solutions', category);
  const filePath = join(dirPath, filename);

  const content = assembleCompoundDoc({
    title: ctx.title,
    source: ctx.source,
    date,
    category,
    prNumber: ctx.prNumber,
    researchResults,
    diff: ctx.diff,
    filesChanged: ctx.filesChanged,
    discoveryContext: ctx.discoveryContext,
    evaluationResult: ctx.evaluationResult,
  });

  mkdirSync(dirPath, { recursive: true });
  writeFileSync(filePath, content, 'utf-8');

  return filePath;
}

function detectCategory(ctx: MergeContext): string {
  const combined = `${ctx.title} ${ctx.diff}`.toLowerCase();
  if (/secur|auth|vulnerab|inject/.test(combined)) return 'security-issues';
  if (/perf|slow|n\+1|cache|latency/.test(combined)) return 'performance-issues';
  if (/test|spec|assert|expect/.test(combined)) return 'test-failures';
  if (/migrat|schema|database|sql/.test(combined)) return 'database-issues';
  if (/build|compil|bundle|deploy/.test(combined)) return 'build-errors';
  if (/refactor|extract|simplif/.test(combined)) return 'refactoring';
  return 'integration-issues';
}

function assembleCompoundDoc(parts: {
  title: string;
  source: string;
  date: string;
  category: string;
  prNumber?: number;
  researchResults: Record<string, string>;
  diff: string;
  filesChanged: string[];
  discoveryContext?: string;
  evaluationResult?: string;
}): string {
  return `---
title: "${parts.title}"
date: ${parts.date}
category: ${parts.category}
source: ${parts.source}
${parts.prNumber ? `pr: ${parts.prNumber}` : ''}
tags: [${parts.source}, improvement-loop, compound]
---

# ${parts.title}

## Problem

${parts.discoveryContext ?? 'Discovered by the improvement loop.'}

## Solution

### Files Changed

${parts.filesChanged.map(f => `- \`${f}\``).join('\n')}

### Key Changes

\`\`\`diff
${parts.diff.slice(0, 2000)}
\`\`\`

## Analysis

### Repository Context (repo-research-analyst)

${parts.researchResults['repo-research-analyst'] ?? 'N/A'}

### Pattern Analysis (pattern-recognition-specialist)

${parts.researchResults['pattern-recognition-specialist'] ?? 'N/A'}

### Related Solutions (learnings-researcher)

${parts.researchResults['learnings-researcher'] ?? 'No related solutions found.'}

${parts.evaluationResult ? `## Evaluation\n\n${parts.evaluationResult}` : ''}

## Prevention

How to prevent similar issues or apply this pattern proactively in the future.

## References

${parts.prNumber ? `- PR: #${parts.prNumber}` : ''}
- Source: ${parts.source} improvement loop
- Date: ${parts.date}
`;
}
```

### 4.5 Context7 Integration for Discovery

The Context7 MCP server (`resolve-library-id` and `get-library-docs`) is bundled with the plugin and accessible via HTTP at `https://mcp.context7.com/mcp`. For headless agents, we create a direct HTTP client.

**Location**: New file `src/compound/context7-client.ts`

```typescript
// src/compound/context7-client.ts

const CONTEXT7_URL = 'https://mcp.context7.com/mcp';

/**
 * Resolve a library name to a Context7 library ID.
 */
export async function resolveLibraryId(libraryName: string): Promise<string | null> {
  try {
    const response = await fetch(CONTEXT7_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'resolve-library-id',
          arguments: { libraryName },
        },
      }),
    });
    const data = await response.json();
    return data?.result?.content?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

/**
 * Get documentation for a library by its Context7 ID.
 */
export async function getLibraryDocs(
  libraryId: string,
  topic?: string
): Promise<string | null> {
  try {
    const response = await fetch(CONTEXT7_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'get-library-docs',
          arguments: {
            context7CompatibleLibraryID: libraryId,
            ...(topic ? { topic } : {}),
          },
        },
      }),
    });
    const data = await response.json();
    return data?.result?.content?.[0]?.text ?? null;
  } catch {
    return null;
  }
}
```

This client can be used by the SIL Discovery phase to look up documentation for libraries referenced in improvement targets, and by AgentOps to enrich signal context with authoritative framework documentation.

### 4.6 PLOW Cycle as a Standard Workflow Pattern

Define the mapping between PLOW and existing improvement loop phases so agents can follow either pattern where appropriate.

**Location**: New rule file `.claude/rules/plow-ooda-composition.md`

```markdown
## PLOW + OODA Composition

Two workflow patterns are available. They are complementary, not competing.

### When to Use OODA

Use OODA (Observe, Orient, Decide, Act) when:
- Exploring an unfamiliar problem space
- Making micro-decisions within a larger task
- Debugging (fast cycles of hypothesis -> test -> observe)
- Monitoring system health
- Any situation where the next step depends on what you just learned

OODA is the default cognitive loop. It runs at any speed.

### When to Use PLOW

Use PLOW (Plan, Work, Review, Compound) when:
- Implementing a discrete, well-scoped task (feature, fix, refactor)
- The task will produce code changes that need quality assurance
- You want parallel specialized review (12+ compound agents)
- A non-trivial problem was solved and should be documented
- Working through an improvement loop iteration (SIL, AgentOps)

PLOW is a structured workflow for engineering tasks. Each phase has specific compound agents.

### Composition Pattern

```
PLOW Task Workflow
├── Plan Phase
│   ├── OODA: Research (repo-research-analyst, learnings-researcher)
│   ├── OODA: Explore (best-practices-researcher, framework-docs-researcher)
│   └── OODA: Validate (spec-flow-analyzer)
├── Work Phase
│   ├── OODA: Implement (fast decide-act cycles)
│   ├── OODA: Test (verify each change)
│   └── OODA: Iterate (respond to failures)
├── Review Phase
│   ├── Parallel compound review panel
│   │   ├── kieran-typescript-reviewer
│   │   ├── security-sentinel
│   │   ├── performance-oracle
│   │   ├── architecture-strategist
│   │   └── code-simplicity-reviewer
│   └── OODA: Address findings (iterate on feedback)
└── Compound Phase
    ├── Document solution (compound-docs)
    ├── Update knowledge layer (KAL ingestion)
    └── Emit signal (cross-loop propagation)
```

### Mapping to Improvement Loops

| Loop | Default Pattern | Compound Enhancement |
|------|----------------|---------------------|
| SIL Discovery | OODA (explore codebase) | PLOW Plan (parallel research agents) |
| SIL Filter | OODA (evaluate candidates) | PLOW Review (architecture-strategist gate) |
| SIL Experiment | OODA (implement changes) | PLOW Work (structured execution) |
| SIL Evaluate | OODA (check results) | PLOW Review (parallel review panel) |
| SIL Post-merge | None | PLOW Compound (document solution) |
| AgentOps Collect | OODA (gather signals) | PLOW Plan (research agent enrichment) |
| AgentOps Synthesize | OODA (generate proposals) | PLOW Plan (spec-flow-analyzer validation) |
| Interactive fix | OODA (debug and fix) | PLOW Compound (document after fix) |
```

---

## 5. Knowledge Compounding Pipeline

The most novel capability Compound Engineering brings is the `/workflows:compound` pattern -- automatic documentation of solved problems. This section describes how solutions from all three loops enter the knowledge layer.

### 5.1 Compound Document Lifecycle

```
Improvement merged (SIL, AgentOps, or interactive)
        │
        ▼
compound-after-merge.ts runs
        │
        ├── Parallel research (3 agents)
        │   ├── learnings-researcher (cross-reference existing solutions)
        │   ├── repo-research-analyst (codebase context)
        │   └── pattern-recognition-specialist (pattern analysis)
        │
        ├── Assemble compound document
        │   └── Write to docs/solutions/{category}/{date}-{slug}.md
        │
        ├── KAL ingestion (Spec 02 dependency)
        │   ├── Create KG entity for the solution
        │   ├── Cross-reference to Beads issues, git commits
        │   └── Update MEMORY.md if learning is a gotcha/behavioral rule
        │
        └── Signal emission (Spec 01 dependency)
            └── Emit "learning" signal with solution metadata
                └── Next AgentOps run picks up via learnings-researcher
```

### 5.2 Searchability

Compound documents use YAML frontmatter with standardized fields that `learnings-researcher` can search:

```yaml
---
title: "Fix hub_wait race condition under concurrent agent access"
date: 2026-02-15
category: integration-issues
source: sil
pr: 145
tags: [sil, improvement-loop, compound, hub, concurrency, race-condition]
---
```

The `learnings-researcher` agent is specifically designed to search `docs/solutions/` for patterns matching a query. By placing improvement loop outputs into this directory with proper frontmatter, we make every improvement discoverable by future improvement cycles.

### 5.3 Compound Knowledge Feedback Loop

```
Session learns pattern → MEMORY.md → AgentOps signal
    ↓
AgentOps proposes fix → Human approves → Implementation
    ↓
SIL picks up as seeded discovery → Implements → Evaluates
    ↓
compound-after-merge.ts → docs/solutions/ document
    ↓
learnings-researcher finds it → Next AgentOps enrichment
    ↓
Future session references it → Knowledge compounds
```

Each documented solution becomes a reusable asset. The first time an issue is solved, it costs research time. The second time, `learnings-researcher` finds the prior solution in `docs/solutions/` and the fix takes minutes.

---

## 6. Task-Type Agent Selection

For interactive sessions, provide automatic compound agent selection based on the type of task being performed.

### 6.1 Selection Rules

| Task Type | Detection Signal | Agents to Invoke |
|-----------|-----------------|------------------|
| **Code review** | `git diff` has staged changes, or PR URL provided | `kieran-typescript-reviewer`, `security-sentinel`, `performance-oracle`, `architecture-strategist`, `code-simplicity-reviewer`, `pattern-recognition-specialist` |
| **Planning** | User describes a feature or improvement | `repo-research-analyst`, `learnings-researcher`, `best-practices-researcher`, `framework-docs-researcher`, `spec-flow-analyzer` |
| **Bug fix** | Error message, stack trace, "bug" keyword | `bug-reproduction-validator`, `learnings-researcher`, `git-history-analyzer` |
| **Architecture decision** | "architecture", "ADR", "design" keywords | `architecture-strategist`, `pattern-recognition-specialist`, `best-practices-researcher` |
| **Performance investigation** | "slow", "performance", "latency" keywords | `performance-oracle`, `git-history-analyzer`, `repo-research-analyst` |
| **Security audit** | "security", "auth", "vulnerability" keywords | `security-sentinel`, `architecture-strategist` |
| **Post-fix documentation** | "fixed", "working now", "solved" signals | `/workflows:compound` pipeline (5 parallel subagents) |
| **Dependency update** | Package version changes | `framework-docs-researcher` (via Context7), `best-practices-researcher` |

### 6.2 Agent Selection Function

```typescript
// src/compound/select-agents.ts

type TaskType =
  | 'code-review'
  | 'planning'
  | 'bug-fix'
  | 'architecture'
  | 'performance'
  | 'security'
  | 'post-fix'
  | 'dependency-update';

const AGENT_SELECTION: Record<TaskType, string[]> = {
  'code-review': [
    'kieran-typescript-reviewer',
    'security-sentinel',
    'performance-oracle',
    'architecture-strategist',
    'code-simplicity-reviewer',
    'pattern-recognition-specialist',
  ],
  'planning': [
    'repo-research-analyst',
    'learnings-researcher',
    'best-practices-researcher',
    'framework-docs-researcher',
    'spec-flow-analyzer',
  ],
  'bug-fix': [
    'bug-reproduction-validator',
    'learnings-researcher',
    'git-history-analyzer',
  ],
  'architecture': [
    'architecture-strategist',
    'pattern-recognition-specialist',
    'best-practices-researcher',
  ],
  'performance': [
    'performance-oracle',
    'git-history-analyzer',
    'repo-research-analyst',
  ],
  'security': [
    'security-sentinel',
    'architecture-strategist',
  ],
  'post-fix': [
    'learnings-researcher',
    'repo-research-analyst',
    'pattern-recognition-specialist',
  ],
  'dependency-update': [
    'framework-docs-researcher',
    'best-practices-researcher',
  ],
};

export function selectAgents(taskType: TaskType): string[] {
  return AGENT_SELECTION[taskType] ?? [];
}

export function detectTaskType(context: string): TaskType {
  const lower = context.toLowerCase();
  if (/\b(review|pr\s*#|pull\s*request|staged\s*changes)\b/.test(lower)) return 'code-review';
  if (/\b(fixed|working\s*now|solved|it\'s\s*fixed)\b/.test(lower)) return 'post-fix';
  if (/\b(bug|error|crash|stack\s*trace|exception)\b/.test(lower)) return 'bug-fix';
  if (/\b(secur|auth|vulnerab|inject|csrf|xss)\b/.test(lower)) return 'security';
  if (/\b(slow|perf|latenc|n\+1|cache|optim)\b/.test(lower)) return 'performance';
  if (/\b(architect|adr|design|structure|module\s*boundar)\b/.test(lower)) return 'architecture';
  if (/\b(updat|upgrad|version|deprecat|depend)\b/.test(lower)) return 'dependency-update';
  return 'planning';
}
```

---

## 7. Implementation Plan

### Phase 0: Foundation (Week 2, Day 1-2)

**Goal**: Agent invocation layer working.

1. Create `src/compound/agent-invoker.ts` with `loadAgentDefinition`, `invokeCompoundAgent`, `invokeCompoundAgentsParallel`.
2. Create `src/compound/context7-client.ts` with `resolveLibraryId`, `getLibraryDocs`.
3. Create `src/compound/select-agents.ts` with task-type detection and agent selection.
4. Tests:
   - Unit test: agent definition loading from plugin path
   - Unit test: task type detection
   - Integration test: invoke a single compound agent with a test prompt

**Exit criteria**: `invokeCompoundAgent('kieran-typescript-reviewer', 'Review this: const x = 1')` returns a meaningful response.

### Phase 1: SIL Integration (Week 2, Day 3-4)

**Goal**: SIL Evaluate phase uses compound review panel.

5. Modify `scripts/agents/sil-010-main-loop-orchestrator.ts`:
   - Add `runCompoundReviewPanel()` call after existing evaluation
   - Compound review is an additional gate, not a replacement for existing evaluation
   - If any compound reviewer flags a blocker, the experiment fails
6. Create `src/compound/compound-after-merge.ts` for post-merge documentation.
7. Wire post-merge compounding into SIL's success path.
8. Tests:
   - Integration test: compound review panel with a mock diff
   - Unit test: blocker detection from reviewer responses
   - Unit test: compound document assembly

**Exit criteria**: A SIL run that produces experimental changes gets reviewed by 5 compound agents in parallel. A successful merge creates a `docs/solutions/` document.

### Phase 2: AgentOps Integration (Week 3, Day 1-2)

**Goal**: AgentOps signal collection includes compound research enrichment.

9. Modify `agentops/runner/lib/sources/collect.ts`:
   - Add compound research enrichment after existing signal collection
   - `learnings-researcher` and `best-practices-researcher` contextualize signals
10. Modify `agentops/runner/lib/synthesis.ts` (or post-synthesis step):
    - Add `spec-flow-analyzer` validation of generated proposals
11. Wire post-implementation compounding into the AgentOps approval workflow.
12. Tests:
    - Integration test: compound enrichment produces internal signals
    - Unit test: enrichment degrades gracefully if plugin is not installed
    - Unit test: compound document creation after AgentOps implementation

**Exit criteria**: An AgentOps daily run's signal collection includes enrichment from `learnings-researcher` and `best-practices-researcher`. Implemented proposals produce compound documents.

### Phase 3: Interactive Integration (Week 3, Day 3-4)

**Goal**: Interactive sessions can invoke compound agents based on task type.

13. Create `.claude/rules/plow-ooda-composition.md` with the composition patterns.
14. Create `.claude/skills/compound-review/SKILL.md` -- a thin wrapper skill that:
    - Detects task type from user context
    - Selects appropriate compound agents
    - Invokes them in parallel
    - Synthesizes results
15. Update CLAUDE.md with a brief note about compound engineering availability.
16. Tests:
    - Manual test: invoke `/compound-review` in an interactive session
    - Verify task type detection selects correct agents for different prompts

**Exit criteria**: An interactive session user can invoke compound review agents via a skill, and the PLOW/OODA composition rule is available to guide agent behavior.

### Phase 4: Knowledge Feedback Loop (Week 4)

**Goal**: Compound documents feed back into improvement loops.

17. Wire compound document creation into the ULC signal store (Spec 01 dependency):
    - After `compound-after-merge.ts` writes a document, emit a `learning` signal
18. Wire into KAL ingestion (Spec 02 dependency):
    - After a compound document is created, create a KG entity and cross-references
19. Verify end-to-end: compound document from SIL merge is found by `learnings-researcher` in the next AgentOps run.

**Exit criteria**: A documented solution from one improvement loop cycle is discoverable by the next cycle's research agents.

---

## 8. Cost Model

All compound agents run as Agent SDK calls using the project's Anthropic API key. Costs are per-invocation, not per-plugin.

### 8.1 Per-Agent Cost

| Agent Type | Typical Tokens (in/out) | Estimated Cost |
|------------|------------------------|----------------|
| Review agent (with diff) | ~3000 in / ~1000 out | $0.10-$0.25 |
| Research agent (with query) | ~2000 in / ~1500 out | $0.10-$0.20 |
| Workflow agent (with context) | ~2000 in / ~800 out | $0.08-$0.15 |

### 8.2 Per-Loop-Phase Cost

| Loop Phase | Agents Invoked | Parallel? | Total Cost |
|------------|---------------|-----------|------------|
| SIL Evaluate (compound review panel) | 5 review agents | Yes | $0.50-$1.25 |
| SIL Post-merge (compound documentation) | 3 research agents | Yes | $0.30-$0.60 |
| AgentOps signal enrichment | 2 research agents | Yes | $0.20-$0.40 |
| AgentOps proposal validation | 1 workflow agent | No | $0.08-$0.15 |
| Interactive compound review | 3-6 agents (task-dependent) | Yes | $0.30-$1.50 |

### 8.3 Weekly Cost Impact

| Component | Frequency | Cost per Invocation | Weekly Total |
|-----------|-----------|-------------------|--------------|
| SIL compound evaluation | 1x/week | $0.50-$1.25 | $0.50-$1.25 |
| SIL compound documentation | 0-3x/week | $0.30-$0.60 | $0.00-$1.80 |
| AgentOps enrichment | 7x/week | $0.20-$0.40 | $1.40-$2.80 |
| AgentOps validation | 7x/week | $0.08-$0.15 | $0.56-$1.05 |
| Interactive compound | 5-10x/week | $0.30-$1.50 | $1.50-$15.00 |
| **Total** | | | **$3.96-$21.90** |

This is well within the existing $80/week system budget (Spec 01). The compound agents add approximately $4-$22/week of additional cost for substantially richer evaluation, research, and documentation.

---

## 9. Governance and Safety

### 9.1 Plugin Version Pinning

The agent invoker reads definitions from a specific plugin version path (`2.31.1`). When the plugin updates, the path changes. The invoker must gracefully handle:
- Plugin not installed (return empty results, log warning)
- Plugin version change (detect installed version from `installed_plugins.json`)
- Agent definition format change (parse errors caught, individual agent failures don't block the panel)

```typescript
function resolvePluginPath(): string | null {
  const configPath = join(process.env.HOME || '~', '.claude/plugins/installed_plugins.json');
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    const entry = config.plugins['compound-engineering@every-marketplace']?.[0];
    return entry?.installPath ?? null;
  } catch {
    return null;
  }
}
```

### 9.2 Budget Guards

Each compound agent invocation has a per-agent budget cap (default $0.50). The `invokeCompoundAgentsParallel` function enforces a total panel budget as well:

```typescript
const totalBudget = agents.length * (opts.budgetPerAgent ?? 0.50);
if (totalBudget > 5.0) {
  throw new Error(
    `Compound review panel budget $${totalBudget} exceeds $5.00 safety limit. ` +
    `Reduce agent count or per-agent budget.`
  );
}
```

### 9.3 Compound Agents Cannot Modify Code

Compound agents invoked via the Agent SDK `query()` function receive only read access. They analyze diffs and return text recommendations. They do not have tool access to modify files. The only write operation is `compound-after-merge.ts` writing to `docs/solutions/`, which is documentation, not product code.

### 9.4 Failure Isolation

Each compound agent runs independently. If `security-sentinel` fails (timeout, API error, malformed response), the other 4 review agents still complete. The review panel reports partial results with a warning about the failed agent, rather than failing the entire evaluation.

### 9.5 Scope Constraint

This integration does NOT:
- Modify the compound engineering plugin itself
- Require the plugin to be installed (graceful degradation)
- Give compound agents access to Thoughtbox MCP tools or Hub operations
- Allow compound agents to make code changes
- Replace existing SIL or AgentOps evaluation logic (compound review is additive)

---

## 10. Success Criteria

### Functional Requirements

| ID | Requirement | Verification |
|----|-------------|-------------|
| F1 | Compound agents can be invoked from headless Agent SDK scripts | Integration test: invoke agent from `scripts/agents/` context |
| F2 | SIL Evaluate phase runs 5 compound reviewers in parallel | SIL run log shows 5 parallel compound reviews |
| F3 | SIL post-merge creates a compound document in `docs/solutions/` | File exists with correct YAML frontmatter |
| F4 | AgentOps signal collection includes compound research enrichment | Daily run log shows `compound-research` source |
| F5 | Compound documents are discoverable by `learnings-researcher` | Manual test: create a compound doc, run learnings-researcher |
| F6 | Context7 client can resolve library IDs and fetch docs | Integration test against Context7 HTTP endpoint |
| F7 | Task type detection selects appropriate agents | Unit test: 8 task types map to correct agent sets |
| F8 | Graceful degradation when plugin is not installed | Test: unset plugin path, verify no errors, empty results |

### Quantitative Targets (3-month horizon)

| Metric | Baseline (current) | Target |
|--------|-------------------|--------|
| Compound agents invoked per SIL iteration | 0 | 5+ |
| Compound documents created per week | 0 | 2-5 |
| AgentOps signals with compound enrichment | 0 | 7/day |
| Security issues caught by compound review | Unknown | Track as new metric |
| Compound docs referenced by learnings-researcher | 0 | 50%+ re-use within 30 days |
| Mean compound review panel latency | N/A | < 60 seconds (parallel) |

---

## 11. Dependencies

### Required (blocks implementation)

| Dependency | Why | Status |
|-----------|-----|--------|
| `compound-engineering` plugin installed | Agent definitions must be readable | Installed (v2.31.1) |
| `@anthropic-ai/claude-agent-sdk` | For `query()` in headless invocation | Available in `package.json` |
| `scripts/agents/sil-010-main-loop-orchestrator.ts` | SIL integration point | Exists |
| `agentops/runner/lib/sources/collect.ts` | AgentOps integration point | Exists |

### Soft (enhances but does not block)

| Dependency | Why | Status |
|-----------|-----|--------|
| [01-unified-loop-controller.md](./01-unified-loop-controller.md) | Signal emission from compound documents enters cross-loop flow | Not yet implemented |
| [02-knowledge-accumulation-layer.md](./02-knowledge-accumulation-layer.md) | KAL ingestion creates KG entities from compound docs | Not yet implemented |
| [05-evaluation-harness.md](./05-evaluation-harness.md) | Compound review results feed into the evaluation harness | Not yet implemented |
| Context7 HTTP endpoint | For `framework-docs-researcher` enrichment in headless context | Available (public) |
| `docs/solutions/` directory | For compound document storage | May not exist yet |

---

## 12. Risks

### R1: Plugin Path Instability

**Risk**: The compound engineering plugin updates frequently (v2.31.1 as of today). Plugin updates change the install path. Hardcoded paths will break.

**Mitigation**: The `resolvePluginPath()` function reads `installed_plugins.json` dynamically. If the path is not found, compound features degrade gracefully (empty results, logged warning). The system never crashes on a missing plugin.

### R2: Agent Definition API Drift

**Risk**: Agent definitions are markdown files with no formal schema. Every could change the format, add new frontmatter fields, or restructure the content. Our system prompt injection depends on reading these files verbatim.

**Mitigation**: Agent definitions are treated as opaque system prompts -- we inject them as-is into `query()`. Format changes only matter if they break Claude's ability to follow the instructions. We test with the latest installed version and pin to a minimum known-good version in the version check.

### R3: Compound Review Noise

**Risk**: Five parallel reviewers generate verbose output. If reviewers flag minor style issues as "warnings," the SIL may produce too many false-positive failures. The Evaluate phase could become a bottleneck rather than a quality gate.

**Mitigation**: Only P1 (CRITICAL/BLOCKS MERGE) findings from compound reviewers fail the evaluation. P2 and P3 findings are recorded in the compound document but do not block. The blocker detection regex is conservative: it matches only explicit critical-severity keywords. The meta-fitness tracker (Spec 01) monitors compound review pass rates -- if they drop below 50%, the threshold is tuned.

### R4: Cost Overrun from Parallel Agent Calls

**Risk**: Running 5 agents in parallel on every SIL iteration, plus 2 on every AgentOps run, plus interactive usage, could exceed budget expectations.

**Mitigation**: Per-agent budget caps ($0.50 default), panel budget caps ($5.00 total), and weekly cost tracking via LangSmith. The cost model (Section 8) estimates $4-$22/week, well within the $80/week system budget. If actual costs exceed the estimate by 2x, the meta-fitness tracker flags it.

### R5: Compound Document Proliferation

**Risk**: If every SIL merge and AgentOps implementation creates a compound document, `docs/solutions/` could grow to hundreds of files quickly, making it harder for `learnings-researcher` to find relevant results.

**Mitigation**: Compound documents are only created for non-trivial changes (the `compound-after-merge.ts` function has a minimum diff size threshold of 50 lines). Categories provide directory-level organization. The `learnings-researcher` agent is specifically designed to search this directory structure. If proliferation becomes an issue, periodic consolidation (merging related documents) can be added as a future enhancement.

### R6: Context7 Availability

**Risk**: The Context7 MCP server is a third-party HTTP service. It could be down, rate-limited, or deprecated.

**Mitigation**: The `context7-client.ts` wraps all calls in try/catch and returns `null` on failure. No improvement loop phase depends on Context7 -- it provides optional enrichment. If Context7 is unavailable, the `framework-docs-researcher` agent still works (it just cannot use documentation lookups).

---

## Appendix A: Full Agent Inventory with Loop Mapping

| # | Agent | Category | SIL Phase | AgentOps Phase | Interactive Trigger |
|---|-------|----------|-----------|----------------|---------------------|
| 1 | `kieran-typescript-reviewer` | Review | Evaluate | -- | Code review |
| 2 | `security-sentinel` | Review | Evaluate | -- | Code review, Security audit |
| 3 | `performance-oracle` | Review | Evaluate | -- | Code review, Performance investigation |
| 4 | `architecture-strategist` | Review | Filter, Evaluate | -- | Code review, Architecture decision |
| 5 | `pattern-recognition-specialist` | Review | Filter | -- | Code review, Architecture decision |
| 6 | `code-simplicity-reviewer` | Review | Evaluate | -- | Code review |
| 7 | `data-integrity-guardian` | Review | -- | -- | Database changes |
| 8 | `agent-native-reviewer` | Review | -- | -- | Agent feature changes |
| 9 | `schema-drift-detector` | Review | -- | -- | Schema changes |
| 10 | `data-migration-expert` | Review | -- | -- | Migration changes |
| 11 | `deployment-verification-agent` | Review | -- | -- | Deployment changes |
| 12 | `kieran-rails-reviewer` | Review | -- | -- | Not applicable (TypeScript project) |
| 13 | `kieran-python-reviewer` | Review | -- | -- | Not applicable |
| 14 | `dhh-rails-reviewer` | Review | -- | -- | Not applicable |
| 15 | `julik-frontend-races-reviewer` | Review | -- | -- | Not applicable |
| 16 | `repo-research-analyst` | Research | Discovery | -- | Planning |
| 17 | `learnings-researcher` | Research | Discovery | Signal enrichment | Bug fix, Post-fix |
| 18 | `best-practices-researcher` | Research | -- | Signal enrichment | Planning, Architecture |
| 19 | `framework-docs-researcher` | Research | -- | Signal enrichment | Planning, Dependency update |
| 20 | `git-history-analyzer` | Research | Discovery | -- | Bug fix, Performance |
| 21 | `bug-reproduction-validator` | Workflow | -- | Pre-implementation | Bug fix |
| 22 | `spec-flow-analyzer` | Workflow | -- | Proposal validation | Planning |
| 23 | `pr-comment-resolver` | Workflow | -- | -- | PR review |
| 24 | `lint` | Workflow | -- | Post-implementation | Code review |
| 25 | `every-style-editor` | Workflow | -- | -- | Documentation |
| 26-28 | Design agents | Design | -- | -- | Not applicable |
| 29 | `ankane-readme-writer` | Docs | -- | -- | Not applicable |

**Active in improvement loops**: 20 of 29 agents (agents 12-15 and 26-29 are not applicable to a TypeScript project).

## Appendix B: Relationship to Other Specs

| Spec | Relationship |
|------|-------------|
| [01-unified-loop-controller.md](./01-unified-loop-controller.md) | Compound documents emit signals into the ULC signal store. Compound review results become evaluation signals. |
| [02-knowledge-accumulation-layer.md](./02-knowledge-accumulation-layer.md) | Compound documents ingested as KG entities with cross-references. `learnings-researcher` queries KAL. |
| [03-automated-pattern-evolution.md](./03-automated-pattern-evolution.md) | `pattern-recognition-specialist` outputs feed into DGM fitness tracking. Patterns identified by compound review update fitness scores. |
| [05-evaluation-harness.md](./05-evaluation-harness.md) | Compound review panel results become evaluation harness inputs. Panel pass/fail rates are harness metrics. |
| [06-agent-team-orchestration.md](./06-agent-team-orchestration.md) | The `orchestrating-swarms` skill from the plugin informs the swarm patterns used by agent teams. |
| [07-assumption-registry.md](./07-assumption-registry.md) | Compound research agents can validate assumptions against external documentation via Context7. |

## Appendix C: File Inventory (New Files)

```
src/compound/
├── agent-invoker.ts             # Core: load definitions, invoke agents, parallel invocation
├── context7-client.ts           # HTTP client for Context7 MCP documentation lookups
├── select-agents.ts             # Task-type detection and agent selection
├── compound-after-merge.ts      # Post-merge compound documentation generation
├── __tests__/
│   ├── agent-invoker.test.ts
│   ├── context7-client.test.ts
│   ├── select-agents.test.ts
│   └── compound-after-merge.test.ts

.claude/rules/
└── plow-ooda-composition.md     # PLOW + OODA composition guide

.claude/skills/compound-review/
└── SKILL.md                     # Interactive compound review skill wrapper
```
