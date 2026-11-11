---
version: 2
name: 98c74f3f-0948-4170-913a-8a5e72a6be75-adoption-of-path-module-for-filesystem-path-resolution-before-introducing-modifying-code-that-references
description: "Adoption of path Module for Filesystem Path Resolution: Before Introducing Modifying Code That References"
metadata:
  actual:
    adr_id: 98c74f3f-0948-4170-913a-8a5e72a6be75
    status: accepted
    candidate_group_id: 13d23bc2-0b7d-43e8-a315-9b3b53e51a75
    evidence:
      source: deep
  scope:
    root: apps/web
---

# Adoption of path Module for Filesystem Path Resolution: Before Introducing Modifying Code That References

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `**` (whole root)

## Context

- Tooling configuration modules require reliable methods to resolve relative and absolute filesystem paths across diverse development and execution environments.
- Direct string manipulation of filesystem paths introduces environment-specific defects due to differing platform directory separators.
- The codebase establishes a convention of utilizing the path module within workspace configuration files to achieve deterministic location resolution.

## Problem Statement

Configuration modules frequently compute paths to project resources, entry points, and directory roots. Relying on manual string formatting or inconsistent path manipulation risks runtime failures across operating systems with distinct path separator semantics.

## Decision

1. MUST: Before introducing or modifying code that references external or runtime-provided modules, engineers MUST inspect the repository lock artifact to verify the exact resolved version and adhere to its published interface documentation.

## Policy Block

- MUST Before introducing or modifying code that references external or runtime-provided modules, engineers MUST inspect the repository lock artifact to verify the exact resolved version and adhere to its published interface documentation.

In scope:
- Tooling and application configuration modules that calculate or resolve filesystem paths.
- Workspace scripts requiring path manipulation across host operating systems.

Out of scope:
- Runtime modules operating purely in browser environments where platform filesystem modules are unavailable.
- Remote URL manipulation where dedicated network URL parsing utilities are required.

## Rationale

- Utilizing the path module provides standardized primitives for joining, resolving, and normalizing filesystem paths across all supported host platforms.
- Centralizing path resolution through established platform utilities avoids idiosyncratic separator handling and reduces configuration parsing bugs.
- Observed patterns across workspace configuration modules demonstrate reliance on standard resolution primitives to maintain uniform resource addressing.

## Consequences

Positive:
- Guarantees consistent cross-platform path resolution across local and automated build environments.
- Eliminates syntax errors caused by manual path separator concatenation.
- Maintains alignment with standard platform module resolution conventions.

Negative:
- Requires explicit conversion when translating between module location URLs and standard filesystem paths in modern module formats.
- Restricts configuration code from sharing path resolution logic with browser-only runtime contexts without bundling abstractions.

## Alternatives

- Manual string concatenation for filesystem paths (rejected)
  Rejected because: Fails across operating systems that use different directory separators and does not normalize redundant segments.
  When valid: Only in single-platform throwaway scripts with zero portability requirements.
- Third-party cross-platform path resolution packages (rejected)
  Rejected because: Adds external dependency maintenance overhead when platform core modules satisfy all required path manipulation capabilities.
  When valid: When advanced virtual filesystem features or non-standard path transformations are required.

## Risks

- Incompatibility when running configuration files under environments without platform core modules available.
  Mitigation: Restrict path module usage to build and configuration scopes where the underlying platform runtime is present.
  Owner: engineering team
- Mismatched handling between module URL objects and filesystem path strings.
  Mitigation: Ensure conversion utilities are applied before passing file URLs to path resolution methods.
  Owner: engineering team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Standardize on resolve when absolute path anchoring to the workspace or module root is necessary, and join for combining relative path segments.
- When working within modern module systems, convert file URLs to filesystem paths prior to invoking path normalization routines.

## Continuation Context


Verify commands:
- sh -c '"${REPO_VERIFY_COMMAND:-echo Discover and execute the project configuration check script from the discovered repository manifest}"'
- sh -c 'echo "Derive static analysis and test validation commands from the project manifest and execute them against configuration modules"'

Accept when:
- All configuration modules resolve filesystem locations using standardized path utility functions without hardcoded path delimiters.
- Discovered test and lint verification suites pass without path resolution or module import errors across host environments.

## Enforcement

- Verified by: Automated continuous integration pipelines executing workspace static analysis and test suites.
- Verified by: Pull request code reviews verifying path resolution adherence in configuration changes.
- Violation handling: Static analysis failures or automated build breakages block pull request merging.
- Violation handling: Manual code review requests replacement of raw path concatenations with path module methods.
- Exception process: Exceptions for platform-isolated scripts require documented justification and approval from engineering leads.