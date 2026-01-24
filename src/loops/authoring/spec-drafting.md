---
type: authoring
speed: medium
scope: document
interface_version: loop-interface@1.0
description: Draft specification documents with appropriate structure and depth.
---
# Spec Drafting Loop

Draft specification documents with appropriate structure and depth.

**Version**: 1.0.0
**Interface**: loop-interface@1.0

## Classification

- **Type**: authoring
- **Speed**: medium (~30s-2min per spec)
- **Scope**: document

## Interface

### Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| spec_summary | SpecSummary | yes | Spec metadata from exploration phase |
| requirements | List<Requirement> | yes | Requirements assigned to this spec |
| dependencies | List<SpecRef> | no | Dependent specs (for cross-referencing) |
| depth | "shallow" \| "standard" \| "comprehensive" | no | Detail level (default: standard) |
| template_overrides | Map<Section, Template> | no | Custom section templates |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| spec_document | SpecDocument | Complete spec markdown |
| section_scores | Map<Section, Score> | Quality score per section |
| tbd_items | List<TBDItem> | Items marked for later resolution |
| cross_references | List<CrossRef> | References to other specs/docs |
| diagrams | List<Diagram> | Generated mermaid diagrams |

### State

| Field | Type | Description |
|-------|------|-------------|
| current_section | Section | Section being drafted |
| draft_content | Map<Section, Text> | Content drafted so far |
| iteration | Number | Refinement iteration count |

## OODA Phases

### OBSERVE

Gather spec-specific context:

```
1. REVIEW spec summary:
   → What is the core purpose?
   → What boundaries were set?
   → What complexity was estimated?

2. LOAD relevant existing code:
   IF spec is enhancement/refactor:
     → Read current implementation files
     → Extract interfaces and contracts
     → Note existing patterns and conventions
   
   IF spec has dependencies:
     → Read dependent spec drafts
     → Extract interface requirements
     → Note integration points

3. GATHER terminology:
   → Domain-specific terms used
   → Existing naming conventions in codebase
   → Industry standard terminology

4. IDENTIFY diagram candidates:
   → Architecture overview needed?
   → Data flow visualization?
   → State machine?
   → Sequence diagrams?

OBSERVATION OUTPUTS:
  existing_code: relevant code snippets
  interface_contracts: what other specs expect
  terminology: domain glossary
  diagram_needs: list of diagrams to generate
```

### ORIENT

Plan document structure and content:

```
1. SELECT spec type:
   
   FEATURE (new capability):
     sections = [
       "Executive Summary",
       "Background",
       "User Stories",
       "Functional Requirements",
       "Non-Functional Requirements", 
       "API Design",
       "Data Model",
       "Migration Path",
       "Acceptance Criteria"
     ]
   
   ARCHITECTURE (system design):
     sections = [
       "Problem Statement",
       "Constraints & Assumptions",
       "Architecture Overview",
       "Component Design",
       "Integration Points",
       "Trade-off Analysis",
       "Alternatives Considered",
       "Risk Assessment"
     ]
   
   REFACTOR (improving existing):
     sections = [
       "Current State Analysis",
       "Problems to Address",
       "Target State",
       "Migration Strategy",
       "Backwards Compatibility",
       "Rollback Plan",
       "Acceptance Criteria"
     ]

2. DETERMINE depth per section:
   
   IF depth == "shallow":
     words_per_section = 50-100
     examples = minimal
     edge_cases = none
   
   IF depth == "standard":
     words_per_section = 100-300
     examples = key scenarios
     edge_cases = major ones
   
   IF depth == "comprehensive":
     words_per_section = 200-500
     examples = exhaustive
     edge_cases = all identified

3. PLAN content strategy:
   
   For each section:
     priority = Required | Recommended | Optional | Defer
     
     Required: Must include for spec validity
     Recommended: Should include for completeness
     Optional: Include if context exists
     Defer: Mark TBD, flag for follow-up

4. MAP requirements to sections:
   
   For each requirement:
     → Which section does it belong in?
     → Does it need acceptance criteria?
     → Does it need examples?
```

### DECIDE

Commit to content for each section:

```
For each section in order:
  
  ASSESS readiness:
    have_context = relevant info gathered?
    have_requirements = requirements mapped?
    have_examples = examples identified?
  
  IF have_context AND have_requirements:
    action = "draft"
    
  ELIF section.priority == "Required":
    action = "draft_with_placeholders"
    
  ELIF section.priority == "Defer":
    action = "mark_tbd"
    
  ELSE:
    action = "skip"

CONTENT DECISIONS:
  include_code_examples: boolean
  include_diagrams: list of diagram types
  include_tables: list of table types
  cross_ref_needed: list of other specs to reference
```

