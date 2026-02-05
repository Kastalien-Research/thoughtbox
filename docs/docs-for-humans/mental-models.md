# Mental Models

15 structured reasoning frameworks to enhance problem-solving.

---

## Overview

Mental models are **structured thinking frameworks** that guide agents through specific types of problems. Each model provides:

- A clear process to follow
- Prompts and questions to consider
- Output format expectations
- Example applications

Access mental models via the `thoughtbox_gateway`:

```json
{
  "operation": "mental_models",
  "args": {
    "action": "get",
    "name": "five-whys"
  }
}
```

---

## Models by Category

### Debugging

Frameworks for identifying and understanding problems.

| Model | Purpose |
|-------|---------|
| [Rubber Duck](#rubber-duck) | Explain the problem to find gaps in understanding |
| [Five Whys](#five-whys) | Drill down to root cause |

### Planning

Frameworks for breaking down and organizing work.

| Model | Purpose |
|-------|---------|
| [Decomposition](#decomposition) | Break complex tasks into manageable pieces |
| [Time Horizon Shifting](#time-horizon-shifting) | Consider short, medium, and long-term impacts |

### Decision Making

Frameworks for choosing between options.

| Model | Purpose |
|-------|---------|
| [Steelmanning](#steelmanning) | Strengthen opposing arguments before deciding |
| [Trade-off Matrix](#trade-off-matrix) | Systematically compare alternatives |

### Risk Analysis

Frameworks for identifying and mitigating risks.

| Model | Purpose |
|-------|---------|
| [Pre-mortem](#pre-mortem) | Imagine failure and work backward |
| [Inversion](#inversion) | Consider what would cause the opposite outcome |

### Estimation

Frameworks for making reasonable estimates.

| Model | Purpose |
|-------|---------|
| [Fermi Estimation](#fermi-estimation) | Estimate unknown quantities through decomposition |

### Prioritization

Frameworks for deciding what matters most.

| Model | Purpose |
|-------|---------|
| [Opportunity Cost](#opportunity-cost) | Consider what you're giving up |
| [Impact-Effort Grid](#impact-effort-grid) | Prioritize by value and cost |

### Architecture

Frameworks for system design decisions.

| Model | Purpose |
|-------|---------|
| [Abstraction Laddering](#abstraction-laddering) | Move between concrete and abstract |
| [Constraint Relaxation](#constraint-relaxation) | Question assumed limitations |

### Validation

Frameworks for testing assumptions and ideas.

| Model | Purpose |
|-------|---------|
| [Adversarial Thinking](#adversarial-thinking) | Attack your own ideas |
| [Assumption Surfacing](#assumption-surfacing) | Make hidden assumptions explicit |

---

## Model Details

### Rubber Duck

**Tags:** debugging, communication

**Purpose:** Explain the problem step-by-step as if teaching someone else. The act of articulation often reveals gaps in understanding.

**Process:**
1. State what you're trying to accomplish
2. Explain what you've tried so far
3. Describe what you expected to happen
4. Describe what actually happened
5. Walk through the logic step by step
6. Notice where your explanation feels uncertain

**When to use:**
- Stuck on a bug with no clear direction
- Code works but you're not sure why
- Need to understand unfamiliar code

---

### Five Whys

**Tags:** debugging, root-cause

**Purpose:** Ask "why" repeatedly to drill past symptoms to the underlying cause.

**Process:**
1. State the problem
2. Ask: "Why did this happen?"
3. Take the answer and ask "Why?" again
4. Repeat until you reach a root cause (usually 3-7 levels)
5. Verify: solving the root cause would prevent the original problem

**Example:**
```
Problem: Production server crashed

Why? → Out of memory
Why? → Memory leak in request handler
Why? → Objects not released after response
Why? → Missing cleanup in error path
Why? → Error handling added without review ← Root cause
```

**When to use:**
- Incident post-mortems
- Recurring bugs
- Systemic problems

---

### Pre-mortem

**Tags:** risk-analysis, planning

**Purpose:** Imagine the project has failed, then work backward to identify what went wrong.

**Process:**
1. Assume complete failure: "It's 6 months later and this project failed spectacularly"
2. Write the failure story: what happened?
3. List all the reasons for failure
4. Rank by likelihood and impact
5. Create mitigations for top risks

**When to use:**
- Starting a new project
- Major architectural decisions
- High-stakes deployments

---

### Steelmanning

**Tags:** decision-making

**Purpose:** Build the strongest possible version of the opposing argument before making a decision.

**Process:**
1. State the position you're inclined toward
2. Identify the opposing view
3. Argue FOR the opposing view as strongly as possible
4. Consider: what evidence would change your mind?
5. Make your decision with full awareness of trade-offs

**When to use:**
- Technical debates
- Architecture decisions
- When you feel certain (to check yourself)

---

### Trade-off Matrix

**Tags:** prioritization, decision-making

**Purpose:** Systematically compare options across multiple criteria.

**Process:**
1. List your options (columns)
2. List evaluation criteria (rows)
3. Weight each criterion by importance
4. Score each option against each criterion
5. Calculate weighted totals
6. Review: does the winner match your intuition?

**Example:**
```
Criteria (weight) | Option A | Option B | Option C
------------------|----------|----------|----------
Speed (3)         |    4     |    2     |    5
Cost (2)          |    3     |    5     |    2
Maintainability(4)|    5     |    3     |    3
------------------|----------|----------|----------
Weighted Total    |   35     |   28     |   31
```

**When to use:**
- Choosing between technologies
- Vendor selection
- Feature prioritization

---

### Fermi Estimation

**Tags:** estimation

**Purpose:** Estimate unknown quantities by breaking them into smaller, estimable components.

**Process:**
1. State what you're trying to estimate
2. Break it into factors you can estimate
3. Estimate each factor with reasonable bounds
4. Multiply factors together
5. Sanity check: is the result plausible?

**Example:**
```
Question: How many piano tuners in Chicago?

Factors:
- Chicago population: ~3 million
- People per household: ~2.5 → 1.2M households
- Households with pianos: ~5% → 60,000 pianos
- Tunings per year: ~1 → 60,000 tunings/year
- Tunings per tuner per day: ~4
- Working days per year: ~250 → 1,000 tunings/tuner/year

Result: 60,000 / 1,000 = ~60 piano tuners
```

**When to use:**
- Resource planning
- Capacity estimation
- Quick feasibility checks

---

### Decomposition

**Tags:** planning

**Purpose:** Break complex problems into smaller, independent pieces.

**Process:**
1. State the overall goal
2. Identify the major components
3. For each component, ask: can this be broken down further?
4. Continue until pieces are small enough to implement confidently
5. Identify dependencies between pieces
6. Order by dependencies and priority

**When to use:**
- Sprint planning
- Feature design
- Complex bug investigation

---

### Abstraction Laddering

**Tags:** architecture

**Purpose:** Move up and down levels of abstraction to find the right framing.

**Process:**
1. State the problem at its current level
2. Move UP (more abstract): "What is this really about?"
3. Move DOWN (more concrete): "What specifically needs to happen?"
4. Find the level where the problem is most tractable
5. Solve at that level, then translate back

**Example:**
```
Concrete: "Add a retry button to the error dialog"
    ↓ Why?
Abstract: "Users need to recover from transient errors"
    ↓ Why?
More abstract: "The system should be resilient"
    ↓ What specifically?
Back down: "Automatic retry with exponential backoff"
```

**When to use:**
- Feeling stuck on implementation details
- Requirements seem arbitrary
- Looking for simpler solutions

---

### Inversion

**Tags:** risk-analysis

**Purpose:** Consider what would cause the opposite of your desired outcome.

**Process:**
1. State your goal
2. Invert: "How could I guarantee failure?"
3. List all the ways to fail
4. Invert again: avoid each failure mode
5. Your success plan is the inverse of your failure plan

**Example:**
```
Goal: Successful product launch

How to guarantee failure:
- Ship with known critical bugs
- No documentation
- No monitoring
- No rollback plan
- No communication plan

Success plan (inverse):
- Fix all critical bugs before launch
- Write documentation
- Set up monitoring and alerts
- Prepare rollback procedure
- Create communication plan
```

**When to use:**
- Launch planning
- Risk mitigation
- When positive planning feels vague

---

### Adversarial Thinking

**Tags:** validation

**Purpose:** Actively try to break or disprove your own ideas.

**Process:**
1. State your proposed solution
2. Put on "attacker" hat: how would you break this?
3. Consider edge cases, failure modes, malicious use
4. For each attack, either:
   - Defend: show why it won't work
   - Fortify: modify the solution
5. Repeat until you can't find more attacks

**When to use:**
- Security design
- API design
- Before committing to an architecture

---

### Opportunity Cost

**Tags:** prioritization

**Purpose:** Consider what you're giving up by choosing one option.

**Process:**
1. List what you could do with the same resources
2. Estimate the value of each alternative
3. The opportunity cost = value of best alternative not chosen
4. Only proceed if expected value > opportunity cost

**When to use:**
- Resource allocation
- Feature prioritization
- Build vs. buy decisions

---

### Constraint Relaxation

**Tags:** architecture

**Purpose:** Question assumed constraints to find simpler solutions.

**Process:**
1. List all constraints on the problem
2. For each constraint, ask: "Is this actually required?"
3. Categorize:
   - Hard: truly immutable (physics, law)
   - Soft: could be changed with effort
   - Assumed: we just thought it was required
4. Solve without assumed constraints
5. Add back only necessary constraints

**When to use:**
- Feeling boxed in by requirements
- Solution seems overly complex
- Looking for creative alternatives

---

### Time Horizon Shifting

**Tags:** planning

**Purpose:** Consider impacts across different time scales.

**Process:**
1. Evaluate impact in 1 week
2. Evaluate impact in 1 month
3. Evaluate impact in 1 year
4. Evaluate impact in 5 years
5. Look for decisions that optimize across horizons

**When to use:**
- Technical debt decisions
- Architecture choices
- Career/team planning

---

### Assumption Surfacing

**Tags:** validation

**Purpose:** Make hidden assumptions explicit so they can be tested.

**Process:**
1. State your conclusion or plan
2. Ask: "What must be true for this to work?"
3. List every assumption (technical, business, people)
4. Rate each assumption by:
   - Importance (if wrong, how bad?)
   - Certainty (how confident are you?)
5. Test high-importance, low-certainty assumptions first

**When to use:**
- Before starting implementation
- When plans seem too optimistic
- Debugging failed projects

---

### Impact-Effort Grid

**Tags:** prioritization

**Purpose:** Prioritize items by balancing value against cost.

**Process:**
1. List items to prioritize
2. Rate each on Impact (1-5)
3. Rate each on Effort (1-5)
4. Plot on 2x2 grid:

```
High Impact │ Quick Wins │  Major     │
            │ (Do First) │  Projects  │
────────────┼────────────┼────────────┤
Low Impact  │ Fill-ins   │  Thankless │
            │            │  Tasks     │
            └────────────┴────────────┘
              Low Effort   High Effort
```

5. Prioritize: Quick Wins → Major Projects → Fill-ins → (Skip Thankless)

**When to use:**
- Sprint planning
- Backlog grooming
- Personal task management

---

## Using Mental Models in Sessions

Mental models integrate naturally with reasoning sessions:

```json
// 1. Start session
{ "operation": "start_new", "args": { "title": "Database selection" } }

// 2. Load cipher
{ "operation": "cipher" }

// 3. Get relevant mental model
{
  "operation": "mental_models",
  "args": { "action": "get", "name": "trade-off-matrix" }
}

// 4. Apply model in thoughts
{
  "operation": "thought",
  "args": {
    "thought": "Using trade-off matrix to compare PostgreSQL vs MongoDB vs DynamoDB...",
    "thoughtNumber": 1,
    "totalThoughts": 4,
    "nextThoughtNeeded": true
  }
}
```

---

## Listing and Filtering

### List All Models

```json
{
  "operation": "mental_models",
  "args": { "action": "list" }
}
```

### Filter by Tag

```json
{
  "operation": "mental_models",
  "args": {
    "action": "list",
    "filter": { "tags": ["debugging"] }
  }
}
```

### List Available Tags

```json
{
  "operation": "mental_models",
  "args": { "action": "list_tags" }
}
```

---

## Next Steps

- [**Tools Reference**](./tools-reference.md) — Complete API documentation
- [**Core Concepts**](./core-concepts.md) — Understanding sessions and thoughts
- [**Notebooks**](./notebooks.md) — Literate programming capabilities
