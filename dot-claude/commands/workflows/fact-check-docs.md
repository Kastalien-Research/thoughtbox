# /fact-check-docs

Systematically verify claims in documentation against sources of truth (codebase, web data, or research), track verification progress across sessions, and automatically correct mismatches using the fact-checking-agent.

## Usage

```bash
/fact-check-docs <docs_folder> [--confidence=N] [--max-corrections=N] [--sources=type] [--plan-only] [--resume]
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

ACTION: Invoke fact-checking-agent subagent
DESCRIPTION: "Extract claims from all markdown files in {DOCS_FOLDER}"

The fact-checking-agent will:
1. Scan DOCS_FOLDER for documentation files (*.md by default)
2. For each document:
   - Read content
   - Extract atomic, verifiable claims
   - Categorize by verification type (code/web/research)
   - Assign unique claim IDs
   - Track source document and line numbers

3. Create claims inventory:

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
         "evidence": null
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
         "evidence": null
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

4. Save claims to .fact-checker/claims.json

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

ACTION: Invoke fact-checking-agent subagent for each claim category
DESCRIPTION: "Discover verification sources for {category} claims"

For CODEBASE claims:
  fact-checking-agent uses:
  - SemanticSearch: Find relevant code by meaning
  - Grep: Locate specific symbols/patterns
  - Glob: Identify relevant files
  - Read: Examine implementations
  - query_library_docs: API documentation

For WEB claims:
  fact-checking-agent uses:
  - firecrawl_search: Discover authoritative sources
  - firecrawl_scrape: Extract web content
  - WebSearch: Real-time information
  - get_code_context_exa: Technical documentation

For RESEARCH claims:
  fact-checking-agent uses:
  - Multi-tool research approach
  - Cross-reference multiple sources
  - Triangulate information

For each claim, the agent populates:
{
  "id": "claim-001",
  "sources": [
    {
      "type": "codebase",
      "location": "src/auth/oauth.ts:23-45",
      "tool": "SemanticSearch",
      "relevance": 0.95,
      "discovered_at": "ISO8601"
    },
    {
      "type": "codebase", 
      "location": "src/auth/config.ts:10",
      "tool": "Grep",
      "relevance": 0.88,
      "discovered_at": "ISO8601"
    }
  ]
}

Update state.json:
{
  "session_id": "uuid",
  "started_at": "ISO8601",
  "current_phase": 2,
  "docs_folder": "path",
  "total_claims": 45,
  "claims_with_sources": 42,
  "claims_without_sources": 3,
  "corrections_made": 0,
  "corrections_remaining": 50
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

ACTION: Invoke fact-checking-agent subagent
DESCRIPTION: "Verify claims against discovered sources"

The agent processes claims in priority order:
1. High-confidence sources first
2. Critical claims prioritized
3. Batch similar verification types

For each claim:
  1. Retrieve source content
  2. Compare claim text to source evidence
  3. Assign verification status:
     - VERIFIED: ✓ Claim matches source
     - FALSE: ✗ Claim contradicts source
     - OUTDATED: ⚠ Claim was accurate but source changed
     - PARTIAL: ⚡ Claim partially correct
     - UNVERIFIABLE: ❓ No authoritative source found

  4. Record confidence score (0.0-1.0)
  5. Extract evidence excerpt from source
  6. Generate correction (if needed)

Update claims.json:
{
  "id": "claim-001",
  "status": "FALSE",
  "confidence": 0.92,
  "sources": [...],
  "evidence": "Code shows OAuth2.1 implementation, not OAuth2",
  "correction": {
    "original": "The API uses OAuth2 for authentication",
    "corrected": "The API uses OAuth2.1 for authentication",
    "reason": "Source code in src/auth/oauth.ts:23 implements OAuth2.1"
  },
  "verified_at": "ISO8601"
}

Progress tracking in state.json:
{
  "verification_progress": {
    "verified": 28,
    "false": 3,
    "outdated": 2,
    "partial": 1,
    "unverifiable": 1,
    "pending": 10
  }
}

SPIRAL DETECTION:
If consecutive claims fail verification with low confidence:
  - Flag for manual review
  - Adjust source discovery strategy
  - Consider different verification tools

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

ACTION: Invoke fact-checking-agent subagent
DESCRIPTION: "Apply corrections to documentation"

Correction strategy:
1. Filter corrections by confidence >= CONFIDENCE_THRESHOLD
2. Group corrections by document
3. Sort by line number (bottom-up to preserve line numbers)
4. Apply corrections using StrReplace or MultiEdit

For each correction meeting threshold:
  Original (api-docs.md:42):
    "The API uses OAuth2 for authentication"
  
  Correction:
    "The API uses OAuth2.1 for authentication"
  
  Apply with StrReplace:
    - file: api-docs.md
    - old_string: "The API uses OAuth2 for authentication"
    - new_string: "The API uses OAuth2.1 for authentication"

Track corrections in state.json:
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
  ]
}

CORRECTION LIMITS:
- Stop after MAX_CORRECTIONS corrections
- Flag remaining high-confidence corrections for next session
- Preserve low-confidence corrections for manual review

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

1. Re-read modified documents to verify corrections
2. Check for unintended side effects
3. Run linters/validators if available

4. Generate report.md:

   # Fact-Checking Report
   
   ## Session Summary
   - Session ID: {session_id}
   - Started: {started_at}
   - Completed: {completed_at}
   - Duration: {duration}
   
   ## Verification Statistics
   - Total claims examined: 45
   - Verified (✓): 35
   - Corrected (✗→✓): 7
   - Requires review (⚠): 3
   
   ## Claims by Status
   
   ### ✓ Verified Claims (35)
   Claims that matched sources without correction needed.
   
   ### ✗ Corrected Claims (7)
   | Claim ID | Document | Line | Original | Corrected | Confidence |
   |----------|----------|------|----------|-----------|------------|
   | claim-001 | api-docs.md | 42 | OAuth2 | OAuth2.1 | 0.92 |
   | ... | ... | ... | ... | ... | ... |
   
   ### ⚠ Requires Manual Review (3)
   Claims with low confidence or conflicting sources.
   
   | Claim ID | Document | Issue | Recommendation |
   |----------|----------|-------|----------------|
   | claim-008 | perf.md | Low confidence (0.72) | Verify with team |
   | ... | ... | ... | ... |
   
   ## Sources Referenced
   
   ### Codebase Sources
   - src/auth/oauth.ts (3 claims)
   - src/config/api.ts (2 claims)
   
   ### Web Sources
   - https://oauth.net/2.1/ (1 claim)
   - https://docs.example.com (2 claims)
   
   ### Research Sources
   - Multi-source synthesis (2 claims)
   
   ## Documents Modified
   - api-docs.md (3 corrections)
   - performance.md (2 corrections)
   - architecture.md (2 corrections)
   
   ## Next Actions
   - [ ] Review low-confidence claims manually
   - [ ] Update unverifiable claims or add sources
   - [ ] Consider adding source citations to documentation

5. Archive session state:
   .fact-checker/
   ├── state.json
   ├── claims.json
   ├── report.md
   └── archive/
       └── session-{session_id}/
           ├── claims-snapshot.json
           ├── state-snapshot.json
           └── corrections.log

GATE: Validation complete?
- [ ] All corrections verified
- [ ] Report generated
- [ ] Session archived
- [ ] User notified

If GATE fails: Document validation issues, generate partial report
```

