# /fact-check-standalone

Systematically verify claims in documentation against sources of truth (codebase, web data, or research), track verification progress across sessions, and automatically correct mismatches. Self-contained workflow that performs all verification operations directly.

## Usage

```bash
/fact-check-standalone <docs_folder> [--confidence=N] [--max-corrections=N] [--sources=type] [--plan-only] [--resume]
```

## Variables

```
DOCS_FOLDER: $ARGUMENTS (required)
CONFIDENCE_THRESHOLD: $ARGUMENTS (default: 0.85 - minimum confidence to auto-correct)
MAX_CORRECTIONS: $ARGUMENTS (default: 50 - max auto-corrections per session)
SOURCE_TYPES: $ARGUMENTS (default: "all" | "codebase" | "web" | "research")
PLAN_ONLY: $ARGUMENTS (default: false)
RESUME: $ARGUMENTS (default: false)
AUTO_COMMIT: $ARGUMENTS (default: false)
```

## What This Solves

When you have documentation that references code, external sources, or specifications:

- **Drift Detection**: Documentation becomes outdated as code evolves
- **Claim Verification**: Need to validate factual statements against sources
- **Source Attribution**: Claims lack clear references to verification sources
- **Multi-Source Truth**: Different claim types require different verification approaches
- **Session Continuity**: Progress lost when fact-checking is interrupted

## Protocol Phases

### Phase 0: Session Detection

```
OBJECTIVE: Check for existing fact-checking session state

1. Check if .fact-checker/ exists for the target folder
2. If exists:
   - Display verification status summary
   - Show: verified claims, failed claims, pending claims
   - Offer: [R]esume | [S]tart fresh | [V]iew report | [C]ancel
3. If resuming, load state and skip to last active phase
4. If starting fresh or no existing session, proceed to Phase 1

STATE_FILE: .fact-checker/state.json
REPORT_FILE: .fact-checker/report.md
CLAIMS_DB: .fact-checker/claims.json
```

### Phase 1: Document Inventory & Claim Extraction (Time-boxed: 15% of budget)

```
OBJECTIVE: Scan documents and extract all verifiable claims

1. Scan DOCS_FOLDER for documentation files:
   -> Use Glob to find all *.md files recursively
   -> Create document inventory list

2. For each document found:
   -> Use Read to load document content
   -> Parse content line by line
   
   Extract atomic claims:
   - Single, verifiable statements
   - Factual assertions (not opinions)
   - Split compound statements into separate claims
   
   Examples of claims to extract:
   ✓ "The API uses OAuth2 for authentication"
   ✓ "The function accepts 3 parameters"
   ✓ "The service handles 10,000 requests per second"
   ✗ "The code is well-designed" (opinion, not verifiable)
   ✗ "Users should be careful" (advice, not fact)

3. Categorize each claim by verification type:
   
   CODEBASE claims (verifiable against source code):
   - Implementation details
   - API signatures
   - Function behaviors
   - Configuration values
   
   WEB claims (verifiable against external sources):
   - Standards references (OAuth, HTTP, etc.)
   - Third-party service capabilities
   - Public specifications
   
   RESEARCH claims (require multi-source verification):
   - Performance characteristics
   - Comparative statements
   - Best practices assertions

4. Create claims database structure:

   {
     "claims": [
       {
         "id": "claim-001",
         "text": "The API uses OAuth2 for authentication",
         "document": "api-docs.md",
         "line": 42,
         "category": "codebase",
         "status": "pending",
         "confidence": null,
         "sources": [],
         "evidence": null,
         "extracted_at": "ISO8601"
       },
       {
         "id": "claim-002", 
         "text": "The service supports 10,000 requests per second",
         "document": "performance.md",
         "line": 15,
         "category": "research",
         "status": "pending",
         "confidence": null,
         "sources": [],
         "evidence": null,
         "extracted_at": "ISO8601"
       }
     ],
     "stats": {
       "total": 0,
       "by_category": {
         "codebase": 0,
         "web": 0,
         "research": 0
       },
       "by_document": {}
     }
   }

5. Initialize tracking directories:
   .fact-checker/
   ├── state.json
   ├── claims.json
   ├── report.md
   └── archive/

6. Save claims to .fact-checker/claims.json using Write tool

GATE: Claim extraction complete?
- [ ] All documents scanned
- [ ] Claims extracted and categorized
- [ ] No parse errors (or documented)
- [ ] Claims database created

If GATE fails: Report issues, ask user for guidance
```

