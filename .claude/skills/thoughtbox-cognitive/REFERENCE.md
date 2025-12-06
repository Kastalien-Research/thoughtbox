# Mental Models Reference

Complete catalog of 15 structured reasoning frameworks. Each model provides a process scaffold that tells you HOW to think about a problem, not WHAT to think.

## Quick Reference by Tag

| Tag | Models | Use When |
|-----|--------|----------|
| debugging | rubber-duck, five-whys | Finding and fixing issues |
| planning | pre-mortem, assumption-surfacing, decomposition, constraint-relaxation, time-horizon-shifting, inversion | Breaking down work, sequencing tasks |
| decision-making | steelmanning, trade-off-matrix, opportunity-cost, time-horizon-shifting | Choosing between options |
| risk-analysis | pre-mortem, adversarial-thinking, inversion | Identifying what could go wrong |
| estimation | fermi-estimation | Making reasonable guesses |
| prioritization | trade-off-matrix, opportunity-cost, impact-effort-grid | Deciding what to do first |
| communication | rubber-duck, abstraction-laddering | Explaining clearly |
| architecture | abstraction-laddering, decomposition, constraint-relaxation | System design |
| validation | five-whys, assumption-surfacing, steelmanning, adversarial-thinking | Testing hypotheses |

---

## 1. Rubber Duck Debugging

**Tags:** debugging, communication

**When to Use:**
- Stuck on a bug you can't explain
- Code works but you don't understand why
- Need to verify mental model matches reality
- Preparing to ask for help (often solves it before you ask)

**Process:**

### Step 1: State the Goal
Clearly articulate what the code/system SHOULD do.
- "This function should take a list of users and return only those with active subscriptions"

### Step 2: Walk Through Line by Line
Explain each line/component as if teaching someone unfamiliar.
- Don't skip "obvious" parts
- Say what each piece does, not just what it is
- "This filter checks if... wait, it's checking `subscription` not `subscription.active`"

### Step 3: State Your Expectations at Each Step
Before checking actual behavior, predict:
- What value should this variable have here?
- What should this function return?
- What state should exist at this point?

### Step 4: Compare Expectation vs Reality
When predictions don't match reality, you've found the problem area.

### Step 5: Articulate the Discovery
"I expected X but actually Y because..."

**Key Principle:** The act of explaining forces you to make implicit assumptions explicit, notice gaps in your understanding, and slow down past the parts you "already know."

