# Docker Architecture Ideas

> Three ways to leverage Thoughtbox's Docker-native architecture

## Context

Thoughtbox is deeply Docker-native: containerized MCP server with persistent volumes, Docker bridge networking (`mcp-network`), a full observability stack (OTel → Prometheus → Grafana), and proven patterns for multi-agent containers sharing a single Thoughtbox instance. The sidecar proxy, discovery registry, and agent profile system create natural extension points.

---

## 1. MCP Server Mesh — Container-Per-Tool Domain

Decompose the monolithic MCP server into per-domain containers (knowledge graph, sessions, hub, notebook, mental models) that auto-register with a gateway via Docker DNS and labels. A gateway container discovers peers and presents a unified MCP endpoint to clients.

**Why it's interesting:**
- Each tool domain scales independently — knowledge graph gets more memory, notebook executor gets stricter sandboxing
- Hot-reload individual capabilities without restarting the whole server
- The discovery-registry (`src/discovery-registry.ts`) already models tool visibility as dynamic — this makes it physical rather than logical
- Security isolation: notebook execution runs with minimal privileges and no network; hub gets network for agent coordination

**Key components:**
- Per-domain services in `docker-compose.yml` with labels (e.g., `mcp.tools=knowledge,session`)
- Gateway container reads Docker socket events to discover/deregister tool containers
- Each tool container implements MCP protocol and registers its tool list on startup
- Existing sidecar pattern (`observability/mcp-sidecar-observability/`) becomes the gateway template

**Existing code that supports this:** `docker-compose.yml`, `src/discovery-registry.ts`, `src/tool-registry.ts`, `observability/mcp-sidecar-observability/`

---

## 2. Ephemeral Reasoning Sandboxes — Disposable Per-Session Containers

When an agent starts a reasoning session (especially untrusted or experimental work), spin up a fresh, isolated container with its own data volume. The session gets a dedicated Thoughtbox instance destroyed when the session ends. Serverless functions, but for reasoning contexts.

**Why it's interesting:**
- Perfect isolation between sessions — no data leakage between projects or agents
- Enables "what-if" reasoning: fork a session into a throwaway container, explore a risky hypothesis, then merge results back or discard
- `THOUGHTBOX_PROJECT` and `THOUGHTBOX_DATA_DIR` already parameterize storage — this takes it one step further
- Pairs with hub workspaces: creating a workspace could auto-provision a container cluster (one per agent + shared Thoughtbox)

**Key components:**
- Session orchestrator service listening for `session.create` events, calling Docker API to spin up containers
- Container templates as Compose profiles or Kubernetes pod specs
- Volume lifecycle: ephemeral volumes for throwaway sessions, named volumes for persistent ones
- Merge protocol for committing session results back to parent instance (mirrors hub proposal/merge model)

**Existing code that supports this:** `src/sessions/`, `src/hub/workspace.ts`, `demo/multi-agent/docker-compose.yml`, `Dockerfile`

---

## 3. Agent Team Topologies via Docker Compose Profiles

Define reusable "team shapes" as Compose profiles. `docker compose --profile review-team up` spins up a coordinator + reviewers + shared hub, all pre-wired with the right agent IDs, profile priming, and network topology.

**Why it's interesting:**
- The multi-agent demo already shows this pattern manually — this productizes it
- Agent profiles (`src/hub/profiles-registry.ts`) already define behavioral roles (COORDINATOR, ARCHITECT, DEBUGGER) — Compose profiles become the deployment counterpart
- Teams can be nested: a "full development" profile composes "code-review" and "architecture" profiles
- Per-agent resource limits prevent runaway consumption

**Key components:**
- Compose profiles: `--profile review-team`, `--profile debug-team`, `--profile full-dev`
- Profile templates map to hub agent profiles with correct `THOUGHTBOX_AGENT_ID` and profile env vars
- MCP tool or CLI (`thoughtbox_hub { operation: "deploy_team", args: { profile: "review-team" } }`) that manages `docker compose` lifecycle
- Init container or entrypoint script for pre-configured channel subscriptions and workspace setup

**Existing code that supports this:** `demo/multi-agent/docker-compose.yml`, `src/hub/profiles-registry.ts`, `src/hub/profile-primer.ts`, `src/hub/hub-types.ts`, `.claude/team-prompts/`