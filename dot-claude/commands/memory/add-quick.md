# Quick Add to Memory

Add a learning to the memory system in one command.

---

## Template

```bash
echo '{
  "title": "Brief Descriptive Title",
  "issue": "What was the problem or challenge",
  "solution": "What worked (be specific)",
  "pattern": "Reusable principle for future work"
}' | .claude/bin/memory-add --domain=CHOOSE_ONE
```

**Domains**: `tools` | `infrastructure` | `testing` | `lessons`

---

## Examples

### Example 1: API Pattern

```bash
echo '{
  "title": "Rate Limiting at Middleware Layer",
  "issue": "API endpoints were vulnerable to abuse",
  "solution": "Implemented token bucket rate limiter as middleware",
  "pattern": "Rate limiting should be middleware, not per-endpoint logic"
}' | .claude/bin/memory-add --domain=tools
```

### Example 2: Database Pattern

```bash
echo '{
  "title": "Connection Pool Timeout Fix",
  "issue": "Database connections timing out under load",
  "solution": "Increased pool size and added connection recycling",
  "pattern": "Monitor connection pool metrics, tune based on actual load"
}' | .claude/bin/memory-add --domain=infrastructure
```

### Example 3: Testing Pattern

```bash
echo '{
  "title": "Mock External APIs in Tests",
  "issue": "Tests failing due to network dependencies",
  "solution": "Used MSW to mock API responses at network layer",
  "pattern": "Mock external dependencies at the boundary, not inline"
}' | .claude/bin/memory-add --domain=testing
```

### Example 4: General Lesson

```bash
echo '{
  "title": "Always Version API Responses",
  "issue": "Breaking changes caused client crashes",
  "solution": "Added version field to all API responses",
  "pattern": "Version everything from the start, not when you need it"
}' | .claude/bin/memory-add --domain=lessons
```

---

## With Optional Fields

You can also include:
- `files` - Key files involved
- `see_also` - Related learnings
- `freshness` - `hot` | `warm` | `cold` (default: hot)

```bash
echo '{
  "title": "Your Title",
  "issue": "Problem",
  "solution": "What worked",
  "pattern": "Principle",
  "files": "src/api/handler.ts:45-67",
  "see_also": "See firebase.md for related patterns",
  "freshness": "hot"
}' | .claude/bin/memory-add --domain=tools
```

---

## Which Domain?

**tools/** - Feature/module-specific patterns
- API routes
- UI components
- Business logic
- Utilities

**infrastructure/** - System-level patterns
- Database
- Authentication
- Deployment
- Monitoring
- Configuration

**testing/** - Testing patterns
- Test structure
- Mocking strategies
- Test data
- CI/CD

**lessons/** - Cross-cutting learnings
- General principles
- Architectural decisions
- Process improvements
- Team learnings

---

## Verify It Worked

```bash
# Search for what you just added
.claude/bin/memory-query "part-of-your-title"

# Check stats
.claude/bin/memory-stats
```

---

## Alternative: Interactive Mode

For more guidance, use:

```bash
/meta capture-learning
```

This walks you through the process with prompts.

---

## Tips

1. **Be specific in solutions** - Not "fixed it" but "added connection retry with exponential backoff"
2. **Extract the pattern** - Not just what you did, but the reusable principle
3. **Include file references** - Helps future agents find relevant code
4. **Choose the right domain** - Affects where it's searchable
5. **Capture frequently** - Better to over-document than forget

---

**Remember**: Every learning makes the system better for future work!

---

**See also:**
- `/memory:start` - Quick start guide
- `/memory:search` - Search existing patterns
- `.claude/rules/00-meta.md` - Memory system guide
