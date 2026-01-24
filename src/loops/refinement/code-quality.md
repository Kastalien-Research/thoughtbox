---
type: refinement
speed: fast
scope: file
interface_version: loop-interface@1.0
description: Improve code quality through systematic analysis and refinement.
---
# Code Quality Loop

Improve code quality through systematic analysis and refinement.

**Version**: 1.0.0
**Interface**: loop-interface@1.0

## Classification

- **Type**: refinement
- **Speed**: fast (~10-30s per file)
- **Scope**: file or function

## Interface

### Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| code | CodeUnit | yes | Code to refine (file, function, or snippet) |
| quality_dimensions | List<Dimension> | no | Which aspects to focus on |
| conventions | List<Convention> | no | Coding conventions to enforce |
| threshold | Score | no | Minimum quality score (default: 0.85) |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| refined_code | CodeUnit | Improved code |
| quality_score | Score | Final quality score |
| improvements | List<Improvement> | Changes made with rationale |
| remaining_issues | List<Issue> | Issues not auto-fixable |
| metrics | QualityMetrics | Detailed quality metrics |

### State

| Field | Type | Description |
|-------|------|-------------|
| iteration | Number | Refinement iteration |
| score_history | List<Score> | Score at each iteration |
| changes_made | List<Change> | All changes across iterations |

## Types

```typescript
type Dimension =
  | "readability"      // Clear, understandable code
  | "maintainability"  // Easy to modify and extend
  | "performance"      // Efficient execution
  | "security"         // Safe from vulnerabilities
  | "testability"      // Easy to test
  | "idiom"            // Language-idiomatic patterns

type QualityMetrics = {
  complexity: {
    cyclomatic: number
    cognitive: number
  }
  size: {
    lines: number
    functions: number
    avg_function_length: number
  }
  documentation: {
    coverage: number
    quality: number
  }
  naming: {
    consistency: number
    descriptiveness: number
  }
}
```

## OODA Phases

### OBSERVE

Analyze code quality across dimensions:

```
1. PARSE code structure:
   
   ast = parse_to_ast(code)
   
   functions = extract_functions(ast)
   classes = extract_classes(ast)
   variables = extract_variables(ast)
   imports = extract_imports(ast)
   comments = extract_comments(ast)

2. MEASURE complexity:
   
   FOR each function in functions:
     function.cyclomatic = calculate_cyclomatic(function)
     function.cognitive = calculate_cognitive(function)
     function.nesting_depth = calculate_max_nesting(function)
   
   overall_complexity = {
     cyclomatic: avg(f.cyclomatic for f in functions),
     cognitive: avg(f.cognitive for f in functions),
     max_nesting: max(f.nesting_depth for f in functions)
   }

3. ASSESS readability:
   
   readability_signals = {
     avg_line_length: avg(len(line) for line in code.lines),
     max_line_length: max(len(line) for line in code.lines),
     avg_function_length: avg(len(f.lines) for f in functions),
     naming_quality: assess_naming(variables, functions, classes),
     comment_ratio: len(comments) / len(code.lines)
   }

4. CHECK security:
   
   security_patterns = [
     { pattern: "eval(", severity: "high", issue: "Code injection risk" },
     { pattern: "innerHTML", severity: "medium", issue: "XSS risk" },
     { pattern: "SQL.*\\+", severity: "high", issue: "SQL injection" },
     { pattern: "password.*=.*['\"]", severity: "high", issue: "Hardcoded credential" },
     { pattern: "// TODO.*security", severity: "medium", issue: "Security TODO" }
   ]
   
   FOR pattern in security_patterns:
     matches = grep(code, pattern.pattern)
     IF matches:
       security_issues.append({pattern, matches})

5. VERIFY conventions:
   
   IF conventions:
     FOR convention in conventions:
       violations = check_convention(code, convention)
       IF violations:
         convention_issues.extend(violations)

6. CALCULATE dimension scores:
   
   scores = {
     readability: score_readability(readability_signals),
     maintainability: score_maintainability(complexity, size),
     performance: score_performance(code, ast),
     security: 1.0 - (len(security_issues) * 0.2),
     testability: score_testability(functions, dependencies),
     idiom: score_idiom(code, language_patterns)
   }
   
   # Weight by requested dimensions
   IF quality_dimensions:
     relevant_scores = {k: v for k, v in scores if k in quality_dimensions}
   ELSE:
     relevant_scores = scores
   
   composite_score = weighted_avg(relevant_scores)

SIGNALS:
  scores: per-dimension quality scores
  issues: all detected issues
  composite_score: overall quality
```

### ORIENT

Identify improvements by priority:

```
1. CATEGORIZE issues:
   
   auto_fixable = []
   manual_review = []
   
   FOR issue in all_issues:
     IF can_auto_fix(issue):
       auto_fixable.append({
         issue: issue,
         fix: generate_fix(issue),
         confidence: fix_confidence(issue),
         impact: estimate_impact(issue)
       })
     ELSE:
       manual_review.append({
         issue: issue,
         suggestion: generate_suggestion(issue),
         severity: issue.severity
       })

2. PRIORITIZE fixes:
   
   # Sort by impact and confidence
   auto_fixable.sort(by=[
     impact descending,
     confidence descending,
     severity descending
   ])
   
   # Group by type for batch application
   fix_groups = group_by_type(auto_fixable)

3. ASSESS risk:
   
   FOR fix in auto_fixable:
     fix.risk = assess_risk(
       code: code,
       change: fix.fix,
       has_tests: code.has_tests
     )
     
     IF fix.risk > risk_threshold:
       # Move to manual review
       manual_review.append(fix)
       auto_fixable.remove(fix)

4. ESTIMATE improvement:
   
   IF all auto_fixable applied:
     estimated_new_score = simulate_score_after_fixes(
       current_score: composite_score,
       fixes: auto_fixable
     )
   
   will_pass = estimated_new_score >= threshold
```

