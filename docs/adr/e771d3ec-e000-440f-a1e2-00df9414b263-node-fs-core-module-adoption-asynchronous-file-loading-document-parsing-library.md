---
version: 2
name: e771d3ec-e000-440f-a1e2-00df9414b263-node-fs-core-module-adoption-asynchronous-file-loading-document-parsing-library
description: "node:fs Core Module Adoption: Asynchronous File Loading Document Parsing Library"
metadata:
  actual:
    adr_id: e771d3ec-e000-440f-a1e2-00df9414b263
    status: accepted
    candidate_group_id: 5d515469-88d5-4494-95fe-416ab3186b02
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - .claude/hooks/**
      - scripts/qa/**
      - src/lib/docs/**
---

# node:fs Core Module Adoption: Asynchronous File Loading Document Parsing Library

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `.claude/hooks/**`
- `scripts/qa/**`
- `src/lib/docs/**`

## Context

- Codebases operating across server-side utilities, verification scripts, and automation hooks require direct file system access for architecture validation, design token verification, and documentation loading
- Historically, runtime core modules could be imported via unadorned bare specifiers, creating ambiguity between standard runtime capabilities and external third-party packages
- Using bare module specifiers introduces supply chain risks such as dependency confusion and package namespace squatting in public registries
- Modern runtime standards provide explicit protocol URI schemes to unambiguously designate native core modules and eliminate resolution ambiguity

## Problem Statement

Server-side scripts, verification utilities, and server-rendered data loaders require direct access to the file system and local resources. Importing core runtime modules using unadorned specifiers creates ambiguity regarding whether a module originates from the runtime standard library or a third-party dependency, risking dependency confusion vulnerabilities, slow module resolution, and potential conflicts with package registry namespaces. A unified architectural standard is required to govern how file system capabilities are imported and executed across server-side and automation contexts.

## Decision

1. SHOULD: Asynchronous file loading and document parsing in library code SHOULD utilize node:fs/promises rather than blocking synchronous file system methods.

## Policy Block

- SHOULD Asynchronous file loading and document parsing in library code SHOULD utilize node:fs/promises rather than blocking synchronous file system methods.

In scope:
- Server-side utility modules requiring file system reading, writing, or metadata inspection
- Quality assurance scripts, design token verifiers, and architecture validation utilities
- Developer tooling automation and repository hook scripts operating in native runtime environments

Out of scope:
- Client-side browser application bundles and shared UI component libraries
- Pure utility modules operating strictly in memory without local resource I/O

Exceptions:
- EXC-20-001: Third-party legacy dependencies that internally use bare imports without protocol prefixes

## Rationale

- Explicit protocol prefixing prevents dependency confusion and supply chain attacks by guaranteeing that imports resolve to built-in runtime modules rather than malicious third-party packages in a public registry
- Standardizing on node:fs and node:fs/promises establishes consistency across scripts, tooling hooks, and server utilities, eliminating discrepancies between CommonJS and ECMAScript module resolution
- Separating promise-based file loading in library code from synchronous operations in verification scripts balances runtime throughput for server operations with implementation simplicity for standalone scripts

## Consequences

Positive:
- Eliminates dependency confusion risks by strictly isolating runtime core modules from external package namespaces
- Improves module resolution performance by bypassing repository package dependency lookups for runtime built-in modules
- Clarifies architectural boundaries by making file system dependencies immediately recognizable during code review

Negative:
- Prevents code sharing between server-side file utilities and client-side browser bundles
- Requires static analysis enforcement and linting rules to prevent inadvertent unadorned bare imports

## Alternatives

- Unadorned bare module specifiers for core module imports (rejected)
  Rejected because: Bare specifiers create risks of package namespace collision, registry squatting vulnerabilities, and slower module resolution
  When valid: Legacy runtime environments that lack support for protocol URI module resolution
- Third-party virtual or enhanced file system abstraction libraries (rejected)
  Rejected because: Introduces unnecessary external dependencies and maintenance overhead when native runtime core modules satisfy all file interaction requirements
  When valid: Applications requiring specialized virtual file systems, cloud storage abstractions, or distributed storage backends

## Risks

- Inadvertent inclusion of server-only file system imports into client-side bundles causing build failures
  Mitigation: Enforce boundary checks in static analysis and bundler configuration to prohibit file system imports in client entry points
  Owner: engineering team
- Blocking synchronous file system calls used inadvertently within high-concurrency request handling paths
  Mitigation: Restrict synchronous file operations to verification scripts and require promise-based APIs in request-serving libraries
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
- Ensure all module import declarations for native capabilities use the protocol URI scheme format to guarantee predictable resolution
- Organize server-only file system operations into dedicated library directories and keep them strictly separated from client-consumed components

## Continuation Context


Verify commands:
- # Discover repository verification scripts from the project manifest and execute linting checks
- # Discover and run the architecture verification test suite defined in repository configuration

Accept when:
- Static analysis confirms zero unadorned bare module imports for runtime core capabilities across the codebase
- Architecture verification and test suites execute without errors across all workspace packages

## Enforcement

- Verified by: Automated static analysis and linter rules validating module import specifiers in continuous integration
- Verified by: Architecture verification scripts checking workspace module boundaries during pull request review
- Violation handling: Continuous integration builds fail upon detection of bare runtime core module imports or client bundle leaks
- Violation handling: Pull requests containing violations are blocked from merging until import specifiers conform to standard
- Exception process: Submit an architectural review request documenting the third-party dependency constraint and mitigation timeline