## Integration with fact-checking-agent

This workflow is designed to work seamlessly with the fact-checking-agent subagent:

```
The main orchestrator (this workflow):
- Manages session state
- Coordinates phases
- Tracks progress across sessions
- Handles corrections and rollbacks
- Generates reports

The fact-checking-agent subagent:
- Extracts claims from documents
- Discovers verification sources
- Verifies claims against sources
- Generates corrections
- Provides detailed evidence

Invocation pattern:
ACTION: Invoke subagent
AGENT: fact-checking-agent
DESCRIPTION: Phase-specific task description
```

The workflow delegates verification work to the agent while maintaining orchestration control.

## State Management

### state.json Structure

```json
{
  "session_id": "uuid",
  "started_at": "ISO8601",
  "completed_at": null,
  "current_phase": 3,
  "docs_folder": "path/to/docs",
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
    "claims_verified": 35,
    "claims_corrected": 7,
    "claims_pending": 3
  },
  "verification_stats": {
    "verified": 35,
    "false": 7,
    "outdated": 2,
    "partial": 1,
    "unverifiable": 0,
    "pending": 0
  },
  "corrections": {
    "applied": 7,
    "skipped": 3,
    "remaining": 0
  },
  "documents_modified": [
    "api-docs.md",
    "performance.md",
    "architecture.md"
  ],
  "phase_history": [
    {
      "phase": 1,
      "started_at": "ISO8601",
      "completed_at": "ISO8601",
      "status": "completed"
    }
  ]
}
```

## Anti-Patterns Prevented

### The Over-Correction Trap
- **Symptom**: Applying low-confidence corrections that introduce errors
- **Prevention**: Confidence thresholds, manual review flags

### The Source Drift
- **Symptom**: Using outdated or incorrect sources for verification
- **Prevention**: Source relevance scoring, multiple source triangulation

### The Context Loss
- **Symptom**: Losing track of verification progress across sessions
- **Prevention**: Persistent state, claims database, session resumption

### The Blanket Acceptance
- **Symptom**: Accepting all claims without proper verification
- **Prevention**: Systematic verification against authoritative sources

### The Source Overwhelm
- **Symptom**: Finding too many sources, unable to determine authority
- **Prevention**: Source prioritization, relevance scoring, source type filtering

## Example Usage

```bash
# Basic: Fact-check all docs in folder
/fact-check-docs docs/api/

# With constraints
/fact-check-docs docs/api/ --confidence=0.9 --max-corrections=20

# Only verify against codebase
/fact-check-docs docs/api/ --sources=codebase

# Plan only (analyze without correcting)
/fact-check-docs docs/api/ --plan-only

# Resume previous session
/fact-check-docs docs/api/ --resume

# With auto-commit of corrections
/fact-check-docs docs/api/ --auto-commit
```

## Integration with Other Commands

```bash
# Use with spec-orchestrator for implementation verification
/spec-orchestrator specs/feature/ && /fact-check-docs docs/feature/

# Combine with code review
/fact-check-docs docs/ && /context-aware-review "docs"

# Track documentation evolution
/fact-check-docs docs/ && /evolution-tracker "documentation accuracy"

# Research phase integration
/docs-researcher "topic" && /fact-check-docs docs/research/
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

1. **Start with high-value docs**: Begin with documentation most likely to drift (API docs, specs)
2. **Set appropriate thresholds**: Use higher confidence (0.9+) for critical docs
3. **Review before accepting**: Check the report before accepting low-confidence corrections
4. **Commit atomically**: If using auto-commit, ensure changes are grouped logically
5. **Maintain source authority**: Regularly verify that verification sources are still authoritative

## Success Metrics

- Claim verification accuracy
- Correction confidence distribution
- Time to complete verification
- Reduction in documentation drift
- Manual review reduction over time

---

*This workflow applies systematic verification principles to ensure documentation accuracy, using the fact-checking-agent for specialized verification work while maintaining orchestration control and session continuity.*
