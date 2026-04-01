## Signal Store Helpers

Location: `agentops/signals/`

### Files
- `signal-store.ts`
  - `emitSignal()`
  - `consumeSignals()`
  - `markConsumed()`
- `emit-session-signals.mjs`
  - emits a minimal `implementation` signal from git changed files

### Bootstrap
```bash
npx tsx scripts/utils/bootstrap-signal-store.ts
```

### Emit example
```bash
node agentops/signals/emit-session-signals.mjs \
  --session-id "example-session" \
  --project-root "$(pwd)"
```

### Notes
- Daily JSONL files: `agentops/signals/YYYY-MM-DD.jsonl`
- `index.json` tracks consumer cursors by timestamp
- TTL is checked during consumption
