---
type: verification
speed: medium
scope: item
interface_version: loop-interface@1.0
description: Verify claims against sources of truth with confidence scoring.
---
# Fact Checking Loop

Verify claims against sources of truth with confidence scoring.

**Version**: 1.0.0
**Interface**: loop-interface@1.0

## Classification

- **Type**: verification
- **Speed**: medium (~15-60s per claim)
- **Scope**: item (single claim)

## Interface

### Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| claim | Claim | yes | The claim to verify |
| source_types | List<SourceType> | no | Types of sources to check |
| confidence_threshold | Score | no | Min confidence to accept (default: 0.85) |
| auto_correct | Boolean | no | Whether to generate corrections (default: true) |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| verdict | Verdict | Verification result |
| confidence | Score | Confidence in verdict |
| evidence | List<Evidence> | Supporting/contradicting evidence |
| correction | Correction | Suggested fix if claim is false |
| sources | List<Source> | All sources consulted |

### State

| Field | Type | Description |
|-------|------|-------------|
| evidence_collected | List<Evidence> | Evidence gathered so far |
| sources_checked | Set<Source> | Sources already consulted |

## Types

```typescript
type Claim = {
  id: string
  text: string
  source_document: string
  line_number: number
  category: "codebase" | "external" | "internal"
}

type Verdict = 
  | "VERIFIED"      // Claim is accurate
  | "CONTRADICTED"  // Claim conflicts with evidence
  | "OUTDATED"      // Claim was true but is no longer
  | "UNVERIFIABLE"  // Cannot find evidence either way
  | "PARTIAL"       // Partially true, needs nuance

type Evidence = {
  type: "supporting" | "contradicting" | "contextual"
  source: Source
  content: string
  relevance: Score
  recency: Date
}

type SourceType =
  | "codebase"      // Search actual code
  | "documentation" // Official docs
  | "web"           // Web search
  | "api"           // Live API calls
  | "database"      // Database queries
```

## OODA Phases

### OBSERVE

Gather evidence for the claim:

```
1. PARSE claim:
   
   # Extract verifiable components
   entities = extract_entities(claim.text)
   # Functions, classes, endpoints, values
   
   assertions = extract_assertions(claim.text)
   # "X does Y", "X returns Z", "X is configured as W"
   
   quantifiers = extract_quantifiers(claim.text)
   # "always", "never", "up to N", "at least M"

2. SEARCH by source type:
   
   IF "codebase" in source_types:
     FOR entity in entities:
       # Search for entity in code
       results = SemanticSearch(
         query: f"Where is {entity} defined or used?",
         target: codebase
       )
       
       FOR result in results:
         code_content = Read(result.file, result.lines)
         evidence_collected.append({
           type: assess_support(code_content, claim),
           source: { type: "codebase", location: result },
           content: code_content,
           relevance: result.score,
           recency: file_modified_date(result.file)
         })
       
       sources_checked.add(result.file)
   
   IF "documentation" in source_types:
     # Search official documentation
     doc_query = formulate_doc_query(claim, entities)
     results = search_docs(doc_query)
     
     FOR result in results:
       evidence_collected.append({
         type: assess_support(result.content, claim),
         source: { type: "documentation", url: result.url },
         content: result.relevant_section,
         relevance: result.score,
         recency: result.last_updated
       })
   
   IF "web" in source_types:
     # Web search for external claims
     web_query = formulate_web_query(claim)
     results = WebSearch(web_query)
     
     FOR result in results[:5]:
       content = Scrape(result.url)
       relevant = extract_relevant_section(content, claim)
       
       evidence_collected.append({
         type: assess_support(relevant, claim),
         source: { type: "web", url: result.url },
         content: relevant,
         relevance: calculate_relevance(relevant, claim),
         recency: extract_date(content)
       })
   
   IF "api" in source_types:
     # Make live API calls to verify
     FOR assertion in assertions:
       IF is_api_verifiable(assertion):
         response = call_api(assertion.endpoint, assertion.params)
         
         evidence_collected.append({
           type: compare_response(response, assertion.expected),
           source: { type: "api", endpoint: assertion.endpoint },
           content: response,
           relevance: 1.0,  # Direct verification
           recency: now()
         })

3. ASSESS evidence quality:
   
   FOR evidence in evidence_collected:
     evidence.quality_score = calculate_quality(
       source_authority: source_authority(evidence.source),
       recency: days_since(evidence.recency),
       relevance: evidence.relevance,
       specificity: how_specific(evidence.content, claim)
     )

SIGNALS:
  evidence_collected: all evidence with assessments
  sources_checked: sources consulted
```

