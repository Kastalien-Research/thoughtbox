# MCP Peer Notebooks Diagrams

**Status**: Companion diagrams for ADR-022 and `SPEC-CONTROL-PLANE.md`
**Date**: 2026-04-30

## System Architecture

```text
User / Agent / Scheduler
        |
        | peer.invoke({ peerId, tool, args })
        v
+-----------------------------------------------+
| Cloud Run MCP API / Peer Broker               |
| - workspace auth                              |
| - peer registry                               |
| - active manifest enforcement                 |
| - broker proxy authority                      |
| - invocation, trace, artifact metadata writes |
+-----------------------------------------------+
        |
        | runtime provider RPC
        v
+-----------------------------------------------+
| Separate Peer Execution Plane                 |
| - mock provider                               |
| - local-process provider                      |
| - future smolvm provider                      |
+-----------------------------------------------+
        |
        v
+-----------------------------------------------+
| Peer Notebook Runtime                         |
| - notebook files                              |
| - selected exposed operation                  |
| - broker-proxy outbound client                |
| - artifact writer                             |
+-----------------------------------------------+
        |
        | artifact payloads + runtime results
        v
+-----------------------------------------------+
| Supabase                                      |
| - Postgres peer rows                          |
| - trace events                                |
| - artifact metadata/previews                  |
| - Storage artifact payloads                   |
+-----------------------------------------------+
        ^
        |
+-----------------------------------------------+
| Next.js Web App                               |
| - peer registry                               |
| - invocation detail                           |
| - trace timeline                              |
| - artifact previews                           |
+-----------------------------------------------+
```

Cloud Run owns the API/control plane. It does not host KVM or smolvm execution.

## Manifest Compilation And Activation

```text
Notebook source
  |
  | contains one JSON cell/file named peer.manifest.json
  v
+------------------------------+
| Control-plane compiler       |
| - parse JSON as data         |
| - never execute code cells   |
| - validate schema            |
| - canonicalize JSON          |
| - compute manifest_hash      |
+------------------------------+
  |
  v
peer_manifests
  status = draft
  manifest_hash = sha256:...
  |
  | explicit approval
  v
peer_manifests
  status = active
  |
  v
peer_notebooks.active_manifest_id
  |
  v
Broker dispatch uses active manifest hash
```

Runtime code cannot activate, expand, or replace the manifest used by the
broker.

## Broker Invocation

```text
Caller
  |
  | peer.invoke({ peerId, tool, args })
  v
+----------------------------+
| Broker                     |
| 1. authenticate workspace  |
| 2. resolve peer            |
| 3. load active manifest    |
| 4. validate tool + args    |
| 5. check budgets           |
| 6. create invocation row   |
| 7. issue scoped token      |
+----------------------------+
  |
  | invoke({ invocationId, tool, args, brokerProxyUrl, scopedToken, budgets })
  v
+----------------------------+
| Runtime Provider           |
| - mock/local now           |
| - smolvm later             |
+----------------------------+
  |
  v
+----------------------------+
| Peer Runtime               |
| - execute selected tool    |
| - return typed result      |
| - return artifact refs     |
+----------------------------+
  |
  v
Broker updates invocation terminal status
```

The runtime receives one broker-selected operation, not arbitrary external
tool traffic.

## Outbound Broker-Proxy Calls

```text
Peer Runtime
  |
  | outbound call with scopedToken + invocationId
  v
+--------------------------------+
| Broker Proxy                   |
| - validate scoped token        |
| - verify workspace             |
| - verify active manifest hash  |
| - enforce mayCall              |
| - enforce remaining budgets    |
+--------------------------------+
        |                         |
        | allowed                 | denied
        v                         v
+------------------+       +--------------------------+
| Target MCP Tool  |       | Denial trace event       |
| or Artifact API  |       | no target execution      |
+------------------+       +--------------------------+
        |
        v
Allowed call trace event
```

Denied calls are product-visible trace events, not silent runtime failures.

## Trace And Artifact Persistence

```text
Broker / Runtime Provider
  |
  | lifecycle, decision, outbound, denial, result events
  v
peer_trace_events
  - invocation_id
  - seq
  - event_type
  - severity
  - attrs

Runtime / Broker
  |
  | claims.json, notebook export, logs, reports
  v
Supabase Storage
  peer-artifacts/{workspace}/{peer}/{invocation}/{artifact}/{name}
  |
  v
peer_artifacts
  - metadata
  - sha256
  - storage_path
  - preview
  - retention

Broker
  |
  v
peer_invocations
  - status
  - args_hash
  - result_hash
  - result summary
```

Trace rows reference artifacts. Full artifact payloads do not live in trace
rows.

## Web App Inspection

```text
Next.js Web App
  |
  | workspace-scoped Supabase reads
  v
+-----------------------+
| Peer Registry         |
| peer_notebooks        |
| peer_manifests        |
+-----------------------+
  |
  v
+-----------------------+
| Invocation List       |
| peer_invocations      |
+-----------------------+
  |
  v
+-----------------------+
| Invocation Detail     |
| peer_trace_events     |
| peer_artifacts        |
+-----------------------+
  |
  v
+-----------------------+
| Artifact Preview      |
| Postgres preview      |
| Supabase Storage      |
+-----------------------+
```

The web app is the deployed product surface. The legacy `src/observatory`
server is not part of the pilot read model.
