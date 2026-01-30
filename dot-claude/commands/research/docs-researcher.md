# /docs-researcher

Comprehensive documentation research and cataloging system that discovers project technologies, catalogs their usage, and scrapes relevant external documentation using Firecrawl MCP.

## Usage

```
/docs-researcher [research_mode] [output_format]
```

## Arguments

- `research_mode` (optional): "discovery" | "catalog" | "scrape" | "full" (default: "full")
- `output_format` (optional): "minimal" | "detailed" | "verbose" (default: "detailed")

## Prerequisites

- Firecrawl MCP server must be configured and available
- Write access to project root for creating `ai_docs/` and `tech_stack/` folders
- Claude Agent SDK available (`@anthropic-ai/sdk`) for context-heavy operations
- **Secrets**: `.env` file must contain:
  - `ANTHROPIC_API_KEY` - For Agent SDK scripts
  - `FIRECRAWL_API_KEY` - For documentation scraping

---

## Context Management Strategy

**CRITICAL**: This workflow is context-intensive. To avoid running out of context mid-execution, we **prefer Claude Agent SDK scripts** for all heavy operations.

### Why Agent SDK Scripts?

| Approach | Context Window | Use Case |
|----------|----------------|----------|
| Inline (in-session) | Shared with conversation | Quick, single-technology discovery |
| Task agents | Separate but limited | Light exploration tasks |
| **Agent SDK scripts** | **Fresh window per script** | **Cataloging, scraping, verification** |

### Decision Tree

```
Is this operation likely to consume significant context?
├── YES → Generate and execute Agent SDK script
│   ├── Cataloging > 3 technologies
│   ├── Scraping ANY documentation pages
│   ├── Verification across multiple technologies
│   └── Any loop that processes multiple items
│
└── NO → Execute inline
    ├── Discovery (package.json, config detection)
    ├── State file updates
    └── Report generation
```

### Script Generation Pattern

When delegating to Agent SDK:

1. **Generate script** with all necessary context baked in
2. **Write to `scripts/docs-research/`** directory
3. **Execute with `tsx`** and capture output
4. **Script writes files directly** - The script writes catalog files (`tech_stack/*.md`) and documentation files (`ai_docs/**/*.md`) itself. The main agent does NOT write these files.
5. **Read results** from output files (not stdout) - Scripts may write JSON results files (e.g., `.docs-research/scrape-results.json`) for the main agent to read
6. **Update state.json** with results

**Key Point**: The generated scripts are **self-contained** - they make API calls, analyze code, and write output files themselves. The main agent only generates and executes scripts; it does NOT need to process script output to write catalog or documentation files.

This ensures:
- Each heavy operation gets a fresh context window
- Progress is persisted to disk (survives interruption)
- Main conversation context stays lean
- Scripts handle all file I/O independently

### Dynamic Script Generation

**You (the executing agent) must generate scripts dynamically**, not copy them verbatim. The templates in this document show the structure, but you should:

1. **Read state from `.docs-research/state.json`** to get discovered technologies
2. **Interpolate actual data** into the script (e.g., technology names, URLs)
3. **Customize based on context** (e.g., skip already-cataloged technologies)
4. **Write the script to disk** in `scripts/docs-research/`
5. **Execute with `tsx`** and monitor output

**Example workflow:**
```typescript
// 1. Read current state
const state = JSON.parse(readFileSync(".docs-research/state.json", "utf-8"));

// 2. Generate script with actual data baked in
const script = `
import "dotenv/config";
// ... rest of template ...
const technologies = ${JSON.stringify(state.technologies_discovered)};
// ... rest of script ...
`;

// 3. Write and execute
writeFileSync("scripts/docs-research/catalog-technologies.ts", script);
// Then execute via Bash tool: tsx scripts/docs-research/catalog-technologies.ts
```

---

## Algorithm

### Phase 0: Initialize Research State