### ORIENT

Synthesize evidence into verdict:

```
1. CATEGORIZE evidence:
   
   supporting = filter(evidence_collected, type == "supporting")
   contradicting = filter(evidence_collected, type == "contradicting")
   contextual = filter(evidence_collected, type == "contextual")

2. WEIGHT evidence:
   
   # Higher weight for authoritative, recent, relevant sources
   supporting_weight = sum(
     e.quality_score * e.relevance 
     for e in supporting
   )
   
   contradicting_weight = sum(
     e.quality_score * e.relevance 
     for e in contradicting
   )
   
   total_weight = supporting_weight + contradicting_weight

3. DETERMINE initial verdict:
   
   IF total_weight == 0:
     initial_verdict = "UNVERIFIABLE"
     confidence = 0.0
   
   ELIF contradicting_weight > supporting_weight * 1.5:
     initial_verdict = "CONTRADICTED"
     confidence = contradicting_weight / total_weight
   
   ELIF supporting_weight > contradicting_weight * 1.5:
     initial_verdict = "VERIFIED"
     confidence = supporting_weight / total_weight
   
   ELSE:
     initial_verdict = "PARTIAL"
     confidence = abs(supporting_weight - contradicting_weight) / total_weight

4. CHECK for outdated:
   
   IF initial_verdict == "CONTRADICTED":
     # Check if claim was previously true
     old_evidence = filter(evidence_collected, 
       recency < claim_date AND type == "supporting"
     )
     new_evidence = filter(evidence_collected,
       recency > claim_date AND type == "contradicting"
     )
     
     IF len(old_evidence) > 0 AND len(new_evidence) > 0:
       initial_verdict = "OUTDATED"

5. IDENTIFY key evidence:
   
   # Select most important evidence for each category
   key_supporting = top_k(supporting, by=quality_score, k=3)
   key_contradicting = top_k(contradicting, by=quality_score, k=3)
```

### DECIDE

Commit to verdict and correction strategy:

```
1. FINALIZE verdict:
   
   IF confidence >= confidence_threshold:
     final_verdict = initial_verdict
   ELIF initial_verdict in ["VERIFIED", "CONTRADICTED"]:
     final_verdict = "PARTIAL"
     # Lower confidence means less certainty
   ELSE:
     final_verdict = initial_verdict

2. DECIDE on correction:
   
   IF auto_correct AND final_verdict in ["CONTRADICTED", "OUTDATED", "PARTIAL"]:
     should_correct = True
     
     IF final_verdict == "CONTRADICTED":
       correction_type = "replace"
       # Generate replacement from evidence
     
     ELIF final_verdict == "OUTDATED":
       correction_type = "update"
       # Update with current information
     
     ELIF final_verdict == "PARTIAL":
       correction_type = "clarify"
       # Add nuance or qualifications
   ELSE:
     should_correct = False

3. ASSESS correction confidence:
   
   IF should_correct:
     correction_confidence = min(
       confidence,
       avg(e.quality_score for e in key_contradicting)
     )
```

### ACT

Generate outputs:

