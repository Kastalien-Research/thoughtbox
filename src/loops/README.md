# OODA Loop Building Blocks

Reusable cognitive loop primitives for composing agent workflows.

## Philosophy

OODA (Observe-Orient-Decide-Act) loops are the fundamental unit of agent cognition. By defining loops as modular building blocks, we can:

- **Compose** complex workflows from simple, well-tested primitives
- **Reuse** proven loop patterns across different commands
- **Evolve** individual loops without breaking dependent workflows
- **Mix and match** loop types for novel workflow configurations

## Directory Structure

```
loops/
├── README.md                    # This file
├── meta/
│   ├── loop-interface.md        # Standard loop contract
│   └── composition-patterns.md  # How loops combine
├── exploration/
│   ├── problem-space.md         # Understand before committing
│   ├── codebase-discovery.md    # Map existing code patterns
│   └── domain-research.md       # Gather external context
├── authoring/
│   ├── spec-drafting.md         # Write specification documents
│   ├── code-generation.md       # Generate implementation code
│   └── documentation.md         # Create documentation
├── refinement/
│   ├── requirement-quality.md   # Polish requirements (SMART)
│   ├── code-quality.md          # Improve code quality
│   └── consistency-check.md     # Cross-reference validation
├── verification/
│   ├── fact-checking.md         # Verify claims against sources
│   ├── integration-test.md      # Test component integration
│   └── acceptance-gate.md       # Validate against criteria
└── orchestration/
    ├── queue-processor.md       # Process work items in order
    ├── dependency-resolver.md   # Topological ordering
    └── spiral-detector.md       # Prevent infinite loops
```

## Using Loops

### In Workflow Commands

Reference loops using the `@` syntax:

```markdown
## Phase 2: Exploration

Execute @loops/exploration/problem-space.md with:
- INPUT: User prompt, codebase context
- OUTPUT: spec_inventory, unknowns_catalog
- MAX_ITERATIONS: 3
```

### Loop Selection Guide

| Goal | Loop Type | Building Block |
|------|-----------|----------------|
| Understand problem space | Exploration | `problem-space.md` |
| Map existing code | Exploration | `codebase-discovery.md` |
| Research external context | Exploration | `domain-research.md` |
| Write specs | Authoring | `spec-drafting.md` |
| Generate code | Authoring | `code-generation.md` |
| Improve requirements | Refinement | `requirement-quality.md` |
| Improve code | Refinement | `code-quality.md` |
| Validate facts | Verification | `fact-checking.md` |
| Test integration | Verification | `integration-test.md` |
| Process work queue | Orchestration | `queue-processor.md` |
| Order dependencies | Orchestration | `dependency-resolver.md` |
| Detect spirals | Orchestration | `spiral-detector.md` |

## Composition Patterns

See @loops/meta/composition-patterns.md for detailed patterns:

1. **Sequential**: Loop A → Loop B → Loop C
2. **Nested**: Loop A contains Loop B at each iteration
3. **Parallel**: Loop A and Loop B run concurrently on different items
4. **Conditional**: Loop A or Loop B based on context
5. **Recursive**: Loop A spawns child Loop A instances

## Creating New Loops

Follow the interface contract in @loops/meta/loop-interface.md:

1. Define clear INPUT/OUTPUT contracts
2. Specify OBSERVE/ORIENT/DECIDE/ACT phases
3. Include termination conditions
4. Document composition constraints