### Phase 2: Source Discovery & Mapping (Time-boxed: 20% of budget)

```
OBJECTIVE: Identify verification sources for each claim

Process claims by category for efficient tool usage:

FOR CODEBASE CLAIMS:
  For each claim requiring code verification:
  
  1. Extract key terms from claim text:
     "The API uses OAuth2 for authentication"
     -> Key terms: ["OAuth2", "authentication", "API"]
  
  2. Use SemanticSearch to find relevant code:
     -> Query: "How is authentication implemented? OAuth2"
     -> Target: [] (search entire codebase)
     -> Review results for relevant files
  
  3. Use Grep for specific symbol searches:
     -> Pattern: "OAuth2|oauth2|OAuth"
     -> Review matching files and line numbers
  
  4. Use Glob for pattern-based file discovery:
     -> Pattern: "*auth*.ts" or "*oauth*.ts"
     -> Identify authentication-related files
  
  5. Use Read to examine promising files:
     -> Read files identified in steps 2-4
     -> Extract relevant code sections
     -> Note line numbers for evidence
  
  6. Record discovered sources:
     {
       "id": "claim-001",
       "sources": [
         {
           "type": "codebase",
           "location": "src/auth/oauth.ts:23-45",
           "tool": "SemanticSearch",
           "relevance": 0.95,
           "snippet": "// OAuth2 implementation...",
           "discovered_at": "ISO8601"
         },
         {
           "type": "codebase",
           "location": "src/auth/config.ts:10",
           "tool": "Grep",
           "relevance": 0.88,
           "snippet": "const authType = 'OAuth2';",
           "discovered_at": "ISO8601"
         }
       ]
     }

FOR WEB CLAIMS:
  For each claim requiring web verification:
  
  1. Extract key terms and construct search query
  
  2. Use firecrawl_search to discover authoritative sources:
     -> Query: Constructed from claim key terms
     -> Limit: 5-10 results
     -> Sources: ["web"]
  
  3. Evaluate search results:
     -> Prioritize: official docs, standards bodies, primary sources
     -> Skip: blog posts, forums, opinion pieces
     -> Select: top 2-3 most authoritative
  
  4. Use firecrawl_scrape to extract content:
     -> URL: Selected authoritative source
     -> Formats: ["markdown"]
     -> Extract relevant sections
  
  5. Alternative: Use WebSearch for real-time info:
     -> When firecrawl unavailable
     -> For very recent information
  
  6. Record web sources:
     {
       "id": "claim-007",
       "sources": [
         {
           "type": "web",
           "location": "https://oauth.net/2/",
           "tool": "firecrawl_search",
           "relevance": 0.98,
           "snippet": "OAuth 2.0 is the industry-standard...",
           "discovered_at": "ISO8601"
         }
       ]
     }

FOR RESEARCH CLAIMS:
  For each claim requiring multi-source verification:
  
  1. Use combination of tools:
     -> Codebase: SemanticSearch, Grep for implementation evidence
     -> Web: firecrawl_search for benchmarks, standards
     -> Documentation: Read internal docs, specs
  
  2. Cross-reference multiple sources:
     -> Compare findings across sources
     -> Look for consensus
     -> Flag contradictions
  
  3. Record research sources:
     {
       "id": "claim-002",
       "sources": [
         {
           "type": "research",
           "location": "multiple",
           "tool": "multi-source",
           "sources_consulted": [
             "src/perf/benchmarks.ts",
             "https://benchmarks.example.com",
             "docs/performance.md"
           ],
           "relevance": 0.85,
           "discovered_at": "ISO8601"
         }
       ]
     }

FOR CLAIMS WITH NO SOURCES:
  If no authoritative sources found:
  -> Mark claim as "unverifiable"
  -> Flag for manual review
  -> Note: "No authoritative source found for verification"
  -> Recommendation: "Add source citation or remove claim"

Update state.json after source discovery:
{
  "session_id": "uuid",
  "started_at": "ISO8601",
  "current_phase": 2,
  "docs_folder": "path",
  "total_claims": 45,
  "claims_with_sources": 42,
  "claims_without_sources": 3,
  "corrections_made": 0,
  "corrections_remaining": 50,
  "source_discovery": {
    "codebase_searches": 25,
    "web_searches": 15,
    "research_syntheses": 5
  }
}

GATE: Source discovery complete?
- [ ] All claims have attempted source discovery
- [ ] Source relevance scored
- [ ] Unverifiable claims flagged
- [ ] State updated

If GATE fails: Document unverifiable claims, proceed with available sources
```

