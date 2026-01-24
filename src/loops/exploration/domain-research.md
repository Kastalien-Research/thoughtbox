---
type: exploration
speed: slow
scope: session
interface_version: loop-interface@1.0
description: Gather external context, standards, and best practices for a domain.
---
# Domain Research Loop

Gather external context, standards, and best practices for a domain.

**Version**: 1.0.0
**Interface**: loop-interface@1.0

## Classification

- **Type**: exploration
- **Speed**: slow (~2-5 minutes)
- **Scope**: session

## Interface

### Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| domain | Text | yes | Domain or topic to research |
| questions | List<Text> | no | Specific questions to answer |
| source_types | List<SourceType> | no | Types of sources to consult |
| depth | "overview" \| "detailed" \| "comprehensive" | no | Research depth (default: detailed) |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| findings | List<Finding> | Key information discovered |
| standards | List<Standard> | Relevant standards and specifications |
| best_practices | List<BestPractice> | Industry best practices |
| patterns | List<DomainPattern> | Common architectural patterns |
| terminology | Map<Term, Definition> | Domain glossary |
| sources | List<Source> | All sources consulted |
| unanswered | List<Text> | Questions that couldn't be answered |

### State

| Field | Type | Description |
|-------|------|-------------|
| queries_executed | List<Query> | Searches performed |
| sources_consulted | Set<URL> | URLs already read |
| confidence_scores | Map<Finding, Score> | Confidence per finding |

## OODA Phases

### OBSERVE

Gather information from multiple source types:

```
1. FORMULATE search queries:
   
   base_queries = [
     f"{domain} best practices",
     f"{domain} architecture patterns",
     f"{domain} standards specification",
     f"{domain} implementation guide"
   ]
   
   IF questions provided:
     specific_queries = [format_as_query(q) for q in questions]
     queries = base_queries + specific_queries
   ELSE:
     queries = base_queries

2. EXECUTE searches by source type:
   
   IF "web" in source_types:
     web_results = []
     FOR each query in queries:
       results = WebSearch(query, num_results=5)
       web_results.extend(results)
   
   IF "documentation" in source_types:
     doc_results = []
     # Search official documentation sites
     doc_sites = identify_official_docs(domain)
     FOR each site in doc_sites:
       results = WebSearch(f"site:{site} {domain}")
       doc_results.extend(results)
   
   IF "academic" in source_types:
     academic_results = []
     # Search academic sources
     results = WebSearch(f"{domain} research paper OR whitepaper")
     academic_results.extend(results)
   
   IF "github" in source_types:
     github_results = []
     # Search for reference implementations
     results = WebSearch(f"site:github.com {domain} example OR reference")
     github_results.extend(results)

3. SCRAPE and extract content:
   
   FOR each result in all_results:
     IF result.url not in sources_consulted:
       content = Scrape(result.url)
       extracted = extract_relevant_sections(content, domain)
       
       sources_consulted.add(result.url)
       raw_findings.append({
         source: result.url,
         content: extracted,
         source_type: result.type,
         query: result.query
       })

4. IDENTIFY standards:
   
   standard_patterns = [
     r"RFC\s*\d+",           # IETF RFCs
     r"ISO\s*\d+",           # ISO standards
     r"W3C\s+\w+",           # W3C specs
     r"OWASP\s+\w+",         # Security standards
     r"PCI\s*DSS",           # Payment standards
     r"GDPR|CCPA|HIPAA"      # Compliance
   ]
   
   FOR each finding in raw_findings:
     FOR each pattern in standard_patterns:
       matches = regex_find(pattern, finding.content)
       IF matches:
         standards_mentioned.extend(matches)

SIGNALS:
  raw_findings: unprocessed search results
  standards_mentioned: potential standards to investigate
  source_coverage: types of sources consulted
```

### ORIENT

Synthesize findings into structured knowledge:

```
1. DEDUPLICATE and consolidate:
   
   # Group findings by topic
   topic_groups = cluster_by_similarity(raw_findings)
   
   # Merge overlapping information
   FOR each group in topic_groups:
     consolidated = merge_findings(group)
     consolidated.confidence = calculate_confidence(
       source_count=len(group),
       source_diversity=unique_source_types(group),
       recency=avg_publish_date(group)
     )
     findings.append(consolidated)

2. EXTRACT best practices:
   
   practice_indicators = [
     "best practice",
     "recommended",
     "should",
     "always",
     "never",
     "avoid",
     "prefer"
   ]
   
   FOR each finding in findings:
     practices = extract_with_indicators(finding, practice_indicators)
     FOR each practice in practices:
       best_practices.append({
         practice: practice.text,
         source: practice.source,
         rationale: practice.context,
         confidence: finding.confidence
       })

3. IDENTIFY patterns:
   
   pattern_indicators = [
     "pattern",
     "architecture",
     "approach",
     "design",
     "structure",
     "model"
   ]
   
   FOR each finding in findings:
     pattern_mentions = extract_with_indicators(finding, pattern_indicators)
     FOR each mention in pattern_mentions:
       IF is_concrete_pattern(mention):
         patterns.append({
           name: extract_pattern_name(mention),
           description: mention.context,
           use_case: extract_use_case(mention),
           trade_offs: extract_trade_offs(mention)
         })

4. BUILD terminology:
   
   # Extract definitions
   definition_patterns = [
     r"(\w+)\s+is\s+(?:a|an|the)\s+(.+)",
     r"(\w+):\s+(.+)",
     r"(\w+)\s+refers to\s+(.+)"
   ]
   
   FOR each finding in findings:
     definitions = extract_definitions(finding, definition_patterns)
     FOR term, definition in definitions:
       IF term.lower() related_to domain:
         terminology[term] = definition

5. ASSESS answer coverage:
   
   IF questions provided:
     FOR each question in questions:
       answered = any(
         finding answers question
         for finding in findings
       )
       IF not answered:
         unanswered.append(question)
```

