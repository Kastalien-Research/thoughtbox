# SPEC: OODA Loops MCP - Implementation Details

## Frontmatter Schema

All loops in `.claude/commands/loops/` MUST include YAML frontmatter following this schema:

```yaml
---
type: exploration | authoring | refinement | verification | orchestration
speed: slow | medium | fast
scope: session | document | item | line
interface_version: "1.0"
description: "Brief one-line description of what this loop does"
inputs:
  - name: input_name
    type: string | number | object | array
    required: true | false
    description: "What this input provides"
outputs:
  - name: output_name
    type: string | number | object | array
    description: "What this output contains"
signals:
  - name: signal_name
    when: "Condition that triggers this signal"
composition:
  can_contain: ["loop-type-1", "loop-type-2"]
  can_be_contained_by: ["loop-type-3"]
  parallelizable: true | false | "conditional: explanation"
---
```

### Fallback Behavior

If frontmatter is missing or malformed:
- **type**: "unknown"
- **speed**: "medium"
- **scope**: "document"
- **description**: Extracted from first H1 heading or "No description"
- **Build warning**: Logged to console during `npm run build`
- **Runtime**: Loop still served, but with incomplete metadata

## Error Handling (REQ-6)

### Build-Time Errors

**Script**: `scripts/embed-loops.ts`

| Error | Action | Example |
|-------|--------|---------|
| Loop file not found during build | FAIL build | `Missing loop: exploration/problem-space.md` |
| Invalid YAML frontmatter | FAIL build | `Malformed YAML in authoring/spec-drafting.md:3` |
| Required frontmatter field missing | WARN build, use fallback | `Missing 'type' in refinement/code-quality.md, defaulting to 'unknown'` |
| Duplicate loop names | FAIL build | `Duplicate loop name 'test' in exploration/ and verification/` |
| Loop file >50KB | WARN build, include with notice | `Large loop file: orchestration/complex.md (67KB), consider splitting` |
| Loop file >100KB | FAIL build | `Loop file too large: meta/mega-loop.md (127KB), max size is 100KB` |

### Runtime Errors

**Handler**: Resource resolution in `server-factory.ts`

| Error | HTTP Status | Response | Example |
|-------|-------------|----------|---------|
| Invalid category | 404 | `{ error: "Invalid category", valid: [...] }` | Category "foo" not in [exploration, authoring, ...] |
| Loop not found | 404 | `{ error: "Loop not found", available: [...] }` | Loop "bar" not in exploration category |
| Malformed URI | 400 | `{ error: "Invalid URI format" }` | URI doesn't match `thoughtbox://loops/{category}/{name}` |

## Variable Substitution Format

### Pattern Recognition

Loops supporting variable substitution MUST include a `## Variables` section:

```markdown
## Variables

INPUT_NAME: $ARGUMENTS (required)
OUTPUT_FOLDER: $ARGUMENTS (default: .output/)
MAX_ITERATIONS: $ARGUMENTS (default: 3)
```

### Extraction Algorithm

When registering a loop as a prompt:

1. Parse content for `## Variables` section
2. Extract variable declarations matching pattern: `NAME: $ARGUMENTS (metadata)`
3. Parse metadata for:
   - Required: presence of "(required)" or absence of "(default: ...)"
   - Default value: extracted from "(default: value)"
   - Type inference: string (default), number (if default is numeric), boolean (if default is true/false)
4. Generate `argsSchema`:

```typescript
{
  INPUT_NAME: z.string().describe("..."),
  OUTPUT_FOLDER: z.string().optional().describe("..."),
  MAX_ITERATIONS: z.string().optional().describe("...")
}
```

5. Substitute in content getter:

```typescript
content = content.replace(
  `INPUT_NAME: $ARGUMENTS`,
  `INPUT_NAME: ${args.INPUT_NAME}`
);
```

### Loops Without Variables

Loops without `## Variables` section are served as static content (no substitution).

## Loop Catalog JSON Schema

**Resource**: `thoughtbox://loops/catalog`

