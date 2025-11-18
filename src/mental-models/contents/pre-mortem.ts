export const PRE_MORTEM_CONTENT = `# Pre-mortem Analysis

Imagine the project has failed, then work backward to identify what caused it.

## When to Use
- Starting a new project or initiative
- Before committing to a major decision
- When optimism bias might be hiding risks
- Team has "groupthink" about success

## Process

### Step 1: Time Travel to Failure
"It's 6 months from now. This project has failed completely. It's not just behind schedule—it's been cancelled."

### Step 2: Generate Failure Stories
Each participant independently writes: "The project failed because..."
- Be specific and concrete
- Generate multiple distinct failure modes
- Don't censor "unlikely" scenarios

### Step 3: Cluster and Categorize
Group failures by type:
- Technical failures (scaling, integration, performance)
- Process failures (communication, coordination, scope)
- People failures (turnover, skill gaps, motivation)
- External failures (market, dependencies, requirements)

### Step 4: Identify Leading Indicators
For each failure mode, what early warning signs would appear?
- "If we're going to fail because of scaling issues, we'd see X by week 4"

### Step 5: Design Preventions and Detections
For top failure modes:
- Prevention: What would stop this from happening?
- Detection: What would alert us it's starting to happen?
- Mitigation: If it happens anyway, how do we reduce impact?

## Key Principle
Prospective hindsight (imagining future failure as past) generates 30% more potential issues than asking "what might go wrong."

## Why This Works
- Permission structure: "Failure has happened" removes social pressure to be optimistic
- Specificity: Forces concrete scenarios vs vague concerns
- Temporal shift: Thinking backward is more generative than forward

## Example Application

**Project:** "Migrate from monolith to microservices"

**Failure stories generated:**
- "Failed because teams couldn't agree on service boundaries and kept changing them"
- "Failed because we didn't have observability for distributed tracing"
- "Failed because one critical path had 12 service hops and latency killed us"
- "Failed because our best engineer quit mid-migration"

**Prevention actions:**
- Lock service boundaries after design review, require formal change process
- Implement distributed tracing before migration, not after
- Map critical paths, set latency budgets, alert on hop count
- Document everything, no single points of knowledge

## Common Failures to Consider
- Integration: What if X and Y don't work together?
- Scale: What if load is 10x what we planned?
- People: What if key person leaves?
- Time: What if it takes 3x longer?
- Dependencies: What if external system changes?
- Requirements: What if we built the wrong thing?

## Anti-patterns
- Generating only technical failures (people/process often more likely)
- Dismissing "unlikely" scenarios (black swans exist)
- Not converting failures into specific preventive actions
- Running pre-mortem but ignoring results
`;
