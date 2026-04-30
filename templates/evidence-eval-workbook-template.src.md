<!-- srcbook:{"language":"typescript"} -->

# [TOPIC] Evaluation Workbook

Executable eval workbook for scoring a model, tool, claim, or workflow.

###### package.json

```json
{
  "type": "module",
  "dependencies": {}
}
```

## Dataset

Define examples and expected outcomes.

###### grader.ts

```typescript
const examples = [{ expected: "pass", actual: "pass" }];
const passed = examples.filter((e) => e.expected === e.actual).length;
console.log(JSON.stringify({ score: passed / examples.length, passed, total: examples.length }));
```

###### validator.ts

```typescript
import { observed, pass, fail } from "./tb-validate.js";

const data = observed<{ score?: number }>();
typeof data.score === "number" && data.score >= 0.8
  ? pass("score meets threshold", data)
  : fail("score below threshold", data);
```
