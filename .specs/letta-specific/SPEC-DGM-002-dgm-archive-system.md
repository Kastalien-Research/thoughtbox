# SPEC-DGM-002: Git-Based DGM Archive Management

**Status**: Draft  
**Priority**: P1 - Critical Foundation  
**Complexity**: Medium  
**Dependencies**: None  
**Target Codebase**: `letta-code-thoughtbox/` (shared with `thoughtbox/`)

## Overview

Implement a Darwin Gödel Machine (DGM) archive system that tracks all generated code variants, their performance metrics, and lineage relationships using Git branches/tags as the storage mechanism. The archive enables parent selection for the next generation of self-modifications based on performance and novelty scoring.

## Motivation

**DGM Principle**: Maintain a population of discovered solutions that serve as stepping stones for future generations, rather than hill-climbing from a single best solution.

**Git as Archive**: Leverage Git's natural capabilities for:
- Branching (parallel variant exploration)
- Tagging (marking archive members)
- History (lineage tracking)
- Diffing (understanding modifications)
- Merging (incorporating improvements)

## Requirements

### Functional Requirements

#### FR-001: Archive Structure
**Priority**: MUST  
**Description**: Define Git-based structure for archive storage with committed metadata

**Acceptance Criteria**:
- [ ] `.dgm/` directory structure created and Git-tracked
- [ ] `archive.json` contains all variant metadata
- [ ] Git branches follow naming convention: `dgm/gen-{N}-{variant-id}`
- [ ] Git tags mark archive members: `archive/gen-{N}-variant-{id}`
- [ ] Lineage encoded in metadata (parent references)
- [ ] Human-readable `ARCHIVE.md` generated on updates

**Directory Structure**:
```
.dgm/
├── archive.json              # Variant registry (COMMITTED)
├── metrics/                  # Performance data (COMMITTED)
│   ├── gen-1-variant-a.json
│   └── gen-2-variant-b.json
├── proposals/                # Improvement proposals (COMMITTED)
│   └── {timestamp}-{id}.md
├── rejections/               # Failed modifications (COMMITTED)
│   └── {timestamp}-{id}.md
├── config.json              # DGM configuration (COMMITTED)
└── ARCHIVE.md               # Human-readable tree (GENERATED)

Git structure:
main                         # Current production
├── dgm/gen-1-variant-a     # First generation variants
├── dgm/gen-1-variant-b
├── dgm/gen-2-from-1a       # Second generation from 1a
└── ...
```

---

#### FR-002: Variant Metadata Schema
**Priority**: MUST  
**Description**: Define comprehensive metadata for each archive variant

**Schema**:
```typescript
interface ArchiveVariant {
  // Identity
  id: string;                    // "gen-2-variant-a"
  generation: number;            // 2
  gitRef: string;               // "dgm/gen-2-variant-a"
  gitTag: string;               // "archive/gen-2-variant-a"
  
  // Lineage
  parent: string | null;        // Parent variant ID
  children: string[];           // Child variant IDs
  lineage: string[];           // Full ancestry path
  
  // Performance
  performance: number;          // 0.0 - 1.0 composite score
  metrics: {
    taskSuccessRate: number;
    reasoningDepth: number;
    contextEfficiency: number;
    toolCallEfficiency: number;
    [key: string]: number;     // Extensible for new metrics
  };
  
  // Capabilities
  capabilities: string[];       // ["architecture-analysis", "str-replace-tool"]
  modifications: {
    target: 'letta-code' | 'thoughtbox' | 'both';
    files: string[];
    description: string;
    proposalRef: string;       // Link to proposal document
  };
  
  // Lifecycle
  status: 'active' | 'superseded' | 'archived';
  createdAt: string;           // ISO timestamp
  evaluatedAt: string;
  retiredAt?: string;
  
  // Validation
  testsPass: boolean;
  regressions: string[];       // List of regression issues
  
  // Selection probability (computed)
  selectionWeight?: number;    // Updated by parent selection algorithm
}

interface Archive {
  version: string;             // Archive schema version
  generation: number;          // Current generation
  variants: ArchiveVariant[];
  bestVariantId: string;       // Current best performer
  config: DGMConfig;
  statistics: {
    totalVariants: number;
    activeVariants: number;
    avgPerformance: number;
    bestPerformance: number;
  };
}
```

---

#### FR-003: Parent Selection Algorithm
**Priority**: MUST  
**Description**: Implement selection algorithm from DGM paper (performance + novelty)

**Algorithm**:
```typescript
function selectParent(archive: Archive): ArchiveVariant {
  const eligible = archive.variants.filter(v => 
    v.status === 'active' && v.performance < 1.0
  );
  
  // Compute selection weights
  for (const variant of eligible) {
    const performance = variant.performance;
    const childCount = variant.children.length;
    
    // Sigmoid-scaled performance
    const s = 1 / (1 + Math.exp(-10 * (performance - 0.5)));
    
    // Novelty bonus (fewer children = higher weight)
    const h = 1 / (1 + childCount);
    
    // Combined weight
    variant.selectionWeight = s * h;
  }
  
  // Normalize to probabilities
  const totalWeight = eligible.reduce((sum, v) => sum + v.selectionWeight, 0);
  const probabilities = eligible.map(v => v.selectionWeight / totalWeight);
  
  // Sample parent
  return weightedRandom(eligible, probabilities);
}
```

**Acceptance Criteria**:
- [ ] Selection favors high-performing variants
- [ ] Selection gives bonus to variants with few children (exploration)
- [ ] All variants have non-zero selection probability
- [ ] Selection is deterministic given RNG seed (for reproducibility)
- [ ] Configurable parameters (λ, α₀ from paper)