### Phase 3: Verification Execution (Time-boxed: 35% of budget)

```
OBJECTIVE: Systematically verify each claim against sources

Process claims in priority order:
1. High-confidence sources first (relevance >= 0.9)
2. Critical claims prioritized (security, API contracts)
3. Batch similar verification types together

FOR EACH CLAIM:

  1. Retrieve source content:
     IF codebase source:
       -> Use Read to get current file content
       -> Extract relevant sections around line numbers
     
     IF web source:
       -> Use previously scraped content
       -> OR re-scrape if cache expired
     
     IF research source:
       -> Compile evidence from multiple sources
  
  2. Compare claim text to source evidence:
  
     VERIFICATION LOGIC:
     
     Extract key facts from claim:
       Claim: "The API uses OAuth2 for authentication"
       Facts: [protocol="OAuth2", purpose="authentication", component="API"]
     
     Extract key facts from source:
       Source: "implements OAuth2.1 authentication"
       Facts: [protocol="OAuth2.1", purpose="authentication"]
     
     Compare facts:
       ✓ Purpose matches: authentication == authentication
       ✗ Protocol differs: OAuth2 != OAuth2.1
       
       Result: PARTIALLY_FALSE (version incorrect)
  
  3. Assign verification status:
  
     VERIFIED (✓):
       - All facts match source
       - No contradictions found
       - High confidence (>= 0.9)
       Example: Claim states "uses POST method", source shows POST
     
     FALSE (✗):
       - Facts contradict source
       - Clear mismatch found
       - High confidence (>= 0.85)
       Example: Claim states "OAuth2", source shows "OAuth2.1"
     
     OUTDATED (⚠):
       - Facts were accurate but source changed
       - Temporal mismatch detected
       - Medium confidence (>= 0.75)
       Example: Claim references old API version
     
     PARTIAL (⚡):
       - Some facts match, others don't
       - Incomplete or ambiguous
       - Medium confidence (>= 0.70)
       Example: Claim partially describes behavior
     
     UNVERIFIABLE (❓):
       - No authoritative source found
       - Source ambiguous or unclear
       - Low confidence (< 0.70)
       Example: Opinion-based claim, no facts to verify
  
  4. Calculate confidence score (0.0-1.0):
  
     Factors:
     - Source authority (official docs = 1.0, blog = 0.4)
     - Source recency (fresh = 1.0, old = 0.6)
     - Fact match clarity (exact = 1.0, fuzzy = 0.5)
     - Number of sources (multiple = +0.1 bonus)
     
     Formula:
     confidence = (source_authority * 0.4) + 
                  (source_recency * 0.2) + 
                  (match_clarity * 0.3) +
                  (multi_source_bonus * 0.1)
  
  5. Extract evidence excerpt:
     
     -> Identify most relevant 2-3 lines from source
     -> Include context if needed
     -> Preserve exact wording
     -> Note line numbers/URLs
  
  6. Generate correction (if needed):
  
     IF status is FALSE, OUTDATED, or PARTIAL:
       
       Analyze difference:
         Original: "The API uses OAuth2 for authentication"
         Source: "implements OAuth2.1 authentication"
         Difference: Version number (2 vs 2.1)
       
       Generate correction:
         Corrected: "The API uses OAuth2.1 for authentication"
         Reason: "Source code in src/auth/oauth.ts:23 implements OAuth2.1"
         Change: "OAuth2" -> "OAuth2.1"
       
       Store correction:
       {
         "original": "The API uses OAuth2 for authentication",
         "corrected": "The API uses OAuth2.1 for authentication",
         "reason": "Source code in src/auth/oauth.ts:23 implements OAuth2.1",
         "change_type": "version_update",
         "minimal_change": "OAuth2 -> OAuth2.1"
       }
  
  7. Update claims.json:
  
     {
       "id": "claim-001",
       "status": "FALSE",
       "confidence": 0.92,
       "sources": [...],
       "evidence": {
         "location": "src/auth/oauth.ts:23-25",
         "text": "// OAuth2.1 implementation\nconst oauth = new OAuth21Provider()",
         "context": "Authentication module initialization"
       },
       "correction": {
         "original": "The API uses OAuth2 for authentication",
         "corrected": "The API uses OAuth2.1 for authentication",
         "reason": "Source code implements OAuth2.1, not OAuth2",
         "confidence": 0.92
       },
       "verified_at": "ISO8601"
     }

PROGRESS TRACKING:
  Update state.json after each verification batch:
  {
    "verification_progress": {
      "verified": 28,
      "false": 3,
      "outdated": 2,
      "partial": 1,
      "unverifiable": 1,
      "pending": 10
    },
    "current_claim": "claim-035",
    "claims_per_minute": 2.5,
    "estimated_completion": "ISO8601"
  }

SPIRAL DETECTION:
  Monitor verification patterns:
  
  IF (consecutive_low_confidence_count >= 5):
    -> Flag: "Multiple low-confidence verifications"
    -> Action: Review source discovery strategy
    -> Consider: Different search terms or tools
  
  IF (unverifiable_count > total_claims * 0.3):
    -> Flag: "High unverifiable rate (>30%)"
    -> Action: Review claim extraction quality
    -> Consider: Claims may be too vague or opinion-based
  
  IF (processing_time > expected_time * 2):
    -> Flag: "Verification taking longer than expected"
    -> Action: Consider parallel processing or simpler verification
    -> Consider: Reduce verification depth

GATE: Verification complete?
- [ ] All claims processed
- [ ] Evidence documented
- [ ] Corrections generated where needed
- [ ] Confidence scores assigned

If GATE fails: Continue with partial results, flag for review
```

