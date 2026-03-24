---
name: mcp-code-mode
description: >
  Guide for designing, implementing, and advising on MCP servers that use Code Mode — the
  pattern where an LLM writes and executes code to orchestrate API calls instead of calling
  individual tools one at a time. Use this skill whenever the user mentions Code Mode, MCP
  tool proliferation, context window bloat from MCP tools, programmatic tool calling, LLM
  code execution in MCP, building a Code Mode server, or wants to compress a large API into
  a small MCP surface. Also use when the user asks how to reduce token cost of MCP tools,
  how to expose an entire API over MCP efficiently, or how to implement search+execute
  patterns in FastMCP, Cloudflare Workers, or custom servers.
---

# MCP Code Mode

## What Code Mode Is

**Code Mode is a server-side MCP architecture where the LLM writes code to orchestrate API calls
instead of calling individual tools one at a time.**

Standard MCP has two scaling problems:

1. **Context bloat**: Every tool definition loads into the LLM's context upfront. Hundreds of
   tools = tens of thousands of tokens spent before the first user token. Cloudflare's full API
   would require 1.17 million tokens as individual tools — exceeding most model context windows
   entirely.

2. **Round-trip overhead**: Every tool call is a full inference round-trip. A 20-step task means
   20 back-and-forth cycles, each burning latency and tokens on intermediate results that only
   exist to feed the next step.

**Code Mode solves both by collapsing the entire API surface into two meta-tools:**

- **`search` (discovery tool)**: The LLM writes an executable code snippet to find relevant
  operations on demand, without the full spec ever entering context.
- **`execute` (code execution tool)**: The LLM writes a script that chains API calls, handles
  conditionals and pagination, and returns only the final result. The script runs in a secure
  sandbox server-side.

**The result**: Typically ~1,000 tokens for discovery setup before task payloads, rather than
loading every tool definition up front. One execution call can replace 20+ round-trips. API keys
stay server-side and never appear in tool parameters.

### Why LLMs write code better than they call tools

LLMs are trained on millions of lines of real-world code. Tool-calling schemas are mostly
synthetic training examples. Code is the LLM's native orchestration language — it can express
conditionals, loops, error handling, and data transformation that tool-calling schemas cannot.

---

## The Two Core Tools

Every Code Mode implementation, regardless of language or framework, converges on the same
two-tool surface:

### Tool 1: Discovery / Search

**Purpose**: Let the LLM execute code to find what operations exist without loading the full catalog.

**Typical names**: `search`, `docs_search`, `find_tools`, `get_schema`

**What it does**: Takes an executable code snippet (or a callable) that filters the operation
  catalog and returns a scoped subset of available operations — names, descriptions, parameter
  schemas — at whatever detail level the LLM needs.

**Key design choices**:
- Return only names + descriptions by default ("brief" level). Let the LLM ask for schemas
  when it's ready to write code.
- BM25 or semantic search over tool names, descriptions, and tags.
- Annotate partial results: "3 of 47 tools" so the LLM knows more exist.
- For large APIs (Cloudflare-style), the search input is itself executable code that walks
  the OpenAPI spec — giving the LLM full programmatic filtering power.

### Tool 2: Execute

**Purpose**: Run LLM-generated code in a secure sandbox and return the result.

**Typical names**: `execute`, `run`, `run_workflow`

**What it does**: Accepts a code string, runs it in an isolated environment with
`call_tool(name, params)` or an authenticated API client injected as the only callable,
and returns the output.

**Key design choices**:
- The sandbox has no filesystem, no arbitrary network access, no env vars.
- API credentials are injected server-side as a pre-configured client — never in the
  tool parameters the LLM sees.
- Execution limits (timeout, memory cap) should always be set.

---

## Discovery Patterns

Choose the pattern based on API surface area and complexity:

### Three-Stage (default for large APIs)
```
search(code) → get_schema(tool_names) → execute(code)
```
Best for APIs with many tools. The LLM pays for schemas only for the tools it actually needs.
Cloudflare uses a variant where `search` itself takes code to query the OpenAPI spec.

### Two-Stage (medium APIs)
```
search(code, detail="detailed") → execute(code)
```
Search returns parameter schemas inline. One fewer round-trip at the cost of more tokens per
search result. Good for catalogs under ~50 tools.