```
1. FORMAT evidence:
   
   evidence_output = []
   
   FOR e in key_supporting + key_contradicting:
     evidence_output.append({
       type: e.type,
       source: format_source(e.source),
       content: truncate(e.content, 500),
       relevance: e.relevance,
       recency: e.recency
     })

2. GENERATE correction if needed:
   
   IF should_correct:
     IF correction_type == "replace":
       # Generate replacement claim from contradicting evidence
       correction = {
         type: "replace",
         original: claim.text,
         corrected: generate_corrected_claim(
           claim, 
           key_contradicting
         ),
         confidence: correction_confidence,
         sources: [e.source for e in key_contradicting]
       }
     
     ELIF correction_type == "update":
       correction = {
         type: "update",
         original: claim.text,
         corrected: update_claim_with_current(
           claim,
           key_contradicting
         ),
         confidence: correction_confidence,
         note: "Information has changed since original writing"
       }
     
     ELIF correction_type == "clarify":
       correction = {
         type: "clarify",
         original: claim.text,
         corrected: add_nuance(
           claim,
           key_supporting,
           key_contradicting
         ),
         confidence: correction_confidence,
         note: "Added qualifications for accuracy"
       }
   ELSE:
     correction = None

3. EMIT verdict:
   
   IF final_verdict == "VERIFIED":
     EMIT claim_verified {
       claim_id: claim.id,
       confidence: confidence,
       key_evidence: key_supporting[0] if key_supporting else None
     }
   
   ELIF final_verdict == "CONTRADICTED":
     EMIT claim_contradicted {
       claim_id: claim.id,
       confidence: confidence,
       contradiction: key_contradicting[0].content
     }
   
   ELIF final_verdict == "OUTDATED":
     EMIT claim_outdated {
       claim_id: claim.id,
       was_true_until: estimate_change_date(evidence_collected)
     }
   
   ELIF final_verdict == "UNVERIFIABLE":
     EMIT claim_unverifiable {
       claim_id: claim.id,
       sources_checked: len(sources_checked)
     }

4. RETURN:
   
   RETURN {
     verdict: final_verdict,
     confidence: confidence,
     evidence: evidence_output,
     correction: correction,
     sources: list(sources_checked)
   }
```

## Termination Conditions

- **Success**: Verdict determined with confidence >= threshold
- **Failure**: N/A (always produces a verdict)
- **Timeout**: Max search time reached → return with available evidence

## Composition

### Can contain (nested loops)
- None (atomic verification loop)

### Can be contained by
- `orchestration/queue-processor` (batch fact-checking)
- Workflow commands (`/fact-check-standalone`)

### Parallelizable
- Yes: Independent claims can be verified in parallel

## Signals Emitted

| Signal | When | Payload |
|--------|------|---------|
| `claim_verified` | Claim is accurate | `{ claim_id, confidence, evidence }` |
| `claim_contradicted` | Claim conflicts with evidence | `{ claim_id, contradiction }` |
| `claim_outdated` | Claim was true but changed | `{ claim_id, was_true_until }` |
| `claim_unverifiable` | Cannot determine | `{ claim_id, sources_checked }` |
| `correction_generated` | Fix suggested | `{ claim_id, correction }` |

## Evidence Quality Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Source Authority | 0.3 | Official docs > blogs > forums |
| Recency | 0.25 | Newer > older |
| Relevance | 0.25 | Direct match > tangential |
| Specificity | 0.2 | Exact quote > general mention |

## Example Usage

```markdown
## Fact-Check Documentation

FOR each claim in extracted_claims:
  
  Execute @loops/verification/fact-checking.md with:
    INPUT:
      claim: claim
      source_types: ["codebase", "documentation"]
      confidence_threshold: 0.85
      auto_correct: true
    
    ON claim_verified:
      MARK claim as verified
    
    ON claim_contradicted:
      IF correction.confidence > 0.8:
        APPLY correction automatically
      ELSE:
        FLAG for manual review
    
    ON claim_outdated:
      APPLY correction with "updated" annotation
    
    ON claim_unverifiable:
      FLAG for manual verification
```