### Phase 4: Correction & Alignment (Time-boxed: 20% of budget)

```
OBJECTIVE: Apply corrections to bring docs into alignment with sources

1. Filter corrections by confidence threshold:
   
   FROM claims.json:
     -> SELECT claims WHERE status IN ('FALSE', 'OUTDATED', 'PARTIAL')
     -> AND confidence >= CONFIDENCE_THRESHOLD
     -> ORDER BY confidence DESC, document ASC, line DESC

2. Group corrections by document:
   
   corrections_by_doc = {
     "api-docs.md": [
       {claim_id: "claim-001", line: 42, ...},
       {claim_id: "claim-007", line: 15, ...}
     ],
     "performance.md": [
       {claim_id: "claim-002", line: 88, ...}
     ]
   }

3. Apply corrections to each document:

   FOR EACH document WITH corrections:
   
     Sort corrections by line number (descending):
       -> Process bottom-up to preserve line numbers
       -> Avoid line number shifts during editing
     
     FOR EACH correction IN document (bottom-up):
     
       1. Read current document state:
          -> Use Read to get latest content
          -> Verify line still contains expected text
       
       2. Prepare replacement:
          
          Original text: Extract from claim
          New text: Extract from correction
          
          Context check:
            -> Read 2 lines before and after
            -> Ensure unique match
            -> Avoid partial string matches
       
       3. Apply correction with StrReplace:
          
          -> file_path: document path
          -> old_string: Original claim text (with context if needed)
          -> new_string: Corrected claim text
          
          IF correction spans multiple lines:
            -> Include full context
            -> Preserve indentation
            -> Maintain formatting
       
       4. Handle edge cases:
          
          IF StrReplace fails (text not unique):
            -> Add more context (surrounding sentences)
            -> OR use MultiEdit for complex changes
            -> OR flag for manual correction
          
          IF text not found (document changed):
            -> Log: "Document modified since extraction"
            -> Skip correction
            -> Flag for manual review
       
       5. Verify correction applied:
          -> Read document again
          -> Confirm new text present
          -> Confirm old text removed
       
       6. Log successful correction:
          {
            "claim_id": "claim-001",
            "document": "api-docs.md",
            "line": 42,
            "old_text": "The API uses OAuth2 for authentication",
            "new_text": "The API uses OAuth2.1 for authentication",
            "confidence": 0.92,
            "status": "applied",
            "applied_at": "ISO8601"
          }

4. Handle skipped corrections:

   FOR EACH correction NOT applied:
   
     Record reason:
       {
         "claim_id": "claim-008",
         "document": "perf.md",
         "line": 72,
         "reason": "confidence_too_low",
         "confidence": 0.72,
         "requires_manual_review": true,
         "correction": {
           "original": "...",
           "corrected": "...",
           "source": "..."
         }
       }
     
     Add to manual review list in report

5. Update state.json:

   {
     "corrections_applied": [
       {
         "claim_id": "claim-001",
         "document": "api-docs.md",
         "line": 42,
         "confidence": 0.92,
         "status": "applied",
         "applied_at": "ISO8601"
       }
     ],
     "corrections_skipped": [
       {
         "claim_id": "claim-008",
         "reason": "confidence_too_low",
         "confidence": 0.72,
         "requires_manual_review": true
       }
     ],
     "corrections_failed": [
       {
         "claim_id": "claim-015",
         "reason": "text_not_found",
         "note": "Document may have been modified"
       }
     ],
     "stats": {
       "applied": 7,
       "skipped": 3,
       "failed": 1
     }
   }

CORRECTION LIMITS:
  IF corrections_applied >= MAX_CORRECTIONS:
    -> Stop correction phase
    -> Log remaining corrections for next session
    -> Update state: "correction_limit_reached": true
  
  Preserve high-confidence pending corrections:
    -> Add to state.json for next session
    -> Include in report under "Pending Corrections"

ROLLBACK SUPPORT:
  IF user requests rollback:
    -> Read correction log
    -> Reverse each correction (new -> old)
    -> Update state to reflect rollback
    -> Generate rollback report

GATE: Corrections complete?
- [ ] High-confidence corrections applied
- [ ] Document formatting preserved
- [ ] No syntax errors introduced
- [ ] Correction log updated

If GATE fails: Rollback problematic corrections, document issues
```

