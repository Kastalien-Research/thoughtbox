# Memory Tool Integration Specification

## Overview

This specification describes the integration of Knowledge Graph memory capabilities into the Thoughtbox MCP server. The memory system enables persistent storage of entities, relations, and observations, allowing Claude to maintain context across sessions and build structured knowledge during complex reasoning workflows.

## Design Goals

1. **Seamless Integration**: Memory tools should work alongside existing `thoughtbox` and `notebook` tools
2. **Persistence**: Knowledge graph data persists to disk (JSONL format)
3. **Session Awareness**: Memory file path is configurable per-project
4. **Minimal Dependencies**: Reuse existing MCP SDK, no additional dependencies

## Architecture

### File Structure

```
src/
├── index.ts              # Main server - add MemoryServer integration
├── memory/
│   ├── index.ts          # MemoryServer class and tool definitions
│   ├── types.ts          # Entity, Relation, KnowledgeGraph types
│   └── operations.ts     # CRUD operations for knowledge graph
```

### Core Types

```typescript
// src/memory/types.ts

export interface Entity {
  name: string;
  entityType: string;
  observations: string[];
}

export interface Relation {
  from: string;
  to: string;
  relationType: string;
}

export interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
}
```

### MemoryServer Class

```typescript
// src/memory/index.ts

export class MemoryServer {
  private memoryFilePath: string;

  constructor(memoryFilePath?: string) {
    // Default to ~/.thoughtbox/memory.jsonl or project-local
    this.memoryFilePath = memoryFilePath ||
      path.join(process.cwd(), '.thoughtbox', 'memory.jsonl');
  }

  // Core operations
  async createEntities(entities: Entity[]): Promise<Entity[]>
  async createRelations(relations: Relation[]): Promise<Relation[]>
  async addObservations(observations: ObservationInput[]): Promise<ObservationResult[]>
  async deleteEntities(entityNames: string[]): Promise<void>
  async deleteObservations(deletions: DeletionInput[]): Promise<void>
  async deleteRelations(relations: Relation[]): Promise<void>
  async readGraph(): Promise<KnowledgeGraph>
  async searchNodes(query: string): Promise<KnowledgeGraph>
  async openNodes(names: string[]): Promise<KnowledgeGraph>
}
```

## Tools

### 1. `memory_create_entities`

Create multiple new entities in the knowledge graph.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "entities": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Unique entity identifier" },
          "entityType": { "type": "string", "description": "Type classification (e.g., 'concept', 'person', 'project')" },
          "observations": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Initial observations about the entity"
          }
        },
        "required": ["name", "entityType", "observations"]
      }
    }
  },
  "required": ["entities"]
}
```

### 2. `memory_create_relations`

Create relations between entities (always in active voice).

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "relations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "from": { "type": "string", "description": "Source entity name" },
          "to": { "type": "string", "description": "Target entity name" },
          "relationType": { "type": "string", "description": "Relation type in active voice" }
        },
        "required": ["from", "to", "relationType"]
      }
    }
  },
  "required": ["relations"]
}
```

### 3. `memory_add_observations`

Add observations to existing entities.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "observations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "entityName": { "type": "string" },
          "contents": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["entityName", "contents"]
      }
    }
  },
  "required": ["observations"]
}
```

### 4. `memory_delete_entities`

Delete entities and their associated relations.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "entityNames": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["entityNames"]
}
```

### 5. `memory_delete_observations`

Delete specific observations from entities.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "deletions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "entityName": { "type": "string" },
          "observations": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["entityName", "observations"]
      }
    }
  },
  "required": ["deletions"]
}
```

### 6. `memory_delete_relations`

Delete specific relations from the graph.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "relations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "from": { "type": "string" },
          "to": { "type": "string" },
          "relationType": { "type": "string" }
        },
        "required": ["from", "to", "relationType"]
      }
    }
  },
  "required": ["relations"]
}
```

### 7. `memory_read_graph`

Read the entire knowledge graph.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {}
}
```

### 8. `memory_search_nodes`

Search for entities matching a query string.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query matching entity names, types, or observations"
    }
  },
  "required": ["query"]
}
```

### 9. `memory_open_nodes`

Retrieve specific entities by name with their inter-relations.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "names": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Entity names to retrieve"
    }
  },
  "required": ["names"]
}
```

## Integration with Main Server

### Changes to `src/index.ts`

```typescript
import { MemoryServer, MEMORY_TOOLS } from "./memory/index.js";

