# Memory System Quick Start

**The memory system is ready to use!**

---

## Current Status

Run this to see what's in memory right now:

```bash
.claude/bin/memory-stats
```

---

## Search Memory

Find patterns and learnings:

```bash
# Search for a topic
.claude/bin/memory-query "firebase"
.claude/bin/memory-query "testing"
.claude/bin/memory-query "error handling"

# Top 3 most relevant results
.claude/bin/memory-pipe top "your-topic" 3

# See all hot learnings (< 2 weeks)
.claude/bin/memory-pipe hot

# Search within a domain
.claude/bin/memory-pipe domain tools "your-topic"
```

---

## Add Learning

Capture something you just discovered:

**Method 1: Interactive (recommended)**
```bash
/meta capture-learning
```

**Method 2: Command line**
```bash
echo '{
  "title": "Brief Descriptive Title",
  "issue": "What was the problem",
  "solution": "What worked",
  "pattern": "Reusable principle for future work"
}' | .claude/bin/memory-add --domain=lessons
```

**Domain options**: `tools` | `infrastructure` | `testing` | `lessons`

---

## Where Things Are

```
.claude/rules/
├── 00-meta.md              # How the memory system works
├── tools/                  # Feature-specific patterns
├── infrastructure/         # System-level patterns
├── testing/                # Testing conventions
├── lessons/                # Cross-cutting learnings
└── active-context/         # What we're working on now
    └── current-focus.md    # ← Check this first!
```

---

## Current Focus

See what we're working on:

```bash
cat .claude/rules/active-context/current-focus.md
```

---

## Available Commands

All in `.claude/bin/`:

| Command | Purpose | Example |
|---------|---------|---------|
| `memory-query` | Search | `memory-query "firebase"` |
| `memory-stats` | Statistics | `memory-stats` or `memory-stats --json` |
| `memory-add` | Add learning | `echo '{...}' \| memory-add --domain=tools` |
| `memory-pipe` | Quick actions | `memory-pipe search "term"` |

**Pro tip**: Add to PATH for easier access:
```bash
export PATH="$PATH:$(pwd)/.claude/bin"
```

---

## Documentation

**Quick:**
- `COMPLETE_SYSTEM_SUMMARY.md` - System overview
- `.claude/rules/README.md` - Rules directory guide
- `.claude/bin/README.md` - CLI tools guide

**Deep dive:**
- `MEMORY_SYSTEM_IMPLEMENTATION_GUIDE.md` - Complete guide
- `UNIX_PHILOSOPHY_MEMORY_SYSTEM.md` - Unix CLI approach
- `docs/MEMORY_SYSTEM_DESIGN.md` - Full design (900 lines)

---

## Quick Actions

**Before starting work:**
```bash
# Check current focus
cat .claude/rules/active-context/current-focus.md

# Check stats
.claude/bin/memory-stats
```

**During work:**
```bash
# Search for relevant patterns
.claude/bin/memory-query "your-topic" | head -5
```

**After work:**
```bash
# Capture what you learned
/meta capture-learning
```

---

## Examples

**Example 1: Find Firebase patterns**
```bash
.claude/bin/memory-pipe search "firebase"
```

**Example 2: Check for testing patterns**
```bash
.claude/bin/memory-query "test" | grep -i "pattern"
```

**Example 3: Add new learning**
```bash
echo '{
  "title": "API Rate Limiting Pattern",
  "issue": "Endpoints vulnerable to abuse",
  "solution": "Token bucket at middleware layer",
  "pattern": "Rate limiting should be middleware, not per-endpoint"
}' | .claude/bin/memory-add --domain=tools
```

---

## Integration (Optional)

To enable automatic calibration hooks:

```bash
.claude/hooks/integrate_memory_hooks.sh
```

This will show you how to integrate hooks for automatic pattern tracking.

---

## Tips

1. **Path-specific rules auto-load** - When you edit `src/firebase.ts`, `.claude/rules/infrastructure/firebase.md` loads automatically (if it has matching paths in frontmatter)

2. **Use domains** - Organize by:
   - `tools/` - Feature-specific (API, components, etc.)
   - `infrastructure/` - System-level (database, auth, deployment)
   - `testing/` - Testing patterns
   - `lessons/` - Cross-cutting learnings

3. **Freshness matters** - Use tags:
   - HOT (< 2 weeks)
   - WARM (< 3 months)
   - COLD (> 3 months)

4. **Search is fast** - Don't hesitate to search frequently

5. **Capture liberally** - Better to document than forget

---

## Common Tasks

**"I just hit an error"**
```bash
.claude/bin/memory-query "error-keyword"
# Check if it's documented
```

**"I'm starting work on X"**
```bash
cat .claude/rules/active-context/current-focus.md
.claude/bin/memory-query "X"
```

**"I solved something tricky"**
```bash
/meta capture-learning
# Or use memory-add directly
```

**"What's in memory?"**
```bash
.claude/bin/memory-stats
.claude/bin/memory-pipe hot
```

---

## System Philosophy

This isn't just documentation - it's a **self-improving cognitive landscape**:

- Every agent interaction can improve the topology
- Information appears when relevant (path-specific)
- Recent patterns prioritized (temporal freshness)
- Programmatic access (Unix-style CLI)

**The environment learns. You benefit. The cycle continues.**

---

## Next Steps

1. Run `memory-stats` to see current state
2. Check `current-focus.md` to see what's active
3. Search for patterns: `memory-query "your-topic"`
4. Add learnings as you discover them
5. Watch the system improve over time

**That's it! The memory system is ready to use.**

---

**Need help?** See:
- `.claude/rules/00-meta.md` - Memory system guide
- `.claude/bin/README.md` - CLI documentation
- `COMPLETE_SYSTEM_SUMMARY.md` - Full overview
