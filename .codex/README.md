# Project-Local Codex Skills

This directory contains Thoughtbox-specific Codex skills that should travel
with the repository.

Current Codex sessions may not automatically discover project-local `.codex`
skills unless the user config includes this directory as a skill root. When a
skill here is relevant, read its `SKILL.md` directly and follow it as a
repo-local procedure.

Available skills:

- `source-of-truth-preflight`: run before feature work that touches domain
  models, lifecycle state, runtime boundaries, persistence contracts, or
  duplicated abstractions.
