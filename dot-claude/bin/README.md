# Memory System CLI Tools - Unix Philosophy

**Composable, pipeable tools for programmatic memory access**

---

## Philosophy

These tools follow the Unix philosophy:

1. **Do one thing well** - Each tool has a single, clear purpose
2. **Text streams as interface** - JSON in/out via stdin/stdout
3. **Composable** - Chain tools together with pipes
4. **Exit codes** - 0=success, 1=no results, 2=error
5. **Silent success** - Only output data, not commentary
6. **Machine-readable** - JSON everywhere for programmatic use

---

## Tools

| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `memory-query` | Search memory | term | JSON stream |
| `memory-rank` | Rank by relevance | JSON stream | Sorted JSON |
| `memory-format` | Human-readable | JSON stream | Formatted text |
| `memory-add` | Add learning | JSON (stdin) | Confirmation |
| `memory-stats` | Statistics | - | Stats (text/JSON) |
| `memory-pipe` | Pre-built pipelines | varies | varies |

---

## Quick Examples

### Basic Search
```bash
# Search for "firebase" patterns
memory-query "firebase"

# Top 5 most relevant results
memory-query "firebase" | memory-rank | head -5

# Human-readable output
memory-query "firebase" | memory-format --style=full
```

### Pipelines
```bash
# Pre-built pipeline
memory-pipe search "firebase"

# Top 3 results
memory-pipe top "timeout" 3

# Recent hot learnings
memory-pipe hot

# Coverage gaps
memory-pipe gaps
```

### Adding Learnings
```bash
# From JSON file
cat learning.json | memory-add --domain=tools

# From string
echo '{"title":"Fix","issue":"X","solution":"Y","pattern":"Z"}' | \
  memory-add --domain=infrastructure
```

### Statistics
```bash
# Human-readable
memory-stats

# JSON output
memory-stats --json | jq '.by_freshness'
```

---

## Detailed Usage

### `memory-query` - Search Memory

**Purpose**: Find learnings matching search term

**Usage**:
```bash
memory-query <term> [env-vars]
```

**Environment Variables**:
- `MEMORY_QUERY_MAX=N` - Max results (default: 10)
- `MEMORY_QUERY_DOMAIN=X` - Filter by domain
- `MEMORY_QUERY_FRESHNESS=X` - Filter by freshness (hot/warm/cold)

**Output**: JSON stream (one object per line)
```json
{
  "title": "Firebase Emulator Init Order",
  "date": "2026-01-09",
  "freshness": "hot",
  "domain": "infrastructure",
  "file": ".claude/rules/infrastructure/firebase.md",
  "issue": "Tests failed despite emulator running",
  "solution": "Set FIRESTORE_EMULATOR_HOST before imports",
  "pattern": "Env vars affecting imports must be set early",
  "files": "scripts/agentic-test.ts:1-5",
  "relevance": 3,
  "full_text": "..."
}
```

**Examples**:
```bash
# Basic search
memory-query "firebase"

# Filter by domain
MEMORY_QUERY_DOMAIN=tools memory-query "timeout"

# Only hot learnings
MEMORY_QUERY_FRESHNESS=hot memory-query "error"

# Limit results
MEMORY_QUERY_MAX=5 memory-query "session"
```

**Exit Codes**:
- 0 = Results found
- 1 = No results
- 2 = Invalid arguments

---

### `memory-rank` - Rank Results

**Purpose**: Sort search results by relevance score

**Usage**:
```bash
memory-query "term" | memory-rank
```

**Scoring Formula**:
```
score = (relevance * 5) + (freshness * 3) + (has_pattern * 2)

Freshness values:
  hot      = 4
  warm     = 3
  cold     = 2
  archived = 1
```

**Environment Variables**:
- `MEMORY_RANK_RELEVANCE=N` - Weight for matches (default: 5)
- `MEMORY_RANK_FRESHNESS=N` - Weight for freshness (default: 3)
- `MEMORY_RANK_PATTERN=N` - Weight for pattern (default: 2)

**Examples**:
```bash
# Default ranking
memory-query "firebase" | memory-rank

# Prioritize freshness
MEMORY_RANK_FRESHNESS=10 memory-query "error" | memory-rank

# Get top 3
memory-query "timeout" | memory-rank | head -3
```