```typescript
interface LoopCatalog {
  version: string;  // "1.0"
  updated: string;  // ISO8601 timestamp of build
  categories: {
    [category: string]: {
      description: string;
      loops: {
        [loopName: string]: LoopMetadata;
      };
    };
  };
}

interface LoopMetadata {
  uri: string;              // "thoughtbox://loops/exploration/problem-space"
  type: LoopType;
  speed: "slow" | "medium" | "fast";
  scope: "session" | "document" | "item" | "line";
  description: string;
  interface_version: string;
  inputs: LoopInput[];
  outputs: LoopOutput[];
  signals: LoopSignal[];
  composition: CompositionRules;
  content_preview: string;  // First 200 chars of content
}

interface LoopInput {
  name: string;
  type: "string" | "number" | "object" | "array";
  required: boolean;
  description: string;
}

interface LoopOutput {
  name: string;
  type: "string" | "number" | "object" | "array";
  description: string;
}

interface LoopSignal {
  name: string;
  when: string;
  payload?: string;  // Type description
}

interface CompositionRules {
  can_contain: LoopType[];
  can_be_contained_by: LoopType[];
  parallelizable: boolean | string;  // boolean or "conditional: explanation"
}

type LoopType = "exploration" | "authoring" | "refinement" | "verification" | "orchestration" | "unknown";
```

### Example Response

```json
{
  "version": "1.0",
  "updated": "2026-01-19T12:00:00Z",
  "categories": {
    "exploration": {
      "description": "Loops for understanding problem spaces and discovering information",
      "loops": {
        "problem-space": {
          "uri": "thoughtbox://loops/exploration/problem-space",
          "type": "exploration",
          "speed": "slow",
          "scope": "session",
          "description": "Understand problem space before committing to solution",
          "interface_version": "1.0",
          "inputs": [
            {
              "name": "prompt",
              "type": "string",
              "required": true,
              "description": "Problem or question to explore"
            }
          ],
          "outputs": [
            {
              "name": "unknowns",
              "type": "array",
              "description": "List of unresolved questions"
            },
            {
              "name": "spec_inventory",
              "type": "array",
              "description": "Decomposed spec requirements"
            }
          ],
          "signals": [
            {
              "name": "clarification_requested",
              "when": "Critical unknown identified",
              "payload": "{ question: string, importance: string }"
            }
          ],
          "composition": {
            "can_contain": ["refinement"],
            "can_be_contained_by": [],
            "parallelizable": false
          },
          "content_preview": "# Problem Space Exploration Loop\n\nSystematically explore and understand a problem space before committing to solutions. This loop identifies unknowns, maps stakeholder concerns, and..."
        }
      }
    }
  }
}
```

## Deployment Configuration

### Docker Build

**File**: `Dockerfile`

```dockerfile
# Builder stage (existing)
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN chmod +x scripts/check-cycles.sh
RUN npm run build  # Includes embed-loops now

# Runtime stage (existing)
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist  # dist/ includes loops-content.ts compiled
# NOTE: .claude/ directory is NOT copied - loops already embedded

CMD ["node", "dist/index.js"]
```

### Build Script Update

**File**: `package.json`

```json
{
  "scripts": {
    "embed-templates": "tsx scripts/embed-templates.ts",
    "embed-loops": "tsx scripts/embed-loops.ts",
    "build:local": "npm run embed-templates && npm run embed-loops && tsc && ...",
    "build": "npm run check:cycles && npm run build:local"
  }
}
```

### What Gets Deployed

| Artifact | Location | Purpose |
|----------|----------|---------|
| `dist/resources/loops-content.js` | Docker image | Compiled loops catalog |
| `dist/server-factory.js` | Docker image | Resource registration code |
| `.claude/commands/loops/*.md` | **NOT in Docker** | Source only (build-time) |

## Testing Strategy

### Unit Tests

**File**: `src/resources/__tests__/loops-content.test.ts`

```typescript
import { LOOPS_CATALOG } from '../loops-content';

describe('LOOPS_CATALOG', () => {
  test('should include all categories', () => {
    expect(LOOPS_CATALOG).toHaveProperty('exploration');
    expect(LOOPS_CATALOG).toHaveProperty('authoring');
    // ...
  });

  test('problem-space loop should have valid metadata', () => {
    const loop = LOOPS_CATALOG.exploration['problem-space'];
    expect(loop.metadata.type).toBe('exploration');
    expect(loop.metadata.speed).toBe('slow');
    expect(loop.content).toContain('# Problem Space');
  });

  test('all loops should have valid URIs', () => {
    Object.entries(LOOPS_CATALOG).forEach(([category, loops]) => {
      Object.entries(loops).forEach(([name, loop]) => {
        expect(loop.metadata.uri).toMatch(/^thoughtbox:\/\/loops\//);
      });
    });
  });
});
```

### Integration Tests

**File**: `tests/loops-resources.md`

```markdown
# Test: Loop Resource Resolution

## Setup

Connect to Thoughtbox MCP server.

## Test Cases

### 1. List all loops

Call resource: `thoughtbox://loops/catalog`