### Single-Stage (small/static APIs)
```
execute(code)  [tool descriptions baked into execute's description]
```
Skip discovery entirely for very small or well-known APIs. Bake the available functions into
the execute tool's description string.

### Four-Stage with Tags (large categorized APIs)
```
get_tags() → search(code, tags=[...]) → get_schema(names) → execute(code)
```
Add `GetTags` upfront when your tools are organized into meaningful categories. Helps the LLM
orient itself before searching.

---

## Implementation: FastMCP (Python)

FastMCP 3.1+ has a first-class `CodeMode` transform. Wrap any existing server:

```python
from fastmcp import FastMCP
from fastmcp.experimental.transforms.code_mode import CodeMode

mcp = FastMCP("MyServer", transforms=[CodeMode()])

@mcp.tool
def get_payment(payment_id: str) -> dict:
    """Retrieve a payment by ID."""
    return payments_client.get(payment_id)
```

Clients no longer see `get_payment` directly. They see CodeMode's meta-tools. The original
tools are still there, accessed through the execution layer.

**Install**: `pip install "fastmcp[code-mode]"`

### Discovery tool configuration

```python
from fastmcp.experimental.transforms.code_mode import (
    CodeMode, GetTags, Search, GetSchemas, ListTools
)

# Default (3-stage): Search + GetSchemas
mcp = FastMCP("Server", transforms=[CodeMode()])

# 4-stage with tags
code_mode = CodeMode(
    discovery_tools=[GetTags(), Search(), GetSchemas()],
)

# 2-stage: search returns schemas inline
code_mode = CodeMode(
    discovery_tools=[Search(default_detail="detailed"), GetSchemas()],
)

# Single-stage: no discovery, bake descriptions in
code_mode = CodeMode(
    discovery_tools=[],
    execute_description=(
        "Available tools:\n"
        "- get_payment(payment_id: str) -> dict\n"
        "Write Python using `await call_tool(name, params)` and `return` the result."
    ),
)
```

### Sandbox resource limits (always set these)

```python
from fastmcp.experimental.transforms.code_mode import CodeMode, MontySandboxProvider

sandbox = MontySandboxProvider(
    limits={
        "max_duration_secs": 10,
        "max_memory": 50_000_000,
        "max_recursion_depth": 100,
    }
)
mcp = FastMCP("Server", transforms=[CodeMode(sandbox_provider=sandbox)])
```

### Inside the Python sandbox

The sandbox injects `call_tool` as the only callable. Code must be `async` and use `return`:

```python
# LLM-generated code inside execute
a = await call_tool("get_payment", {"payment_id": "pay_123"})
b = await call_tool("create_refund", {"payment_id": a["id"], "amount": a["amount"]})
return b
```

---

## Implementation: Cloudflare (`@cloudflare/codemode`)

```typescript
import { Agent } from "agents";
import { CodeMode } from "@cloudflare/codemode";

export class MyAgent extends Agent<Env, State> {
  // ...
}
```

Install: `npm install agents @cloudflare/codemode`

The Cloudflare implementation uses **Dynamic Worker Loader** (V8 isolates) as the sandbox.
The `search` tool in the Cloudflare MCP server accepts JavaScript async arrow functions that
run against a pre-resolved OpenAPI spec object. The `execute` tool injects a
`cloudflare.request()` client with scoped OAuth permissions.

**Key characteristics**:
- TypeScript/JavaScript inside the sandbox (not Python)
- `spec` object available in search sandbox (pre-resolved OpenAPI)
- `cloudflare.request()` available in execute sandbox (authenticated, scoped)
- Worker isolates: no filesystem, no arbitrary network, external fetches disabled by default
- OAuth 2.1 compliant; token downscoped to user-approved permissions at connect time

### Cloudflare search pattern

```javascript
// LLM-generated search code
async () => {
  const results = [];
  for (const [path, methods] of Object.entries(spec.paths)) {
    if (path.includes('/zones/') && path.includes('rulesets')) {
      for (const [method, op] of Object.entries(methods)) {
        results.push({ method: method.toUpperCase(), path, summary: op.summary });
      }
    }
  }
  return results;
}
```

### Cloudflare execute pattern

