export const TRADE_OFF_MATRIX_CONTENT = `# Trade-off Matrix

Map competing concerns explicitly to make balanced decisions with clear reasoning.

## When to Use
- Multiple valid options with different strengths
- Stakeholders prioritize different things
- Need to communicate reasoning for a decision
- Want to avoid "gut feeling" decisions on complex choices

## Process

### Step 1: Define the Options
List the distinct alternatives you're choosing between.
- Option A: Build custom solution
- Option B: Use open-source library X
- Option C: Use commercial service Y

### Step 2: Identify Evaluation Criteria
What factors matter for this decision?
- Performance
- Development time
- Maintenance burden
- Cost
- Flexibility
- Team expertise
- Risk

### Step 3: Weight the Criteria
Not all criteria matter equally. Assign relative importance.
- Critical (3x): Must be good here
- Important (2x): Strongly prefer good
- Nice-to-have (1x): Prefer but will compromise

### Step 4: Score Each Option
Rate how well each option satisfies each criterion (1-5 scale).
Be honest—don't inflate scores for your preferred option.

### Step 5: Calculate and Compare
Multiply scores by weights, sum for each option.
The math isn't the point—the process of explicit evaluation is.

### Step 6: Sense-Check the Result
Does the "winner" feel right? If not, what criteria are missing or mis-weighted?

## Key Principle
The goal isn't to find the "objectively best" option—it's to make trade-offs explicit so decisions are reasoned and communicable.

## Example Application

**Decision:** Which state management for our React app?

**Criteria (with weights):**
- Learning curve (2x): Team needs to ramp up fast
- Performance (1x): App is simple, perf not critical
- Bundle size (1x): Mobile users, bundle matters
- Ecosystem (2x): Need good tooling/community
- Future flexibility (1x): May need to scale later

**Scoring:**

| Criterion | Weight | Redux | Zustand | Jotai |
|-----------|--------|-------|---------|-------|
| Learning curve | 2x | 2 | 4 | 4 |
| Performance | 1x | 3 | 4 | 5 |
| Bundle size | 1x | 2 | 5 | 5 |
| Ecosystem | 2x | 5 | 3 | 3 |
| Flexibility | 1x | 4 | 4 | 3 |

**Totals:**
- Redux: 4+3+2+10+4 = 23
- Zustand: 8+4+5+6+4 = 27
- Jotai: 8+5+5+6+3 = 27

**Analysis:** Zustand and Jotai score similarly. Zustand has slight edge on flexibility. Check if ecosystem difference matters in practice—does Redux's ecosystem give us something we actually need?

## Matrix Variations

**Simple Yes/No:** For quick decisions
| Criterion | Option A | Option B |
|-----------|----------|----------|
| Under budget | Yes | No |
| Team knows it | No | Yes |
| Scales to 10K | Yes | Yes |

**Risk-focused:** Add likelihood and impact columns
| Risk | Likelihood | Impact | Option A | Option B |
|------|------------|--------|----------|----------|
| Data loss | Low | High | Mitigated | Exposed |

## Anti-patterns
- Including criteria that don't actually vary between options
- Weighting after you see which option is winning (reverse engineering)
- Excessive precision (3.7 vs 3.8 is false precision)
- Not including "gut check" at the end
`;