**Expected**:
- Returns JSON catalog
- Includes all categories
- Each loop has valid metadata

### 2. Get specific loop

Call resource: `thoughtbox://loops/exploration/problem-space`

**Expected**:
- Returns markdown content
- Includes OODA phases
- Metadata in response

### 3. Invalid category

Call resource: `thoughtbox://loops/invalid/foo`

**Expected**:
- Returns 404 error
- Helpful message with valid categories

### 4. Invalid loop name

Call resource: `thoughtbox://loops/exploration/nonexistent`

**Expected**:
- Returns 404 error
- Lists available loops in category
```

## Performance Considerations

### Build Time

- **embed-loops.ts** reads ~20 loop files
- Estimated: +2-3 seconds to build time
- Acceptable for CI/CD pipeline

### Runtime

- All loops embedded as TypeScript constants
- No file I/O at runtime
- Resource resolution: O(1) hash lookup
- Memory overhead: ~50-100KB (all loops loaded)

### Optimization Opportunities (Future)

- Lazy-load loop content (only metadata initially)
- Compress loop content with gzip
- Cache parsed frontmatter

## Embed Script Specification

### embed-loops.ts Implementation

**Purpose**: Read `.claude/commands/loops/` directory, parse loop files, validate, and generate `src/resources/loops-content.ts`

**Algorithm**:

```typescript
#!/usr/bin/env tsx
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const LOOPS_DIR = '.claude/commands/loops';
const OUTPUT_FILE = 'src/resources/loops-content.ts';
const MAX_LOOP_SIZE = 100 * 1024; // 100KB
const WARN_LOOP_SIZE = 50 * 1024;  // 50KB

async function embedLoops() {
  const categories = await fs.readdir(LOOPS_DIR);
  const catalog: LoopsCatalog = {};
  const seenNames = new Set<string>();

  for (const category of categories) {
    if (category.startsWith('.') || category === 'README.md') continue;

    const categoryPath = path.join(LOOPS_DIR, category);
    const stat = await fs.stat(categoryPath);
    if (!stat.isDirectory()) continue;

    const loops = await fs.readdir(categoryPath);
    catalog[category] = {};

    for (const file of loops) {
      if (!file.endsWith('.md')) continue;

      const loopPath = path.join(categoryPath, file);
      const loopName = file.replace('.md', '');

      // Check for duplicates
      if (seenNames.has(loopName)) {
        throw new Error(`Duplicate loop name: ${loopName} in ${category}/`);
      }
      seenNames.add(loopName);

      // Read and validate size
      const content = await fs.readFile(loopPath, 'utf-8');
      const sizeKB = Buffer.byteLength(content, 'utf8') / 1024;

      if (sizeKB > MAX_LOOP_SIZE / 1024) {
        throw new Error(
          `Loop file too large: ${category}/${file} (${sizeKB.toFixed(1)}KB), max is 100KB`
        );
      }

      if (sizeKB > WARN_LOOP_SIZE / 1024) {
        console.warn(
          `⚠️  Large loop file: ${category}/${file} (${sizeKB.toFixed(1)}KB), consider splitting`
        );
      }

      // Parse frontmatter
      const { data: frontmatter, content: markdown } = matter(content);

      // Validate required fields with fallbacks
      const metadata = {
        type: frontmatter.type || 'unknown',
        speed: frontmatter.speed || 'medium',
        scope: frontmatter.scope || 'document',
        description: frontmatter.description || extractDescription(markdown),
        interface_version: frontmatter.interface_version || '1.0',
        inputs: frontmatter.inputs || [],
        outputs: frontmatter.outputs || [],
        signals: frontmatter.signals || [],
        composition: frontmatter.composition || {},
      };

      if (!frontmatter.type) {
        console.warn(`⚠️  Missing 'type' in ${category}/${file}, defaulting to 'unknown'`);
      }

      catalog[category][loopName] = {
        content: markdown,
        metadata,
      };
    }
  }

  // Generate TypeScript file
  const tsContent = `// Auto-generated by scripts/embed-loops.ts
// DO NOT EDIT MANUALLY

export const LOOPS_CATALOG = ${JSON.stringify(catalog, null, 2)} as const;
`;

  await fs.writeFile(OUTPUT_FILE, tsContent);
  console.log(`✅ Generated ${OUTPUT_FILE}`);
}