```javascript
// LLM-generated execution code
async () => {
  const zones = await cloudflare.request({ method: "GET", path: "/zones" });
  const zone = zones.result.find(z => z.name === "example.com");
  const rulesets = await cloudflare.request({
    method: "GET",
    path: `/zones/${zone.id}/rulesets`
  });
  return rulesets.result.map(r => ({ name: r.name, phase: r.phase }));
}
```

---

## Detail Levels (FastMCP)

| Level | Output | Tokens |
|-------|--------|--------|
| `"brief"` | Tool names + one-line descriptions | Cheapest |
| `"detailed"` | Compact markdown with param names, types, required markers | Medium |
| `"full"` | Complete JSON schema | Most expensive |

`Search` defaults to `"brief"`. `GetSchemas` defaults to `"detailed"`. LLM can override per call.

---

## Security Properties

Code Mode is **more secure by design** than standard MCP tool proliferation:

- **No credentials in context**: API keys/tokens injected server-side into the sandbox client.
  The LLM never sees them in tool parameters.
- **Isolated execution**: Code runs in a restricted sandbox (V8 isolate or Monty), no access to
  host filesystem, env vars, or arbitrary network.
- **Controlled API surface**: Only the SDK/client injected into the sandbox is callable. The LLM
  cannot import arbitrary modules or call arbitrary code.
- **Prompt injection resistance**: Even if injected content tries to exfiltrate data via a
  network call, the sandbox blocks unapproved outbound requests.

---

## Custom Discovery Tools (FastMCP)

Discovery tools can be custom callables. Each receives `get_catalog` (a request-scoped accessor)
and returns a `Tool`:

```python
from fastmcp.experimental.transforms.code_mode import CodeMode, GetToolCatalog, GetSchemas
from fastmcp.server.context import Context
from fastmcp.tools.tool import Tool

def list_payment_tools(get_catalog: GetToolCatalog) -> Tool:
    async def list_tools(ctx: Context) -> str:
        """List all available payment tool names."""
        tools = await get_catalog(ctx)
        return ", ".join(t.name for t in tools)
    return Tool.from_function(fn=list_tools, name="list_tools")

code_mode = CodeMode(discovery_tools=[list_payment_tools, GetSchemas()])
```

---

## Ecosystem Context

Code Mode originated at Cloudflare (server-side approach) and was independently explored by
Anthropic as "Programmatic Tool Calling." It is currently implemented in:

- **Cloudflare Agents SDK** (`@cloudflare/codemode`) — TypeScript, V8 sandbox
- **FastMCP** (`fastmcp[code-mode]`) — Python, Monty sandbox
- **Goose** (Block) — client-side variant
- **Claude SDK** — "Programmatic Tool Calling" client-side variant
- **DodoPayments, and other API providers** — adopting Cloudflare's server-side pattern

The pattern is spreading rapidly among any API with more tools than a context window can hold.
Anthropic measured: 37% token reduction, knowledge retrieval accuracy improved from 25.6% to
28.5%, context overhead reduced from 77K to 8.7K tokens in their own internal tooling.

---

## When to Recommend Code Mode

Use Code Mode when:
- The API has more than ~20-30 distinct operations
- Token cost of loading all tool definitions is measurable (>10K tokens)
- Tasks often require chaining multiple API calls
- Security matters: credentials shouldn't appear in LLM-visible tool parameters
- The API is growing and you don't want to hand-maintain tool definitions

Stick with standard tools when:
- The API has fewer than ~10 operations
- Operations are truly independent (rarely chained)
- The client environment doesn't support remote MCP or sandbox execution

---

## Common Mistakes

1. **Forgetting sandbox limits**: Always set `max_duration_secs` and `max_memory`.
   Without them, LLM-generated scripts can run indefinitely.

2. **Single-stage for complex catalogs**: Dumping all schemas into the execute tool's
   description defeats the purpose. Staged discovery keeps context lean.

3. **No `GetSchemas` fallback in 2-stage**: Always keep `GetSchemas` available even when
   search returns detailed results. Deeply nested schemas need the full JSON occasionally.

4. **Exposing credentials in the execute tool's description**: API keys belong in the
   sandbox's injected client, not in the tool description string the LLM sees.

5. **Not annotating partial search results**: The LLM needs to know "3 of 47 tools shown"
   or it will assume the search was exhaustive.
