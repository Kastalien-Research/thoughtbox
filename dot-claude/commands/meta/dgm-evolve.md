# /dgm-evolve - Darwin Godel Machine for Memory Patterns

Evolve the memory system through empirical fitness testing. Patterns that help solve problems survive; patterns that don't fade away. No formal proofs required - just results.

## Core Insight

The original Godel Machine required *mathematical proof* that a self-modification would improve performance. This is impractical. The Darwin Godel Machine (DGM) instead uses *empirical evidence* - like evolution, where the deer that survives the lion didn't prove it was faster; it just was.

Our memory system can work the same way:
- **Patterns that get used and work** → promoted (hot/warm)
- **Patterns that don't get used** → decay (cold/archived)
- **Patterns that fail when tried** → marked as anti-patterns or deprecated
- **Variations of successful patterns** → explored as experiments

## Command Signature

```bash
/meta:dgm-evolve [focus-area] [--mode=MODE] [--dry-run]
```

### Parameters

- `focus-area`: Domain to evolve (`tools`, `infrastructure`, `testing`, `lessons`, or `all`)
- `--mode`: Evolution mode
  - `assess` - Analyze current pattern fitness (default)
  - `mutate` - Generate variations of high-performing patterns
  - `prune` - Archive low-fitness patterns
  - `full` - Complete evolution cycle
  - `cycle` - **CycleQD**: Advance to next quality focus and evolve
  - `niche` - Show niche grid visualization
- `--dry-run`: Show what would change without modifying

## The DGM-Memory Architecture

### 1. Archive = Memory System

```
.claude/rules/
├── tools/           # Active patterns (the "population")
├── infrastructure/
├── testing/
├── lessons/
└── evolution/       # NEW: Pattern evolution tracking
    ├── lineage.json       # Pattern ancestry
    ├── fitness.json       # Usage/success metrics
    ├── experiments/       # Unproven variations
    └── graveyard/         # Deprecated patterns (stepping stones)
```

### 2. Fitness = Empirical Success

Unlike DGM's coding benchmarks, we measure:

| Metric | Signal | How to Track |
|--------|--------|--------------|
| **Usage** | Pattern was referenced | Search logs, explicit citations |
| **Success** | Pattern helped solve problem | Session calibration feedback |
| **Convergence** | Multiple agents discover same pattern | Duplicate detection |
| **Decay** | Pattern not used recently | Freshness tags |

**Fitness Score Formula:**
```
fitness = (usage_count * 0.4) + (success_signals * 0.4) + (recency_bonus * 0.2)
```

### 3. Mutations = Pattern Variations

When a pattern shows high fitness, generate variations:

```markdown
## Original Pattern (fitness: 8.5)
### 2026-01-09: Rate Limiting at Middleware Layer
- **Issue**: API endpoints vulnerable to abuse
- **Solution**: Token bucket rate limiter as middleware
- **Pattern**: Rate limiting should be middleware, not per-endpoint

## Mutation 1: Generalization
- **Pattern**: Cross-cutting concerns belong in middleware, not scattered

## Mutation 2: Specification
- **Pattern**: Token bucket > sliding window for bursty traffic

## Mutation 3: Combination
- **Pattern**: Middleware for rate limiting + circuit breaker = resilient APIs
```

### 4. Selection = Empirical Validation

Variations enter as "experiments" with:
- `status: experimental`
- `parent: <original-pattern-id>`
- `created: <timestamp>`

After N uses or M days:
- **Outperforms parent** → Promoted, parent demoted
- **Underperforms** → Archived as stepping stone
- **Neutral** → Remains experimental

### 5. Open-Ended Exploration

Key DGM insight: Keep "stepping stones" - patterns that failed but might seed future breakthroughs.

```
.claude/rules/evolution/graveyard/
├── 2026-01-rate-limit-per-endpoint.md  # Failed, but why documented
├── 2026-01-sync-file-writes.md          # Superseded by async
└── ...
```

Each graveyard entry includes:
- Why it was tried
- Why it failed
- What replaced it
- Potential resurrection conditions

## Evolution Workflow

### Phase 1: Fitness Assessment

```bash
/meta:dgm-evolve all --mode=assess
```

1. Scan all patterns in `.claude/rules/`
2. Calculate fitness scores from:
   - Git history (when pattern files were read/cited)
   - Session calibration data
   - Freshness tags
