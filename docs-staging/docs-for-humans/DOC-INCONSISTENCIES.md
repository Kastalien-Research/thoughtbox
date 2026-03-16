# Documentation Inconsistencies Audit

This file lists claims in `docs/docs-for-humans/` that are not clearly supported by the current codebase.

## Fixed in 2026-03-16 update

These items from the 2026-03-07 audit have been resolved:

| Issue | Resolution |
|---|---|
| `OBSERVATORY_PORT` documented instead of `THOUGHTBOX_OBSERVATORY_PORT` | Fixed: variable names updated in `configuration.md` and `observability.md` |
| Grafana dashboard documented as `thoughtbox-overview` instead of `thoughtbox-mcp` | Fixed: dashboard and URL updated in `observability.md` |
| Health response example shows version `1.0.0` instead of `1.2.2` | Fixed: versions updated to `1.2.2` in `tools-reference.md` and `observability.md` |

## Current findings

None.

## Notes

- Some other `1.0` / `1.0.0` values in the docs appear to describe schema or catalog versions rather than the package version. Those were **not** flagged unless they clearly referred to the running server version.
- Most other claims sampled during the audit were supported, including the default HTTP port (`1731`), Observatory default port (`1729`), Node.js requirement (`22+`), and the existence of 15 mental models.