// In createServer function:
const memoryServer = new MemoryServer();

// Add to ListToolsRequestSchema handler:
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [CLEAR_THOUGHT_TOOL, NOTEBOOK_TOOL, ...MEMORY_TOOLS],
}));

// Add to CallToolRequestSchema handler:
if (request.params.name.startsWith("memory_")) {
  return memoryServer.processTool(request.params.name, request.params.arguments);
}
```

### Resources

Add a new resource for viewing the knowledge graph:

```typescript
{
  uri: "thoughtbox://memory/graph",
  name: "Knowledge Graph",
  description: "Current state of the knowledge graph memory",
  mimeType: "application/json",
}
```

## Storage Format

### JSONL File Structure

Each line is a JSON object with a `type` field:

```jsonl
{"type":"entity","name":"React_Hooks","entityType":"concept","observations":["Introduced in React 16.8","Enable state in function components"]}
{"type":"entity","name":"useState","entityType":"hook","observations":["Returns [state, setState] tuple","Lazy initialization with function"]}
{"type":"relation","from":"useState","to":"React_Hooks","relationType":"is_a"}
```

### File Location

Default: `<project-root>/.thoughtbox/memory.jsonl`

Configurable via:
- Environment variable: `THOUGHTBOX_MEMORY_PATH`
- Constructor parameter in `MemoryServer`

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `THOUGHTBOX_MEMORY_PATH` | Custom path for memory file | `.thoughtbox/memory.jsonl` |

### Smithery Config Schema Extension

```typescript
export const configSchema = z.object({
  disableThoughtLogging: z.boolean().optional().default(false),
  memoryFilePath: z.string().optional()
    .describe("Custom path for knowledge graph memory file"),
});
```

## Use Cases

### 1. Reasoning Chain Memory

During a thoughtbox reasoning session, store key insights:

```typescript
// After reaching an important conclusion in thought 5
memory_create_entities([{
  name: "Authentication_Insight",
  entityType: "insight",
  observations: [
    "JWT tokens should include refresh mechanism",
    "Discovered in thought 5 of security analysis"
  ]
}])
```

### 2. Cross-Session Context

Remember project context between sessions:

```typescript
memory_create_entities([{
  name: "ProjectX_Architecture",
  entityType: "project",
  observations: [
    "Uses microservices pattern",
    "Primary database is PostgreSQL",
    "Authentication via OAuth2"
  ]
}])
```

### 3. Relationship Mapping

Connect related concepts:

```typescript
memory_create_relations([
  { from: "OAuth2", to: "ProjectX_Architecture", relationType: "authenticates" },
  { from: "PostgreSQL", to: "ProjectX_Architecture", relationType: "stores_data_for" }
])
```

## Testing Strategy

### Unit Tests

- Test each CRUD operation independently
- Test search functionality with various query patterns
- Test persistence (save/load cycle)
- Test cascading deletes (entity deletion removes relations)

### Integration Tests

- Test memory tools alongside thoughtbox tool
- Test concurrent access patterns
- Test large graph performance

### BDD Scenarios

See `specs/memory-bdd-workflows.md` for behavior-driven test scenarios.

## Implementation Phases

### Phase 1: Core Implementation
- [ ] Create `src/memory/types.ts` with interfaces
- [ ] Create `src/memory/operations.ts` with KnowledgeGraphManager
- [ ] Create `src/memory/index.ts` with MemoryServer and tool definitions

### Phase 2: Server Integration
- [ ] Import and instantiate MemoryServer in `src/index.ts`
- [ ] Add memory tools to ListToolsRequestSchema handler
- [ ] Add memory tool dispatch to CallToolRequestSchema handler
- [ ] Add memory graph resource

### Phase 3: Configuration
- [ ] Add memoryFilePath to configSchema
- [ ] Handle environment variable configuration
- [ ] Ensure directory creation for memory file

### Phase 4: Build & Test
- [ ] Verify TypeScript compilation
- [ ] Test with Claude Code after restart
- [ ] Run BDD scenarios

## Success Criteria

1. All 9 memory tools appear in tool list
2. Knowledge graph persists to `.thoughtbox/memory.jsonl`
3. Search returns relevant entities
4. Relations are properly cascaded on entity deletion
5. Works with existing thoughtbox and notebook tools
