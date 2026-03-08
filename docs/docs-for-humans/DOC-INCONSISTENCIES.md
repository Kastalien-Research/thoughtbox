# Documentation Inconsistencies Audit

This file lists claims in `docs/docs-for-humans/` that are not clearly supported by the current codebase as checked on 2026-03-07.

Only concrete inconsistencies are listed below. High-level conceptual claims that are subjective or clearly approximate are not included.

## Findings

| Doc file | Claim | Evidence checked | Verdict | Notes |
|---|---|---|---|---|
| `configuration.md` | `OBSERVATORY_PORT` is the environment variable for the Observatory UI port | `src/observatory/config.ts:42-43` reads `THOUGHTBOX_OBSERVATORY_PORT` | Unsupported | The documented variable name is wrong. |
| `observability.md` | `OBSERVATORY_PORT=1729 thoughtbox` starts the Observatory | `src/observatory/config.ts:42-43` reads `THOUGHTBOX_OBSERVATORY_PORT` | Unsupported | Same variable-name mismatch as above. |
| `observability.md` | The Grafana dashboard name / URL is `thoughtbox-overview` | `src/observability/gateway-handler.ts:210` defaults to `thoughtbox-mcp` | Unsupported | The example request/response uses the wrong default dashboard identifier. |
| `tools-reference.md` | Health response example shows Thoughtbox version `1.0.0` | `package.json:3`, `src/index.ts:207`, `src/index.ts:214` all show `1.2.2` | Outdated | The example is stale relative to the codebase version. |

## Notes

- Some other `1.0` / `1.0.0` values in the docs appear to describe schema or catalog versions rather than the package version. Those were **not** flagged unless they clearly referred to the running server version.
- Most other claims sampled during the audit were supported, including the default HTTP port (`1731`), Observatory default port (`1729`), Node.js requirement (`22+`), and the existence of 15 mental models.

## Recommended follow-up

1. Replace `OBSERVATORY_PORT` with `THOUGHTBOX_OBSERVATORY_PORT` in human-facing docs.
2. Replace `thoughtbox-overview` with `thoughtbox-mcp` in observability examples unless the code is intentionally changing.
3. Update versioned examples that clearly refer to the running server.