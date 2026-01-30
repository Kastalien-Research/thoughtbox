# Memory Search

Search the memory system for patterns and learnings.

---

## Quick Search

```bash
# Basic search
.claude/bin/memory-query "your-search-term"

# Top 3 results
.claude/bin/memory-pipe top "your-search-term" 3

# Full search with ranking and formatting
.claude/bin/memory-pipe search "your-search-term"
```

---

## Search by Domain

```bash
# Search only in tools
.claude/bin/memory-pipe domain tools "your-term"

# Search only in infrastructure
.claude/bin/memory-pipe domain infrastructure "your-term"

# Search only in testing
.claude/bin/memory-pipe domain testing "your-term"
```

---

## Search by Freshness

```bash
# Only hot learnings (< 2 weeks)
MEMORY_QUERY_FRESHNESS=hot .claude/bin/memory-query "your-term"

# Only warm learnings (< 3 months)
MEMORY_QUERY_FRESHNESS=warm .claude/bin/memory-query "your-term"
```

---

## Advanced Search

```bash
# Limit results
MEMORY_QUERY_MAX=5 .claude/bin/memory-query "your-term"

# Search and extract just patterns
.claude/bin/memory-query "your-term" | jq -r '.pattern'

# Search and format as markdown
.claude/bin/memory-query "your-term" | \
  .claude/bin/memory-rank | \
  .claude/bin/memory-format --style=markdown

# Get JSON output for programmatic use
.claude/bin/memory-query "your-term" | jq '.'
```

---

## Common Searches

**Find error patterns:**
```bash
.claude/bin/memory-query "error"
.claude/bin/memory-query "timeout"
.claude/bin/memory-query "failed"
```

**Find implementation patterns:**
```bash
.claude/bin/memory-query "authentication"
.claude/bin/memory-query "validation"
.claude/bin/memory-query "database"
```

**Find testing patterns:**
```bash
.claude/bin/memory-query "test"
.claude/bin/memory-query "mock"
```

---

## Result Format

Each result includes:
- `title` - Brief description
- `date` - When it was captured
- `domain` - Which area (tools/infrastructure/testing/lessons)
- `issue` - What was the problem
- `solution` - What worked
- `pattern` - Reusable principle
- `files` - Key files involved

---

## Tips

1. **Be specific** - "firebase timeout" better than just "firebase"
2. **Try variations** - "authentication", "auth", "login"
3. **Search frequently** - It's fast, don't hesitate
4. **Pipe to other tools** - Combine with grep, jq, etc.

---

## No Results?

If you don't find what you need:

1. Try broader terms
2. Check if the area has memory: `ls .claude/rules/`
3. This might be a new pattern - capture it!
4. Run `memory-stats` to see what's covered

---

**See also:**
- `/memory:start` - Quick start guide
- `/meta capture-learning` - Add new learnings
- `.claude/bin/README.md` - Full CLI documentation
