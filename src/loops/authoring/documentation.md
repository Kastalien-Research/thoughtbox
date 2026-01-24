---
type: authoring
speed: medium
scope: document
interface_version: loop-interface@1.0
description: Generate and maintain documentation from code and specifications.
---
# Documentation Loop

Generate and maintain documentation from code and specifications.

**Version**: 1.0.0
**Interface**: loop-interface@1.0

## Classification

- **Type**: authoring
- **Speed**: medium (~30s-2min per document)
- **Scope**: document

## Interface

### Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| source | Source | yes | What to document (code, spec, API) |
| doc_type | DocType | yes | Type of documentation to generate |
| audience | Audience | no | Target audience (default: developers) |
| existing_docs | List<FilePath> | no | Existing docs to update/integrate |
| style_guide | StyleGuide | no | Documentation style preferences |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| documents | List<Document> | Generated documentation |
| updates | List<DocUpdate> | Updates to existing docs |
| cross_references | List<CrossRef> | Links between docs |
| coverage | DocCoverage | What's documented vs not |

### State

| Field | Type | Description |
|-------|------|-------------|
| sections_written | Set<SectionId> | Sections completed |
| examples_generated | List<Example> | Code examples created |

## Types

```typescript
type Source =
  | { type: "code", files: List<FilePath> }
  | { type: "spec", document: SpecDocument }
  | { type: "api", endpoints: List<Endpoint> }
  | { type: "schema", definitions: List<Schema> }

type DocType =
  | "readme"           // Project/module README
  | "api_reference"    // API documentation
  | "guide"            // How-to guide
  | "tutorial"         // Step-by-step tutorial
  | "architecture"     // Architecture documentation
  | "changelog"        // Version changes
  | "contributing"     // Contribution guidelines

type Audience =
  | "developers"       // Internal developers
  | "api_consumers"    // External API users
  | "operators"        // DevOps/SRE
  | "end_users"        // Non-technical users
```

## OODA Phases

### OBSERVE

Extract documentable content from source:

```
1. ANALYZE source type:
   
   IF source.type == "code":
     # Extract from code
     FOR file in source.files:
       content = Read(file)
       
       # Extract documentation elements
       exports = extract_exports(content)
       functions = extract_functions(content)
       classes = extract_classes(content)
       types = extract_types(content)
       comments = extract_doc_comments(content)
       
       code_elements.append({
         file: file,
         exports, functions, classes, types, comments
       })
   
   ELIF source.type == "spec":
     # Extract from specification
     spec_elements = {
       summary: source.document.summary,
       requirements: source.document.requirements,
       api: source.document.api_design,
       data_model: source.document.data_model,
       examples: source.document.examples
     }
   
   ELIF source.type == "api":
     # Extract from API endpoints
     FOR endpoint in source.endpoints:
       api_elements.append({
         method: endpoint.method,
         path: endpoint.path,
         params: endpoint.parameters,
         request_body: endpoint.request,
         response: endpoint.response,
         errors: endpoint.errors
       })
   
   ELIF source.type == "schema":
     # Extract from schema definitions
     FOR schema in source.definitions:
       schema_elements.append({
         name: schema.name,
         fields: schema.fields,
         relationships: schema.relationships,
         constraints: schema.constraints
       })

2. IDENTIFY documentation gaps:
   
   IF existing_docs:
     FOR doc in existing_docs:
       existing_content = Read(doc)
       documented_items = extract_documented_items(existing_content)
       
     # Find undocumented items
     all_items = collect_all_documentable_items(source)
     undocumented = all_items - documented_items
   ELSE:
     undocumented = all_items

3. GATHER examples:
   
   # Look for existing examples in tests
   test_files = find_test_files(source)
   FOR test_file in test_files:
     examples_from_tests = extract_usage_examples(test_file)
     examples.extend(examples_from_tests)

SIGNALS:
  documentable_items: items to document
  undocumented: gaps to fill
  existing_examples: examples found in codebase
```

### ORIENT

Plan documentation structure:

```
1. SELECT structure based on doc_type:
   
   IF doc_type == "readme":
     structure = [
       "Title & Badges",
       "Description",
       "Installation",
       "Quick Start",
       "Usage",
       "API Overview",
       "Configuration",
       "Contributing",
       "License"
     ]
   
   ELIF doc_type == "api_reference":
     structure = [
       "Overview",
       "Authentication",
       "Base URL",
       "Endpoints" (grouped by resource),
       "Error Handling",
       "Rate Limiting",
       "Examples"
     ]
   
   ELIF doc_type == "guide":
     structure = [
       "Introduction",
       "Prerequisites",
       "Step-by-Step Instructions",
       "Common Patterns",
       "Troubleshooting",
       "Next Steps"
     ]
   
   ELIF doc_type == "tutorial":
     structure = [
       "What You'll Build",
       "Prerequisites",
       "Step 1..N",
       "Testing Your Work",
       "Summary",
       "Further Reading"
     ]
   
   ELIF doc_type == "architecture":
     structure = [
       "System Overview",
       "Component Diagram",
       "Data Flow",
       "Key Design Decisions",
       "Integration Points",
       "Deployment"
     ]

2. MAP content to structure:
   
   content_mapping = {}
   
   FOR section in structure:
     relevant_items = filter_items_for_section(
       documentable_items,
       section,
       audience
     )
     content_mapping[section] = relevant_items

3. PLAN examples:
   
   FOR section in content_mapping:
     IF section needs examples:
       IF existing_examples for section:
         planned_examples[section] = existing_examples
       ELSE:
         planned_examples[section] = generate_example_spec(section)

4. ADJUST for audience:
   
   IF audience == "end_users":
     # Remove technical details
     remove_sections(["API Overview", "Configuration"])
     simplify_language()
   
   ELIF audience == "operators":
     # Emphasize operational aspects
     expand_sections(["Configuration", "Deployment", "Monitoring"])
   
   ELIF audience == "api_consumers":
     # Focus on API usage
     expand_sections(["Authentication", "Endpoints", "Examples"])
```

