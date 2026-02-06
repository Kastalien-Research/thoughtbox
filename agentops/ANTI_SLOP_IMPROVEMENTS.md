# AgentOps: Anti-Slop Improvements

**Applied**: 2026-01-29
**Based on**: OpenAI Reasoning Model feedback

---

## Critical Improvements Applied ✅

### 1. Ban Fabricated Impact Numbers

**Problem**: LLMs fabricate precise numbers ("40%", "2x faster") that sound credible but are invented.

**Fix Applied**:

**A) Updated synthesizer prompt** (`agentops/prompts/dev_brief_synthesizer.md`):
```markdown
- NEVER include precise impact numbers (%, ms, "by X%", "N times faster") unless sourced from provided metrics.
  - BAD: "Reduce debugging time by 40%"
  - GOOD: "Reduce debugging time through deterministic replay"
  - If you want to estimate impact, use qualitative terms: "significantly", "measurably", "substantially"
```

**B) Added validation** (`agentops/runner/lib/template.ts`):
```typescript
const fabricatedNumberPattern = /\d+%|\d+x\s|by\s+\d+|reduce.*\d+|improve.*\d+/i;
if (fabricatedNumberPattern.test(outcome)) {
  errors.push(`Proposal ${idx}: outcome contains unsourced numeric claim`);
}
```

**C) Added tests** (`agentops/tests/synthesis.test.ts`):
- Rejects "Reduce debugging time by 40%"
- Rejects "Improve performance by 2x"
- Rejects "Reduce latency by 100ms"

**Verified**: ✅ All tests pass (16/16)

---

### 2. Enforce Full URLs in Evidence

**Problem**: Shorthand URLs like "commit/abc123" can slip through and aren't clickable.

**Fix Applied**:

**Validation** (`agentops/runner/lib/template.ts`):
```typescript
p.evidence.forEach((url, urlIdx) => {
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    errors.push(`Proposal ${idx}, evidence[${urlIdx}]: must be full URL (got: ${url})`);
  }
});
```

**Test** (`agentops/tests/synthesis.test.ts`):
- Rejects `evidence: ['commit/abc123']`
- Requires `evidence: ['https://github.com/...']`

**Verified**: ✅ Test passes

---

### 3. Label Cost Tracking as Estimated

**Problem**: Cost calculations drift with pricing changes. Treating as authoritative is misleading.

**Fix Applied**:

**A) Type comment** (`agentops/runner/types.ts`):
```typescript
metrics: {
  llm_cost_usd: number;  // Estimated based on token counts and known pricing; may drift
  // ...
}
```

**B) Console output** (`agentops/runner/daily-dev-brief.ts`):
```typescript
console.log(`✅ Generated ${proposalsData.proposals.length} proposals (est. cost: $${llmCost.toFixed(4)})`);
//                                                                       ^^^^ Added "est."
```

**Verified**: ✅ Console shows "est. cost: $0.0693"

---

### 4. Track Source Failures in run_summary

**Problem**: If a source fails (arXiv timeout, RSS 404), it's invisible in artifacts.

**Fix Applied**:

**A) Added field to RunSummary** (`agentops/runner/types.ts`):
```typescript
signal_collection?: {
  sources_attempted: string[];
  sources_succeeded: string[];
  sources_failed: Array<{ source: string; error: string }>;
};
```

**B) Populate in daily-dev-brief.ts**:
```typescript
signal_collection: signalMetadata ? {
  sources_attempted: signalMetadata.sources_attempted,
  sources_succeeded: signalMetadata.sources_succeeded,
  sources_failed: signalMetadata.sources_failed,
} : undefined,
```

**Verified**: ✅ run_summary.json now includes failure tracking

---

## Test Coverage for Anti-Slop Measures

**New Tests Added**:
1. ✅ Reject "40%" in outcome
2. ✅ Reject "2x" in outcome
3. ✅ Reject "by 100ms" in outcome
4. ✅ Reject non-URL evidence ("commit/abc123")
5. ✅ Require https:// prefix in evidence

**Total Tests**: 16/16 passing

---

## External Reality Checks (Spot-Checked)

