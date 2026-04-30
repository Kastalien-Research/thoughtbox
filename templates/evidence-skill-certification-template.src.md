<!-- srcbook:{"language":"typescript"} -->

# [TOPIC] Skill Certification

Certification harness for reusable skills, including positive, adversarial, and negative-control cases.

###### package.json

```json
{
  "type": "module",
  "dependencies": {}
}
```

## Case Matrix

- Positive:
- Adversarial:
- Negative control:

###### cases.ts

```typescript
const cases = [{ name: "positive", pass: true }];
console.log(JSON.stringify({ certified: cases.every((c) => c.pass), cases }));
```

###### validator.ts

```typescript
import { observed, pass, fail } from "./tb-validate.js";

const data = observed<{ certified?: boolean }>();
data.certified === true ? pass("skill certified", data) : fail("skill not certified", data);
```
