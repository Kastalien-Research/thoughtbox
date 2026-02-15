# Validation Report: OODA Loops as MCP Prompts/Resources

**Spec**: loops-mcp-composition-system.md
**Validated**: 2026-01-19
**Status**: ✅ READY FOR IMPLEMENTATION (with clarifications)

## Executive Summary

**Score**: 85/100

The specification is well-structured and feasible. It clearly defines the problem, requirements, and implementation approach. Minor gaps exist around error handling, parsing edge cases, and deployment logistics.

**Critical Issues**: None
**Warnings**: 3
**Recommendations**: 5

## Requirement Analysis

### REQ-1: Loop Discovery via MCP Resources ✓ VALID

**Status**: Clear and feasible
**Baseline Code**: Similar pattern exists in `src/prompts/index.ts` (getInterleavedResourceTemplates, getInterleavedGuideForUri)

**Validation**:
- ✅ URI pattern well-defined
- ✅ Metadata structure specified
- ⚠️ **GAP**: How to handle loops with frontmatter vs. without?

**Recommendation**: Specify fallback behavior for loops without frontmatter.

### REQ-2: Loop Content as Prompts ✓ VALID

**Status**: Clear, optional (SHOULD priority)
**Baseline Code**: Existing prompt registration pattern in `server-factory.ts:588-722`

**Validation**:
- ✅ Follows established pattern
- ✅ Variable substitution approach defined
- ⚠️ **GAP**: Which variables? Loop-specific or generic?

**Recommendation**: Create variable substitution spec per loop type.

### REQ-3: Loop Metadata API ✓ VALID

**Status**: Clear requirements
**Baseline Code**: MentalModelsHandler has metadata patterns (`src/mental-models/index.ts`)

**Validation**:
- ✅ Metadata structure defined
- ✅ Composition validation mentioned
- ⚠️ **FEASIBILITY RISK**: "Interface compatibility checking" - complex logic

**Recommendation**: Defer compatibility checking to Phase 2, start with simple metadata exposure.

### REQ-4: Resource Templates ✓ VALID

**Status**: Clear, follows existing patterns
**Baseline Code**: Lines 435-437 in `server-factory.ts`

**Validation**:
- ✅ Template syntax correct
- ✅ Matches existing interleaved pattern
- ✅ Well-defined URI scheme

### REQ-5: File System Integration ✓ VALID

**Status**: Two approaches specified (dynamic vs static)
**Baseline Code**: `scripts/embed-templates.ts` exists as reference

**Validation**:
- ✅ Hybrid approach reasonable
- ✅ Build-time embedding safer than runtime I/O
- ✓ **PATTERN MATCH**: Follows existing template embedding

## Architectural Alignment

### Pattern Consistency ✓

The spec follows established Thoughtbox patterns:
- Resource templates (✓ like interleaved guides)
- Prompt registration (✓ like spec-designer)
- Build-time embedding (✓ like template system)

### Abstraction Match ✓

Not reinventing wheels:
- Uses existing `server.registerResource()` API
- Follows MCP resource template spec
- Reuses embed-templates script pattern

## Gap Analysis

### Missing Requirements

1. **Error Handling**
   - What if a loop file is malformed?
   - What if frontmatter parsing fails?
   - What if a referenced loop doesn't exist?

2. **Deployment Logistics**
   - Must `.claude/commands/loops/` be in Docker image?
   - Or only embedded `loops-content.ts` in dist/?
   - **Answer**: Embedded only (per hybrid approach), but clarify

3. **Frontmatter Schema**
   - What fields are required?
   - What's the parsing library?
   - Validation rules?

4. **Loop Content Format**
   - All loops use `## Variables` section for substitution?
   - What if a loop doesn't follow interface spec?

5. **Catalog Index Structure**
   - JSON schema for `thoughtbox://loops/index`?
   - How are loops sorted/grouped?

### Edge Cases Unhandled

1. Loop with no OODA sections → serve as-is or error?
2. Loop references another loop → resolve URI or leave as @reference?
3. Loop has external dependencies → document or ignore?
4. Multiple loops with same name in different categories → URI collision?

## Security & Safety

### Tenant Isolation ✓

Loops are read-only resources, no user data involved. No isolation concerns.

### Input Validation ⚠️

**Issue**: URI parameters not validated
**Recommendation**: Add validation for `{category}` and `{name}` params:
```typescript
const validCategories = ['exploration', 'authoring', 'refinement', 'verification', 'orchestration', 'meta'];
if (!validCategories.includes(category)) {
  throw new Error(`Invalid category: ${category}`);
}
```

### Injection Risks ✓

No injection risk - serving static markdown content.

## Complexity Assessment

