# /spec-validator

Systematically validate a specification document against the current codebase and project architecture. Identify omissions, contradictions, and feasibility issues before implementation begins, or verify an existing implementation against its spec.

## Usage

```bash
/spec-validator <spec_file_or_folder> [--strict] [--deep] [--report-only] [--resume]
```

## Variables

```text
SPEC_PATH: $ARGUMENTS (required)
STRICT_MODE: $ARGUMENTS (default: false - if true, any missing requirement is a failure)
DEEP_VALIDATION: $ARGUMENTS (default: false - if true, performs deeper semantic analysis and cross-file trace)
REPORT_ONLY: $ARGUMENTS (default: false - skip suggestion phase)
RESUME: $ARGUMENTS (default: false)
```

## What This Solves

When an agent or developer writes a specification:

- **Requirement Gaps**: Identifying what the spec forgot to mention (edge cases, error handling, auth).
- **Architectural Contradiction**: Detecting when a spec proposes something that breaks existing patterns.
- **Implementation Drift**: Verifying if the code actually matches the spec requirements.
- **Feasibility Risk**: Identifying "magic" requirements that lack a clear implementation path in the current stack.
- **Traceability**: Ensuring every requirement has a corresponding implementation (or a clear TODO).

## Protocol Phases

### Phase 0: Session Detection

```text
OBJECTIVE: Check for existing validation session state

1. Check if .spec-validator/ exists for the target path
2. If exists:
   - Display validation status summary
   - Show: verified requirements, failed requirements, gaps found
   - Offer: [R]esume | [S]tart fresh | [V]iew report | [C]ancel
3. If resuming, load state and skip to last active phase
4. If starting fresh, initialize .spec-validator/
```

### Phase 1: Requirement Extraction & Categorization (15% budget)

```text
OBJECTIVE: Parse the spec and extract atomic, testable requirements

1. Read SPEC_PATH (file or all md files in folder)
2. Extract requirements:
   - Identify "must", "should", "shall" statements
   - Parse checklist items
   - Identify data models and API signatures
   - Split compound requirements into atomic units

3. Categorize requirements:
   - FUNCTIONAL: UI/UX, logic, data flow
   - TECHNICAL: API signatures, data schemas, performance
   - CROSS-CUTTING: Auth, logging, error handling, security
   - INFRASTRUCTURE: Database changes, environment variables

4. Initialize .spec-validator/requirements.json
```

### Phase 2: Codebase Mapping & Baseline Search (25% budget)

```text
OBJECTIVE: Map requirements to existing code or identify complete novelties

1. For each requirement:
   - Use SemanticSearch to find existing logic that overlaps
   - Use Grep to search for proposed symbols/types
   - Determine if requirement is:
     - EXISTING: Already implemented (validation mode)
     - PARTIAL: Touches existing code but needs modification
     - NOVEL: Completely new functionality

2. Detect Architectural Patterns:
   - Search for "Existing Abstractions" (middleware, storage patterns)
   - Compare proposed spec patterns (e.g., "Firebase Auth") with current project standards
   - Flag "Pattern Mismatches" (e.g., spec says "PostgreSQL" but project uses "Firestore")

3. Update requirements.json with "Implementation Baseline"
```

### Phase 3: Validation Execution (40% budget)