3. Output fitness report:
   ```
   HIGH FITNESS (promote/explore):
   - infrastructure/database.md:connection-pooling (8.7)
   - tools/api-patterns.md:error-handling (8.2)

   LOW FITNESS (prune candidates):
   - lessons/2025-12-old-approach.md (1.2)
   - tools/deprecated-feature.md (0.8)

   EXPERIMENTAL (awaiting validation):
   - evolution/experiments/async-validation.md (pending: 3 more uses)
   ```

### Phase 2: Mutation Generation

```bash
/meta:dgm-evolve tools --mode=mutate
```

For high-fitness patterns:
1. **Generalize**: Extract broader principle
2. **Specialize**: Add context-specific variants
3. **Combine**: Merge with complementary patterns
4. **Invert**: Document the anti-pattern

Generated mutations go to `evolution/experiments/` with metadata:
```yaml
---
status: experimental
parent: tools/api-patterns.md#error-handling
mutation_type: generalization
created: 2026-01-12
expires: 2026-02-12
---
```

### Phase 3: Pruning

```bash
/meta:dgm-evolve all --mode=prune
```

1. Move low-fitness patterns to `evolution/graveyard/`
2. Update cross-references
3. Add graveyard metadata:
   ```yaml
   ---
   deprecated: 2026-01-12
   reason: "Superseded by async pattern"
   replacement: infrastructure/async-patterns.md
   resurrection_if: "Sync becomes viable for <10ms operations"
   ---
   ```

### Phase 4: Full Evolution Cycle

```bash
/meta:dgm-evolve all --mode=full
```

Runs all phases:
1. Assess fitness
2. Mutate high performers
3. Validate experiments (check if ready for promotion)
4. Prune low performers
5. Update lineage tracking
6. Generate evolution report

## Extended Memory Format

To support DGM, patterns gain new fields:

```markdown
### 2026-01-12: Pattern Title 🔥
- **Issue**: What was the problem
- **Solution**: What worked
- **Pattern**: Reusable principle
- **Files**: Relevant code locations
- **See Also**: Related patterns

<!-- DGM Metadata (optional, for high-value patterns) -->
- **Fitness**: 8.5 (usage: 12, success: 9, age: 14d)
- **Lineage**: Evolved from `lessons/2025-12-original.md`
- **Variants**:
  - `evolution/experiments/generalized-version.md` (testing)
  - `evolution/graveyard/failed-variant.md` (archived)
```

## Fitness Tracking Implementation

### Implicit Signals (Automatic)

```bash
# Track when patterns are read during sessions
# Hook into session start/end to log pattern access

# .claude/hooks/session_end_fitness.sh
#!/bin/bash
# Log which rule files were loaded this session
# Increment usage counters in evolution/fitness.json
```

### Explicit Signals (Agent Feedback)

After using a pattern, agents can signal:
```bash
# Pattern helped
echo '{"pattern": "tools/api.md#rate-limiting", "signal": "success"}' >> .claude/rules/evolution/signals.jsonl

# Pattern didn't help
echo '{"pattern": "tools/api.md#rate-limiting", "signal": "failure", "reason": "..."}' >> .claude/rules/evolution/signals.jsonl
```

Or via the calibration template:
```markdown
## Session Calibration - 2026-01-12

**Patterns Used**:
- ✅ `infrastructure/database.md:connection-pooling` - Solved timeout issue
- ❌ `tools/validation.md:schema-first` - Didn't apply to this case
- 🔄 `lessons/error-handling.md` - Partially helpful, needs refinement
```

## Example Evolution

### Before: Scattered Patterns

```
lessons/2025-12-rate-limiting.md     (fitness: 3.2, rarely used)
tools/api-security.md                 (fitness: 7.8, often used)
infrastructure/middleware.md          (fitness: 6.5)
```

### After: `/meta:dgm-evolve all --mode=full`

```
tools/api-security.md                 (fitness: 8.1, enhanced)
infrastructure/middleware.md          (fitness: 7.2, cross-referenced)
evolution/experiments/
  └── unified-security-middleware.md  (experimental: combines both)
evolution/graveyard/
  └── 2025-12-rate-limiting.md        (archived: subsumed by middleware)
evolution/lineage.json                (tracks ancestry)
```

## Integration Points

### With Existing Memory Commands

```bash
# Search includes fitness scores
.claude/bin/memory-query "rate limiting" --show-fitness

# Add with lineage
.claude/bin/memory-add --domain=tools --parent=existing-pattern-id

# Stats include evolution metrics
.claude/bin/memory-stats --evolution
```