**Anti-patterns:**
- Skipping the "obvious" parts (that's where bugs hide)
- Explaining what code IS rather than what it DOES
- Not stating expectations before checking reality

---

## 2. Five Whys

**Tags:** debugging, validation

**When to Use:**
- A problem keeps recurring after fixes
- You're treating symptoms not causes
- Need to understand failure chains
- Post-incident analysis

**Process:**

### Step 1: State the Problem Clearly
Start with a specific, observable problem.
- Bad: "The system is slow"
- Good: "API response time increased from 200ms to 2s at 3pm yesterday"

### Step 2-4: Ask Why Iteratively
- "Why did response time increase?" → "The database queries started timing out"
- "Why did queries start timing out?" → "The connection pool was exhausted"
- "Why was the pool exhausted?" → "Connections weren't being released"
- "Why weren't they released?" → "Error handling didn't close connections on exception"
- "Why not?" → "No code review checklist item for resource cleanup"

### Step 5: Verify the Chain
Read the chain backward: does fixing the root cause prevent all the downstream effects?

**Key Principle:** Stop when you reach something you can change systemically, prevent from recurring, and actually control.

**Signals You've Gone Too Far:**
- "Because humans make mistakes" (too generic)
- "Because physics" (can't change)

**Signals You Haven't Gone Far Enough:**
- Fix would only address this instance
- Same type of failure could easily recur

---

## 3. Pre-mortem Analysis

**Tags:** risk-analysis, planning

**When to Use:**
- Starting a new project or initiative
- Before committing to a major decision
- When optimism bias might be hiding risks
- Team has "groupthink" about success

**Process:**

### Step 1: Time Travel to Failure
"It's 6 months from now. This project has failed completely."

### Step 2: Generate Failure Stories
Write: "The project failed because..."
- Be specific and concrete
- Generate multiple distinct failure modes
- Don't censor "unlikely" scenarios

### Step 3: Cluster and Categorize
Group by type:
- Technical failures (scaling, integration, performance)
- Process failures (communication, coordination, scope)
- People failures (turnover, skill gaps, motivation)
- External failures (market, dependencies, requirements)

### Step 4: Identify Leading Indicators
For each failure mode, what early warning signs would appear?

### Step 5: Design Preventions and Detections
For top failure modes:
- Prevention: What would stop this from happening?
- Detection: What would alert us it's starting to happen?
- Mitigation: If it happens anyway, how do we reduce impact?

**Key Principle:** Prospective hindsight generates 30% more potential issues than asking "what might go wrong."

---

## 4. Assumption Surfacing

**Tags:** validation, planning

**When to Use:**
- Starting work based on requirements from others
- Something "obvious" keeps causing problems
- Different people have different understandings
- Past projects failed due to mistaken assumptions

**Process:**

### Step 1: List Everything You "Know"
Write down all beliefs about the problem/solution without filtering.

### Step 2: Categorize by Certainty
For each item:
- **Fact**: Verified, have evidence
- **Assumption**: Believe to be true, not verified
- **Unknown**: Don't know, need to find out

### Step 3: Identify Critical Assumptions
Which assumptions, if wrong, would derail the project?

### Step 4: Plan Validation
For each critical assumption:
- How would you test it?
- What would prove it wrong?
- Who might have contradicting information?

### Step 5: Validate Before Proceeding
Test critical assumptions early, before they become expensive mistakes.

---

## 5. Steelmanning

**Tags:** decision-making, validation

**When to Use:**
- Disagreement with a proposed approach
- Evaluating options you're biased against
- Need to understand opposing viewpoint deeply
- Want to make your own position more robust

**Process:**

### Step 1: Identify the Position to Steelman
What view are you tempted to dismiss or argue against?

### Step 2: Construct the Strongest Version
- What are the best arguments FOR this position?
- What evidence supports it?
- Under what conditions would it be optimal?
- What does this position get right that you might be missing?

### Step 3: Present it Fairly
Could a proponent of this view say "yes, that's exactly my argument"?

### Step 4: Respond to the Strongest Version
Now engage with this steelmanned position:
- What are the genuine trade-offs?
- Where does your position have weaknesses?
- Is there a synthesis that takes the best of both?

**Key Principle:** If you can't argue FOR an opposing view convincingly, you don't understand it well enough to argue against it.

---

## 6. Trade-off Matrix

**Tags:** decision-making, prioritization

**When to Use:**
- Multiple options with no clear winner
- Stakeholders value different things
- Need to make trade-offs explicit
- Decision feels subjective, want structure

**Process:**

### Step 1: List All Options
What are the possible choices?

### Step 2: Identify Criteria
What factors matter for this decision?
(cost, time, risk, scalability, team skill match, etc.)

### Step 3: Weight the Criteria
How important is each criterion? (1-5 or percentage)

### Step 4: Score Each Option
Rate each option against each criterion.

### Step 5: Calculate and Analyze
Multiply scores by weights, sum for each option.
But don't just pick highest score—examine:
- Any deal-breakers (0 on critical criterion)?
- Sensitivity: does order change with small weight changes?
- Qualitative factors not captured?

**Key Principle:** The matrix doesn't decide for you—it makes your decision-making process transparent and discussable.

---

## 7. Fermi Estimation

**Tags:** estimation

**When to Use:**
- Need rough estimate without full data
- Sizing effort, capacity, or resources
- Sanity-checking someone else's numbers
- Quick scoping of feasibility

**Process:**

### Step 1: Clarify What You're Estimating
"How many API calls per day?" → "From what sources? What counts as a call?"

### Step 2: Break Into Components
Decompose into factors you can estimate:
- Users × Requests per user × Actions per request

### Step 3: Estimate Each Component
Use ranges: low estimate / likely / high estimate
Anchor to things you know.

### Step 4: Calculate and Cross-Check
Multiply/combine components.
Then sanity check: Does this match any reference points?

### Step 5: Express Uncertainty
"Somewhere between 10K and 100K, likely around 30K"

**Key Principle:** Being within an order of magnitude is often good enough for decision-making.

---

## 8. Abstraction Laddering

**Tags:** architecture, communication

**When to Use:**
- Stuck at one level of thinking
- Talking past someone at different abstraction level
- Need to find the right level to solve problem
- Explaining something to varied audiences

**Process:**

### Step 1: Identify Current Level
What level of abstraction are you currently at?

### Step 2: Ladder UP (More Abstract)
Ask "WHY?" to move up the ladder:
- "Fix login bug" → "Improve authentication reliability" → "Increase user trust" → "Grow the business"

### Step 3: Ladder DOWN (More Concrete)
Ask "HOW?" to move down:
- "Improve performance" → "Reduce latency" → "Add caching layer" → "Implement Redis with 5-min TTL"

### Step 4: Find the Right Level
- Too abstract: Can't act on it
- Too concrete: Missing the point
- Right level: Actionable and addresses core need

**Key Principle:** Problems can often only be solved at a different level of abstraction than where they appear.

---

## 9. Decomposition

**Tags:** planning, architecture

**When to Use:**
- Problem feels overwhelming or unclear where to start
- Task is too big to estimate or plan
- Need to parallelize work across people
- Complexity hides in interactions between parts

**Process:**

### Step 1: State the Whole Problem
Clearly define what needs to be accomplished.

### Step 2: Identify Natural Seams
Look for boundaries where pieces have minimal interaction:
- Different data domains
- Different user interactions
- Different technical concerns
- Different lifecycles

### Step 3: Decompose Along Seams
Split into sub-problems, each addressing one aspect.

### Step 4: Check for Independence
For each piece:
- Can this be built without the others?
- Can this be tested in isolation?
- Can this be understood without full context?

### Step 5: Identify Interfaces
What does each piece need from others?

**Signs of Good Decomposition:**
- Pieces can be explained without mentioning others
- Pieces can be tested with mocks
- Pieces can be replaced without rewriting others

**Signs of Bad Decomposition:**
- Circular dependencies
- Pieces that can't be tested alone
- Changes cascade across pieces

---

## 10. Adversarial Thinking

**Tags:** risk-analysis, validation

**When to Use:**
- Security review
- Testing robustness of a system
- Finding edge cases
- Stress-testing assumptions

**Process:**

### Step 1: Become the Adversary
Adopt mindset of someone trying to break, exploit, or misuse the system.

### Step 2: Identify Attack Surfaces
What are the entry points? Where are the trust boundaries?

### Step 3: Generate Attack Vectors
For each surface:
- How could this be abused?
- What if inputs are malicious?
- What if timing is adversarial?
- What if state is corrupted?

### Step 4: Prioritize by Risk
Which attacks are most likely and most damaging?

### Step 5: Design Defenses
For top risks:
- How do you prevent this attack?
- How do you detect if it's happening?
- How do you limit damage if it succeeds?

---

## 11. Opportunity Cost Analysis

**Tags:** decision-making, prioritization

**When to Use:**
- Choosing between mutually exclusive options
- Resource allocation decisions
- Evaluating "should we do this?"
- Prioritizing a backlog

**Process:**

### Step 1: List Your Options
What could you do with these resources? (Include "do nothing")

### Step 2: For Each Option, Identify What You Give Up
If you choose A, what B, C, D become impossible or harder?

### Step 3: Estimate Value of What You Give Up
The opportunity cost of A is the value of the best alternative foregone.

### Step 4: Compare Option Value vs Opportunity Cost
Is this option worth more than what you're giving up?

### Step 5: Consider Reversibility
Can you change course later? Irreversible decisions deserve more scrutiny.

---

## 12. Constraint Relaxation

**Tags:** planning, architecture

**When to Use:**
- Stuck on "impossible" problem
- All solutions seem to have fatal flaws
- Requirements seem contradictory
- Need creative breakthrough

**Process:**

### Step 1: List All Constraints
What limitations are you working within?

### Step 2: Categorize Constraints
- **True constraints**: Physical laws, hard requirements
- **Assumed constraints**: "We've always done it this way"
- **Negotiable constraints**: Could change with approval

### Step 3: Relax One Constraint at a Time
"If we didn't have to worry about X, how would we solve this?"

### Step 4: Generate Solutions in Relaxed Space
What approaches become possible?

### Step 5: Work Back to Reality
Can you approximate the relaxed solution within constraints?
Can you renegotiate the constraint?

---

## 13. Time Horizon Shifting

**Tags:** planning, decision-making

**When to Use:**
- Decision with short-term and long-term implications
- Balancing immediate pressure vs future needs
- Evaluating technical debt trade-offs
- Strategic planning

**Process:**

### Step 1: Identify the Decision
What are you deciding?

### Step 2: Evaluate at Multiple Time Horizons
How does this decision look at:
- 1 week from now?
- 1 month from now?
- 1 year from now?
- 5 years from now?

### Step 3: Look for Conflicts
Does short-term optimal conflict with long-term optimal?

### Step 4: Find the Right Trade-off
Where should you optimize? Consider:
- How certain is the future?
- How reversible is this decision?
- What's the cost of changing course later?

---

## 14. Impact/Effort Grid

**Tags:** prioritization

**When to Use:**
- Have more ideas than time
- Need to prioritize a backlog
- Team can't agree on what's most important
- Want quick visual prioritization

**Process:**

### Step 1: List All Items to Prioritize

### Step 2: Create 2x2 Grid
- X-axis: Effort (Low → High)
- Y-axis: Impact (Low → High)

### Step 3: Place Each Item on Grid

### Step 4: Prioritize by Quadrant
1. **High Impact, Low Effort**: Do first (Quick wins)
2. **High Impact, High Effort**: Plan and schedule (Major projects)
3. **Low Impact, Low Effort**: Do if time permits (Fill-ins)
4. **Low Impact, High Effort**: Avoid (Time sinks)

---

## 15. Inversion

**Tags:** risk-analysis, planning

**When to Use:**
- Direct path to goal is unclear
- Want to avoid common failures
- Complex systems with many failure modes
- Decision with asymmetric risk

**Process:**

### Step 1: State the Goal
What are you trying to achieve?

### Step 2: Invert: Ask How to Fail
Instead of "how do I succeed?", ask "how would I guarantee failure?"

### Step 3: Generate Failure Modes
List all the ways to fail.

### Step 4: Invert Again: Avoid These
Convert each failure mode to an avoidance rule.

### Step 5: Check Coverage
Does avoiding all these failures get you to success?

**Key Principle:** It's often easier to identify what definitely doesn't work than what definitely does. Avoiding stupidity beats seeking brilliance.

**Classic Inversions:**
- "How to build a great team" → "How to destroy a team"
- "How to write clean code" → "How to write unmaintainable code"
- "How to have a good meeting" → "How to waste everyone's time"

---

## Usage with Thoughtbox

Retrieve any model with:
```javascript
mental_models({ operation: "get_model", args: { model: "model-name" } })
```

Then apply it using thoughtbox steps:
```javascript
thoughtbox({
  thought: "Applying [model name] Step 1: [content]",
  thoughtNumber: 1,
  totalThoughts: N,  // Based on model's step count
  nextThoughtNeeded: true
})
```