---

### `memory-format` - Format Output

**Purpose**: Transform JSON to human-readable text

**Usage**:
```bash
memory-query "term" | memory-format [--style=X]
```

**Styles**:
- `compact` - One line per result (default)
- `full` - Multi-line with all details
- `markdown` - Markdown formatted
- `summary` - Just titles and patterns

**Examples**:
```bash
# Compact (default)
memory-query "firebase" | memory-format

# Full details
memory-query "error" | memory-rank | memory-format --style=full

# Markdown
memory-query "timeout" | memory-format --style=markdown > results.md

# Summary
memory-query "session" | memory-format --style=summary
```

---

### `memory-add` - Add Learning

**Purpose**: Add new learning to memory system

**Usage**:
```bash
echo <json> | memory-add [--domain=X] [--file=Y]
```

**Required JSON Fields**:
- `title` - Brief descriptive title
- `issue` - What was the problem
- `solution` - What worked
- `pattern` - Reusable principle

**Optional JSON Fields**:
- `files` - Key files involved
- `see_also` - Related learnings
- `freshness` - hot|warm|cold (default: hot)

**Options**:
- `--domain=X` - tools|infrastructure|testing|lessons
- `--file=Y` - Specific file path (overrides domain)

**Examples**:
```bash
# Add to tools domain
echo '{
  "title": "Notebook Execution Timeout",
  "issue": "Long-running cells block other operations",
  "solution": "Added 30s timeout with graceful termination",
  "pattern": "Always timeout async operations in sandboxed code",
  "files": "src/notebook/executor.ts:45-67",
  "freshness": "hot"
}' | memory-add --domain=tools

# Add to specific file
cat learning.json | memory-add --file=.claude/rules/infrastructure/firebase.md

# From stdin in script
cat <<EOF | memory-add --domain=infrastructure
{
  "title": "Middleware Order Matters",
  "issue": "Session validation failed intermittently",
  "solution": "Ensured auth middleware runs before session middleware",
  "pattern": "Middleware order determines execution sequence - be explicit"
}
EOF
```

---

### `memory-stats` - Statistics

**Purpose**: Display memory system statistics

**Usage**:
```bash
memory-stats [--json]
```

**Output** (human-readable):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 Memory System Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📂 Total Files:      12
📚 Total Learnings:  45

By Freshness:
  🔥 Hot:            15
  ⚡ Warm:           20
  📚 Cold:           8
  🗄️ Archived:       2

...
```

**Output** (JSON):
```json
{
  "total_files": 12,
  "total_learnings": 45,
  "by_freshness": {"hot": 15, "warm": 20, "cold": 8, "archived": 2},
  "by_domain": {"tools": 4, "infrastructure": 5, "testing": 2, "lessons": 1},
  "recent_updates": 3,
  "calibration": {"coverage_gaps": 2, "repeated_issues": 1}
}
```

**Examples**:
```bash
# Human-readable
memory-stats

# JSON
memory-stats --json

# Extract specific data
memory-stats --json | jq '.by_freshness.hot'

# Check for gaps
if [[ $(memory-stats --json | jq '.calibration.coverage_gaps') -gt 0 ]]; then
    echo "Coverage gaps detected!"
fi
```

---

### `memory-pipe` - Pre-built Pipelines

**Purpose**: Common operations as single commands

**Pipelines**:
- `search <term>` - Search and rank results
- `top <term> [N]` - Top N results (default: 5)
- `recent [N]` - N most recent learnings
- `gaps` - Show coverage gaps
- `issues` - Show repeated issues
- `hot` - Show hot learnings only
- `domain <name> <term>` - Search within domain

**Examples**:
```bash
# Search with ranking and formatting
memory-pipe search "firebase"

# Top 3 results
memory-pipe top "timeout" 3

# Recent learnings
memory-pipe recent 10

# Coverage gaps
memory-pipe gaps

# Repeated issues
memory-pipe issues

# Hot learnings only
memory-pipe hot