### Phase 5: Validation & Reporting (Time-boxed: 10% of budget)

```
OBJECTIVE: Validate corrections and generate comprehensive report

1. Validation checks:

   FOR EACH modified document:
   
     a) Re-read document:
        -> Use Read to get current state
        -> Verify all corrections present
        -> Check for unintended side effects
     
     b) Check formatting:
        -> Markdown syntax still valid
        -> No broken links or references
        -> Indentation preserved
     
     c) Run linters if available:
        -> Use Bash to run markdown linters
        -> Example: markdownlint docs/
        -> Report any new warnings
     
     d) Verify line counts:
        -> Compare pre/post line counts
        -> Large changes may indicate issues
        -> Flag for review if > 20% change

2. Generate comprehensive report.md:

   Use Write to create .fact-checker/report.md:

---START REPORT TEMPLATE---

# Fact-Checking Report

**Session ID**: {session_id}  
**Started**: {started_at}  
**Completed**: {completed_at}  
**Duration**: {duration_minutes} minutes

---

## Executive Summary

Verified **45 claims** across **5 documents**:
- ✓ **35 claims verified** with no corrections needed
- ✗ **7 claims corrected** (high confidence)
- ⚠ **3 claims require manual review** (low confidence)
- ❓ **0 claims unverifiable** (no sources found)

**Documents Modified**: 3
**Corrections Applied**: 7
**Confidence Average**: 0.89

---

## Verification Statistics

| Status | Count | Percentage |
|--------|-------|------------|
| Verified (✓) | 35 | 77.8% |
| Corrected (✗→✓) | 7 | 15.6% |
| Requires Review (⚠) | 3 | 6.7% |
| Unverifiable (❓) | 0 | 0.0% |

### By Category
- **Codebase**: 28 claims (25 verified, 3 corrected)
- **Web**: 12 claims (8 verified, 4 corrected)
- **Research**: 5 claims (2 verified, 3 review)

---

## Verified Claims (35)

Claims that matched sources without correction needed.

<details>
<summary>View verified claims</summary>

| ID | Document | Line | Claim | Confidence |
|----|----------|------|-------|------------|
| claim-003 | api-docs.md | 52 | "Supports JSON responses" | 0.95 |
| claim-005 | api-docs.md | 67 | "Rate limited to 1000 req/hr" | 0.92 |
| ... | ... | ... | ... | ... |

</details>

---

## Corrected Claims (7)

Claims that were incorrect and have been automatically corrected.

### 1. Authentication Protocol Version

**Location**: api-docs.md:42  
**Confidence**: 0.92

**Original**:
```
The API uses OAuth2 for authentication
```

**Corrected**:
```
The API uses OAuth2.1 for authentication
```

**Source**: src/auth/oauth.ts:23-25
```typescript
// OAuth2.1 implementation
const oauth = new OAuth21Provider()
```

**Reason**: Source code implements OAuth2.1, not OAuth2

---

### 2. Function Parameter Count

**Location**: developer-guide.md:156  
**Confidence**: 0.95

**Original**:
```
The authenticate() function accepts 3 parameters
```

**Corrected**:
```
The authenticate() function accepts 2 parameters
```

**Source**: src/auth/authenticate.ts:45
```typescript
export function authenticate(username: string, password: string): Promise<Token>
```

**Reason**: Function signature shows 2 parameters, not 3

---

[... repeat for all corrections ...]

---

## Requires Manual Review (3)

Claims with low confidence or conflicting sources that need human review.

### 1. Performance Claim

**Location**: performance.md:88  
**Confidence**: 0.72 (below threshold)

**Claim**:
```
The service handles 10,000 requests per second under normal load
```

**Issue**: Multiple sources with conflicting data
- Benchmark A: 8,500 req/s
- Benchmark B: 12,000 req/s
- Documentation: 10,000 req/s

**Recommendation**: Verify with load testing team or update with range

---

### 2. Security Claim

**Location**: security.md:34  
**Confidence**: 0.68 (below threshold)

**Claim**:
```
All data is encrypted at rest using AES-256
```

**Issue**: Source shows mixed encryption:
- User data: AES-256
- Logs: AES-128
- Cache: Not encrypted

**Recommendation**: Clarify which data is encrypted with AES-256

---

[... repeat for all flagged claims ...]

---

## Source Coverage

### Codebase Sources (28 claims)

| File | Claims Verified |
|------|-----------------|
| src/auth/oauth.ts | 5 |
| src/api/routes.ts | 4 |
| src/config/settings.ts | 3 |
| ... | ... |

### Web Sources (12 claims)

| URL | Claims Verified |
|-----|-----------------|
| https://oauth.net/2.1/ | 2 |
| https://docs.example.com/api | 3 |
| ... | ... |

### Research Sources (5 claims)

Multi-source synthesis for performance and comparative claims.

---

## Documents Modified

### api-docs.md
- **Corrections**: 3
- **Lines modified**: 42, 67, 103
- **Status**: ✓ Validated

### developer-guide.md
- **Corrections**: 2
- **Lines modified**: 156, 203
- **Status**: ✓ Validated

### performance.md
- **Corrections**: 2
- **Lines modified**: 45, 72
- **Status**: ⚠ Contains claims requiring review

---

## Tools Used

- **SemanticSearch**: 15 queries (codebase exploration)
- **Grep**: 23 searches (symbol lookup)
- **Read**: 47 file reads (evidence extraction)
- **firecrawl_search**: 8 searches (web verification)
- **firecrawl_scrape**: 5 scrapes (content extraction)
- **StrReplace**: 7 corrections (document updates)

---

## Next Actions

- [ ] Review 3 low-confidence claims manually
- [ ] Verify performance claims with load testing team
- [ ] Consider adding source citations to documentation
- [ ] Re-run fact-checker after next code release

---

## Session Details

**Configuration**:
- Confidence threshold: 0.85
- Max corrections: 50
- Source types: all
- Auto-commit: false

**Performance**:
- Claims processed: 45
- Processing rate: 2.1 claims/minute
- Total time: 21 minutes

**State file**: `.fact-checker/state.json`  
**Claims database**: `.fact-checker/claims.json`

---

*Report generated: {generated_at}*

---END REPORT TEMPLATE---

3. Archive session state:

   Create archive directory:
     .fact-checker/archive/session-{session_id}/
   
   Copy session artifacts:
     -> state.json -> archive/session-{id}/state-snapshot.json
     -> claims.json -> archive/session-{id}/claims-snapshot.json
     -> Create corrections.log with all correction details
   
   Preserve for future reference and auditing

4. Display summary to user:

   ```
   📊 FACT-CHECKING COMPLETE
   ========================
   
   Verified: 45 claims across 5 documents
   Corrections: 7 applied automatically
   Review needed: 3 claims flagged
   
   Documents modified:
   - api-docs.md (3 corrections)
   - developer-guide.md (2 corrections)
   - performance.md (2 corrections)
   
   Average confidence: 0.89
   Duration: 21 minutes
   
   Report: .fact-checker/report.md
   
   [V]iew report | [R]eview flagged | [D]one
   ```

5. Optional: Auto-commit changes:

   IF AUTO_COMMIT is true:
     Use Bash to create git commit:
     ```bash
     cd {docs_folder}
     git add -A
     git commit -m "docs: fact-check corrections
     
     - Verified 45 claims across 5 documents
     - Applied 7 high-confidence corrections
     - See .fact-checker/report.md for details
     
     Session: {session_id}"
     ```

GATE: Validation complete?
- [ ] All corrections verified
- [ ] Report generated and complete
- [ ] Session archived
- [ ] User notified

If GATE fails: Document validation issues, generate partial report
```

