 # Thoughtbox Server Capabilities
 
 This folder documents the intended capabilities of the Thoughtbox MCP server based on the current `src/` implementation and bundled resources/prompts. It focuses on what the server is designed to provide, even when some features are staged or described by embedded documentation.
 
 ## What this server is
 
 - An MCP server with both streamable HTTP and stdio transports.
 - A progressive disclosure system with a single always-available gateway tool.
 - A reasoning workspace with persistence, notebooks, mental models, knowledge graph memory, and observability.
 
 ## Primary tools
 
 - `thoughtbox_gateway` (always-on router for all Thoughtbox operations)
 - `observability_gateway` (always-on operational telemetry tool)
 
 ## Initialization and stages (intended flow)
 
 - Stage 0: init operations (`get_state`, `list_sessions`, `navigate`, `load_context`, `start_new`, `list_roots`, `bind_root`)
 - Stage 1: `cipher`, `session`, `deep_analysis`
 - Stage 2: `thought`, `read_thoughts`, `get_structure`, `notebook`, `mental_models`, `knowledge`
 - Stage 3: domain-specific mental model filtering (defined in code but not yet wired into init workflow)
 
 ## Files in this folder
 
 - `Reasoning-and-Sessions.md` — thoughtbox reasoning, cipher, sessions, exports, analysis
 - `Notebook.md` — notebook toolhost, execution, templates, export
 - `Mental-Models.md` — mental model registry, tags, resource browsing
 - `Knowledge-and-Memory.md` — knowledge graph operations and storage model
 - `Observability-and-Events.md` — observability gateway, observatory, event stream
 - `Resources-and-Prompts.md` — resources, prompts, guidance, tests, loops
 
 ## Server modes and configuration
 
 - Transport:
   - `THOUGHTBOX_TRANSPORT=http` (default, streamable HTTP)
   - `THOUGHTBOX_TRANSPORT=stdio`
 - Storage:
   - `THOUGHTBOX_STORAGE=fs` (default, filesystem persistence)
   - `THOUGHTBOX_STORAGE=memory` (in-memory, volatile)
   - `THOUGHTBOX_DATA_DIR` (data root, default `~/.thoughtbox`)
   - `THOUGHTBOX_PROJECT` (project scope, default `_default`)
 - Thought logging:
   - `DISABLE_THOUGHT_LOGGING=true` disables stderr thought rendering
 - Event stream:
   - `THOUGHTBOX_EVENTS_ENABLED=true`
   - `THOUGHTBOX_EVENTS_DEST=stderr|stdout|<filepath>`
 - Observatory:
   - `THOUGHTBOX_OBSERVATORY_ENABLED=true`
   - `THOUGHTBOX_OBSERVATORY_PORT`
   - `THOUGHTBOX_OBSERVATORY_CORS`
   - `THOUGHTBOX_OBSERVATORY_PATH`
   - `THOUGHTBOX_OBSERVATORY_MAX_CONN`
   - `THOUGHTBOX_OBSERVATORY_HTTP_API=false` to disable HTTP API
 - Observability:
   - `PROMETHEUS_URL`
   - `GRAFANA_URL`