| Requirement | Complexity (1-10) | Rationale |
|-------------|-------------------|-----------|
| REQ-1 | 4 | Resource templates straightforward, URI routing simple |
| REQ-2 | 6 | Prompt registration + variable substitution per loop |
| REQ-3 | 7 | Metadata extraction + composition validation logic |
| REQ-4 | 3 | Copy existing pattern |
| REQ-5 | 5 | Build script similar to embed-templates |

**Overall Complexity**: Medium (5.0/10)

## Implementation Risks

### High Risk: Parsing Frontmatter

**Risk**: Frontmatter format not standardized across loops
**Mitigation**:
1. Audit existing loops for frontmatter consistency
2. Define strict schema
3. Add validation in embed script

### Medium Risk: Build Step Integration

**Risk**: npm run build must succeed or deployment fails
**Mitigation**:
1. Make embed-loops idempotent
2. Add tests for generated content
3. CI validation

### Low Risk: URI Resolution

**Risk**: URI routing logic breaks
**Mitigation**: Existing pattern proven (interleaved guides)

## Traceability Matrix

| Requirement | Status | Baseline Code | Conflicts | Suggested Change |
|-------------|--------|---------------|-----------|------------------|
| REQ-1: Discovery | ✓ | getInterleavedGuideForUri | None | Add category validation |
| REQ-2: Prompts | ✓ | SPEC_DESIGNER_PROMPT | None | Define variable schema |
| REQ-3: Metadata | ⚠ | MentalModelsHandler | Complexity | Defer composition validation |
| REQ-4: Templates | ✓ | getInterleavedResourceTemplates | None | None |
| REQ-5: Embedding | ✓ | embed-templates.ts | None | Clarify deployment |

## Recommended Spec Updates

### 1. Add Frontmatter Schema Section

```markdown
## Frontmatter Schema

All loops MUST include YAML frontmatter:

```yaml
---
type: exploration | authoring | refinement | verification | orchestration
speed: slow | medium | fast
scope: session | document | item | line
interface_version: "1.0"
inputs:
  - name: prompt
    type: string
    required: true
outputs:
  - name: result
    type: object
---
```

Missing frontmatter → default to type="unknown", speed="medium", scope="document"
\`\`\`

### 2. Clarify Deployment in REQ-5

Update to specify:
> Generated `src/resources/loops-content.ts` is the ONLY source at runtime. The `.claude/commands/loops/` directory is NOT deployed to Docker image.

### 3. Add Error Handling Requirement

**New REQ-6: Error Handling**

- Invalid category/name → 404 with helpful message listing valid options
- Malformed frontmatter → serve loop without metadata, log warning
- Missing loop file during build → fail build with clear error

### 4. Specify Variable Substitution Format

For REQ-2, clarify:
> Loops using `## Variables` section with `$ARGUMENTS` placeholders follow the pattern:
> ```
> VARIABLE_NAME: $ARGUMENTS (default: value)
> ```
>
> Prompt registration extracts these and creates `argsSchema` automatically.

### 5. Add Loop Catalog JSON Schema

For REQ-3, define:
```typescript
interface LoopCatalog {
  categories: {
    [category: string]: {
      loops: {
        [name: string]: {
          uri: string;
          type: string;
          speed: string;
          scope: string;
          description: string;
          inputs: LoopInput[];
          outputs: LoopOutput[];
        };
      };
    };
  };
}
```

## Quality Gates

| Gate | Status |
|------|--------|
| All requirements identified | ✅ |
| Abstractions identified | ✅ |
| Logic consistent | ✅ |
| Architecture aligned | ✅ |
| Security checked | ✅ |
| Edge cases documented | ⚠️ (added above) |
| Traceability matrix complete | ✅ |

## Conclusion

**Recommendation**: ✅ APPROVE with clarifications

The specification is solid and ready for implementation. Address the 5 recommended updates (frontmatter schema, deployment clarification, error handling, variable substitution format, catalog JSON schema) and this spec is production-ready.

**Estimated Implementation Effort**: 2-3 days for core functionality (REQ-1, REQ-4, REQ-5), +1 day for prompts (REQ-2), +1-2 days for metadata API (REQ-3).

**Suggested Implementation Order**:
1. Phase 1: Embedding (REQ-5) - establishes foundation
2. Phase 1: Resource templates (REQ-1, REQ-4) - exposes loops
3. Phase 2: Prompts (REQ-2) - enables direct execution
4. Phase 3: Metadata API (REQ-3) - advanced composition

---

**Validator**: Claude (Sonnet 4.5)
**Mode**: Systematic validation following spec-validator protocol
**Perspectives Applied**: Logician, Architect, Security Guardian, Implementer