## State Management

### state.json Structure

```json
{
  "session_id": "abc-123-def",
  "started_at": "2024-01-15T10:00:00Z",
  "completed_at": "2024-01-15T10:21:00Z",
  "current_phase": 5,
  "phase_status": "completed",
  "docs_folder": "docs/api",
  
  "config": {
    "confidence_threshold": 0.85,
    "max_corrections": 50,
    "source_types": ["codebase", "web", "research"],
    "auto_commit": false
  },
  
  "progress": {
    "total_claims": 45,
    "claims_extracted": 45,
    "claims_with_sources": 42,
    "claims_verified": 45,
    "claims_corrected": 7,
    "claims_pending": 0
  },
  
  "verification_stats": {
    "verified": 35,
    "false": 7,
    "outdated": 0,
    "partial": 0,
    "unverifiable": 0,
    "review_needed": 3
  },
  
  "corrections": {
    "applied": 7,
    "skipped": 3,
    "failed": 0,
    "remaining": 0
  },
  
  "documents": {
    "scanned": 5,
    "modified": 3,
    "unchanged": 2
  },
  
  "tool_usage": {
    "SemanticSearch": 15,
    "Grep": 23,
    "Read": 47,
    "firecrawl_search": 8,
    "firecrawl_scrape": 5,
    "StrReplace": 7
  },
  
  "phase_history": [
    {
      "phase": 1,
      "name": "Claim Extraction",
      "started_at": "2024-01-15T10:00:00Z",
      "completed_at": "2024-01-15T10:03:00Z",
      "duration_minutes": 3,
      "status": "completed",
      "claims_extracted": 45
    },
    {
      "phase": 2,
      "name": "Source Discovery",
      "started_at": "2024-01-15T10:03:00Z",
      "completed_at": "2024-01-15T10:07:00Z",
      "duration_minutes": 4,
      "status": "completed",
      "sources_found": 42
    },
    {
      "phase": 3,
      "name": "Verification",
      "started_at": "2024-01-15T10:07:00Z",
      "completed_at": "2024-01-15T10:15:00Z",
      "duration_minutes": 8,
      "status": "completed",
      "claims_verified": 45
    },
    {
      "phase": 4,
      "name": "Correction",
      "started_at": "2024-01-15T10:15:00Z",
      "completed_at": "2024-01-15T10:19:00Z",
      "duration_minutes": 4,
      "status": "completed",
      "corrections_applied": 7
    },
    {
      "phase": 5,
      "name": "Validation",
      "started_at": "2024-01-15T10:19:00Z",
      "completed_at": "2024-01-15T10:21:00Z",
      "duration_minutes": 2,
      "status": "completed",
      "report_generated": true
    }
  ]
}
```

