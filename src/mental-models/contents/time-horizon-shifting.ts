export const TIME_HORIZON_SHIFTING_CONTENT = `# Time Horizon Shifting

Evaluate decisions across multiple time scales to reveal different priorities.

## When to Use
- Short-term pressure conflicting with long-term goals
- Quick fix vs proper solution decisions
- Technical debt discussions
- Strategic planning

## Process

### Step 1: State the Decision
What are you trying to decide?
- "Should we add this feature using a hack or do it properly?"

### Step 2: Evaluate at Multiple Horizons
For each option, consider impact at:
- **1 week:** Immediate consequences
- **1 month:** Short-term effects
- **1 year:** Medium-term implications
- **5 years:** Long-term outcomes

### Step 3: Identify Reversibility at Each Horizon
- At what point does this become hard to change?
- When do we lock in consequences?
- What's the cost of changing course later?

### Step 4: Notice Where Options Diverge
- At which horizon do the options start to differ significantly?
- This reveals what time scale matters most for this decision

### Step 5: Choose Based on Appropriate Horizon
Match decision importance to time horizon:
- Trivial decision → optimize for 1 week
- Important decision → consider 1 year
- Strategic decision → consider 5 years

## Key Principle
Decisions that seem obvious at one time horizon often look different at another. Shifting horizons reveals hidden costs and benefits.

## Example Application

**Decision:** "Add feature with hardcoded values vs build config system"

**Option A: Hardcoded values**

| Horizon | Outcome |
|---------|---------|
| 1 week | Ship fast, users happy |
| 1 month | Need to change value, requires deploy |
| 1 year | 10 hardcoded values scattered in code, changes are risky |
| 5 years | Major refactor needed, no one knows where values are |

**Option B: Config system**

| Horizon | Outcome |
|---------|---------|
| 1 week | Delayed ship, more complexity |
| 1 month | Easy to adjust values |
| 1 year | All config centralized, changes are safe |
| 5 years | Foundation for feature flags, A/B testing |

**Analysis:**
Options diverge significantly at 1-year horizon. If this feature will be around for years, Option B is clearly better despite 1-week cost.

**Decision:** Build config system if feature is strategic; hardcode if experimental/temporary.

## Common Patterns Revealed

**Technical debt:**
- 1 week: Fast
- 1 year: Slow (paying interest)
- 5 years: Paralyzed (can't change)

**Proper abstractions:**
- 1 week: Slow (building foundation)
- 1 year: Fast (leveraging foundation)
- 5 years: Very fast (compound benefit)

**Team knowledge:**
- 1 week: Expert ships faster
- 1 year: Team with shared knowledge ships faster
- 5 years: Bus factor matters

## Horizon-Specific Questions

**1 week:**
- Will this unblock us?
- Can we ship?

**1 month:**
- Will we need to change this?
- Are we creating confusion?

**1 year:**
- Will we understand this?
- Does this scale?

**5 years:**
- Is this foundational?
- Are we building capability or debt?

## Decision Rules by Horizon

**Optimize for shortest horizon when:**
- Experimenting/validating
- Very uncertain about need
- Easy to change later
- Low stakes

**Optimize for longest horizon when:**
- Building core infrastructure
- High certainty about need
- Hard to change later
- High stakes

## Anti-patterns
- Always optimizing for immediate (accumulates debt)
- Always optimizing for long-term (never ships)
- Not checking reversibility
- Treating all decisions as equally strategic
`;
