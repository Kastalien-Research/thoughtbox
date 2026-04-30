<!-- srcbook:{"language":"typescript"} -->

# [TOPIC] Runbook

Executable runbook for a reusable agent workflow. Keep prose steps close to deterministic validators.

###### package.json

```json
{
  "type": "module",
  "dependencies": {}
}
```

## Inputs

- Task:
- Success criteria:
- Evidence required:

###### step.ts

```typescript
console.log(JSON.stringify({ step: "replace with runbook step", status: "ready" }));
```

###### validator.ts

```typescript
import { observed, pass, fail } from "./tb-validate.js";

const data = observed<{ status?: string }>();
data.status === "ready"
  ? pass("runbook step is ready", data)
  : fail("runbook step is not ready", data);
```
