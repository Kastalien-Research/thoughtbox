# Memory System Expert Skill

**Skill ID**: `memory-system-expert`  
**Version**: 1.0  
**Last Updated**: 2026-01-09

---

## Skill Purpose

This skill teaches Claude agents how to effectively use and contribute to the **progressive learning memory system** in this codebase. You will learn to:

1. Search memory for relevant patterns
2. Add learnings to improve the system
3. Use Unix-style CLI tools programmatically
4. Understand path-specific rule loading
5. Calibrate the information topology over time

**When to use this skill**: Any time you're working in a codebase with a `.claude/rules/` directory and memory CLI tools.

---

## Core Concepts

### What is the Memory System?

A **self-improving cognitive landscape** that:
- Learns from every agent interaction
- Auto-loads relevant information when editing files
- Provides Unix-style programmatic access
- Prioritizes recent learnings over stale information

**Not just documentation** - it's an evolving environment optimized by usage patterns.

### Three-Part Architecture

```
Memory Structure          CLI Tools              Calibration Hooks
(.claude/rules/)          (.claude/bin/)         (.claude/hooks/)
      │                        │                       │
      ├─→ tools/              ├─→ memory-query        ├─→ session_start
      ├─→ infrastructure/     ├─→ memory-rank         ├─→ track_file_access
      ├─→ testing/            ├─→ memory-format       ├─→ pattern_detector
      ├─→ lessons/            ├─→ memory-add          └─→ session_end
      └─→ active-context/     ├─→ memory-stats
                              └─→ memory-pipe

           Self-Improving System
```

### Key Innovation: Environmental Calibration

**Traditional approach**: Train model weights  
**Memory system**: Optimize the information environment

Same model + better information topology = faster discovery

---

## How to Use Memory (Agent Perspective)

### 1. Starting a Session

**First, check current focus:**
```python
# In Python agent
with open('.claude/rules/active-context/current-focus.md') as f:
    current_focus = f.read()
    print(f"Current focus: {current_focus[:200]}")
```

**Check memory status:**
```python
import subprocess

result = subprocess.run(['memory-stats', '--json'], capture_output=True, text=True)
if result.returncode == 0:
    stats = json.loads(result.stdout)
    print(f"Memory: {stats['total_files']} files, {stats['total_learnings']} learnings")
```

### 2. Searching for Patterns