---

#### FR-004: Archive Operations
**Priority**: MUST  
**Description**: CRUD operations on the archive with Git integration

**Operations**:

```typescript
class ArchiveManager {
  // Add new variant (after successful modification)
  async add(variant: ArchiveVariant): Promise<void> {
    // 1. Create Git branch from parent
    // 2. Commit modifications
    // 3. Create Git tag
    // 4. Update archive.json
    // 5. Regenerate ARCHIVE.md
    // 6. Commit metadata
  }
  
  // Load variant (checkout Git ref)
  async load(variantId: string): Promise<void> {
    // 1. Fetch variant metadata
    // 2. Git checkout variant.gitRef
    // 3. Restore working directory
  }
  
  // List variants with filtering
  async list(filter?: ArchiveFilter): Promise<ArchiveVariant[]> {
    // Query archive.json with optional filters
  }
  
  // Get best performer
  async getBest(): Promise<ArchiveVariant> {
    return this.list().reduce((best, v) => 
      v.performance > best.performance ? v : best
    );
  }
  
  // Retire old variants (mark superseded)
  async retire(variantId: string): Promise<void> {
    // Update status, preserve history
  }
  
  // Export lineage visualization
  async exportTree(): Promise<string> {
    // Generate Mermaid diagram or ASCII tree
  }
}
```

**Acceptance Criteria**:
- [ ] All operations maintain Git consistency
- [ ] Archive.json syncs to Git on every change
- [ ] Concurrent access handled (file locking)
- [ ] Validation: no orphaned variants, valid parent references
- [ ] Performance: O(1) add, O(log n) select

---

#### FR-005: Multi-Machine Sync
**Priority**: MUST (per user choice 1B)  
**Description**: Archive syncs across machines via Git

**Acceptance Criteria**:
- [ ] `archive.json` is Git-tracked (not in `.gitignore`)
- [ ] Metrics files are Git-tracked
- [ ] Conflict resolution strategy for concurrent modifications
- [ ] Git pull updates local archive state
- [ ] Git push shares variants with team/other machines

**Conflict Resolution**:
```typescript
// When pulling and archive.json conflicts
async resolveArchiveConflict() {
  const local = JSON.parse(await fs.readFile('.dgm/archive.json'));
  const remote = await git.show('origin/main:.dgm/archive.json');
  
  // Merge strategies:
  // 1. Union of variants (both machines explored)
  // 2. Keep higher generation number
  // 3. Preserve all lineage relationships
  
  const merged = mergeArchives(local, remote);
  await fs.writeFile('.dgm/archive.json', JSON.stringify(merged, null, 2));
}
```

---

### Non-Functional Requirements

#### NFR-001: Performance
- Archive load time: <500ms for 100 variants
- Parent selection: <100ms
- Git operations: Non-blocking UI

#### NFR-002: Storage
- Archive.json size: <1MB for 1000 variants (compression if needed)
- Metrics files: <10KB each (aggregate old data)

#### NFR-003: Reliability
- Archive corruption detection and recovery
- Atomic operations (all-or-nothing updates)
- Backup mechanism (Git reflog + manual export)

---

## Configuration

```typescript
// .dgm/config.json
{
  "version": "1.0",
  "selection": {
    "algorithm": "performance-novelty",
    "lambda": 10,          // Sigmoid sharpness
    "alpha0": 0.5,        // Sigmoid midpoint
    "seed": 42            // RNG seed for reproducibility
  },
  "archive": {
    "maxActive": 100,     // Auto-retire beyond this
    "gitTracked": true,   // Commit archive.json
    "autoExport": true    // Regenerate ARCHIVE.md
  },
  "parallel": {
    "maxConcurrent": 2    // Parallel explorations
  }
}
```

---

## Visualization

### Archive Tree Display

```bash
# CLI command
letta /dgm tree

# Output (example)
📦 DGM Archive (Generation 3)
├── gen-1-variant-a (perf: 0.75) [3 children]
│   ├── gen-2-from-1a-v1 (perf: 0.72) [retired]
│   ├── gen-2-from-1a-v2 (perf: 0.82) [2 children] ⭐ BEST
│   │   ├── gen-3-from-2a2-v1 (perf: 0.85) ⭐⭐ CURRENT BEST
│   │   └── gen-3-from-2a2-v2 (perf: 0.79)
│   └── gen-2-from-1a-v3 (perf: 0.68)
└── gen-1-variant-b (perf: 0.60) [1 child]
    └── gen-2-from-1b-v1 (perf: 0.58) [dead end]

Best: gen-3-from-2a2-v1 (0.85)
Avg:  0.74
Active: 8 variants
```

---

## Success Criteria

- [ ] Archive persists across sessions
- [ ] Archive syncs across machines (Git push/pull)
- [ ] Parent selection implements DGM algorithm correctly
- [ ] All Git operations are atomic
- [ ] Archive visualization works in CLI
- [ ] No data loss on crashes
- [ ] Migration from single codebase to archived variants works

---

## References

- [Darwin Gödel Machine Paper](https://arxiv.org/pdf/2505.22954) - Section 3, Appendix C.2
- [Git as Database Pattern](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)

---

**Previous**: [SPEC-DGM-001: Direct MCP Client](./SPEC-DGM-001-mcp-client-local-mode.md)  
**Next**: [SPEC-DGM-003: Reflection Session Framework](./SPEC-DGM-003-reflection-session-system.md)