### DECIDE

Evaluate research completeness:

```
1. CHECK coverage metrics:
   
   source_diversity = len(unique(source_types consulted))
   question_coverage = (len(questions) - len(unanswered)) / len(questions)
   confidence_avg = avg(finding.confidence for finding in findings)

2. DETERMINE next action:
   
   IF depth == "comprehensive" AND confidence_avg < 0.8:
     decision = "EXPAND"
     action = generate_follow_up_queries(low_confidence_findings)
   
   ELIF len(unanswered) > 0 AND depth != "overview":
     decision = "DEEP_DIVE"
     action = focused_search_for(unanswered)
   
   ELIF source_diversity < expected_for_depth:
     decision = "DIVERSIFY"
     action = search_missing_source_types()
   
   ELSE:
     decision = "COMPLETE"
     action = finalize_outputs()

3. VALIDATE findings:
   
   # Cross-reference between sources
   FOR each finding in findings:
     corroboration = count_sources_agreeing(finding)
     IF corroboration < 2 AND finding.confidence < 0.7:
       finding.flag = "needs_verification"
```

### ACT

Produce research outputs:

```
1. PRIORITIZE findings:
   
   findings.sort(by=[
     confidence descending,
     relevance_to_questions descending,
     recency descending
   ])

2. FORMAT outputs:
   
   # Structure standards with details
   FOR each standard in standards:
     IF standard not already detailed:
       detail = lookup_standard_details(standard)
       standards_detailed.append({
         identifier: standard,
         full_name: detail.name,
         relevance: detail.relevance_to_domain,
         key_requirements: detail.requirements,
         link: detail.url
       })
   
   # Structure best practices by category
   best_practices_grouped = group_by_category(best_practices)

3. GENERATE summary:
   
   research_summary = {
     domain: domain,
     key_findings: top_5_findings,
     applicable_standards: standards_detailed,
     recommended_practices: top_5_practices,
     common_patterns: patterns,
     terminology_count: len(terminology),
     confidence_level: confidence_avg,
     gaps: unanswered
   }

4. EMIT completion:
   
   EMIT research_complete {
     domain: domain,
     findings_count: len(findings),
     standards_count: len(standards),
     practices_count: len(best_practices),
     coverage: question_coverage,
     confidence: confidence_avg
   }

5. RETURN:
   
   RETURN {
     findings,
     standards: standards_detailed,
     best_practices: best_practices_grouped,
     patterns,
     terminology,
     sources,
     unanswered
   }
```

## Termination Conditions

- **Success**: Sufficient coverage with acceptable confidence
- **Failure**: No relevant sources found or all searches fail
- **Timeout**: Max research time reached (preserve partial results)

## Composition

### Can contain (nested loops)
- None (leaf exploration loop)

### Can be contained by
- `exploration/problem-space` (for domain context)
- `authoring/spec-drafting` (for standards compliance)
- `verification/fact-checking` (for claim verification)

### Parallelizable
- Yes: Different questions can be researched in parallel
- Yes: Different source types can be searched in parallel

## Signals Emitted

| Signal | When | Payload |
|--------|------|---------|
| `source_consulted` | URL scraped | `{ url, source_type, relevance }` |
| `finding_extracted` | Key info found | `{ finding, confidence, sources }` |
| `standard_identified` | Standard referenced | `{ standard, relevance }` |
| `research_complete` | Research done | `{ summary_stats }` |

## Source Types

```typescript
type SourceType =
  | "web"           // General web search
  | "documentation" // Official docs
  | "academic"      // Papers, whitepapers
  | "github"        // Reference implementations
  | "stackoverflow" // Community knowledge
  | "rfc"           // IETF standards
  | "spec"          // W3C, ECMA specs
```

## Example Usage

```markdown
## Research Phase

Execute @loops/exploration/domain-research.md with:
  INPUT:
    domain: "OAuth 2.0 authentication"
    questions: [
      "What are the security best practices for token storage?",
      "How should refresh tokens be handled?",
      "What are the PKCE requirements?"
    ]
    source_types: ["documentation", "rfc", "web"]
    depth: "detailed"
  
  ON standard_identified:
    ADD to spec requirements section
  
  ON research_complete:
    USE findings to inform design
    USE terminology for spec glossary
    INCLUDE standards in compliance section
```

## Output Example

```yaml
findings:
  - topic: "Token Storage"
    content: "Access tokens should be stored in memory, not localStorage..."
    confidence: 0.95
    sources: ["oauth.net", "auth0.com/docs"]

standards:
  - identifier: "RFC 6749"
    full_name: "The OAuth 2.0 Authorization Framework"
    relevance: "Core specification"
    key_requirements: ["Authorization endpoint", "Token endpoint"]
  - identifier: "RFC 7636"
    full_name: "PKCE for OAuth Public Clients"
    relevance: "Required for SPAs and mobile apps"

best_practices:
  security:
    - practice: "Use PKCE for all public clients"
      rationale: "Prevents authorization code interception"
    - practice: "Store tokens in memory, not localStorage"
      rationale: "Prevents XSS token theft"

terminology:
  "Access Token": "Short-lived credential for API access"
  "Refresh Token": "Long-lived credential for obtaining new access tokens"
  "PKCE": "Proof Key for Code Exchange, prevents code interception"
```
