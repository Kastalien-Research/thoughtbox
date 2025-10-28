export const MAP_ELITES_GUIDE = `# MAP-Elites & Quality Diversity: A Guide for LLMs

## What is Quality Diversity?

Quality Diversity (QD) algorithms are a family of evolutionary algorithms that aim to:
1. **Illuminate** the behavior space - find diverse solutions
2. **Optimize** within each behavioral niche - find the best solution for each behavior

Unlike traditional optimization (find THE best solution), QD finds MANY high-performing solutions that behave differently.

## What is MAP-Elites?

MAP-Elites is the foundational QD algorithm. It maintains an archive (map) of elite solutions:

**Core Concept:**
- Define behavioral dimensions that characterize solutions
- Discretize behavior space into a grid of niches
- For each niche, keep only the best-performing solution found so far
- Result: A map that "illuminates" the relationship between behavior and performance

**The Algorithm (You Run This):**
\`\`\`
1. Initialize: Create empty archive
2. Loop:
   a. Select: Pick a parent solution from archive (or random if empty)
   b. Mutate: Create variation of parent
   c. Evaluate: Measure behavioral characteristics and performance
   d. Propose: Submit to archive
   e. Archive decides: If performance > current elite at those coordinates, replace
3. Repeat until satisfied with coverage/quality
\`\`\`

**The Server's Role:**
- Validates input
- Manages archive state (Map<coordinates, elite>)
- Performs ONE comparison: \`if (performance > current.performance) replace\`
- Returns acceptance/rejection feedback

**Your Role (The LLM):**
- Define meaningful behavioral dimensions
- Generate/mutate solutions
- Evaluate behavioral characteristics
- Evaluate performance (fitness)
- Run the search loop
- Interpret results

## When to Use MAP-Elites

**✅ Good for:**
- **Creative exploration**: Generate diverse prompts, stories, designs
- **Multi-objective optimization**: Trade-offs between competing goals
- **Discovering stepping stones**: Find intermediate solutions leading to hard goals
- **Understanding trade-offs**: Map the Pareto frontier of behaviors
- **Robust solutions**: Find alternatives that work under different conditions

**❌ Not ideal for:**
- **Single-objective optimization**: If you just want THE best, use gradient descent
- **No clear behavioral dimensions**: If solutions can't be characterized meaningfully
- **Tiny search spaces**: If exhaustive search is feasible

## Designing Behavioral Dimensions

This is the most important design choice. Good dimensions are:

1. **Discriminative**: Different solutions have different values
2. **Independent**: Dimensions capture orthogonal aspects of behavior
3. **Measurable**: Can be computed from the solution
4. **Meaningful**: Capture important aspects you care about

**Examples:**

| Domain | Dimension 1 | Dimension 2 | Performance |
|--------|-------------|-------------|-------------|
| Image prompts | Specificity | Creativity | Human rating |
| Sorting algorithms | Comparisons | Memory usage | Correctness |
| Text summaries | Length | Formality | Quality score |
| Game AI | Aggression | Exploration | Win rate |
| API designs | Simplicity | Flexibility | Developer satisfaction |

**Common Patterns:**
- **Complexity vs Performance**: Simple fast solutions vs complex accurate ones
- **Quality vs Speed**: High quality slow vs low quality fast
- **Conservative vs Creative**: Safe boring vs risky interesting
- **Size vs Capability**: Small limited vs large capable

## Resolution Selection

Resolution = number of bins per dimension.

**Trade-offs:**
- **High resolution** (e.g., 50 bins):
  - Pro: Fine-grained distinctions
  - Con: Sparse coverage (many empty niches)
  - Con: More proposals needed to fill

- **Low resolution** (e.g., 5 bins):
  - Pro: Dense coverage achievable
  - Pro: Faster to fill archive
  - Con: Coarse distinctions, lose nuance

**Recommendations:**
- Start with 10-20 bins per dimension for 2D
- Reduce resolution for higher dimensions (curse of dimensionality)
- 2D: 20×20 = 400 niches (very manageable)
- 3D: 10×10×10 = 1000 niches (reasonable)
- 4D: 5×5×5×5 = 625 niches (sparse but doable)

## Workflow Example: Prompt Engineering

**Goal**: Generate diverse high-quality image generation prompts

**Step 1: Define dimensions**
\`\`\`typescript
{
  dimensions: [
    { name: "specificity", min: 0, max: 100, resolution: 10 },
    { name: "creativity", min: 0, max: 100, resolution: 10 }
  ]
}
// Creates 10×10 = 100 niches
\`\`\`

**Step 2: Run exploration loop (YOU do this)**
\`\`\`
Iteration 1: Random initialization
  Generate: "A sunset over mountains"
  Evaluate behavior: specificity=30, creativity=40
  Evaluate performance: human_rating=0.7
  Propose → ACCEPTED (new niche [3,4])

Iteration 2: Mutate from elite
  Parent: "A sunset over mountains"
  Mutate: "A glowing crimson sunset over jagged crystalline mountains"
  Evaluate behavior: specificity=75, creativity=65
  Evaluate performance: 0.85
  Propose → ACCEPTED (new niche [7,6])

Iteration 3: Mutate
  Generate: "A sunset with clouds"
  Evaluate behavior: specificity=20, creativity=30
  Evaluate performance: 0.60
  Propose → REJECTED (niche [2,3] has elite with 0.72)

... repeat for 500-1000 iterations ...
\`\`\`

**Step 3: Harvest results**
- Get coverage map visualization
- Extract all elites (up to 100 diverse prompts)
- Identify gaps (e.g., high creativity + high specificity might be hard)
- Use elites for downstream tasks

## Mutation Strategies

How you generate variations affects exploration quality:

**Random mutation:**
- Pick random aspects to change
- Good for initial exploration
- Can get stuck in local optima

**Crossover:**
- Combine features from two parents
- Good for discovering combinations
- Needs diversity in archive first

**Targeted mutation:**
- Mutate to reach empty niches
- Query empty_niches, mutate toward them
- Speeds up coverage

**Gradient-based:**
- If you can compute gradients, use them
- Mutate in direction of improvement
- Faster convergence per niche

**Recommendation**: Start with random, add sophistication as needed.

## Common Mistakes

**❌ Using behavioral characteristics as performance:**
"Make dimension 1 be accuracy" → No! Accuracy is performance, not behavior.
Behavior describes HOW it works, performance describes how WELL.

**❌ Too many dimensions:**
6D archive = millions of niches = sparse coverage.
Start with 2D, add dimensions only if necessary.

**❌ Dependent dimensions:**
"Lines of code" and "number of functions" are highly correlated.
Choose orthogonal dimensions.

**❌ Not running enough iterations:**
For n niches, expect to need 10-100× n proposals to achieve good coverage.
100 niches → 1000-10000 proposals.

**❌ Forgetting the server is dumb:**
Server doesn't evaluate performance - YOU must do that.
Server doesn't suggest mutations - YOU must do that.
Server just stores and compares.

## Integration with Sequential Thinking

These tools are complementary:

**Use sequential thinking to:**
- Design your MAP-Elites setup (what dimensions? what performance metric?)
- Understand why coverage has gaps
- Analyze patterns in discovered elites
- Debug when results don't make sense

**Use MAP-Elites to:**
- Execute the exploration sequential thinking planned
- Generate diverse examples sequential thinking can analyze
- Find edge cases sequential thinking might miss
- Discover unexpected solution strategies

**Workflow:**
1. Sequential thinking: "What dimensions matter for X?"
2. MAP-Elites: Run exploration with those dimensions
3. Sequential thinking: "Why did niche [7,8] have the best solutions?"
4. MAP-Elites: Targeted exploration of that region

## Advanced: CVT-MAP-Elites

The basic MAP-Elites uses a fixed grid. CVT-MAP-Elites uses adaptive partitioning:
- Instead of grid, use Voronoi tessellation
- Centroids adapt to where solutions actually exist
- Better for high-dimensional spaces

Not implemented in this server yet, but the archive structure could support it.

## Performance Optimization

**For large archives:**
- Don't call get_map_state after every proposal (expensive)
- Check coverage every 100-1000 proposals
- Use get_empty_niches strategically, not every iteration

**For fast iteration:**
- Batch evaluate if possible (evaluate 10 solutions, then 10 proposals)
- Cache behavioral evaluations if expensive
- Early stopping: if coverage plateaus, you're done

## Resources & References

**Papers:**
- "Illuminating Search Spaces by Mapping Elites" (Mouret & Clune, 2015)
- "Quality Diversity: A New Frontier for Evolutionary Computation" (Pugh et al., 2016)

**Key Concepts:**
- **Illumination**: Mapping the space of possible behaviors
- **Elite**: Best solution found for a particular behavioral niche
- **Coverage**: Percentage of niches that contain an elite
- **Quality**: Performance scores of elites
- **Stepping stones**: Intermediate solutions that lead to breakthroughs

## Quick Reference

**Archive creation:**
\`\`\`typescript
map_elites({ operation: "create_archive", args: { dimensions: [...] } })
\`\`\`

**Propose solution:**
\`\`\`typescript
map_elites({
  operation: "propose_solution",
  args: {
    archiveId,
    solution,
    behavioralCharacteristics,
    performance
  }
})
\`\`\`

**Check coverage:**
\`\`\`typescript
map_elites({
  operation: "get_map_state",
  args: { archiveId, includeVisualization: true }
})
\`\`\`

**Find gaps:**
\`\`\`typescript
map_elites({ operation: "get_empty_niches", args: { archiveId, limit: 10 } })
\`\`\`

**Get neighbors:**
\`\`\`typescript
map_elites({
  operation: "get_neighbors",
  args: { archiveId, coordinates, radius: 1 }
})
\`\`\`

---

Remember: The server is a "notebook" - it provides structure, but YOU write the algorithm.
`;
