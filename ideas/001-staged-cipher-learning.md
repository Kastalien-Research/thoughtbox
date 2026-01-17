# Staged Cipher Learning (COCONUT-Inspired)

> Improving cipher comprehension for smaller models through staged compression

## Source

Inspired by Meta's COCONUT paper: [Training Large Language Models to Reason in a Continuous Latent Space](https://arxiv.org/abs/2412.06769)

## The Insight

COCONUT trains models in stages:
1. First, learn full chain-of-thought reasoning (explicit text)
2. Then, learn to compress reasoning into continuous latent space

The model learns the *full form* before learning the *shorthand*. This staged approach achieves better compression without losing reasoning capability.

## Application to Thoughtbox Cipher

The cipher currently presents compressed notation immediately. Smaller models (e.g., Haiku 4.5) may struggle to decode dense notation without context.

### Proposed: Warm-Up Protocol

The first 1-2 thoughts in a session use expanded form, establishing patterns before compression:

```
# Thought 1: Full form (teaching the pattern)
S1|H|—|Hypothesis: Database performance degraded because query regression
       introduced in recent deployment caused p99 latency increase

# Thought 2: Transitional (partial compression)
S2|E|S1|Evidence supporting S1: query metrics show p99 latency up 3x
       on user lookup endpoint ⊕ [H1]

# Thought 3+: Full compression (pattern established)
S3|E|S1|log vol ↑10%, w/in normal ⊖ [H1] (insig)
S4|C|S1-S3|[H1] conf (!), investigate query Δ in deploy
```

### Implementation Options

**Option A: Cipher Tool Parameter**
Add `warmup: true|false` parameter to `thoughtbox_cipher` tool. When true, first call returns expanded examples before the quick reference.

**Option B: Session-Aware Auto-Warmup**
Thoughtbox detects first session use and automatically includes expanded examples in early thought responses.

**Option C: Model-Adaptive**
Detect model tier (Opus/Sonnet/Haiku) and adjust compression level:
- Opus: Full compression immediately
- Sonnet: 1 warmup thought
- Haiku: 2-3 warmup thoughts with inline expansions

## Other COCONUT Principles

### "Thought Tokens" as Density Markers

COCONUT uses special tokens to signal "reasoning happens here." Consider adding optional density markers:

```
⟪S1|H|db perf⟫  ← signals "unpack this carefully"
```

This tells the model to allocate more "attention" to dense notation.

### Information Density Bounds

COCONUT shows diminishing returns past a compression threshold. The current cipher is probably near optimal for smaller model comprehension - don't over-compress.

### Reference Syntax Already Good

The `[S1]` reference syntax is the token-level equivalent of COCONUT's latent state feedback. This pattern is solid.

## Testing Approach

1. Create test prompts with reasoning chains
2. Compare Haiku comprehension:
   - Current cipher (immediate compression)
   - Warm-up protocol (staged compression)
3. Measure: accuracy of decoded reasoning, appropriate use of references

## Complexity Assessment

- **Option A**: Low complexity, ~20 lines of code
- **Option B**: Medium complexity, requires session state tracking
- **Option C**: Higher complexity, requires model detection

## Recommendation

Start with **Option A** - a simple `warmup` parameter. Test with Haiku to validate the hypothesis before building more sophisticated approaches.

---

**Created**: 2025-01-16
**Status**: Idea - needs validation
**Related**: `src/resources/thoughtbox-cipher-content.ts`
