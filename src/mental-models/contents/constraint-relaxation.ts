export const CONSTRAINT_RELAXATION_CONTENT = `# Constraint Relaxation

Temporarily remove constraints to explore solution space freely, then reapply them.

## When to Use
- Feeling stuck or boxed in
- Solutions feel like compromises
- Need creative breakthrough
- Want to identify which constraints actually matter

## Process

### Step 1: List All Constraints
Document everything limiting your solution:
- Technical: "Must use existing database"
- Resource: "Only 2 weeks and 1 developer"
- Business: "Can't change the API contract"
- Regulatory: "Must be GDPR compliant"
- Assumed: "Users expect instant response"

### Step 2: Categorize Constraints
- **Hard:** Truly immovable (laws, physics)
- **Firm:** Very difficult to change (contracts, infrastructure)
- **Soft:** Could be changed with effort (timelines, budgets)
- **Assumed:** May not be real constraints

### Step 3: Relax Constraints One by One
For each non-hard constraint, ask:
"If this constraint didn't exist, what would I do?"

Generate solutions without that constraint.

### Step 4: Explore the Unconstrained Space
With several constraints removed:
- What's the ideal solution?
- What becomes possible?
- What obvious approach were we blocking?

### Step 5: Reintroduce Constraints Gradually
Add constraints back one at a time:
- Which constraints actually prevent the ideal solution?
- Can any constraints be negotiated or changed?
- What's the minimal modification to make it work?

### Step 6: Challenge Assumed Constraints
For constraints that significantly block good solutions:
- Is this actually a constraint or an assumption?
- Who imposed this? Can we talk to them?
- What's the cost of changing it vs working around it?

## Key Principle
Constraints are often less fixed than they appear. Understanding which ones actually matter reveals which ones to challenge.

## Example Application

**Problem:** "Need to add search to our app but can't afford Elasticsearch"

**Listed constraints:**
1. Budget: Can't add new infrastructure costs
2. Technical: Must search 10M documents sub-second
3. Stack: Must work with PostgreSQL
4. Team: No search expertise
5. Timeline: Ship in 2 weeks

**Relaxation exploration:**

Without constraint 1 (budget):
- Use Algolia/Elasticsearch managed service
- Reveals: maybe we CAN afford $100/month?

Without constraint 2 (performance):
- Simple PostgreSQL LIKE queries
- Reveals: do we actually need sub-second? User research says 2s is fine

Without constraint 3 (PostgreSQL):
- Use purpose-built search service
- Reveals: this constraint is artificial, not a real requirement

Without constraint 5 (timeline):
- Build proper search infrastructure
- Reveals: can we phase this? Basic search now, advanced later?

**Result:**
Challenge constraints 1 and 2. Actually we can afford a small service fee, and users don't need sub-second. Use Algolia at $100/month, ship in 1 week.

## Common Constrains to Question

**"We must use X technology"**
- Says who? Why?
- Often historical, not current requirement

**"We have N weeks"**
- Is this real deadline or arbitrary?
- What's cost of missing it?

**"It must work for all users"**
- Can we phase rollout?
- Can we serve 80% now?

**"We can't break the API"**
- Can we version it?
- How many clients actually use it?

## Anti-patterns
- Treating all constraints as equally fixed
- Not questioning who imposed constraints
- Generating ideas that violate hard constraints
- Not testing if "impossible" things are actually impossible
`;
