<!-- srcbook:{"language":"typescript"} -->

# [TOPIC] ADR Evidence Pack

Executable evidence bundle for an architectural hypothesis.

###### package.json

```json
{
  "type": "module",
  "dependencies": {}
}
```

## Hypothesis

We believe ...

## Prediction

If correct, we should observe ...

###### validation.ts

```typescript
console.log(JSON.stringify({ outcome: "inconclusive", evidence: {} }));
```

###### validator.ts

```typescript
import { observed, pass, fail } from "./tb-validate.js";

const data = observed<{ outcome?: string }>();
["validated", "rejected", "inconclusive"].includes(String(data.outcome))
  ? pass("ADR evidence has a valid outcome", data)
  : fail("ADR evidence outcome is invalid", data);
```