## Anti-Patterns Prevented

### The Over-Correction Trap
- **Symptom**: Applying low-confidence corrections that introduce errors
- **Prevention**: Strict confidence thresholds, manual review flags

### The Source Drift
- **Symptom**: Using outdated or incorrect sources for verification
- **Prevention**: Source relevance scoring, multiple source triangulation, recency checks

### The Context Loss
- **Symptom**: Losing track of verification progress across sessions
- **Prevention**: Persistent state, claims database, session resumption capability

### The Blanket Acceptance
- **Symptom**: Accepting all claims without proper verification
- **Prevention**: Systematic verification against authoritative sources with evidence

### The Source Overwhelm
- **Symptom**: Finding too many sources, unable to determine authority
- **Prevention**: Source prioritization, relevance scoring, authority weighting

### The Correction Cascade
- **Symptom**: One correction breaks other parts of documentation
- **Prevention**: Bottom-up correction order, context validation, rollback support

## Example Usage

```bash
# Basic: Fact-check all docs in folder
/fact-check-standalone docs/api/

# With constraints
/fact-check-standalone docs/api/ --confidence=0.9 --max-corrections=20

# Only verify against codebase
/fact-check-standalone docs/api/ --sources=codebase

# Plan only (analyze without correcting)
/fact-check-standalone docs/api/ --plan-only

# Resume previous session
/fact-check-standalone docs/api/ --resume

# With auto-commit of corrections
/fact-check-standalone docs/api/ --auto-commit
```