```bash
# Create state tracking infrastructure
mkdir -p .docs-research
cat > .docs-research/state.json << 'EOF'
{
  "phase": "initialization",
  "started_at": "$(date -Iseconds)",
  "ai_docs_existed": false,
  "tech_stack_existed": false,
  "technologies_discovered": [],
  "technologies_cataloged": [],
  "technologies_scraped": [],
  "discrepancies": [],
  "errors": []
}
EOF
```

**Actions:**
1. Check if `ai_docs/` folder exists
   - If not, create it
   - Record existing state in `state.json`
2. Inventory existing documentation in `ai_docs/` (note subfolder names as already-documented technologies)
3. Check if `tech_stack/` folder exists
   - If not, create it
4. Update state with initialization results

**State Schema:**
```typescript
interface ResearchState {
  phase: "initialization" | "discovery" | "cataloging" | "scraping" | "verification" | "complete";
  started_at: string;
  ai_docs_existed: boolean;
  tech_stack_existed: boolean;
  technologies_discovered: TechnologyEntry[];
  technologies_cataloged: string[];  // filenames in tech_stack/
  technologies_scraped: ScrapedDoc[];
  discrepancies: Discrepancy[];
  errors: ErrorEntry[];
}

interface TechnologyEntry {
  name: string;
  source: "package.json" | "config_file" | "import_scan" | "mcp_config" | "manual";
  category: "runtime_dependency" | "dev_dependency" | "deployment" | "mcp_server" | "external_service";
  version?: string;
  detected_at: string;
  docs_url?: string;
}

interface ScrapedDoc {
  technology: string;
  url: string;
  local_path: string;
  scraped_at: string;
  success: boolean;
}

interface Discrepancy {
  type: "missing_docs" | "missing_catalog" | "scrape_failure" | "version_mismatch";
  technology: string;
  expected: string;
  actual: string;
  resolution?: string;
}
```

---

### Phase 1: Technology Discovery

**Step 1.1: Package.json Analysis**
```bash
# Parse dependencies from package.json
echo "Analyzing package.json dependencies..."

# Extract runtime dependencies
jq -r '.dependencies | keys[]' package.json 2>/dev/null | while read dep; do
  VERSION=$(jq -r ".dependencies[\"$dep\"]" package.json)
  echo "{\"name\": \"$dep\", \"source\": \"package.json\", \"category\": \"runtime_dependency\", \"version\": \"$VERSION\"}"
done

# Extract dev dependencies
jq -r '.devDependencies | keys[]' package.json 2>/dev/null | while read dep; do
  VERSION=$(jq -r ".devDependencies[\"$dep\"]" package.json)
  echo "{\"name\": \"$dep\", \"source\": \"package.json\", \"category\": \"dev_dependency\", \"version\": \"$VERSION\"}"
done
```

**Step 1.2: Configuration File Detection**
Scan for technology indicators in configuration files:

| File Pattern | Technology Indicated |
|--------------|---------------------|
| `fly.toml` | Fly.io deployment |
| `vercel.json` | Vercel deployment |
| `.github/workflows/*.yml` | GitHub Actions CI/CD |
| `docker-compose.yml`, `Dockerfile` | Docker containerization |
| `firebase.json`, `firestore.rules` | Firebase/Firestore |
| `tsconfig.json` | TypeScript |
| `.eslintrc*`, `eslint.config.*` | ESLint |
| `prettier.config.*`, `.prettierrc*` | Prettier |
| `jest.config.*` | Jest testing |
| `vitest.config.*` | Vitest testing |
| `.env`, `.env.example` | Environment variables (scan for service hints) |
| `*.yaml`, `*.yml` in root | Various configs |