Verified these from the REAL run are factual:
- ✅ Claude Sonnet 4.5 exists (announced by Anthropic)
- ✅ Gemini 3 launch post exists on Google blog
- ✅ arXiv papers exist (2601.20727, 2601.20730)
- ✅ OpenAI "AI agent link safety" article exists

**Conclusion**: System is not "making up the world" ✅

---

## Remaining Known Brittleness (Documented, Not Fixed)

### 1. arXiv XML Parsing (Low Priority)
**Status**: Uses regex, not proper XML parser
**Risk**: Medium (will break if arXiv changes format)
**Impact**: arXiv signals stop appearing
**Mitigation**: Log failures in sources_failed
**Future**: Switch to fast-xml-parser or xml2js

### 2. HTML Scraping (Low Priority)
**Status**: Generic selectors (article, h2, a)
**Risk**: Medium (brittle across sites)
**Impact**: Some newsrooms won't scrape correctly
**Mitigation**: RSS feeds preferred; HTML is fallback
**Future**: Add per-site selectors in config

### 3. LangSmith Tracing (Low Priority)
**Status**: Mock (console only)
**Risk**: Low (doesn't affect core functionality)
**Impact**: No centralized trace storage
**Mitigation**: Local logs + run_summary work fine
**Future**: Real LangSmith SDK integration (Phase 2+)

---

## Decision: Ship Phase 1 With These Protections

**Anti-slop measures in place**:
- ✅ Ban fabricated numbers in outcomes
- ✅ Enforce full URLs in evidence
- ✅ Label costs as estimated
- ✅ Track source failures
- ✅ Evidence must be from collected signals (enforced by LLM prompt)

**Known brittleness (acceptable for Phase 1)**:
- ⚠️ arXiv regex parsing (will log failure if breaks)
- ⚠️ HTML scraping (graceful degradation)
- ⚠️ Mock tracing (doesn't affect proposals)

**Phase 1 Status**: ✅ PRODUCTION READY with anti-slop protections

---

## How to Verify Anti-Slop Works

```bash
# Run with API key
npm run agentops:daily -- --dry-run

# Check run_summary for source failures
cat agentops/runs/run_*/run_summary.json | jq '.signal_collection.sources_failed'

# Check proposals for numeric claims
cat agentops/runs/run_*/proposals.json | jq '.proposals[].expected_impact.outcome' | grep -E '\d+%'
# Should return empty (no fabricated numbers)

# Check evidence for full URLs
cat agentops/runs/run_*/proposals.json | jq '.proposals[].evidence[]' | grep -v '^"https://'
# Should return empty (all URLs valid)
```

---

## Summary: Phase 1 Anti-Slop Scorecard

| Measure | Status | Test Coverage |
|---------|--------|---------------|
| Evidence URLs required | ✅ Enforced | ✅ Tested |
| Full URL format | ✅ Enforced | ✅ Tested |
| Ban fabricated numbers | ✅ Enforced | ✅ Tested |
| Cost labeled "estimated" | ✅ Applied | N/A |
| Source failures tracked | ✅ Applied | ✅ Verified |
| External reality check | ✅ Spot-checked | N/A |

**Overall**: Phase 1 has strong anti-slop protections. Safe to ship.

---

## Phase 1.2 Improvements (2026-01-29) ✅

### P0-1: Evidence Provenance Enforcement
**Problem**: Evidence URLs only validated by prompt, not code. LLM could cite plausible-looking but unrelated links.

**Fix Applied**: Code-level enforcement that evidence URLs must be subset of collected signals.
- Added `normalizeURL()` to handle arXiv variations (http/https, /abs vs /pdf)
- Added `validateEvidenceProvenance()` to check URLs against collected signals
- Updated `validateProposalsPayload()` to accept signals parameter

**Tests**: 2/2 passing
- ✅ Rejects URLs not in collected signals
- ✅ Normalizes arXiv URLs correctly

### P0-2: Improved Numeric Impact Regex
**Problem**: False positives on "MCP v2", "stage 2". False negatives on "2x" at end-of-string.

**Fix Applied**: Unit-based pattern that only rejects numbers with impact units.
```typescript
// OLD: /\d+%|\d+x\s|by\s+\d+|reduce.*\d+|improve.*\d+/i
// NEW: /\b\d+(\.\d+)?\s*(%|ms|milliseconds?|seconds?|...|x|×|times)(\b|$)|by\s+\d+(\.\d+)?\s*(%|ms|x|×|times)/i
```

**Tests**: 4/4 passing
- ✅ Allows "MCP v2", "stage 2", "404 errors"
- ✅ Rejects "40%", "2x faster", "100ms improvement"

### P0-3: Zero-Cost Testing Mode
**Problem**: `--dry-run` still costs money (makes LLM calls).

**Fix Applied**: New `--fixtures` flag uses hardcoded data, zero cost.
```bash
npm run agentops:daily -- --fixtures  # $0.00, <5 seconds
npm run agentops:daily -- --dry-run   # ~$0.07, creates no issue
npm run agentops:daily                # ~$0.07, creates GitHub issue
```

### P0-4: Cost Calculation Transparency
**Problem**: Hardcoded pricing, not model-aware, no metadata.

**Fix Applied**: Created `pricing.ts` with model-specific pricing config.
- Renamed `cost_usd` → `cost_usd_calculated` (honesty in labeling)
- Added `cost_metadata` with pricing source, date, per-token rates
- Handles Sonnet 4.5 large context tier (>200K tokens)

**Tests**: 4/4 passing
- ✅ Sonnet 4.5 standard/large pricing
- ✅ Opus 4.5 pricing
- ✅ Unknown model fallback

### P1: Per-Source Observability
**Added**: `signals_by_source` and `elapsed_ms_by_source` to metadata.

Example output:
```json
{
  "signals_by_source": {"repo": 3, "arxiv": 12, "rss": 5, "html": 11},
  "elapsed_ms_by_source": {"repo": 450, "arxiv": 890, "rss": 320, "html": 1200}
}
```

### P1: signals.json Artifact
**Added**: Persist all collected signals before subsetting for reproducibility.

**Phase 1.2 Tests**: 12/12 passing

---

## Known Limitation: Regex Brittleness ⚠️

### The Problem
The numeric impact regex is inherently incomplete:

**Will always miss**:
- Written numbers: "forty percent", "double the speed"
- Semantic equivalents: "half the time", "twice as fast"
- Creative phrasing: "orders of magnitude faster"

**Maintenance burden**:
- Requires constant tweaking as new patterns emerge
- False positives/negatives are inevitable
- Doesn't understand MEANING, just surface patterns

### Better Alternatives (Future Work)

#### Option 1: LLM Self-Validation
Add second LLM pass to validate its own output:
```typescript
const validationPrompt = `Review these proposals. Flag any numeric claims lacking evidence...`;
const validation = await callLLM(config, validationPrompt, JSON.stringify(proposals));
```
**Pros**: Semantic understanding, catches more cases
**Cons**: Doubles cost (~$0.14 instead of $0.07)

#### Option 2: Structured Citation Linking (RECOMMENDED)
Force explicit evidence linking in schema:
```json
{
  "expected_impact": {
    "outcome": "Faster debugging for developers",
    "quantitative_claims": [
      {
        "claim": "40% time reduction",
        "evidence_index": 2,
        "evidence_quote": "Study found 40% reduction..."
      }
    ]
  }
}
```
**Pros**: Deterministic validation, explicit provenance
**Cons**: More complex schema, requires prompt updates

#### Option 3: Ban Quantitative Language
Simpler: disallow vague quantitative terms entirely.
```typescript
const banned = ['faster', 'slower', 'reduces', 'improves'];
// Force purely qualitative descriptions
```
**Pros**: Simple, forces clearer language
**Cons**: May be too restrictive

### Recommended Path Forward

1. **Keep regex as backstop** (catches obvious cases)
2. **Implement structured citation linking** (schema change)
3. **Validate citations in code** (check evidence_index exists)

This gives deterministic validation without relying solely on regex.

**Status**: Documented for future implementation
**Priority**: P1 (nice to have, current regex is acceptable backstop)

---