**When to search**:
- Before implementing a feature (check for existing patterns)
- When encountering an error (check if it's documented)
- When stuck (look for similar solutions)

**How to search:**
```python
def search_memory(term: str) -> list:
    """Search memory system for patterns"""
    result = subprocess.run(
        ['memory-query', term],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        learnings = [json.loads(line) for line in result.stdout.strip().split('\n')]
        return learnings
    return []

# Usage
patterns = search_memory("authentication")
for p in patterns:
    print(f"Pattern: {p['pattern']}")
    print(f"Solution: {p['solution']}\n")
```

**Advanced search:**
```python
# Search by domain
os.environ['MEMORY_QUERY_DOMAIN'] = 'tools'
patterns = search_memory("validation")

# Search only hot learnings
os.environ['MEMORY_QUERY_FRESHNESS'] = 'hot'
patterns = search_memory("error handling")

# Rank results
import json
query_result = subprocess.run(['memory-query', 'term'], capture_output=True, text=True)
rank_result = subprocess.run(['memory-rank'], input=query_result.stdout, capture_output=True, text=True)
ranked = [json.loads(line) for line in rank_result.stdout.strip().split('\n')]
```

### 3. Adding Learnings

**When to capture**:
- ✅ Non-obvious bugs and their fixes
- ✅ Patterns worth repeating
- ✅ Time-saving discoveries
- ✅ "I wish I'd known this" moments
- ❌ One-off fixes without broader lessons
- ❌ Information already in official docs

**How to add:**
```python
def add_learning(title: str, issue: str, solution: str, pattern: str, domain: str = "lessons"):
    """Add a learning to memory system"""
    learning = {
        "title": title,
        "issue": issue,
        "solution": solution,
        "pattern": pattern
    }
    
    result = subprocess.run(
        ['memory-add', f'--domain={domain}'],
        input=json.dumps(learning),
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        confirmation = json.loads(result.stdout)
        print(f"✅ Added: {confirmation['title']}")
        print(f"📁 File: {confirmation['file']}")
        return True
    else:
        print(f"❌ Failed: {result.stderr}")
        return False

# Usage
add_learning(
    title="Rate Limiting at Middleware Layer",
    issue="API endpoints vulnerable to abuse without rate limiting",
    solution="Implemented token bucket rate limiter as Express middleware",
    pattern="Rate limiting should be middleware, not per-endpoint logic",
    domain="tools"
)
```

### 4. Path-Specific Rules (Advanced)

**Understand auto-loading:**

When you edit a file, rules with matching `paths` in their frontmatter auto-load.

Example rule file: `.claude/rules/tools/api.md`
```yaml
---
paths: [src/api/**, api/**]
---

# API Development Memory
...
```

When you edit `src/api/handler.ts`, this rule loads automatically!

**How to check what's loaded:**
```bash
# In Claude Code
/memory
```

### 5. Unix-Style Composition

**The tools are composable - use pipes:**

```bash
# Search → Rank → Format → Take top 3
memory-query "timeout" | memory-rank | head -3 | memory-format --style=full

# Extract just patterns
memory-query "error" | jq -r '.pattern' | sort -u

# Search and export to markdown
memory-query "authentication" | memory-rank | memory-format --style=markdown > auth-patterns.md
```

**From Python:**
```python
# Pipeline in Python
query_proc = subprocess.Popen(['memory-query', 'timeout'], stdout=subprocess.PIPE)
rank_proc = subprocess.Popen(['memory-rank'], stdin=query_proc.stdout, stdout=subprocess.PIPE)
format_proc = subprocess.Popen(['memory-format', '--style=full'], stdin=rank_proc.stdout, stdout=subprocess.PIPE)

output, _ = format_proc.communicate()
print(output.decode())
```

---

## Learning Format

### Standard Structure

```markdown
### YYYY-MM-DD: [Brief Title] 🔥
- **Issue**: What was the problem or challenge
- **Solution**: What worked (be specific with details)
- **Pattern**: Reusable principle for future work
- **Files**: Key files involved (with line ranges if relevant)
- **See Also**: Links to related learnings or documentation
```

### Freshness Tags

- 🔥 **HOT** (< 2 weeks): Active development, highest priority
- ⚡ **WARM** (< 3 months): Recent patterns, very relevant
- 📚 **COLD** (> 3 months): Stable knowledge, reference as needed
- 🗄️ **ARCHIVED** (> 6 months): Historical, in ai_docs/archive/

### Good vs. Bad Examples

**❌ Bad Example** (too vague):
```markdown
### 2026-01-09: Fixed bug
- **Issue**: Something was broken
- **Solution**: Changed the code
- **Pattern**: Fix bugs
```

**✅ Good Example** (specific and actionable):
```markdown
### 2026-01-09: Database Connection Pool Timeout 🔥
- **Issue**: API requests timing out after 10 concurrent users due to connection pool exhaustion
- **Solution**: Increased pool size from 5 to 20 and added connection recycling after 30min idle time
- **Pattern**: Monitor connection pool metrics (pool.totalCount, pool.idleCount) and tune based on actual load, not guesses
- **Files**: `src/infrastructure/database.ts:15-30`, `config/database.json:8-12`
- **See Also**: `.claude/rules/infrastructure/database.md` for related patterns
```

---

## Domain Organization

### Choosing the Right Domain

**tools/** - Feature/module-specific patterns
- API routes and handlers
- UI components
- Business logic
- Utilities and helpers
- Feature-specific workflows

**infrastructure/** - System-level patterns
- Database (connections, queries, migrations)
- Authentication and authorization
- Deployment and CI/CD
- Monitoring and logging
- Configuration management
- Caching strategies

**testing/** - Testing patterns
- Test structure and organization
- Mocking strategies
- Test data generation
- Integration test patterns
- CI/CD testing
- Performance testing

**lessons/** - Cross-cutting learnings
- General architectural principles
- Process improvements
- Team conventions
- Hard-learned lessons
- When to use what approach

**active-context/** - Current work state
- What's being worked on right now
- Recent decisions and rationale
- Active questions
- What NOT to focus on

---

## CLI Tools Reference

### memory-query

**Purpose**: Search memory for patterns

**Basic usage:**
```bash
memory-query "search-term"
```

**Environment variables:**
- `MEMORY_QUERY_MAX=N` - Limit results (default: 10)
- `MEMORY_QUERY_DOMAIN=X` - Filter by domain
- `MEMORY_QUERY_FRESHNESS=X` - Filter by freshness (hot/warm/cold)

**Output**: JSON stream (one object per line)

**Exit codes:**
- 0 = Success, results found
- 1 = No results
- 2 = Invalid arguments

### memory-rank

**Purpose**: Sort search results by relevance score

**Usage:**
```bash
memory-query "term" | memory-rank
```

**Scoring formula:**
```
score = (relevance × 5) + (freshness × 3) + (has_pattern × 2)

Freshness values:
  hot = 4, warm = 3, cold = 2, archived = 1
```

**Environment variables:**
- `MEMORY_RANK_RELEVANCE=N` - Weight for matches (default: 5)
- `MEMORY_RANK_FRESHNESS=N` - Weight for freshness (default: 3)
- `MEMORY_RANK_PATTERN=N` - Weight for pattern presence (default: 2)

### memory-add

**Purpose**: Add new learning to memory system

**Usage:**
```bash
echo '{"title":"...","issue":"...","solution":"...","pattern":"..."}' | \
  memory-add --domain=DOMAIN
```

**Required JSON fields:**
- `title` - Brief descriptive title
- `issue` - What was the problem
- `solution` - What worked
- `pattern` - Reusable principle

**Optional JSON fields:**
- `files` - Key files involved
- `see_also` - Related learnings
- `freshness` - hot|warm|cold (default: hot)

**Domains:** `tools` | `infrastructure` | `testing` | `lessons`

### memory-stats

**Purpose**: Display memory system statistics

**Usage:**
```bash
memory-stats           # Human-readable
memory-stats --json    # Machine-readable
```

**JSON output structure:**
```json
{
  "total_files": 12,
  "total_learnings": 45,
  "by_freshness": {
    "hot": 15,
    "warm": 20,
    "cold": 8,
    "archived": 2
  },
  "by_domain": {
    "tools": 4,
    "infrastructure": 5,
    "testing": 2,
    "lessons": 1
  }
}
```

### memory-pipe

**Purpose**: Pre-built pipelines for common operations

**Pipelines:**
- `search <term>` - Search, rank, and format results
- `top <term> [N]` - Top N results (default: 5)
- `recent [N]` - N most recent learnings
- `gaps` - Show coverage gaps (if calibration enabled)
- `issues` - Show repeated issues (if calibration enabled)
- `hot` - Show hot learnings only
- `domain <name> <term>` - Search within specific domain

**Usage:**
```bash
memory-pipe search "firebase"
memory-pipe top "timeout" 3
memory-pipe hot
memory-pipe domain tools "validation"
```

---

## Agent Workflows

### Workflow 1: Implementing New Feature

```python
def implement_feature(feature_name: str):
    """
    Implement a feature using memory system
    """
    
    # 1. Check current focus
    with open('.claude/rules/active-context/current-focus.md') as f:
        focus = f.read()
        if feature_name.lower() not in focus.lower():
            print(f"⚠️  This feature not in current focus. Consider updating current-focus.md")
    
    # 2. Search for relevant patterns
    patterns = search_memory(feature_name)
    if patterns:
        print(f"✅ Found {len(patterns)} relevant patterns:")
        for p in patterns[:3]:
            print(f"  • {p['title']}: {p['pattern']}")
    else:
        print("ℹ️  No existing patterns found - you'll be blazing a trail!")
    
    # 3. Implement (your actual work)
    implementation_result = do_implementation(feature_name)
    
    # 4. Capture learnings
    if implementation_result.had_challenges:
        add_learning(
            title=f"{feature_name} Implementation Pattern",
            issue=implementation_result.challenge_description,
            solution=implementation_result.solution_description,
            pattern=implementation_result.extracted_pattern,
            domain="tools"
        )
        print("✅ Learning captured for future work!")
    
    return implementation_result
```

### Workflow 2: Debugging Issues

```python
def debug_issue(error_message: str):
    """
    Debug using memory system
    """
    
    # 1. Check if this is a known issue
    patterns = search_memory(error_message)
    
    if patterns:
        print(f"✅ This error is documented! Found {len(patterns)} related patterns:")
        top_pattern = patterns[0]
        print(f"\nMost relevant:")
        print(f"  Issue: {top_pattern['issue']}")
        print(f"  Solution: {top_pattern['solution']}")
        print(f"  Pattern: {top_pattern['pattern']}")
        return top_pattern['solution']
    
    # 2. Not documented - debug manually
    print("⚠️  This error is NOT documented yet")
    solution = debug_manually(error_message)
    
    # 3. Document for future
    if solution:
        add_learning(
            title=f"Fix for: {error_message[:50]}",
            issue=error_message,
            solution=solution,
            pattern=extract_pattern(solution),
            domain="lessons"
        )
        print("✅ Error solution documented for future!")
    
    return solution
```

### Workflow 3: Code Review Prep

```python
def prepare_code_review(changed_files: list[str]):
    """
    Check memory for relevant patterns before code review
    """
    
    recommendations = []
    
    for file in changed_files:
        # Infer topic from file path
        if 'api' in file:
            patterns = search_memory('api best practices')
        elif 'test' in file:
            patterns = search_memory('testing patterns')
        elif 'database' in file or 'db' in file:
            patterns = search_memory('database patterns')
        else:
            continue
        
        if patterns:
            recommendations.append({
                'file': file,
                'relevant_patterns': [p['pattern'] for p in patterns[:2]]
            })
    
    return recommendations
```

---

## Advanced: Pattern Detection

If calibration hooks are enabled, the system tracks:
- **Coverage gaps**: Files accessed frequently without memory rules
- **Repeated issues**: Same problems encountered multiple times
- **Discovery time**: How long it takes to find information

**Check calibration status:**
```python
import os

if os.path.exists('.claude/state/memory-calibration.json'):
    with open('.claude/state/memory-calibration.json') as f:
        calibration = json.load(f)
        
        gaps = calibration.get('coverage_gaps', [])
        if gaps:
            print("🎯 Coverage Gaps Detected:")
            for gap in gaps:
                print(f"  • {gap['file']} (accessed {gap['access_count']}x)")
        
        issues = calibration.get('repeated_issues', [])
        if issues:
            print("🔁 Repeated Issues:")
            for issue in issues:
                print(f"  • {issue['error']} (occurred {issue['count']}x)")
```

---

## Best Practices for Agents

### 1. Search First, Implement Second

```python
# ✅ Good
patterns = search_memory("rate limiting")
if patterns:
    # Apply existing pattern
    implement_using_pattern(patterns[0])
else:
    # Create new implementation
    result = implement_new()
    # Document it
    add_learning(...)

# ❌ Bad
# Just implement without checking memory
implement_new()
```

### 2. Capture Learnings Immediately

Don't wait until end of session - capture when fresh:

```python
try:
    result = implement_tricky_feature()
    
    # Capture immediately while details are fresh
    add_learning(
        title="What I just learned",
        issue="What was tricky",
        solution="What worked",
        pattern="General principle"
    )
except Exception as e:
    # Also capture failures!
    add_learning(
        title=f"Pitfall: {str(e)[:50]}",
        issue=f"Tried X, got error: {e}",
        solution="Don't do X, do Y instead",
        pattern="Always validate Z before X"
    )
```

### 3. Be Specific in Patterns

```python
# ❌ Vague
pattern = "Use proper error handling"

# ✅ Specific
pattern = "Wrap database operations in try/catch with specific error types (ConnectionError, TimeoutError) and handle each differently - don't catch generic Exception"
```

### 4. Include Context

```python
# ❌ No context
add_learning(
    title="Fixed bug",
    issue="It was broken",
    solution="Changed it",
    pattern="Fix bugs"
)

# ✅ Full context
add_learning(
    title="JWT Token Expiry Handling",
    issue="API requests failing with 401 after 1 hour due to expired JWT tokens",
    solution="Added token refresh logic that checks expiry before each request and auto-refreshes if < 5min remaining",
    pattern="For long-running processes with JWT auth, implement proactive token refresh rather than reactive (waiting for 401)",
    files="src/api/auth.ts:45-67"
)
```

### 5. Update Current Focus

When starting significant new work:

```python
def start_new_work(feature_name: str):
    """Update current focus when starting new work"""
    
    # Read current
    with open('.claude/rules/active-context/current-focus.md') as f:
        current = f.read()
    
    # Update
    date = datetime.now().strftime('%Y-%m-%d')
    new_section = f"""
## What We're Working On Now

**Started**: {date}

### {feature_name}

[Description of work]

[Previous content below...]

{current}
"""
    
    with open('.claude/rules/active-context/current-focus.md', 'w') as f:
        f.write(new_section)
    
    print(f"✅ Updated current-focus.md with: {feature_name}")
```

---

## Slash Commands

Quick access in Claude Code:

- `/memory-start` - Quick start guide with all essential commands
- `/memory-search` - How to search memory effectively
- `/memory-add-quick` - Copy-paste templates for adding learnings
- `/meta capture-learning` - Interactive learning capture workflow

---

## Troubleshooting

### "No results when searching"

```python
# Check if memory exists
result = subprocess.run(['memory-stats'], capture_output=True, text=True)
print(result.stdout)

# Try broader search
search_memory("broader-term")

# Check what domains exist
import os
domains = os.listdir('.claude/rules')
print(f"Available domains: {domains}")
```

### "Not sure which domain to use"

```python
def suggest_domain(description: str) -> str:
    """Suggest domain based on description"""
    
    description_lower = description.lower()
    
    if any(word in description_lower for word in ['api', 'endpoint', 'route', 'component', 'feature']):
        return 'tools'
    elif any(word in description_lower for word in ['database', 'deployment', 'auth', 'config', 'infrastructure']):
        return 'infrastructure'
    elif any(word in description_lower for word in ['test', 'mock', 'fixture']):
        return 'testing'
    else:
        return 'lessons'  # Default for cross-cutting concerns

# Usage
domain = suggest_domain("How to structure API endpoints")
print(f"Suggested domain: {domain}")
```

### "Want to see what's loaded"

In Claude Code:
```
/memory
```

Or programmatically:
```python
# Check if path-specific rules exist for a file
import re

def get_rules_for_file(filepath: str) -> list[str]:
    """Get rules that would load for a file"""
    
    matching_rules = []
    
    for rule_file in glob.glob('.claude/rules/**/*.md', recursive=True):
        with open(rule_file) as f:
            content = f.read()
            
            # Extract paths from frontmatter
            if content.startswith('---'):
                frontmatter = content.split('---')[1]
                if 'paths:' in frontmatter:
                    paths_match = re.search(r'paths:\s*\[(.*?)\]', frontmatter, re.DOTALL)
                    if paths_match:
                        paths = paths_match.group(1).split(',')
                        for path_pattern in paths:
                            path_pattern = path_pattern.strip().strip('"\'')
                            # Simple glob matching
                            if path_matches(filepath, path_pattern):
                                matching_rules.append(rule_file)
                                break
    
    return matching_rules
```

---

## Key Takeaways

1. **Search before implementing** - Check if pattern exists
2. **Capture immediately** - Don't wait, document while fresh
3. **Be specific** - Vague patterns don't help future agents
4. **Use domains correctly** - Organize by area
5. **Include context** - Files, line numbers, why not just what
6. **Unix composition** - Pipe tools together for power
7. **Update current focus** - Keep team/agents aligned
8. **Monitor calibration** - Watch for gaps and repeated issues

---

## Philosophy

**This is not documentation** - it's an **evolving cognitive landscape**.

Every time you:
- Search memory → Signal what's important
- Add learning → Improve the topology
- Use patterns → Validate their usefulness

**The environment learns from your behavior.**

Over time:
- Discovery gets faster (patterns easier to find)
- Coverage improves (fewer gaps)
- Quality increases (useful patterns amplified)

**You're not just using memory - you're training the environment.**

---

## Success Indicators

You're using the memory system well when:

✅ You search memory BEFORE implementing features  
✅ You capture learnings IMMEDIATELY after discoveries  
✅ Your searches find relevant patterns in < 30 seconds  
✅ You rarely encounter the same problem twice  
✅ Other agents benefit from your captured learnings  
✅ Current focus stays up-to-date  
✅ You use Unix pipes to compose custom workflows  

**The system is working when information feels "ready at hand"** 🎯

---

**Version**: 1.0  
**Last Updated**: 2026-01-09  
**Related Skills**: None (foundational skill)  
**Prerequisites**: Basic understanding of bash, Python subprocess, and JSON

---

**End of Skill**

When you use this skill, you become a **memory system expert** capable of leveraging and improving the cognitive landscape of any codebase with this system installed.