```bash
# Detect deployment and infrastructure
for config in fly.toml vercel.json render.yaml railway.toml; do
  if [ -f "$config" ]; then
    echo "{\"name\": \"${config%.*}\", \"source\": \"config_file\", \"category\": \"deployment\"}"
  fi
done

# Detect Firebase
if [ -f "firebase.json" ] || [ -f "firestore.rules" ]; then
  echo "{\"name\": \"firebase\", \"source\": \"config_file\", \"category\": \"external_service\"}"
fi

# Detect Docker
if [ -f "Dockerfile" ] || [ -f "docker-compose.yml" ]; then
  echo "{\"name\": \"docker\", \"source\": \"config_file\", \"category\": \"deployment\"}"
fi
```

**Step 1.3: MCP Configuration Scan**
Analyze available MCP servers from the current session:

```bash
# Check for MCP config files
MCP_CONFIGS=(
  ".claude/settings.json"
  "~/.claude/settings.json"
  "claude_desktop_config.json"
)

for config in "${MCP_CONFIGS[@]}"; do
  if [ -f "$config" ]; then
    jq -r '.mcpServers | keys[]' "$config" 2>/dev/null | while read server; do
      echo "{\"name\": \"mcp-$server\", \"source\": \"mcp_config\", \"category\": \"mcp_server\"}"
    done
  fi
done
```

**Step 1.4: Import Statement Scan**
Use grep/ast analysis to find technology usage patterns in source code:

```bash
# Scan TypeScript/JavaScript imports for notable patterns
grep -rh "^import.*from ['\"]" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | \
  sed -E "s/.*from ['\"]([^'\"]+)['\"].*/\1/" | \
  grep -v "^\." | \
  sort -u
```

**Step 1.5: Consolidate Discovery Results**
Merge all discovered technologies into `state.json`, deduplicating by name and enriching with documentation URLs:

```typescript
// Documentation URL mapping for common technologies
const DOCS_URLS: Record<string, string> = {
  "@modelcontextprotocol/sdk": "https://modelcontextprotocol.io/docs",
  "express": "https://expressjs.com/",
  "firebase-admin": "https://firebase.google.com/docs/admin/setup",
  "stripe": "https://docs.stripe.com/",
  "zod": "https://zod.dev/",
  "typescript": "https://www.typescriptlang.org/docs/",
  "@anthropic-ai/claude-agent-sdk": "https://platform.claude.com/docs/en/agent-sdk",
  "fly.io": "https://fly.io/docs/",
  "docker": "https://docs.docker.com/",
  // ... extend as needed
};
```

---

### Phase 2: Technology Usage Cataloging

Analyze HOW each technology is used in the codebase. **Use Agent SDK scripts** to avoid context exhaustion.

**Strategy Selection:**

| # Technologies | Approach |
|----------------|----------|
| 1-3 | Inline Task agents (quick) |
| 4+ | **Agent SDK script** (fresh context) |

**Agent SDK Script (Preferred for 4+ technologies):**

**IMPORTANT**: You (the executing agent) should **dynamically generate** this script with the actual discovered technologies baked in. Read from `.docs-research/state.json` and interpolate the data.

**CRITICAL: File Writing Responsibility**

The generated script **writes the catalog files directly** - the main Claude Code agent does NOT write them. Here's the flow:

1. **Main agent**: Generates the script with technologies baked in
2. **Main agent**: Executes the script via `tsx scripts/docs-research/catalog-technologies.ts`
3. **Script**: Runs independently, makes Anthropic API calls internally
4. **Script**: Writes files directly to `tech_stack/*.md` (see line 400: `writeFileSync(outputFile, textContent.text)`)
5. **Main agent**: Does NOT need to read script output or write files - the script handles everything

The script is self-contained and writes all output files itself. The main agent only needs to generate and execute it.

Generate and execute a dedicated cataloging script:

```bash
# Create scripts directory if needed
mkdir -p scripts/docs-research
```

