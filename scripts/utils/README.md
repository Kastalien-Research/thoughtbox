## Utility Helpers

### `time-check.ts`
Print current UTC time and elapsed minutes.
```bash
PROMPT_START_TIME=2026-02-11T10:00:00Z npx tsx scripts/utils/time-check.ts
```

### `spec-index.mjs`
Generate `specs/continual-improvement/INDEX.md`.
```bash
node scripts/utils/spec-index.mjs
```

### `bootstrap-signal-store.ts`
Initialize `agentops/signals/index.json`.
```bash
npx tsx scripts/utils/bootstrap-signal-store.ts
```

### `capture-handoff.mjs`
Capture git + beads into `.claude/session-handoff.json`.
```bash
node scripts/utils/capture-handoff.mjs
```

### `validate-handoff.mjs`
Validate `.claude/session-handoff.json`.
```bash
node scripts/utils/validate-handoff.mjs
```