embedLoops().catch(console.error);
```

**Size Limits Rationale**:
- 100KB hard limit prevents accidentally embedding massive files
- 50KB warning encourages loop modularity
- Most loops should be 2-10KB (1-3 pages of markdown)
- Mega-loops (>50KB) indicate design smell (should be composed of smaller loops)

## Migration Path

### Phase 1: Basic Resources (Week 1)

- Implement `embed-loops.ts` with size validation
- Generate `loops-content.ts`
- Register resource templates
- Serve via `thoughtbox://loops/{category}/{name}`

### Phase 2: Catalog API (Week 2)

- Generate catalog JSON during build
- Expose `thoughtbox://loops/catalog`
- Add category filtering

### Phase 3: Prompts (Week 3)

- Identify 3-5 most-used loops
- Register as prompts
- Implement variable substitution

### Phase 4: Composition Validation (Future)

- Build composition rule checker
- Expose via `thoughtbox://loops/validate-composition`
- Accept workflow definition, return validation result

## REQ-7: Codebase Learning via Usage Analytics

**Priority**: SHOULD

**Purpose**: Record loop access patterns to `.claude/thoughtbox/` to enable the codebase to learn which cognitive patterns are effective over time.

**Critical Distinction**: Thoughtbox is a reasoning server providing cognitive affordances, NOT a memory server. The learning happens in the codebase (via `.claude/`), not in Thoughtbox itself or in future agent instances.

### Architecture Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│ CODEBASE (.claude/) = Learning Substrate                    │
│                                                              │
│  Rules, patterns, workflows accumulate here.                │
│  Version-controlled, persistent, improves over time.        │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ THOUGHTBOX = Measurement Instrument                   │  │
│  │                                                        │  │
│  │  Provides: structured thinking, session export,       │  │
│  │           loop usage recording, reasoning artifacts   │  │
│  │                                                        │  │
│  │  Does NOT: learn, remember, improve itself            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ AGENT (Claude) = Stateless Consumer                   │  │
│  │                                                        │  │
│  │  Each instance starts fresh.                          │  │
│  │  Reads .claude/ to benefit from past sessions.        │  │
│  │  Uses Thoughtbox for structured reasoning.            │  │
│  │  Writes back to .claude/ to contribute learnings.     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Complementary with Memory Servers**: A stateful agent using Letta (block memory) + Thoughtbox (reasoning affordances) could achieve even more sophisticated workflows. But we optimize for Claude Code first - the most powerful stateless agent.

### Implementation

**Storage Location**: `.claude/thoughtbox/`

```
.claude/thoughtbox/
├── loop-usage.jsonl          # Append-only access log
├── workflow-metrics.json     # Aggregated stats (updated periodically)
├── hot-loops.json           # Top 10 by usage (for quick catalog sorting)
└── sessions/
    └── {sessionId}/
        ├── loops-used.json   # Which loops this session accessed
        └── workflow-trace.jsonl  # Sequence of loop invocations
```

**Recording Trigger**: Every time a loop resource is accessed via `thoughtbox://loops/{category}/{name}`

**Data Captured**:
```jsonl
{"timestamp": "2026-01-19T10:30:00Z", "loop": "exploration/problem-space", "session": "abc123", "mcp_session": "xyz789"}
```

**Write Safety**: Use atomic append operations to prevent corruption from concurrent access:
```typescript
import fs from 'fs/promises';

async function recordLoopAccess(data: LoopAccessRecord): Promise<void> {
  const logPath = path.join(claudePath, 'thoughtbox/loop-usage.jsonl');
  const entry = JSON.stringify(data) + '\n';

  // Node.js fs.appendFile is atomic for small writes (<4KB)
  // For maximum safety, use exclusive file handle
  try {
    await fs.appendFile(logPath, entry, {
      encoding: 'utf8',
      flag: 'a'  // Append mode
    });
  } catch (err) {
    // Graceful degradation: log to stderr, don't throw
    console.error('[Thoughtbox] Failed to record loop access:', err);
  }
}
```

**Rationale**: Node.js `fs.appendFile` with flag 'a' is atomic for writes smaller than the system's PIPE_BUF (typically 4KB on Unix). Since each log entry is ~100-200 bytes, concurrent writes are safe without explicit locking.

**Aggregation Schedule**:

Aggregation runs at three trigger points:

1. **On server startup** (synchronous, blocks init)
   - Ensures hot-loops.json is current before serving first request
   - Max duration: 2 seconds for 10,000 log entries

2. **After 1000 new log entries** (async, non-blocking)
   - Counter incremented on each recordLoopAccess
   - Triggered when `accessCounter % 1000 === 0`
   - Runs in background, doesn't block requests

3. **On explicit refresh** (synchronous, user-triggered)
   - Resource: `thoughtbox://loops/analytics/refresh`
   - Returns updated metrics after aggregation completes