### ACT

Generate the spec document:

```
1. WRITE header:
   
   """
   # {spec_summary.name}
   
   **Version:** 1.0.0
   **Date:** {today}
   **Status:** Draft
   **Author:** AI-assisted via @loops/authoring/spec-drafting
   **Depends on:** {dependencies}
   
   ---
   
   ## Table of Contents
   {generated_toc}
   
   ---
   """

2. FOR each section:
   
   IF action == "draft":
     content = generate_section_content(
       section=section,
       requirements=mapped_requirements,
       depth=depth,
       existing_code=relevant_snippets
     )
     
     IF include_code_examples:
       content += generate_code_examples()
     
     IF include_diagrams:
       diagram = generate_mermaid_diagram(diagram_type)
       content += diagram
       diagrams.append(diagram)
     
     IF include_tables:
       content += generate_tables()
     
     section_scores[section] = assess_section_quality(content)
   
   ELIF action == "draft_with_placeholders":
     content = generate_section_skeleton(section)
     content += "[TBD: {missing_info}]"
     tbd_items.append({section, missing_info})
   
   ELIF action == "mark_tbd":
     content = "**[TBD]** This section will be completed when {condition}."
     tbd_items.append({section, condition})
   
   draft_content[section] = content

3. GENERATE cross-references:
   
   For each dependency:
     Add reference in relevant sections
     cross_references.append({
       from_section: section,
       to_spec: dependency,
       relationship: "depends_on" | "extends" | "implements"
     })

4. ASSEMBLE document:
   
   spec_document = header
   
   For each section in sections:
     spec_document += f"\n\n## {section.number}. {section.title}\n\n"
     spec_document += draft_content[section]
   
   spec_document += generate_appendix(terminology, references)

5. EMIT completion signal:
   
   overall_score = avg(section_scores.values())
   
   EMIT spec_drafted {
     spec: spec_summary.name,
     score: overall_score,
     tbd_count: len(tbd_items),
     diagram_count: len(diagrams)
   }
```

## Termination Conditions

- **Success**: All Required sections drafted with `score >= 0.7`
- **Failure**: Cannot gather minimum context for Required sections
- **Timeout**: Time limit reached → emit partial spec with TBDs

## Composition

### Can contain (nested loops)
- `refinement/requirement-quality` (inline requirement polishing)
- `authoring/documentation` (for verbose sections)

### Can be contained by
- `exploration/problem-space` (post-exploration)
- `orchestration/queue-processor` (batch spec drafting)

### Parallelizable
- Yes: Independent specs can be drafted in parallel
- No: Dependent specs must be drafted in order

## Signals Emitted

| Signal | When | Payload |
|--------|------|---------|
| `section_drafted` | Each section complete | `{ section, score, word_count }` |
| `diagram_generated` | Diagram created | `{ type, mermaid_source }` |
| `tbd_flagged` | Item deferred | `{ section, reason }` |
| `spec_drafted` | Spec complete | `{ spec_name, overall_score, tbd_count }` |
| `cross_ref_needed` | Missing dependency | `{ from_spec, to_spec, reason }` |

## Section Templates

### Requirements Table Template

```markdown
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-001 | {specific requirement} | Must | {testable criteria} |
| FR-002 | {requirement} | Should | {criteria} |
```

### Trade-off Table Template

```markdown
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| A: {name} | {pros} | {cons} | {chosen/rejected + why} |
| B: {name} | {pros} | {cons} | {chosen/rejected + why} |
```

### Risk Table Template

```markdown
| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| {risk description} | High/Med/Low | High/Med/Low | {mitigation strategy} |
```

## Example Usage

```markdown
## Phase 2: Authoring

For each spec in spec_inventory:
  
  Execute @loops/authoring/spec-drafting.md with:
    INPUT:
      spec_summary: spec
      requirements: spec.requirements
      dependencies: spec.dependencies
      depth: "standard"
    
    ON section_drafted:
      LOG progress
    
    ON tbd_flagged:
      RECORD for later resolution
    
    ON spec_drafted:
      IF score >= 0.7:
        PROCEED to refinement
      ELSE:
        FLAG for manual review
```

## Quality Checklist

Before marking spec as drafted:

- [ ] All Required sections have content (not just placeholders)
- [ ] Requirements have unique IDs (FR-001, NFR-001, etc.)
- [ ] Diagrams render correctly (valid mermaid syntax)
- [ ] Cross-references are valid (linked specs exist)
- [ ] TBD items have clear resolution conditions
- [ ] Glossary covers all domain-specific terms