### DECIDE

Commit to refinement strategy:

```
1. EVALUATE options:
   
   IF composite_score >= threshold:
     decision = "ACCEPT"
     rationale = "Code meets quality threshold"
   
   ELIF len(auto_fixable) > 0 AND will_pass:
     decision = "REFINE"
     rationale = f"Applying {len(auto_fixable)} auto-fixes"
   
   ELIF iteration >= MAX_ITERATIONS:
     decision = "ACCEPT_WITH_ISSUES"
     rationale = f"Max iterations; {len(manual_review)} issues remain"
   
   ELSE:
     decision = "ESCALATE"
     rationale = "Cannot auto-fix to meet threshold"

2. SELECT fixes to apply:
   
   IF decision == "REFINE":
     # Apply fixes in order of impact
     fixes_this_iteration = auto_fixable[:max_fixes_per_iteration]
     
     # Ensure no conflicting fixes
     fixes_this_iteration = resolve_conflicts(fixes_this_iteration)
```

### ACT

Apply refinements:

```
1. IF decision == "ACCEPT":
   
   EMIT quality_accepted {
     score: composite_score,
     metrics: metrics
   }
   
   RETURN {
     refined_code: code,
     quality_score: composite_score,
     improvements: [],
     remaining_issues: [],
     metrics: metrics
   }

2. IF decision == "REFINE":
   
   refined_code = code
   
   FOR fix in fixes_this_iteration:
     # Apply the fix
     refined_code = apply_fix(refined_code, fix)
     
     # Record the change
     improvements.append({
       type: fix.type,
       location: fix.location,
       before: fix.original,
       after: fix.fixed,
       rationale: fix.rationale,
       dimension: fix.dimension
     })
     
     changes_made.append(fix)
   
   # Re-score
   new_score = calculate_quality_score(refined_code)
   score_history.append(new_score)
   
   IF new_score >= threshold:
     EMIT quality_improved {
       score_before: composite_score,
       score_after: new_score,
       fixes_applied: len(fixes_this_iteration)
     }
     
     RETURN {
       refined_code: refined_code,
       quality_score: new_score,
       improvements: improvements,
       remaining_issues: manual_review,
       metrics: recalculate_metrics(refined_code)
     }
   ELSE:
     iteration += 1
     RETURN to OBSERVE with refined_code

3. IF decision == "ACCEPT_WITH_ISSUES":
   
   EMIT quality_partial {
     score: composite_score,
     remaining_issues: len(manual_review)
   }
   
   RETURN {
     refined_code: code,
     quality_score: composite_score,
     improvements: improvements,
     remaining_issues: manual_review,
     metrics: metrics
   }

4. IF decision == "ESCALATE":
   
   EMIT quality_escalation {
     score: composite_score,
     blocking_issues: manual_review
   }
   
   RETURN {
     refined_code: code,
     quality_score: composite_score,
     improvements: [],
     remaining_issues: manual_review,
     metrics: metrics
   }
```

## Termination Conditions

- **Success**: `quality_score >= threshold`
- **Failure**: Cannot improve score, issues require manual review
- **Timeout**: `iteration >= MAX_ITERATIONS` (default 3)

## Composition

### Can contain (nested loops)
- None (atomic refinement loop)

### Can be contained by
- `authoring/code-generation` (post-generation polish)
- `verification/acceptance-gate` (pre-acceptance polish)
- `orchestration/queue-processor` (batch refinement)

### Parallelizable
- Yes: Independent files can be refined in parallel
- No: Interdependent code units should be sequential

## Signals Emitted

| Signal | When | Payload |
|--------|------|---------|
| `quality_accepted` | Meets threshold initially | `{ score, metrics }` |
| `quality_improved` | Score improved to threshold | `{ score_before, score_after, fixes }` |
| `quality_partial` | Best effort, issues remain | `{ score, remaining_issues }` |
| `quality_escalation` | Cannot meet threshold | `{ score, blocking_issues }` |

## Auto-Fix Patterns

| Issue Type | Auto-Fix | Confidence |
|------------|----------|------------|
| Long lines | Break at logical points | High |
| Missing semicolons | Add semicolons | High |
| Inconsistent naming | Rename to convention | Medium |
| Dead code | Remove unused | Medium |
| Complex conditionals | Extract to function | Medium |
| Magic numbers | Extract to constant | Medium |
| Nested callbacks | Convert to async/await | Medium |
| Console.log | Remove or convert to logger | High |

## Example Usage

```markdown
## Post-Generation Quality Check

FOR each generated_file:
  
  Execute @loops/refinement/code-quality.md with:
    INPUT:
      code: generated_file.content
      quality_dimensions: ["readability", "maintainability", "security"]
      conventions: project_conventions
      threshold: 0.85
    
    ON quality_improved:
      WRITE refined_code to file
      LOG "Improved {file}: {score_before} → {score_after}"
    
    ON quality_partial:
      WRITE refined_code to file
      FLAG remaining_issues for review
    
    ON quality_escalation:
      ADD to manual_review_queue
```

## Quality Scoring

| Dimension | Weight | Thresholds |
|-----------|--------|------------|
| Readability | 0.25 | >0.8 good, >0.9 excellent |
| Maintainability | 0.25 | <10 cyclomatic good |
| Performance | 0.15 | No O(n²) in hot paths |
| Security | 0.20 | No high severity issues |
| Testability | 0.10 | <5 dependencies per function |
| Idiom | 0.05 | Follows language patterns |
