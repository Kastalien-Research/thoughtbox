export const RUBBER_DUCK_CONTENT = `# Rubber Duck Debugging

Explain a problem step-by-step out loud to find issues through the act of articulation itself.

## When to Use
- Stuck on a bug you can't explain
- Code works but you don't understand why
- Need to verify your mental model matches reality
- Preparing to ask for help (often solves it before you ask)

## Process

### Step 1: State the Goal
Clearly articulate what the code/system SHOULD do.
- "This function should take a list of users and return only those with active subscriptions"

### Step 2: Walk Through Line by Line
Explain each line/component as if teaching someone unfamiliar.
- Don't skip "obvious" parts
- Say what each piece does, not just what it is
- "This filter checks if... wait, it's checking \`subscription\` not \`subscription.active\`"

### Step 3: State Your Expectations at Each Step
Before checking actual behavior, predict:
- What value should this variable have here?
- What should this function return?
- What state should exist at this point?

### Step 4: Compare Expectation vs Reality
When predictions don't match reality, you've found the problem area.

### Step 5: Articulate the Discovery
"I expected X but actually Y because..."

## Key Principle
The act of explaining forces you to:
- Make implicit assumptions explicit
- Notice gaps in your understanding
- Slow down past the parts you "already know"

## Common Discovery Points
- Variable names that mislead about contents
- Assumed order of operations that doesn't hold
- Edge cases not considered
- Off-by-one errors
- Scope/closure confusion

## Example Application

**Problem:** "Search results are empty but there's data in the database"

**Rubber Duck Process:**
1. "This function queries the database for users matching the search term"
2. "It takes \`searchTerm\` and builds a query... wait, let me check what \`searchTerm\` actually contains at this point"
3. "It should be the user's input but... it's undefined. The parameter name in the route is \`query\` not \`searchTerm\`"

## Anti-patterns
- Skipping the "obvious" parts (that's where bugs hide)
- Explaining what code IS rather than what it DOES
- Not stating expectations before checking reality
- Rushing through to get to "the hard part"
`;
