# Thoughtbox Probe Harness

A minimal scaffold for spawning a Claude Agent SDK agent wired to the live
Code Mode Thoughtbox MCP server, so you can write probes against it ad hoc.

A **probe** is a standalone script that hands an agent a natural-language task,
lets it drive Thoughtbox, and reports a structured result. Probes are for
behavioral checks and exploratory dogfooding — not deterministic unit tests
(they are non-deterministic, slow, and cost real tokens + write real data).

## Setup

The harness reads connection details from `.env` (via `dotenv`):

| Env var | Meaning | Default |
|---|---|---|
| `THOUGHTBOX_API_KEY` | `tbx_` API key (same one in `.mcp.json`) | required |
| `THOUGHTBOX_URL` | MCP base URL | live Cloud Run server |
| `ANTHROPIC_API_KEY` | drives the Agent SDK | required |

To target a local server instead of production:

```bash
THOUGHTBOX_URL=http://localhost:1731/mcp npx tsx scripts/probes/surface.probe.ts
```

## Run the seed probes

```bash
npx tsx scripts/probes/surface.probe.ts          # confirm the Code Mode surface is reachable
npx tsx scripts/probes/thought-roundtrip.probe.ts # verify a thought persists in Supabase
```

Each probe exits non-zero if its assertion fails, so they compose into scripts.
Runs create real data visible in the web app's Runs view.

## Write a new probe

Create `scripts/probes/<name>.probe.ts`:

```ts
import { runProbe, reportProbe } from "./harness.js";

const result = await runProbe({
  name: "my-probe",
  prompt: "You are connected to Thoughtbox. <task for the agent>",
  maxTurns: 10,                       // bound the run
  assert: (r) => {                    // optional pass/fail
    if (!r.completed) throw new Error("did not complete");
  },
});

reportProbe(result);
process.exit(result.passed === false ? 1 : 0);
```

`runProbe` returns a `ProbeResult`: `finalText`, `tbOperations` (the `tb.*` ops
parsed from execute calls), `toolCalls`, `turns`, `usage`, and `passed`. The
agent is scoped to the three Thoughtbox tools plus any `allowedTools` you add.

## Cost

Each probe spawns a real agent against real models and writes real Supabase
data. Per the Agent SDK docs, from 2026-06-15 SDK/`-p` usage on subscription
plans draws on a separate monthly Agent SDK credit. Run probes deliberately;
`maxTurns` bounds per-probe spend.
