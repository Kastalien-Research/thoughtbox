<!-- srcbook:{"language":"typescript"} -->

# [TOPIC] System Audit

Living audit notebook for recurring repo, protocol, or infrastructure invariants.

###### package.json

```json
{
  "type": "module",
  "dependencies": {}
}
```

## Invariants

- Invariant:
- Evidence source:
- Failure report format:

###### audit.ts

```typescript
const findings: Array<{ severity: string; message: string }> = [];
console.log(JSON.stringify({ findings }));
```

###### validator.ts

```typescript
import { observed, pass, fail } from "./tb-validate.js";

const data = observed<{ findings?: Array<{ severity?: string }> }>();
Array.isArray(data.findings)
  ? pass("audit findings are structured", data)
  : fail("audit findings are not structured", data);
```
