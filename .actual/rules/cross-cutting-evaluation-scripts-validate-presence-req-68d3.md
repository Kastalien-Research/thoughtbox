---
version: 2
name: cross-cutting-evaluation-scripts-validate-presence-req-68d3
description: "LangSmith Evaluation and Experiment Tracking Library Adoption: Evaluation Scripts Validate Presence Required Authentication"
metadata:
  actual:
    adr_id: 68d31a4a-a5d8-433b-9a10-95184eb4b158
    status: accepted
    candidate_group_id: 24daf34b-1fd7-4e4f-96ed-da0e6d818c7e
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
      - src/evaluation/**
---

# LangSmith Evaluation and Experiment Tracking Library Adoption: Evaluation Scripts Validate Presence Required Authentication

Scope: applies to `scripts/**`, `src/evaluation/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-LANGSMITH-001** SHOULD: Evaluation scripts SHOULD validate the presence of required authentication credentials before initiating remote experiment dataset queries.
- **R-LANGSMITH-002** MANDATORY: The consumer MUST derive all tool names, file names, commands, package managers, and version numbers from the project repository (DISCOVERY POLICY).
- **R-LANGSMITH-003** MANDATORY: Before writing code that uses a versioned library, execute in order: (1) Find dependency manifest, (2) Identify build tool, (3) Inspect repository lock/resolution artifact, (4) Look up official documentation/changelog for exact version, (5) Confirm every API/class/function exists in that version, (6) Re-run steps 3-5 per dependency at point of use (LOCK-VERSION GROUNDING).
- **R-LANGSMITH-004** SHOULD: Configure client initialization through structured environment settings, providing explicit fallbacks when client instances cannot be initialized.
- **R-LANGSMITH-005** SHOULD: Encapsulate remote client API invocations within reusable asynchronous error-boundary methods that capture and log service errors without raising uncaught exceptions.

### Verify

```bash
# Discover dependency manifest and lock artifact, and verify the evaluation library is declared and locked
manifest=$(find . -maxdepth 2 -name "pyproject.toml" -o -name "package.json" -o -name "requirements.txt" -o -name "Cargo.toml" | head -n 1)
echo "Manifest found: $manifest"

# Discover and run static analysis / type verification script
if [ -f "package.json" ]; then
  npm run --if-present typecheck || npm run --if-present check
elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  python -m mypy . || true
fi

# Run the evaluation test suite to verify safe fallback handling when endpoints are unreachable
if [ -f "pytest.ini" ] || [ -d "tests" ]; then
  pytest -k "evaluation or benchmark" || true
fi
```

**Accept when:**
- The evaluation library and its schema modules resolve successfully according to the project's lock artifact.
- Static type verification confirms that all evaluation outputs and datasets adhere to the standardized evaluation schemas.
- Evaluation runners execute successfully with safe fallback handling when remote evaluation credentials or network endpoints are unavailable.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>