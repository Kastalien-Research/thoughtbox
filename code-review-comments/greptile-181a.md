This is a comment left during a code review. Path: src/hub/hub-tool-schema.ts
Line: 91-92

Comment: **`mergeMessage` optional in schema but required in operation catalog**

`mergeMessage` is marked `optional()` here, but `operations.ts` now lists it in
`required: ["workspaceId", "proposalId", "mergeMessage"]`. Any agent following
the Zod schema (what MCP surfaces) can legally call `merge_proposal` without
`mergeMessage` and will get a runtime failure from the hub handler rather than a
clean validation error.

```suggestion
mergeMessage: z.string()
  .describe('Merge thought content (merge_proposal) — required for merge_proposal'),
```

If a truly flat optional-everywhere schema is preferred, at minimum the
`.describe()` should call out that this is required for `merge_proposal` so
agents are warned before they hit the downstream error.

How can I resolve this? If you propose a fix, please make it concise.

---

This is a comment left during a code review. Path: src/index.ts Line: 133-138

Comment: **New `FileSystemStorage` instances per session, not pre-initialized**

The original code returned the same pre-initialized `fsStorage` instance for
every call. Now each `getStorage()` call produces a new, uninitialized instance.
The `setProject` fix (calling `await this.initialize()` inside `setProject`)
covers the normal project-scoped path.

However, any code that calls unscoped storage methods (e.g. `getConfig()`,
health checks, observatory) on a factory-created instance before `setProject` is
invoked will hit an uninitialized instance where the config/directory state
hasn't been loaded from disk yet. Worth verifying that all callers of
`factory.getStorage()` always call `setProject` before touching the storage.

How can I resolve this? If you propose a fix, please make it concise.

---

This is a comment left during a code review. Path: src/hub/hub-tool-handler.ts
Line: 58-66

Comment: **Env agent only enters the first session's registry**

`envResolved` is a handler-level boolean that fires once and adds the resolved
ID only to the session key of the **first** call. In a multi-session HTTP
server, any subsequent session that passes `agentId: envAgentId` is rejected
with "not registered in this session."

In the old code, every session independently resolved the env agent identity
(each had its own `sessionIdentities` entry), so every session could address the
env agent. The new code regresses that behaviour for secondary sessions.

T-HTW-16 passes today because the test uses a single shared `sessionId`
throughout — the limitation doesn't appear until a second independent session is
created. Consider resolving per-session (guard on
`sessionDefaults.has(sessionKey)` instead of the handler-level `envResolved`
flag) so every new session initialises correctly.

How can I resolve this? If you propose a fix, please make it concise.
