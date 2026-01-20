# Thoughtbox Documentation

> **A reasoning ledger for AI agents** — persistent, auditable thinking that survives conversations.

Thoughtbox is an MCP (Model Context Protocol) server that transforms AI reasoning from ephemeral process into durable, structured data. Think of it as version control for thinking.

---

## What is Thoughtbox?

When AI agents reason through problems, that thinking typically vanishes after each conversation. Thoughtbox captures and persists this reasoning, creating an auditable trail of how conclusions were reached.

**Key principles:**

- **Local-First**: All data stored on your machine (`~/.thoughtbox/`)
- **Privacy-Preserving**: Nothing sent to external servers
- **Persistent**: Thought chains survive across conversations
- **Auditable**: Full history with branches, revisions, and critiques

---

## Documentation

### Getting Started

- [**Quick Start**](./getting-started.md) — Install and run your first reasoning session
- [**Configuration**](./configuration.md) — Environment variables and settings

### Core Concepts

- [**How Thoughtbox Works**](./core-concepts.md) — Sessions, thoughts, branches, and revisions
- [**Progressive Disclosure**](./core-concepts.md#progressive-disclosure) — The staged tool system
- [**Effective Reasoning**](./effective-reasoning.md) — Methodology guide for structured thinking
- [**Glossary**](./glossary.md) — Terminology and concepts

### Reference

- [**Tools Reference**](./tools-reference.md) — Complete API for all gateway operations
- [**Mental Models**](./mental-models.md) — 15 structured reasoning frameworks
- [**Notebooks**](./notebooks.md) — Literate programming with executable cells

### Advanced

- [**Architecture**](./architecture.md) — Technical deep-dive for contributors
- [**Observability**](./observability.md) — Prometheus, Grafana, and real-time visualization
- [**Future Work**](./FUTURE.md) — Planned documentation (schemas, standalone guides)

---

## Quick Example

Here's what a reasoning session looks like:

```
Agent: thoughtbox_gateway { "operation": "start_new", "args": { "title": "Debug auth flow" } }
→ Session created: auth-debug-2025-01

Agent: thoughtbox_gateway { "operation": "cipher" }
→ Deep thinking mode activated

Agent: thoughtbox_gateway {
  "operation": "thought",
  "args": {
    "thought": "The 401 errors appear after token refresh. Let me trace the flow...",
    "thoughtNumber": 1,
    "totalThoughts": 5,
    "nextThoughtNeeded": true
  }
}
→ Thought persisted, observable in real-time
```

Later, you can:
- Export the session as Markdown or JSON
- Analyze reasoning patterns and quality metrics
- Resume the session in a new conversation
- Branch to explore alternative approaches

---

## Who is this for?

**AI Agent Developers** building systems that need explainable reasoning

**Researchers** studying how AI models approach problems

**Teams** wanting audit trails for AI-assisted decisions

**Anyone** curious about making AI thinking more transparent

---

## Get Started

```bash
# Install
npm install -g @kastalien-research/thoughtbox

# Run with stdio (for Claude Code, Cursor, etc.)
thoughtbox

# Or run as HTTP server
THOUGHTBOX_TRANSPORT=http thoughtbox
```

Then connect via MCP and start reasoning.

→ [Continue to Quick Start Guide](./getting-started.md)
