<!-- srcbook:{"language":"typescript"} -->

# [TOPIC] Failure Capsule

Replayable debugging lab for a bug, production incident, or agent failure.

###### package.json

```json
{
  "type": "module",
  "dependencies": {}
}
```

## Symptom

Describe the observed failure and reproduction conditions.

###### reproduce.ts

```typescript
console.log(JSON.stringify({ reproduced: false, notes: "replace with failing reproduction" }));
```

###### fix-validator.ts

```typescript
import { observed, pass, fail } from "./tb-validate.js";

const data = observed<{ fixed?: boolean }>();
data.fixed === true ? pass("fix validated", data) : fail("fix not validated", data);
```