### With Session Workflow

```bash
# Start of session
cat .claude/rules/active-context/current-focus.md
.claude/bin/memory-stats --evolution  # See what's hot

# End of session
/meta:dgm-evolve all --mode=assess  # Update fitness
/meta capture-learning               # Add new patterns
```

## Why This Works

1. **No Formal Proofs**: Like biological evolution, we don't need to prove a pattern is better - we just observe if it works.

2. **Stepping Stones Preserved**: Failed patterns aren't deleted; they're archived with context. A future mutation might resurrect them.

3. **Open-Ended**: The system can discover patterns we didn't anticipate, just by tracking what actually helps.

4. **Self-Improving**: High-fitness patterns spawn variations; the best variations replace their parents.

5. **Low Overhead**: Fitness tracking can be mostly automatic (file access logs + occasional explicit signals).

## Comparison to Original DGM

| DGM Component | Original (Sakana) | Memory System Adaptation |
|---------------|-------------------|--------------------------|
| Archive | Python agent variants | Pattern files in .claude/rules/ |
| Fitness Function | SWE-bench, Polyglot scores | Usage + success signals |
| Mutations | LLM-generated code changes | Pattern generalizations/specializations |
| Selection | Benchmark comparison | Freshness decay + promotion |
| Open-Ended | Keep stepping stones | Graveyard with resurrection conditions |

## CycleQD: Quality Diversity for Patterns

CycleQD extends DGM with **Quality Diversity** - instead of optimizing for one metric, we maintain a diverse population of patterns, each excelling in different ways.

### The Niche Grid

Patterns occupy positions in a 2D grid based on their **Behavior Characteristics (BCs)**:

```
                    APPLICABILITY
                 (domain-specific → cross-cutting)
                      1    2    3    4    5
                   ┌────┬────┬────┬────┬────┐
               1   │    │    │    │    │    │  Specific
  S                ├────┼────┼────┼────┼────┤
  P            2   │    │ 🟡 │    │    │    │  bug fixes
  E                ├────┼────┼────┼────┼────┤
  C            3   │    │    │ 🟢 │    │    │  domain patterns
  I                ├────┼────┼────┼────┼────┤
  F            4   │    │    │    │ 🔵 │    │  cross-domain
  I                ├────┼────┼────┼────┼────┤
  C            5   │    │    │    │    │ 🟣 │  universal principles
  I                └────┴────┴────┴────┴────┘
  T                                            General
  Y
```

Each cell can hold **one champion pattern**. This ensures diversity - we don't want 10 patterns all in the same niche.

### Behavior Characteristics

| BC | Range | Low (1) | High (10) |
|----|-------|---------|-----------|
| **Specificity** | 1-10 | Fix for specific bug | Universal principle |
| **Applicability** | 1-10 | Single domain only | Cross-cutting concern |
| **Complexity** | 1-10 | Simple one-liner | Complex multi-step procedure |
| **Maturity** | 1-10 | Just discovered | Battle-tested, used 50+ times |

### Cyclic Quality Focus

Instead of always optimizing for the same metric, CycleQD rotates focus:

```
Round 1: Optimize for USAGE
  → Patterns that get referenced often win their niche

Round 2: Optimize for SUCCESS_RATE
  → Patterns with high success/failure ratio win

Round 3: Optimize for GENERALIZABILITY
  → Patterns with high applicability BC win

Round 4: Optimize for CLARITY
  → Simple patterns (low complexity) win

Round 5: Optimize for EFFICIENCY
  → High usage per complexity wins

[Cycle repeats]
```

This ensures every quality dimension gets its "moment in the spotlight."

### CycleQD Workflow

```bash
# View current niche grid
/meta:dgm-evolve all --mode=niche
```