## Integration with Other Commands

```bash
# Use with spec-orchestrator for implementation verification
/spec-orchestrator specs/feature/ && /fact-check-standalone docs/feature/

# Combine with code review
/fact-check-standalone docs/ && /review

# Parallel with research
/docs-researcher "topic" && /fact-check-standalone docs/research/

# After major code changes
git log --since="1 week ago" && /fact-check-standalone docs/
```

## Quality Gates Summary

| Phase | Gate | Failure Action |
|-------|------|----------------|
| 1. Extraction | All claims extracted | Report errors, ask for guidance |
| 2. Discovery | Sources found for claims | Document unverifiable, proceed |
| 3. Verification | Claims verified against sources | Continue with partial results |
| 4. Correction | Corrections applied correctly | Rollback problematic changes |
| 5. Validation | Report generated | Generate partial report |

## Best Practices

1. **Start with high-value docs**: Begin with documentation most likely to drift (API docs, architecture)
2. **Set appropriate thresholds**: Use higher confidence (0.9+) for critical documentation
3. **Review before accepting**: Always check the report before accepting low-confidence corrections
4. **Commit atomically**: Group related corrections in single commits with clear messages
5. **Maintain source authority**: Regularly verify that verification sources are current and authoritative
6. **Iterate regularly**: Run fact-checking after major code changes or releases
7. **Track patterns**: Monitor which docs drift most to identify documentation process issues

## Success Metrics

- **Accuracy**: Percentage of claims verified correctly
- **Coverage**: Percentage of claims with authoritative sources
- **Confidence**: Average confidence score of verifications
- **Efficiency**: Claims processed per minute
- **Impact**: Reduction in documentation-related bugs or confusion

## Troubleshooting

### High Unverifiable Rate
If many claims are unverifiable:
- Claims may be too vague or opinion-based
- Need better source discovery strategy
- Documentation may need restructuring to be more factual

### Low Confidence Scores
If confidence scores are consistently low:
- Sources may be outdated or ambiguous
- Need more authoritative sources
- Consider updating source discovery tools/patterns

### Frequent Correction Failures
If corrections fail to apply:
- Documents may have been manually edited during session
- Line numbers may have shifted
- Need more context in old_string for unique matching

---

*This workflow provides complete fact-checking capability without requiring specialized subagents, performing all verification operations directly through Claude Code's native tools.*