### DECIDE

Commit to documentation content:

```
1. PRIORITIZE sections:
   
   required_sections = filter(structure, is_required_for(doc_type))
   optional_sections = filter(structure, is_optional)
   
   # Must document required sections
   FOR section in required_sections:
     IF not content_mapping[section]:
       FLAG missing_content(section)

2. DECIDE on example generation:
   
   FOR section, example_spec in planned_examples:
     IF example_spec.complexity > threshold:
       decision = "generate_simple_example"
     ELIF existing_examples available:
       decision = "adapt_existing_example"
     ELSE:
       decision = "generate_new_example"
     
     example_decisions[section] = decision

3. DECIDE on cross-references:
   
   FOR item in documentable_items:
     related_items = find_related(item, documentable_items)
     IF related_items:
       cross_references.append({
         from: item,
         to: related_items,
         relationship: "see_also" | "implements" | "uses"
       })
```

### ACT

Generate documentation:

```
1. GENERATE each section:
   
   document_content = []
   
   FOR section in structure:
     items = content_mapping[section]
     
     section_content = generate_section(
       title: section,
       items: items,
       style: style_guide,
       audience: audience
     )
     
     # Add examples if planned
     IF section in planned_examples:
       example = generate_or_adapt_example(
         spec: planned_examples[section],
         decision: example_decisions[section],
         existing: existing_examples
       )
       section_content += format_example(example)
       examples_generated.append(example)
     
     document_content.append(section_content)
     sections_written.add(section)

2. ADD cross-references:
   
   FOR xref in cross_references:
     insert_link(
       document: document_content,
       at: xref.from,
       to: xref.to,
       text: xref.relationship
     )

3. FORMAT document:
   
   IF style_guide:
     document = apply_style(document_content, style_guide)
   ELSE:
     document = format_markdown(document_content)

4. GENERATE updates for existing docs:
   
   IF existing_docs:
     FOR existing_doc in existing_docs:
       diff = calculate_updates(
         existing: Read(existing_doc),
         new_items: undocumented relevant to existing_doc
       )
       IF diff:
         updates.append({
           path: existing_doc,
           changes: diff
         })

5. CALCULATE coverage:
   
   coverage = {
     total_items: len(documentable_items),
     documented: len(sections_written),
     with_examples: len(examples_generated),
     percentage: len(documented) / len(total_items)
   }

6. OUTPUT documents:
   
   FOR doc in documents:
     Write(doc.path, doc.content)
   
   FOR update in updates:
     apply_update(update)

7. EMIT completion:
   
   EMIT documentation_complete {
     doc_type: doc_type,
     sections: len(sections_written),
     examples: len(examples_generated),
     coverage: coverage.percentage
   }
```

## Termination Conditions

- **Success**: All required sections documented with acceptable coverage
- **Failure**: Cannot extract documentable content from source
- **Timeout**: Max generation time reached

## Composition

### Can contain (nested loops)
- None (leaf authoring loop)

### Can be contained by
- `authoring/spec-drafting` (generate docs from spec)
- `authoring/code-generation` (generate docs alongside code)
- Workflow commands

### Parallelizable
- Yes: Different doc types can be generated in parallel
- Yes: Different sections can be generated in parallel

## Signals Emitted

| Signal | When | Payload |
|--------|------|---------|
| `section_written` | Section complete | `{ section, word_count }` |
| `example_generated` | Example created | `{ section, example_type }` |
| `gap_identified` | Missing content | `{ section, missing_items }` |
| `documentation_complete` | All done | `{ doc_type, coverage }` |

## Documentation Templates

### API Endpoint Template

```markdown
### {METHOD} {path}

{description}

**Authentication**: {auth_requirement}

**Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| {name} | {type} | {yes/no} | {description} |

**Request Body**

```json
{example_request}
```

**Response**

```json
{example_response}
```

**Errors**

| Code | Description |
|------|-------------|
| {code} | {description} |
```

### Function Documentation Template

```markdown
### `{function_name}({params})`

{description}

**Parameters**

- `{param}` ({type}): {description}

**Returns**

{return_type}: {description}

**Example**

```{language}
{example_code}
```
```

## Example Usage

```markdown
## Generate API Documentation

Execute @loops/authoring/documentation.md with:
  INPUT:
    source: { type: "api", endpoints: api_endpoints }
    doc_type: "api_reference"
    audience: "api_consumers"
    style_guide: openapi_style
  
  ON section_written:
    LOG "Documented: {section}"
  
  ON documentation_complete:
    IF coverage.percentage < 0.9:
      FLAG incomplete documentation
    ELSE:
      PUBLISH to docs site
```