Output:
```
NICHE GRID (Current Focus: USAGE, Round 3)
═══════════════════════════════════════════

                    APPLICABILITY →
           │  1  │  2  │  3  │  4  │  5  │
       ────┼─────┼─────┼─────┼─────┼─────┤
        1  │     │     │     │     │     │
       ────┼─────┼─────┼─────┼─────┼─────┤
   S    2  │     │ 🟡  │     │     │     │
   P   ────┼─────┼─────┼─────┼─────┼─────┤
   E    3  │     │     │ 🟢  │ 🟢  │     │
   C   ────┼─────┼─────┼─────┼─────┼─────┤
   ↓    4  │     │     │ 🔵  │ 🔵  │ 🔵  │
       ────┼─────┼─────┼─────┼─────┼─────┤
        5  │     │     │     │ 🟣  │ 🟣  │
       ────┴─────┴─────┴─────┴─────┴─────┘

Legend: 🟡 experimental  🟢 warm  🔵 hot  🟣 mature
Coverage: 9/25 niches filled (36%)

NICHE CHAMPIONS:
  (2,2) lessons/debug-specific.md (fitness: 4.2)
  (3,3) tools/api-errors.md (fitness: 6.8)
  (3,4) infrastructure/retry.md (fitness: 7.1)
  ...

EMPTY NICHES (opportunity for new patterns):
  - (1,*) Very specific patterns needed
  - (*,1) Domain-locked patterns needed
  - (5,5) Universal principles needed
```

```bash
# Advance cycle and evolve
/meta:dgm-evolve all --mode=cycle
```

Output:
```
CYCLE ADVANCEMENT: USAGE → SUCCESS_RATE (Round 4)
═══════════════════════════════════════════════════

Re-evaluating all patterns with SUCCESS_RATE as quality...

NICHE CHANGES:
  (3,3) tools/api-errors.md DEFENDED (success: 90%)
  (3,4) infrastructure/retry.md CHALLENGED by experiments/smart-retry.md
        → smart-retry.md wins (success: 95% vs 82%)
        → retry.md demoted to graveyard
  (4,4) NEW CHAMPION: lessons/circuit-breaker.md fills empty niche

MUTATIONS GENERATED (based on high-success patterns):
  → experiments/generalized-circuit-breaker.md (from lessons/circuit-breaker.md)
  → experiments/api-errors-v2.md (from tools/api-errors.md)

Coverage: 10/25 niches (40%) ↑
```

### Niche Competition Rules

1. **One Champion Per Cell**: Each niche holds exactly one pattern
2. **Quality-Based Selection**: Current cycle's quality metric determines winner
3. **Diversity Bonus**: Patterns filling empty niches get +2 fitness
4. **Incumbent Bonus**: Current champions get +1 fitness (stability)
5. **Challenger Entry**: New patterns must beat incumbent by >1 fitness to take over

### Assigning BCs to Patterns

When adding a pattern, estimate its BCs:

```markdown
### 2026-01-12: Smart Retry with Backoff 🔥
- **Issue**: API calls failing under load
- **Solution**: Exponential backoff with jitter
- **Pattern**: Retry with backoff for transient failures
- **BCs**: specificity=5, applicability=8, complexity=4, maturity=3
```

Or let the system infer from context:
- Domain file → affects applicability
- Line count → affects complexity
- Age + usage → affects maturity

### CycleQD Benefits

1. **Diversity Preservation**: Won't converge to all similar patterns
2. **Multi-Objective**: Each quality gets attention cyclically
3. **Niche Discovery**: Empty niches signal gaps in knowledge
4. **Stable Evolution**: Champions have slight advantage (no thrashing)
5. **Visual Insight**: Grid shows pattern landscape at a glance

## Future Enhancements

1. **Automated Fitness Hooks**: Instrument Claude Code to track pattern usage automatically

2. **Cross-Codebase Learning**: Share high-fitness patterns across projects

3. **Mutation Templates**: Standard ways to generalize/specialize patterns

4. **Visualization**: Graph of pattern evolution over time

5. **A/B Testing**: Serve different pattern variants to see which performs better

6. **Red Queen Mode**: Adversarial evolution where patterns compete directly

7. **Collective Intelligence**: Multiple agents contribute patterns, best ones surface

---

**The memory system becomes a living organism** - patterns compete for attention, successful ones reproduce (spawn variants), unsuccessful ones fade but aren't forgotten. Over time, the system evolves toward higher and higher fitness while maintaining diversity across niches.

---

**Sources:**
- [Darwin Gödel Machine Paper (arXiv)](https://arxiv.org/abs/2505.22954)
- [Sakana AI DGM Overview](https://sakana.ai/dgm/)
- [GitHub: jennyzzt/dgm](https://github.com/jennyzzt/dgm)
- [CycleQD: Agent Skill Acquisition via Quality Diversity (arXiv)](https://arxiv.org/abs/2410.14735)
- [Sakana AI CycleQD Overview](https://sakana.ai/cycleqd/)
