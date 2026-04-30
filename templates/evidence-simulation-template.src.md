<!-- srcbook:{"language":"typescript"} -->

# [TOPIC] Simulation

Seeded Monte Carlo or parameterized simulation notebook. Record assumptions before interpreting results.

###### package.json

```json
{
  "type": "module",
  "dependencies": {}
}
```

## Parameters

- seed:
- runs:
- parameter grid:

###### simulation.ts

```typescript
const runs = 100;
const wins = Array.from({ length: runs }, (_, i) => i % 2 === 0).filter(Boolean).length;
console.log(JSON.stringify({ runs, wins, rate: wins / runs }));
```

###### analysis.ts

```typescript
console.log("Interpret simulation output here.");
```