```typescript
// scripts/docs-research/catalog-technologies.ts
import "dotenv/config";  // Load .env file
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

// Anthropic SDK auto-reads ANTHROPIC_API_KEY from env
const client = new Anthropic();

interface TechnologyEntry {
  name: string;
  category: string;
  version?: string;
}

const technologies: TechnologyEntry[] = ${JSON.stringify(discoveredTechnologies, null, 2)};

async function catalogTechnology(tech: TechnologyEntry): Promise<void> {
  const outputFile = `tech_stack/${tech.name.replace(/[@\/]/g, '-')}.md`;

  console.log(`Cataloging ${tech.name}...`);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `You are analyzing a codebase. Catalog how "${tech.name}" (${tech.category}) is used.

Search the codebase for:
1. Import statements and initialization patterns
2. Configuration and setup code
3. Primary use cases and features utilized
4. Integration points with other systems
5. Any custom wrappers or utilities built around it

Output a markdown file with this structure:
# ${tech.name}

## Overview
[Brief description of what this technology does in the project]

## Version
${tech.version || "[Detect from package.json or config]"}

## Features Used
- [Feature 1]: [How it's used]
- [Feature 2]: [How it's used]

## Configuration
- **Environment Variables**: [List relevant env vars]
- **Config Files**: [List config file locations]
- **Initialization**: [Where/how it's initialized]

## Key Files
| File | Purpose |
|------|---------|
| [path] | [description] |

## Integration Points
- [Integration 1]
- [Integration 2]

## Notes
[Any important observations, gotchas, or patterns]

Provide ONLY the markdown content, no explanation.`
    }],
    tools: [{
      name: "read_file",
      description: "Read a file from the codebase",
      input_schema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "File path to read" }
        },
        required: ["path"]
      }
    }, {
      name: "search_codebase",
      description: "Search for patterns in the codebase",
      input_schema: {
        type: "object" as const,
        properties: {
          pattern: { type: "string", description: "Grep pattern to search for" },
          file_type: { type: "string", description: "File extension filter (e.g., 'ts')" }
        },
        required: ["pattern"]
      }
    }]
  });

  // Extract markdown content from response
  const textContent = response.content.find(c => c.type === "text");
  if (textContent && textContent.type === "text") {
    mkdirSync("tech_stack", { recursive: true });
    writeFileSync(outputFile, textContent.text);
    console.log(`  ✓ Written to ${outputFile}`);
  }
}

// Process technologies sequentially to avoid rate limits
async function main() {
  console.log(`\\nCataloging ${technologies.length} technologies...\\n`);

  for (const tech of technologies) {
    try {
      await catalogTechnology(tech);
    } catch (error) {
      console.error(`  ✗ Failed to catalog ${tech.name}:`, error);
    }
  }

  console.log("\\nCataloging complete!");
}

main();
```

Execute the script:
```bash
tsx scripts/docs-research/catalog-technologies.ts
```

**Inline Task Agents (For 1-3 technologies only):**

```typescript
// Only use this for small sets to preserve main context
for (const tech of discoveredTechnologies.slice(0, 3)) {
  deployTaskAgent({
    subagent_type: "Explore",
    prompt: `Analyze how "${tech.name}" is used. Output to tech_stack/${tech.name.replace(/[@\/]/g, '-')}.md`,
    run_in_background: true  // Don't block main context
  });
}
```

**Catalog File Template:**
```markdown
# {Technology Name}

## Overview
{Brief description of role in project}

## Version
{Version from package.json or config}

## Features Used
- {Feature 1}: {How it's used}
- {Feature 2}: {How it's used}
- ...

## Configuration
- **Environment Variables**: {List relevant env vars}
- **Config Files**: {List config file locations}
- **Initialization**: {Where/how it's initialized}

## Key Files
| File | Purpose |
|------|---------|
| {path} | {description} |

## Integration Points
- {Integration 1}
- {Integration 2}

## Documentation URLs
- Official Docs: {url}
- Relevant Sections:
  - {section 1}: {url}
  - {section 2}: {url}

## Notes
{Any important observations, gotchas, or patterns}
```

---

### Phase 3: External Documentation Scraping

Using Firecrawl MCP to research and scrape relevant documentation.

**IMPORTANT**: **Always use Agent SDK scripts** for scraping. Documentation scraping is inherently context-heavy (many pages, large content). Never attempt inline scraping.

**CRITICAL: File Writing Responsibility**

The generated scraping script **writes all documentation files directly** - the main Claude Code agent does NOT write them. The script:
- Reads technologies from `tech_stack/*.md`
- Scrapes documentation via Firecrawl API
- **Writes files directly to `ai_docs/{technology}/**/*.md`** (see line 592: `writeFileSync(localPath, ...)`)
- The main agent only generates and executes the script, then reads results from `.docs-research/scrape-results.json`

**Step 3.1: Generate Scraping Script**

You (the executing agent) should generate a scraping script that:
1. Reads cataloged technologies from `tech_stack/*.md`
2. Discovers documentation URLs via Firecrawl search
3. Maps documentation sites
4. Filters for relevant pages
5. Scrapes and saves to `ai_docs/` (the script writes these files directly)

```typescript
// scripts/docs-research/scrape-documentation.ts
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, basename } from "path";

const client = new Anthropic();
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

if (!FIRECRAWL_API_KEY) {
  throw new Error("FIRECRAWL_API_KEY not found in environment");
}

// Read cataloged technologies
const techStackDir = "tech_stack";
const technologies = readdirSync(techStackDir)
  .filter(f => f.endsWith(".md"))
  .map(f => basename(f, ".md"));

interface ScrapedPage {
  url: string;
  localPath: string;
  success: boolean;
  error?: string;
}

async function scrapeWithFirecrawl(url: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true
      })
    });

    const data = await response.json();
    return data.data?.markdown || null;
  } catch (error) {
    console.error(`  ✗ Scrape failed for ${url}:`, error);
    return null;
  }
}

async function searchDocs(techName: string): Promise<string[]> {
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        query: `${techName} official documentation`,
        limit: 5
      })
    });

    const data = await response.json();
    return data.data?.map((r: any) => r.url) || [];
  } catch (error) {
    console.error(`  ✗ Search failed for ${techName}:`, error);
    return [];
  }
}

async function scrapeTechnology(techName: string): Promise<ScrapedPage[]> {
  console.log(`\\n📚 Processing ${techName}...`);
  const results: ScrapedPage[] = [];

  // Find documentation URLs
  const docUrls = await searchDocs(techName);
  console.log(`  Found ${docUrls.length} documentation URLs`);

  // Create output directory
  const outputDir = join("ai_docs", techName.replace(/[@\/]/g, "-"));
  mkdirSync(outputDir, { recursive: true });

  // Scrape each URL (limit to top 10 to avoid rate limits)
  for (const url of docUrls.slice(0, 10)) {
    console.log(`  Scraping: ${url}`);
    const content = await scrapeWithFirecrawl(url);

    if (content) {
      const filename = new URL(url).pathname
        .replace(/\//g, "-")
        .replace(/^-|-$/g, "") || "index";
      const localPath = join(outputDir, `${filename}.md`);

      writeFileSync(localPath, `<!-- Source: ${url} -->\\n\\n${content}`);
      results.push({ url, localPath, success: true });
      console.log(`    ✓ Saved to ${localPath}`);
    } else {
      results.push({ url, localPath: "", success: false, error: "Scrape returned null" });
    }

    // Rate limit: wait 1 second between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  return results;
}

async function main() {
  console.log(`\\n🔍 Scraping documentation for ${technologies.length} technologies...`);

  const allResults: Record<string, ScrapedPage[]> = {};

  for (const tech of technologies) {
    allResults[tech] = await scrapeTechnology(tech);
  }

  // Write results to state
  const stateFile = ".docs-research/scrape-results.json";
  writeFileSync(stateFile, JSON.stringify(allResults, null, 2));
  console.log(`\\n✅ Results written to ${stateFile}`);

  // Summary
  const totalPages = Object.values(allResults).flat().length;
  const successPages = Object.values(allResults).flat().filter(p => p.success).length;
  console.log(`\\n📊 Summary: ${successPages}/${totalPages} pages scraped successfully`);
}

main().catch(console.error);
```

Execute the script:
```bash
tsx scripts/docs-research/scrape-documentation.ts
```

**Step 3.2: Output Organization**
```
ai_docs/
  {technology-name}/
    {url-path-segment}/
      {page-name}.md
    index.md  # Overview/table of contents for this technology
```

---

### Phase 4: Verification and Reconciliation

**Use Agent SDK script** for verification when processing multiple technologies.

Generate and execute a verification script:

```typescript
// scripts/docs-research/verify-coverage.ts
import "dotenv/config";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";
import { globSync } from "glob";

interface VerificationResult {
  technology: string;
  catalogFile: string;
  docsDir: string;
  docsCount: number;
  status: "complete" | "partial" | "missing";
}

function verify(): VerificationResult[] {
  const results: VerificationResult[] = [];
  const techStackDir = "tech_stack";

  if (!existsSync(techStackDir)) {
    console.error("tech_stack/ directory not found");
    return results;
  }

  const techFiles = readdirSync(techStackDir).filter(f => f.endsWith(".md"));

  for (const techFile of techFiles) {
    const techName = basename(techFile, ".md");
    const docsDir = join("ai_docs", techName);

    let docsCount = 0;
    let status: "complete" | "partial" | "missing" = "missing";

    if (existsSync(docsDir)) {
      const docs = globSync(`${docsDir}/**/*.md`);
      docsCount = docs.length;
      status = docsCount >= 3 ? "complete" : docsCount > 0 ? "partial" : "missing";
    }

    results.push({
      technology: techName,
      catalogFile: join(techStackDir, techFile),
      docsDir,
      docsCount,
      status
    });

    const icon = status === "complete" ? "✅" : status === "partial" ? "⚠️" : "❌";
    console.log(`${icon} ${techName}: ${docsCount} docs (${status})`);
  }

  return results;
}

function main() {
  console.log("\\n🔍 Verifying documentation coverage...\\n");

  const results = verify();

  // Write results
  writeFileSync(
    ".docs-research/verification-results.json",
    JSON.stringify(results, null, 2)
  );

  // Summary
  const complete = results.filter(r => r.status === "complete").length;
  const partial = results.filter(r => r.status === "partial").length;
  const missing = results.filter(r => r.status === "missing").length;

  console.log(`\\n📊 Summary:`);
  console.log(`  ✅ Complete: ${complete}`);
  console.log(`  ⚠️  Partial: ${partial}`);
  console.log(`  ❌ Missing: ${missing}`);

  // List technologies needing attention
  const needsWork = results.filter(r => r.status !== "complete");
  if (needsWork.length > 0) {
    console.log(`\\n🔧 Technologies needing attention:`);
    needsWork.forEach(r => console.log(`  - ${r.technology} (${r.status})`));
  }
}

main();
```

Execute:

```bash
tsx scripts/docs-research/verify-coverage.ts
```

**Discrepancy Resolution:**

| Scenario | Action |
| -------- | ------ |
| Complete | Mark done in state.json |
| Partial | Re-run scraping script for specific technology |
| Missing | Check if technology was skipped, re-run discovery |

---

### Phase 5: Generate Summary Report

```bash
cat > .docs-research/report.md << 'EOF'
# Documentation Research Report

Generated: $(date -Iseconds)

## Summary

| Metric | Value |
|--------|-------|
| Technologies Discovered | ${technologies_discovered.length} |
| Technologies Cataloged | ${technologies_cataloged.length} |
| Documentation Pages Scraped | ${total_pages_scraped} |
| Overall Coverage | ${average_coverage}% |

## Technology Breakdown

$(for tech in technologies; do
  echo "### ${tech.name}"
  echo "- Category: ${tech.category}"
  echo "- Catalog: tech_stack/${tech.name}.md"
  echo "- Docs: ai_docs/${tech.name}/"
  echo "- Coverage: ${tech.coverage}%"
  echo ""
done)

## Discrepancies

$(if discrepancies.length > 0; then
  for d in discrepancies; do
    echo "- **${d.technology}**: ${d.type}"
    echo "  - Expected: ${d.expected}"
    echo "  - Actual: ${d.actual}"
    echo ""
  done
else
  echo "No discrepancies detected."
fi)

## Next Steps

$(generate_recommendations)

EOF

# Display summary
cat .docs-research/report.md
```

---

## Examples

```bash
# Full research workflow (discovery + catalog + scrape + verify)
/docs-researcher

# Discovery only - just find what technologies are used
/docs-researcher discovery

# Catalog only - analyze usage of already-discovered technologies
/docs-researcher catalog

# Scrape only - fetch docs for already-cataloged technologies
/docs-researcher scrape

# Full workflow with verbose output
/docs-researcher full verbose
```

---

## Output Artifacts

| Location | Purpose |
| -------- | ------- |
| `.docs-research/state.json` | Process state tracking |
| `.docs-research/report.md` | Final summary report |
| `.docs-research/scrape-results.json` | Scraping execution results |
| `.docs-research/verification-results.json` | Coverage verification results |
| `tech_stack/*.md` | Technology usage catalogs |
| `ai_docs/{technology}/**/*.md` | Scraped documentation |
| `scripts/docs-research/*.ts` | Generated Agent SDK scripts |

---

## Error Handling

### Firecrawl Rate Limits
- Implement exponential backoff
- Queue requests with delay
- Fall back to Context7 for popular libraries

### Scraping Failures
- Try alternative URLs from search results
- Use stealth proxy mode for difficult sites
- Log failures for manual follow-up

### Large Documentation Sites
- Prioritize by relevance score
- Set reasonable page limits (50-100 per technology)
- Use batch_scrape for efficiency

---

## Integration with Other Commands

This command works well in sequence with:
- `/prime` - Run after priming to enhance context
- `/fact-check-docs` - Verify scraped docs against source
- `/knowledge-fusion` - Synthesize docs into actionable knowledge

---

## Meta-Learning

Results are stored in `~/.claude-code/docs-research-history.json` for:

- Documentation URL caching (avoid re-discovering known sources)
- Scraping pattern optimization
- Success rate tracking per documentation site

---

## Key Design Principles

### Why Agent SDK Scripts Over Inline Execution?

This skill was redesigned to **prefer Agent SDK scripts** for context-heavy operations. The rationale:

1. **Context Exhaustion Prevention**: Documentation research generates massive amounts of content. Running inline risks context overflow mid-operation, leaving work incomplete.

2. **Fresh Context Per Phase**: Each generated script runs with its own context window, ensuring full capacity for each phase.

3. **Resumability**: Scripts write results to disk. If a script fails or times out, results are preserved and the phase can be resumed.

4. **Parallelization Potential**: Generated scripts can be run concurrently for different technologies (future enhancement).

5. **Debugging**: Scripts are inspectable. If something fails, you can examine and re-run the script directly.

### When to Use What

| Operation | Approach | Why |
| --------- | -------- | --- |
| Discovery (Phase 1) | Inline | Low context usage, fast |
| Cataloging (Phase 2) | Agent SDK script | Many technologies = high context |
| Scraping (Phase 3) | **Always** Agent SDK script | Content-heavy by nature |
| Verification (Phase 4) | Agent SDK script | Multi-technology processing |
| Report Generation (Phase 5) | Inline | Template-based, low context |

### Script Generation Best Practices

When generating scripts:

1. **Bake in all data** - Don't rely on the script reading state files that might change
2. **Include error handling** - Scripts should handle failures gracefully
3. **Write incremental results** - Don't wait until the end to write output
4. **Use rate limiting** - Respect API limits (1s delay between Firecrawl calls)
5. **Log progress** - Console output helps monitor long-running operations