# Search within domain
memory-pipe domain tools "execution"
```

---

## Advanced Pipelines

### Find Hot Learnings About Specific Topic
```bash
MEMORY_QUERY_FRESHNESS=hot memory-query "firebase" | \
  memory-rank | \
  memory-format --style=markdown
```

### Get Patterns for Issue
```bash
memory-query "timeout" | \
  memory-rank | \
  jq -r '.pattern' | \
  sort -u
```

### Export Domain to Markdown
```bash
MEMORY_QUERY_DOMAIN=tools memory-query "." | \
  memory-format --style=markdown > tools-memory.md
```

### Check for Repeated Issues
```bash
if memory-pipe issues | grep -q "Firestore timeout"; then
    echo "Known issue - check firebase.md"
    memory-query "firestore timeout" | memory-format --style=full
fi
```

### Conditional Learning Addition
```bash
# Only add if not already documented
if ! memory-query "specific-issue" | grep -q "specific-issue"; then
    echo "$learning_json" | memory-add --domain=infrastructure
fi
```

---

## Programmatic Use (Claude Agent SDK)

### Python Example

```python
import subprocess
import json

# Search memory
def search_memory(term, max_results=10):
    env = {"MEMORY_QUERY_MAX": str(max_results)}
    result = subprocess.run(
        ["memory-query", term],
        capture_output=True,
        text=True,
        env={**os.environ, **env}
    )
    
    if result.returncode == 0:
        return [json.loads(line) for line in result.stdout.strip().split('\n')]
    return []

# Add learning
def add_learning(learning_dict, domain="lessons"):
    result = subprocess.run(
        ["memory-add", f"--domain={domain}"],
        input=json.dumps(learning_dict),
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        return json.loads(result.stdout)
    else:
        raise Exception(f"Failed to add learning: {result.stderr}")

# Get stats
def get_stats():
    result = subprocess.run(
        ["memory-stats", "--json"],
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

# Usage in agent
learnings = search_memory("firebase")
for learning in learnings:
    print(f"Pattern: {learning['pattern']}")

# Add new learning
new_learning = {
    "title": "Discovery from this session",
    "issue": "Problem encountered",
    "solution": "What worked",
    "pattern": "General principle"
}
add_learning(new_learning, domain="tools")
```

### Bash Example

```bash
#!/bin/bash

# Search and act on results
search_and_apply() {
    local term="$1"
    
    # Search memory
    results=$(memory-query "$term" | memory-rank)
    
    # Count results
    count=$(echo "$results" | wc -l)
    
    if [[ $count -gt 0 ]]; then
        echo "Found $count relevant patterns:"
        echo "$results" | memory-format --style=summary
        return 0
    else
        echo "No patterns found for: $term"
        return 1
    fi
}

# Add learning if not duplicate
add_if_new() {
    local title="$1"
    local learning_json="$2"
    
    # Check if already exists
    if memory-query "$title" | grep -q "$title"; then
        echo "Learning already exists: $title"
        return 1
    fi
    
    # Add new learning
    echo "$learning_json" | memory-add --domain=lessons
}

# Check coverage
check_coverage() {
    local file="$1"
    
    # Check if file has memory coverage
    if memory-query "$file" | grep -q "$file"; then
        echo "✅ Memory exists for $file"
        return 0
    else
        echo "⚠️  No memory for $file (consider creating)"
        return 1
    fi
}
```

---

## Integration with Claude Agent SDK

### In agentic-test.ts (TypeScript)

```typescript
import { spawn } from 'child_process';

async function searchMemory(term: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const proc = spawn('memory-query', [term]);
        let output = '';
        
        proc.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        proc.on('close', (code) => {
            if (code === 0) {
                const results = output.trim().split('\n')
                    .filter(line => line)
                    .map(line => JSON.parse(line));
                resolve(results);
            } else if (code === 1) {
                resolve([]);  // No results
            } else {
                reject(new Error('Search failed'));
            }
        });
    });
}

async function addLearning(learning: any, domain: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const proc = spawn('memory-add', [`--domain=${domain}`]);
        
        proc.stdin.write(JSON.stringify(learning));
        proc.stdin.end();
        
        proc.on('close', (code) => {
            code === 0 ? resolve() : reject(new Error('Add failed'));
        });
    });
}

