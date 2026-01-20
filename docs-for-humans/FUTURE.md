# Future Documentation Work

Items to be documented in future updates.

---

## Data Schemas & Exchange Formats

**Status:** Planned

**Description:** Formal schema documentation for data formats that external tools might consume or produce.

### SessionExport JSON Schema

The `SessionExport` format is the portable representation of a complete reasoning session. Currently defined in TypeScript types, but would benefit from:

- JSON Schema definition for validation
- Language-agnostic specification
- Version migration documentation
- Example files with annotations

**Current location:** `src/persistence/types.ts`

### .src.md Notebook Format Specification

The notebook file format is an enhanced Markdown compatible with Srcbook. Needs:

- Formal specification document
- Parser implementation notes
- Examples of all cell types
- Compatibility notes with Srcbook

**Current location:** `src/notebook/encoding.ts`

### ThoughtData Schema

The structure of individual thoughts as persisted to disk. Useful for:

- Building analysis tools
- Creating importers from other formats
- Validating exports

**Current location:** `src/persistence/types.ts`

---

## Mental Models as Standalone Guides

**Status:** Planned (requires materials gathering)

**Description:** The 15 mental models are valuable reasoning frameworks independent of Thoughtbox. They should be published as standalone guides.

### Goals

1. **Accessibility** — Usable by people who don't use Thoughtbox
2. **Referenceable** — Can be cited by other AI systems
3. **Comprehensive** — Full explanations, not just prompts

### Models to Document

| Model | Category | Priority |
|-------|----------|----------|
| Five Whys | Debugging | High |
| Pre-mortem | Risk Analysis | High |
| Rubber Duck | Debugging | High |
| Trade-off Matrix | Decision Making | High |
| Decomposition | Planning | Medium |
| Steelmanning | Decision Making | Medium |
| Fermi Estimation | Estimation | Medium |
| Inversion | Risk Analysis | Medium |
| Abstraction Laddering | Architecture | Medium |
| Adversarial Thinking | Validation | Medium |
| Assumption Surfacing | Validation | Medium |
| Opportunity Cost | Prioritization | Low |
| Impact-Effort Grid | Prioritization | Low |
| Constraint Relaxation | Architecture | Low |
| Time Horizon Shifting | Planning | Low |

### Proposed Format

Each model guide should include:

1. **Overview** — What it is, when to use it
2. **The Process** — Step-by-step instructions
3. **Detailed Example** — Real-world walkthrough
4. **Variations** — Adaptations for different contexts
5. **Common Mistakes** — Pitfalls to avoid
6. **Related Models** — Complementary frameworks

### Source Materials Needed

- Original academic/practitioner sources for each model
- Real-world examples from actual reasoning sessions
- Feedback from users on effectiveness
- Edge cases and limitations

**Current location:** `src/mental-models/contents/`

---

## Other Potential Documentation

### Integration Guides

- How to build a custom storage backend
- How to add new mental models
- How to integrate with specific MCP clients
- How to build tools that consume Thoughtbox exports

### API Client Libraries

Documentation for language-specific clients if/when they exist:
- Python client
- Go client
- etc.

### Deployment Guides

- Kubernetes deployment
- Cloud-specific guides (AWS, GCP, Azure)
- High-availability setup

---

## Contributing to This Documentation

When working on these items:

1. Check this file for current status
2. Update status when starting work
3. Follow the style of existing docs in `docs-for-humans/`
4. Update `index.md` when adding new pages
5. Mark items complete here when done
