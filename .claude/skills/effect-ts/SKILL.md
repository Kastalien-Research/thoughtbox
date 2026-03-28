---
name: effect-ts
description: "Effect-TS expert — write, debug, refactor, and explain code using the Effect ecosystem (effect, @effect/platform, @effect/rpc, @effect/cli, @effect/schema, @effect/cluster). Use this skill whenever the user works with Effect-TS code, mentions Effect services/layers/fibers/streams/schedules, asks about Effect error handling or dependency injection, wants to migrate code to Effect, or asks questions like 'how do I do X in Effect'. Also trigger when you see Effect imports in code being discussed, or when the user mentions Effect patterns like generators, pipe, Context.Tag, Layer.provide, or Schema.Class. This skill has a semantic search index over the full Effect documentation — use it to ground answers in official docs rather than guessing."
---

# Effect-TS Expert

You are an Effect-TS expert. Use the semantic search index to find relevant documentation before answering questions about Effect.

## How to Use the Search Index

When the user asks about Effect-TS, search the documentation index to ground your answer:

```bash
node .claude/skills/effect-ts/scripts/search.mjs "<query>" --top-k 5
```

Run multiple searches if the question spans several topics. For example, if someone asks "how do I use layers with streams", search for "Layer" and "Stream" separately.

The search returns the most relevant sections of the official Effect documentation, ranked by semantic similarity. Use these results as your primary source of truth.

## When to Search vs. When to Answer Directly

**Search first** when:
- The user asks how to use a specific Effect module or API
- You're unsure about the exact API signature or behavior
- The question involves less common features (Batching, Runtime, Platform, RPC, Cluster)
- You need code examples from the official docs

**Answer directly** (without searching) when:
- The question is about basic Effect concepts you're confident about (Effect.gen, pipe, basic error types)
- You're reviewing/debugging code that's already in front of you
- The user asks a conceptual question ("what's the difference between Effect and Promise")

When in doubt, search. The index is fast and the results are high quality.

## Core Effect Concepts Quick Reference

These are the foundational patterns. For anything beyond this, search the index.

### The Effect Type

```typescript
Effect<Success, Error, Requirements>
```

- `Success` — what the effect produces on success
- `Error` — typed error channel (use `never` for infallible effects)
- `Requirements` — services this effect needs (use `never` for no requirements)

### Creating Effects

```typescript
// From sync values
Effect.succeed(42)
Effect.fail(new MyError())

// From async
Effect.tryPromise({ try: () => fetch(url), catch: () => new FetchError() })

// Generators (preferred for sequential composition)
Effect.gen(function* () {
  const a = yield* getA()
  const b = yield* getB(a)
  return a + b
})
```

### Services and Layers

```typescript
// Define a service
class MyService extends Context.Tag("MyService")<
  MyService,
  { readonly doThing: (x: string) => Effect.Effect<number, MyError> }
>() {}

// Implement via Layer
const MyServiceLive = Layer.effect(
  MyService,
  Effect.gen(function* () {
    const dep = yield* SomeDependency
    return { doThing: (x) => Effect.succeed(x.length) }
  })
)

// Use in a program
const program = Effect.gen(function* () {
  const svc = yield* MyService
  return yield* svc.doThing("hello")
})

// Provide layers and run
program.pipe(Effect.provide(MyServiceLive), Effect.runPromise)
```

### Error Handling

```typescript
// Typed errors with Data.TaggedError
class NotFound extends Data.TaggedError("NotFound")<{ id: string }> {}

// Catch specific errors
effect.pipe(
  Effect.catchTag("NotFound", (e) => Effect.succeed(fallback))
)

// Catch all errors
effect.pipe(
  Effect.catchAll((e) => Effect.succeed(fallback))
)
```

### Schema

```typescript
import { Schema } from "effect"

class User extends Schema.Class<User>("User")({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String,
}) {}

const decode = Schema.decodeUnknown(User)
const encode = Schema.encode(User)
```

## Important Guidelines

1. **Prefer `Effect.gen` over pipe chains** for sequential logic — it's more readable and the Effect team recommends it.

2. **Services over global state** — Effect's dependency injection via `Context.Tag` and `Layer` is the idiomatic way to manage dependencies. Don't use module-level singletons.

3. **Typed errors are a feature** — Effect's error channel isn't just for catching errors, it's for making error handling part of the type system. Use `Data.TaggedError` for domain errors.

4. **Layer composition happens at the edge** — individual services declare their dependencies in their Layer type signature. The composition (which service gets which dependency) happens at the program entry point.

5. **Effect vs Promise** — don't mix them carelessly. Use `Effect.tryPromise` to wrap promise-based APIs at system boundaries, then stay in Effect-land.

6. **The ecosystem is modular** — `effect` is the core. `@effect/platform` adds HTTP, filesystem, etc. `@effect/schema` handles data validation. `@effect/rpc` does RPC. Search the index for specific package docs.
