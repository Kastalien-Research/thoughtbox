# OODA Loop Building Blocks Index

Composable cognitive loops for agent workflows.

## Quick Reference

### Exploration Loops
| Loop | Purpose | Speed | Status |
|------|---------|-------|--------|
| @exploration/problem-space.md | Understand problem space before committing | Slow | ✅ |
| @exploration/codebase-discovery.md | Map existing code patterns | Medium | ✅ |
| @exploration/domain-research.md | Gather external context | Slow | ✅ |

### Authoring Loops
| Loop | Purpose | Speed | Status |
|------|---------|-------|--------|
| @authoring/spec-drafting.md | Generate specification documents | Medium | ✅ |
| @authoring/code-generation.md | Generate implementation code | Medium | ✅ |
| @authoring/documentation.md | Create documentation | Medium | ✅ |

### Refinement Loops
| Loop | Purpose | Speed | Status |
|------|---------|-------|--------|
| @refinement/requirement-quality.md | Polish requirements (SMART criteria) | Fast | ✅ |
| @refinement/code-quality.md | Improve code quality | Fast | ✅ |
| @refinement/consistency-check.md | Cross-reference validation | Fast | ✅ |

### Verification Loops
| Loop | Purpose | Speed | Status |
|------|---------|-------|--------|
| @verification/acceptance-gate.md | Validate against acceptance criteria | Medium | ✅ |
| @verification/fact-checking.md | Verify claims against sources | Medium | ✅ |
| @verification/integration-test.md | Test component integration | Slow | ✅ |

### Orchestration Loops
| Loop | Purpose | Speed | Status |
|------|---------|-------|--------|
| @orchestration/queue-processor.md | Process work items in order | Varies | ✅ |
| @orchestration/dependency-resolver.md | Topological ordering | Fast | ✅ |
| @orchestration/spiral-detector.md | Prevent infinite loops | Fast | ✅ |

## Meta Documentation

- @meta/loop-interface.md - Standard loop contract specification
- @meta/composition-patterns.md - How loops combine into workflows

## Loop Composition Guide

### By Workflow Type

**Spec Design Workflow** (`/spec-designer`)
```
exploration/problem-space
  └── authoring/spec-drafting
        └── refinement/requirement-quality
  └── verification/acceptance-gate
```

**Spec Implementation Workflow** (`/spec-orchestrator`)
```
orchestration/dependency-resolver
  └── orchestration/queue-processor
        └── authoring/code-generation
              └── orchestration/spiral-detector
              └── refinement/code-quality
        └── verification/integration-test
```

**Fact-Checking Workflow** (`/fact-check-standalone`)
```
orchestration/queue-processor
  └── verification/fact-checking
  └── refinement/consistency-check
```

**Code Review Workflow**
```
exploration/codebase-discovery
  └── refinement/code-quality
  └── refinement/consistency-check
  └── verification/acceptance-gate
```

### Parallel Execution Opportunities

| Loop | Parallelizable | Condition |
|------|----------------|-----------|
| exploration/* | Conditional | Different focus areas |
| authoring/* | Yes | Independent items |
| refinement/* | Yes | Independent items |
| verification/fact-checking | Yes | Independent claims |
| verification/integration-test | Conditional | Independent scenarios |
| orchestration/* | No | Sequential by nature |

## Loop Speed Reference

| Speed | Duration | Use For |
|-------|----------|---------|
| **Fast** | ~5-30s | Atomic refinements, checks |
| **Medium** | ~30s-5min | Document generation, verification |
| **Slow** | ~2-10min | Exploration, comprehensive research |
| **Varies** | Depends on queue | Orchestration, batch processing |

## Creating New Loops

1. Follow the interface in @meta/loop-interface.md
2. Place in appropriate category folder
3. Update this index
4. Document composition constraints
5. Add usage examples

## Total Loop Library

**15 loops** across 5 categories:
- 3 exploration loops
- 3 authoring loops  
- 3 refinement loops
- 3 verification loops
- 3 orchestration loops

Combined documentation: ~10,000+ lines of reusable cognitive patterns
