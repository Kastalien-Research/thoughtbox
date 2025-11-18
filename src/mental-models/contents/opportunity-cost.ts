export const OPPORTUNITY_COST_CONTENT = `# Opportunity Cost Analysis

Consider what you give up by choosing one option over others.

## When to Use
- Allocating limited resources (time, money, people)
- Choosing between projects or features
- Evaluating "should we build this?"
- Feeling resource-constrained

## Process

### Step 1: Identify the Choice
What are you deciding to do?
- "We're going to spend Q3 on building feature X"

### Step 2: List Alternatives
What else could you do with these resources?
- Feature Y (revenue potential)
- Technical debt reduction (velocity)
- Scaling infrastructure (reliability)
- Team training (capability)
- Nothing (preserve optionality)

### Step 3: Estimate Value of Each
For the chosen option AND each alternative, estimate:
- Expected benefit
- Probability of success
- Time to realize value

### Step 4: Calculate Opportunity Cost
Opportunity cost = Value of best alternative you're NOT choosing

If Feature X = $500K value, but Feature Y = $800K value
Then opportunity cost of X = $800K

### Step 5: Make Explicit Trade-off
"We're choosing X ($500K) over Y ($800K) because..."
- X has strategic importance beyond revenue
- Y has dependencies that aren't ready
- X has higher certainty of success

## Key Principle
Every choice has a cost beyond its direct cost: the value of what you didn't choose. Ignoring this leads to poor resource allocation.

## Common Opportunity Costs

**Time spent on:**
- Meetings → not coding
- New features → not fixing bugs
- Perfect solution → not shipping good-enough
- Optimization → not building new capability

**Technical choices:**
- Building custom → not using existing
- Monolith → not getting microservice benefits
- New technology → not leveraging team expertise

**Organizational:**
- Hiring senior → not hiring two juniors
- One big bet → not several small experiments
- Process overhead → not shipping speed

## Example Application

**Decision:** "Should we build our own analytics or use a service?"

**Build custom:**
- Cost: 3 engineer-months
- Value: Perfect fit, no per-event fees
- Risk: Maintenance burden forever

**Use service:**
- Cost: $5K/month
- Value: Immediate availability, maintained by vendor
- Risk: Vendor lock-in, may not fit all needs

**Opportunity cost analysis:**

3 engineer-months could alternatively:
- Build Feature A (est. $200K revenue impact)
- Reduce tech debt (est. 20% velocity improvement)
- Build integrations (est. 3 enterprise deals)

**Calculation:**
- Analytics service: $60K/year ongoing
- Custom build: $0 ongoing BUT 3 months × best alternative

If best alternative is Feature A ($200K), opportunity cost = $200K

Custom actually costs $200K in opportunity + maintenance burden
vs Service costs $60K/year

**Decision:** Use service unless custom has strategic value beyond cost.

## Hidden Opportunity Costs

**Complexity:**
- Every feature has ongoing cost
- What won't you build because this needs maintenance?

**Cognitive load:**
- Team bandwidth is finite
- What decisions won't get attention?

**Optionality:**
- Committing closes doors
- What options are you giving up?

## Anti-patterns
- Only counting direct costs ($ and time)
- Comparing to "doing nothing" instead of best alternative
- Ignoring ongoing/maintenance opportunity costs
- Sunk cost fallacy (past investment shouldn't factor in)
`;
