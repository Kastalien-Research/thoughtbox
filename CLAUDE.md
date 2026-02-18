# Claude Code Instructions

@AGENTS.md

---

## CRITICAL: Always Verify

**NEVER say "probably", "maybe", "might be", "could be", or other conditional hedging.**

Before making ANY claim about:
- Whether a file exists
- Whether code is present
- Whether a feature works
- Whether something was done

You MUST verify it first using the appropriate tool (Read, Glob, Grep, Bash, etc.).

**Do NOT:**
- Assume something exists without checking
- Claim something works without testing
- Say "it should be there" without reading the file
- Trust previous agents' claims without verification

**DO:**
- Read files before claiming they contain something
- Run tests before claiming they pass
- Check directory contents before claiming files exist
- Verify configurations before claiming they're correct

## Commit Message Format (REQUIRED)

**This project uses [Conventional Commits](https://www.conventionalcommits.org/)**

When creating commits, you MUST use this format:

```
<type>[optional scope]: <description>

[optional body]
```

### Quick Reference

**Types** (use these exactly):
- `feat`: New feature → CHANGELOG Added section
- `fix`: Bug fix → CHANGELOG Fixed section
- `perf`: Performance improvement → CHANGELOG Changed section
- `refactor`: Code refactor → CHANGELOG Changed section
- `docs`: Documentation only → Omitted from CHANGELOG
- `test`: Tests only → Omitted from CHANGELOG
- `chore`: Maintenance/tooling → Omitted from CHANGELOG
- `security`: Security fix → CHANGELOG Security section
- `breaking` or add `!`: Breaking change → MAJOR version bump

### Examples

```bash
# New feature
feat(loops): Add OODA loops MCP integration

# Bug fix
fix(analytics): Resolve concurrent write issue in loop-usage.jsonl

# Breaking change (note the !)
feat!: Remove deprecated thoughtbox_v1 tool

# With scope
perf(catalog): Cache hot-loops.json for faster sorting

# Documentation (not in changelog)
docs: Update README with loops documentation
```

### Why This Matters

1. **Automated changelog**: Commits automatically populate CHANGELOG.md
2. **Semantic versioning**: Commit types determine version bumps
3. **Clear history**: Easy to see what changed and why
4. **PR quality**: GitHub Action validates format

**If you create a commit**, use conventional format. The changelog automation depends on it.

## Meta_Skill Patterns for Deep Reasoning

> **Implementation Status**: §1 Git persistence is implemented (`src/persistence/`); SQLite analytics are not.
> §2 Progressive Disclosure is implemented (`src/tool-registry.ts` `DisclosureStage`).
> **§3 Thompson Sampling and §4 DCG are planned architecture — neither exists in `src/` yet.**
> The only hash implementation is `src/multi-agent/content-hash.ts` (Merkle chain for attribution only).

Thoughtbox provides structured reasoning with branching exploration. These patterns optimize how reasoning traces are captured, analyzed, and reused.

### 1. Dual Persistence Architecture

**Pattern**: Store reasoning traces in two complementary systems for different access patterns.

**Implementation**:
- **Git (Primary)**: Full thought content with branches, merges, and history
  - Human-readable diffs for reasoning evolution
  - Branch-based exploration of alternative approaches
  - Immutable audit trail with commit SHAs
  - Tools: `git log --graph`, `git diff`, `git show`

- **SQLite (Analytics)**: Structured metadata for performance analysis
  - Query which reasoning strategies succeed/fail
  - Track token costs per thought pattern
  - Aggregate statistics across sessions
  - Schema: `sessions`, `thoughts`, `branches`, `outcomes`

**Why It Works**:
- Git preserves complete reasoning context for human review
- SQLite enables fast queries for pattern recognition
- Each system optimized for its access pattern
- No single-point-of-failure for reasoning history

**Usage**:
```bash
# Git: Review reasoning evolution
git log --graph --oneline session-123/

# SQLite: Query success patterns
sqlite3 thoughtbox.db "
  SELECT thought_type, AVG(outcome_score)
  FROM thoughts
  WHERE session_type = 'code-review'
  GROUP BY thought_type
"
```

### 2. Progressive Disclosure

**Pattern**: Load thought branches on-demand rather than eagerly loading full reasoning trees.

**Problem**: Full reasoning trees consume excessive tokens when loaded upfront. Most branches are never referenced.

**Implementation**:
- **Initial Load**: Only load root thought and immediate children
- **Lazy Expansion**: Load branch details when explicitly referenced
- **Reference Format**: `S3` (thought ID) triggers lazy load if not in context
- **Pagination**: Load thought history in chunks (last 10 thoughts)
- **Pruning**: Auto-remove unreferenced branches after N thoughts

**API Design**:
```json
{
  "operation": "thought",
  "args": {
    "loadBranch": "exploration-A",
    "depth": 2
  }
}
```

**Benefits**:
- Preserves context window for actual reasoning
- Reduces initial session load time
- Scales to sessions with 100+ thoughts
- Users explicitly request detail when needed

**Trade-off**: Slight latency when loading branches, but acceptable for on-demand access.

### 3. Thompson Sampling for Reasoning Strategies

**Pattern**: Track which reasoning strategies work best for which problem types, then sample proportionally to success rate.

**Background**: Thompson Sampling balances exploration (trying new strategies) with exploitation (using proven strategies).

**Implementation**:
```python
# Track outcomes in SQLite
CREATE TABLE strategy_performance (
  strategy TEXT,
  problem_type TEXT,
  successes INT DEFAULT 0,
  trials INT DEFAULT 0
);

# Sample strategy proportional to Beta(successes + 1, failures + 1)
def select_strategy(problem_type):
    strategies = query_strategies(problem_type)
    samples = [
        beta.rvs(s.successes + 1, s.failures + 1)
        for s in strategies
    ]
    return strategies[argmax(samples)]
```

**Reasoning Strategy Types**:
- `depth-first`: Deep exploration of single branch before backtracking
- `breadth-first`: Explore multiple branches shallowly
- `pruning`: Aggressively cut unpromising branches
- `synthesis`: Combine insights from multiple branches
- `sequential`: Linear reasoning without branching

**Problem Types**:
- `code-architecture`: Design decisions with multiple approaches
- `debugging`: Root cause analysis with hypothesis testing
- `optimization`: Performance improvements with trade-off analysis
- `security-review`: Threat modeling with attack tree exploration

**Analytics Query**:
```sql
SELECT
  strategy,
  problem_type,
  successes,
  trials,
  CAST(successes AS FLOAT) / trials AS success_rate
FROM strategy_performance
WHERE trials >= 5
ORDER BY success_rate DESC;
```

**Benefits**:
- Automatically learns which strategies work for which problems
- Balances exploration (trying new strategies) with exploitation (using proven ones)
- Provides data-driven reasoning about reasoning itself
- Enables continuous improvement of reasoning patterns

### 4. Multi-Layer Security with DCG

**Pattern**: Use Deterministic Context Generation (DCG) to ensure reproducible reasoning outputs and prevent prompt injection.

**Threat Model**:
- **Prompt Injection**: User-controlled input influences reasoning structure
- **Context Manipulation**: Malicious thoughts alter subsequent reasoning
- **Non-Determinism**: Same inputs produce different reasoning traces

**DCG Implementation**:
```yaml
# Deterministic thought generation
thought_hash: SHA256(
  parent_hash +
  thought_content +
  annotations +
  timestamp_quantized
)

# Quantize timestamps to 5-minute windows
timestamp_quantized: floor(timestamp / 300) * 300

# Verify chain integrity
verify_chain:
  for thought in session:
    recompute_hash = hash(thought)
    assert recompute_hash == thought.stored_hash
```

**Layer 1: Input Sanitization**
- Escape user content in thought templates
- Validate annotation structure against schema
- Reject thoughts with suspicious patterns (code execution, file access)

**Layer 2: Isolated Execution**
- Each thought processed in isolated context
- No shared mutable state between thoughts
- Annotations as pure data (no executable code)

**Layer 3: Chain Verification**
- Hash each thought including parent hash (blockchain-style)
- Detect tampering by recomputing hash chain
- Git commits provide additional integrity layer

**Layer 4: Reproducible Sampling**
- Seed random number generator with thought hash
- Thompson Sampling becomes deterministic for same session state
- Enables debugging: "Why did it choose strategy X?"

**Benefits**:
- **Auditability**: Reasoning traces are tamper-evident
- **Reproducibility**: Same inputs → same reasoning outputs
- **Security**: Prevents injection attacks via thought content
- **Debugging**: Deterministic behavior aids investigation

**Trade-offs**:
- Timestamp quantization reduces precision (5-min windows)
- Hash computation adds ~10ms per thought
- Deterministic sampling may miss novel strategies (mitigated by exploration parameter)

### Integration Guidelines

**When to use each pattern**:

| Pattern | Use When | Skip When |
|---------|----------|-----------|
| **Dual Persistence** | Sessions exceed 50 thoughts, need analytics | Quick one-off reasoning tasks |
| **Progressive Disclosure** | Reasoning trees with 10+ branches | Linear reasoning without branches |
| **Thompson Sampling** | Recurring problem types with measurable outcomes | Novel problems without historical data |
| **Multi-Layer Security** | Production systems, untrusted input | Trusted local development |

**Combining patterns**:
- Progressive Disclosure + Dual Persistence: SQLite indexes enable fast branch lookup
- Thompson Sampling + Dual Persistence: SQLite stores strategy performance data
- DCG + Thompson Sampling: Deterministic sampling enables reproducible analytics

**Migration path**:
1. Start with Git-only persistence (simplest)
2. Add SQLite when analytics needs emerge
3. Implement Progressive Disclosure when context limits hit
4. Enable Thompson Sampling after 20+ sessions per problem type
5. Add DCG when security/reproducibility becomes critical

## Development Notes

### Build & Test
- `npm run build:local` — local build (skips Docker steps); use this, not `npm run build`
- `npx vitest run` — full test suite; 339 tests pass; `agentops/tests/phase1.2.test.ts` always shows "No test suite found" (pre-existing empty file, not a regression)
- `src/resources/loops-content.ts` — auto-generated from `.claude/commands/loops/` (gitignored); **never edit manually**; build preserves existing catalog when source dir is absent

### ThoughtHandler Session Lifecycle
- `processThought({ nextThoughtNeeded: false })` auto-closes the session and sets `currentSessionId = null`
- **Capture `getCurrentSessionId()` BEFORE the closing thought** — calling it after returns null

## Improvement Loop Learnings

> Auto-generated learnings from autonomous improvement cycles

### What Works

### What Doesn't Work

### Current Capability Gaps
