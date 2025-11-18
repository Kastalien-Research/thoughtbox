export const ABSTRACTION_LADDERING_CONTENT = `# Abstraction Laddering

Move up and down levels of abstraction to find the right framing for a problem.

## When to Use
- Problem feels too specific or too vague
- Stuck in implementation details, losing sight of why
- Solution doesn't fit the problem scope
- Need to communicate across expertise levels

## Process

### Step 1: State Current Framing
What level are you at now?
- "I need to implement a caching layer"

### Step 2: Ladder Up (Ask "Why?")
Move to higher abstraction by asking why this matters.
- Why cache? → "To reduce latency"
- Why reduce latency? → "To improve user experience"
- Why improve UX? → "To reduce churn"
- Why reduce churn? → "To grow revenue"

### Step 3: Ladder Down (Ask "How?")
Move to lower abstraction by asking how to achieve it.
- How to cache? → "Use Redis with TTL"
- How to configure Redis? → "Set up cluster with read replicas"
- How to set up cluster? → "Use managed Redis on AWS"

### Step 4: Find the Right Level
The optimal level for your task is where:
- You have enough context (not too low)
- You can take concrete action (not too high)
- Trade-offs are visible (usually mid-levels)

### Step 5: Reframe if Needed
Sometimes a different level reveals better solutions.
- "Reduce latency" might be solved by prefetching, not caching
- "Improve UX" might be solved by better loading states, not speed

## Key Principle
Problems at the wrong level of abstraction lead to wrong solutions. Too high = vague; too low = miss the point.

## The Abstraction Ladder

\`\`\`
HIGH ABSTRACTION (Why?)
    ↑
    "Grow the business"
    "Improve user satisfaction"
    "Make the system more reliable"
    "Reduce response time"
    "Add caching"
    "Use Redis"
    "Configure Redis TTL"
    "Set TTL to 3600"
    ↓
LOW ABSTRACTION (How?)
\`\`\`

## Example Application

**Starting point:** "Implement JWT refresh tokens"

**Laddering up:**
- Why? → "To keep users logged in longer"
- Why? → "To reduce friction in the product"
- Why? → "To improve retention"

**New insight:** Maybe the goal isn't long sessions but reduced friction. Could also consider:
- "Remember me" checkbox
- Passwordless auth
- Session length by user segment

**Laddering down:**
- How? → "Check token expiration, issue new token"
- How? → "Use short-lived access token + long-lived refresh token"
- How? → "Store refresh token in httpOnly cookie"

**New insight:** Implementation details reveal security considerations that affect the higher-level goal.

## Communication Applications

**Explaining to executives:** Ladder UP
- Not: "We're adding database indexes"
- But: "We're improving search performance to reduce user frustration"

**Explaining to junior devs:** Ladder DOWN
- Not: "Optimize the query"
- But: "Add an index on user_id because we filter on that column"

## When to Move Levels

**Go UP when:**
- Implementation is blocked (maybe wrong approach entirely)
- Losing sight of purpose
- Need to communicate to leadership
- Solution feels like a hack

**Go DOWN when:**
- Plan is too vague to act on
- Need specific implementation guidance
- Communicating to implementers
- Vague solution hides complexity

## Anti-patterns
- Staying at one level stubbornly
- Going so high everything is "improve business"
- Going so low you lose context for decisions
- Not checking if level is appropriate for audience
`;