**Aggregation Logic**:
```typescript
interface WorkflowMetrics {
  totalAccesses: number;
  loopStats: Map<string, LoopStats>;
  lastAggregated: string;
  entryCount: number;
}

interface LoopStats {
  invocations: number;
  lastUsed: string;
  sessions: Set<string>;
  coOccurrence: Map<string, number>;  // Which loops used together
}

async function aggregateLoopMetrics(logPath: string): Promise<WorkflowMetrics> {
  const entries = await readJSONL<LoopAccessRecord>(logPath);
  const stats = new Map<string, LoopStats>();

  // Single pass aggregation
  for (const entry of entries) {
    const loop = entry.loop;
    const existing = stats.get(loop) || {
      invocations: 0,
      lastUsed: entry.timestamp,
      sessions: new Set(),
      coOccurrence: new Map()
    };

    existing.invocations++;
    existing.lastUsed = entry.timestamp; // Assumes chronological
    existing.sessions.add(entry.session);

    stats.set(loop, existing);
  }

  // Generate hot-loops.json (top 10)
  const ranked = Array.from(stats.entries())
    .sort((a, b) => b[1].invocations - a[1].invocations)
    .slice(0, 10);

  await fs.writeFile(
    path.join(path.dirname(logPath), 'hot-loops.json'),
    JSON.stringify({
      updated: new Date().toISOString(),
      top_10: ranked.map(([uri, stats]) => ({
        uri,
        rank: ranked.indexOf([uri, stats]) + 1,
        invocations: stats.invocations,
        lastUsed: stats.lastUsed
      }))
    }, null, 2)
  );

  return {
    totalAccesses: entries.length,
    loopStats: stats,
    lastAggregated: new Date().toISOString(),
    entryCount: entries.length
  };
}
```

### Integration Points

**1. Catalog Sorting** (`thoughtbox://loops/catalog`):
```typescript
const hotLoops = readHotLoops('.claude/thoughtbox/hot-loops.json');
const catalog = buildCatalog(LOOPS_CATALOG);

// Sort loops by usage rank
if (hotLoops) {
  catalog.categories.forEach(category => {
    category.loops.sort((a, b) =>
      (hotLoops.ranks[a.uri] || 999) - (hotLoops.ranks[b.uri] || 999)
    );
  });
}
```

**2. Dynamic Prompt Registration**:
```typescript
// At server startup or rebuild
const hotLoops = readHotLoops('.claude/thoughtbox/hot-loops.json');
const top5 = hotLoops?.top_5 || DEFAULT_PROMOTED_LOOPS;

// Register top 5 as prompts
top5.forEach(loopName => {
  server.registerPrompt(loopName, ...);
});
```

**3. Cipher Integration**:
When exporting a session, include loop references:
```markdown
## Session Export

S1-5: @loops/exploration/problem-space
      Used: 247 times across all sessions (rank #1)
      Last used: 2026-01-19
```

**4. DGM Evolution Bridge**:
```typescript
// Read fitness from .claude/rules/evolution/fitness.json
// Write usage data back to .claude/rules/evolution/signals.jsonl
// Thoughtbox becomes a signal source for DGM
```

### Graceful Degradation

If `.claude/` folder doesn't exist:
- No usage recording (silent)
- Catalog uses default ordering (alphabetical)
- Default set of loops registered as prompts
- Server still fully functional

### Privacy & Security

**Data Sensitivity**: Loop access patterns are NOT sensitive (no user data, no secrets)

**Storage Location**: `.claude/thoughtbox/` is workspace-local, not shared externally

**Opt-out**: Users can add `.claude/thoughtbox/` to `.gitignore` if they don't want to version-control usage metrics

## Open Questions Resolved

1. **Should loops be prompts or resources?**
   - **Answer**: Both. Resources for discovery, prompts for direct execution.

2. **How to handle loop versioning?**
   - **Answer**: Start without URI versioning. Use `interface_version` in metadata for breaking changes.

3. **Should we support loop composition syntax?**
   - **Answer**: Phase 4 feature. For now, agents compose manually.

4. **Where does learning happen?**
   - **Answer**: In the codebase's `.claude/` folder, not in Thoughtbox or future agent instances. Thoughtbox records; `.claude/` learns.

---

**Status**: ADDENDUM to loops-mcp-composition-system.md
**Addresses**: Validation gaps identified in loops-mcp-validation-report.md
**Created**: 2026-01-19
**Updated**: 2026-01-19 (added REQ-7: Codebase Learning via Usage Analytics)