// Usage in test
const firebasePatterns = await searchMemory('firebase');
console.log(`Found ${firebasePatterns.length} Firebase patterns`);
```

---

## Exit Codes

All tools follow Unix conventions:

- **0** - Success
- **1** - No results / Not found (not an error, just empty)
- **2** - Invalid arguments / usage error

Check exit codes in scripts:
```bash
if memory-query "term" > /dev/null 2>&1; then
    echo "Results found"
else
    echo "No results"
fi
```

---

## Performance

- **memory-query**: O(n) where n = memory files
- **memory-rank**: O(m log m) where m = results
- **memory-format**: O(m)
- **memory-add**: O(1) insert at top
- **memory-stats**: O(n)

For large memory systems (100+ files):
- Use domain filtering
- Limit max results
- Cache stats output

---

## Tips & Tricks

### 1. Alias Common Commands
```bash
alias mq='memory-query'
alias mr='memory-rank'
alias mf='memory-format'
alias ms='memory-stats'
alias mp='memory-pipe'
```

### 2. Custom Pipelines
```bash
# Create your own pipeline scripts
cat > ~/.local/bin/memory-find <<'EOF'
#!/bin/bash
memory-query "$1" | memory-rank | head -3 | memory-format --style=full
EOF
chmod +x ~/.local/bin/memory-find
```

### 3. Integration with fzf
```bash
# Interactive memory search
memory-search-interactive() {
    local term=$(echo "" | fzf --print-query --header "Search memory:" | head -1)
    if [[ -n "$term" ]]; then
        memory-pipe search "$term"
    fi
}
```

### 4. Watch for Changes
```bash
# Monitor memory additions
watch -n 5 'memory-stats'

# Alert on coverage gaps
while true; do
    if [[ $(memory-stats --json | jq '.calibration.coverage_gaps') -gt 0 ]]; then
        echo "Coverage gaps detected!"
        memory-pipe gaps
    fi
    sleep 300  # Check every 5 minutes
done
```

---

## Testing

Test each tool:

```bash
# Test query
memory-query "firebase" && echo "✅ query works"

# Test ranking
memory-query "firebase" | memory-rank | head -1 && echo "✅ rank works"

# Test formatting
memory-query "firebase" | memory-format --style=compact && echo "✅ format works"

# Test add
echo '{"title":"Test","issue":"X","solution":"Y","pattern":"Z"}' | \
    memory-add --domain=lessons && echo "✅ add works"

# Test stats
memory-stats --json | jq '.' && echo "✅ stats works"

# Test pipeline
memory-pipe hot && echo "✅ pipe works"
```

---

## Troubleshooting

**No results from query**:
- Exit code 1 is normal (means no matches)
- Check if memory files exist: `ls .claude/rules/`
- Try broader search term

**JSON parsing errors**:
- Ensure tools are executable: `chmod +x .claude/bin/memory-*`
- Check jq is installed: `which jq`
- Validate input JSON: `echo "$json" | jq .`

**Add fails**:
- Check domain is valid: tools|infrastructure|testing|lessons
- Ensure JSON has required fields
- Verify target file/directory exists

---

## Philosophy in Action

These tools embody Unix philosophy:

**Example**: Find hot Firebase patterns
```bash
# Traditional way (monolithic)
find_hot_firebase_patterns_with_all_options

# Unix way (composable)
memory-query "firebase" | \
  MEMORY_QUERY_FRESHNESS=hot | \
  memory-rank | \
  memory-format --style=full
```

**Benefits**:
- ✅ Each tool does one thing well
- ✅ Easy to test individual components
- ✅ Flexible composition for new use cases
- ✅ Machine-readable (JSON) and human-readable
- ✅ Programmatic access from any language
- ✅ Scriptable and automatable

**This is how agents should interact with memory - through composable, pipeable commands, not monolithic APIs.** 🎯

---

**See Also**:
- `.claude/rules/infrastructure/hooks-calibration.md` - Hook system
- `docs/MEMORY_SYSTEM_DESIGN.md` - Overall design
- `MEMORY_SYSTEM_WITH_HOOKS_SUMMARY.md` - Complete summary
