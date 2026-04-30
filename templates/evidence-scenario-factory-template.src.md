<!-- srcbook:{"language":"typescript"} -->

# [TOPIC] Scenario Factory

Parameterized generator for eval datasets, synthetic bug reports, adversarial prompts, or regression examples.

###### package.json

```json
{
  "type": "module",
  "dependencies": {}
}
```

## Schema

Describe the generated scenario schema.

###### generate.ts

```typescript
const scenarios = [{ id: "scenario-1", prompt: "replace with generated case" }];
console.log(JSON.stringify({ generated: scenarios.length, scenarios }));
```

###### validate-schema.ts

```typescript
import { observed, pass, fail } from "./tb-validate.js";

const data = observed<{ generated?: number }>();
typeof data.generated === "number" && data.generated > 0
  ? pass("scenarios generated", data)
  : fail("no scenarios generated", data);
```