```text
OBJECTIVE: Evaluate each requirement for validity, feasibility, and conflict

Apply "Validator Perspectives":

1. THE LOGICIAN (Consistency Check):
   - Are there logical contradictions within the spec?
   - Is the state machine complete (all transitions covered)?
   - Are error states defined for every success state?
   - **Invariant Check**: Do the proposed invariants (rules that must always be true) conflict with each other or existing system invariants?

2. THE ARCHITECT (Pattern & Structural Alignment):
   - Does this break existing middleware chains (Auth -> Billing -> Session)?
   - Is the data model scalable/correct for Firestore (e.g., avoids subcollection depth issues)?
   - Are naming conventions followed (CamelCase for types, camelCase for variables)?
   - **Abstration Match**: Is the spec reinventing a wheel already in src/utils/ or src/persistence/?

3. THE SECURITY GUARDIAN (Risk & Trust Boundaries):
   - Is auth mentioned for every new tool or endpoint?
   - Is PII (Personally Identifiable Information) handled correctly?
   - Are there potential injection or exposure risks in proposed logic?
   - **Tenant Isolation**: Does the spec ensure one user cannot see another's data?

4. THE IMPLEMENTER (Feasibility & Detail):
   - Are the requirements atomic enough to build (not "hand-wavy")?
   - Is there enough detail for the "magic" parts?
   - Are dependencies (internal/external) available?
   - **Complexity Score**: Assign a 1-10 difficulty rating to each requirement.

VERIFICATION STATUS:
- ✓ VALID: Clear, feasible, no conflicts.
- ✗ CONTRADICTION: Conflicts with codebase or existing patterns.
- ⚠ GAP: Missing critical detail (e.g., "how is this authorized?").
- ⚡ FEASIBILITY RISK: Proposed implementation seems overly complex or impossible.
```

### Phase 4: Gap Analysis & Recommendations (15% budget)

```text
OBJECTIVE: Synthesize findings into actionable improvements for the spec

1. Generate "Missing Requirements" list:
   - Common omissions: Logging (pino), monitoring, retry logic, timeout handling.
   - Unhandled edge cases: What if Firestore is down? What if the session is expired?
   - Missing security headers/auth checks.

2. Draft "Spec Corrections":
   - Propose better wording for ambiguous requirements.
   - Correct technical inaccuracies (API paths, type names, property names).
   - Suggest alternative implementations that fit project patterns better.

3. Create Traceability Matrix:
   - | Requirement | Status | Baseline Code | Conflicts | Suggested Change |
   - |-------------|--------|---------------|-----------|------------------|
   - | Auth Check  | ✓      | src/auth.ts   | None      | N/A              |
   - | New Tool    | ⚠      | None          | Pattern   | Use Toolhost     |
```

### Phase 5: Reporting & Alignment (5% budget)

```text
OBJECTIVE: Produce the final Validation Report and update the spec

1. Generate .spec-validator/report.md:
   - Executive Summary (Score: 0-100)
   - Critical Conflicts (Blockers)
   - Traceability Matrix
   - Recommended Spec Updates

2. If user approves:
   - Update the original spec with "Validation Metadata" (inline comments or footer)
   - Add new requirements discovered to the spec's checklist

3. Cleanup or Archive session
```

## Anti-Patterns Prevented

### The Magic Requirement

- **Symptom**: Spec says "System automatically optimizes database" without saying how.
- **Prevention**: Feasibility check in Phase 3.

### The Pattern Breaker

- **Symptom**: Spec proposes a new auth system when one already exists.
- **Prevention**: Baseline search and Pattern Mismatch detection in Phase 2.

### The Security Blindspot

- **Symptom**: Spec defines endpoints but forgets auth/middleware.
- **Prevention**: Security Guardian perspective in Phase 3.

### The Vague Checklist

- **Symptom**: Checklist items like "Make it fast".
- **Prevention**: Atomic requirement extraction in Phase 1.

## Example Usage

```bash
# Validate a new feature spec before starting implementation
/spec-validator specs/api-key-management-spec.md

# Verify an existing implementation matches its spec
/spec-validator specs/THOUGHT_NODE_LINKING.md --strict

# Perform deep analysis of a spec folder
/spec-validator specs/observability/ --deep
```

## Quality Gates Summary

| Phase | Gate | Failure Action |
| --- | --- | --- |
| 1. Extraction | All requirements identified | Clarify ambiguous sections with user |
| 2. Mapping | Abstractions identified | Flag reinvented wheels |
| 3. Validation | Logic/Arch/Security check | Document contradictions |
| 4. Gaps | Edge cases identified | Recommend additions to spec |
| 5. Reporting | Report generated | Notify user of blockers |

---

*This command transforms spec validation from a manual review into a systematic audit, ensuring that specifications are technically sound, architecturally aligned, and ready for robust implementation.*
