export const FIVE_WHYS_CONTENT = `# Five Whys

Iteratively ask "Why?" to drill down from symptoms to root cause.

## When to Use
- A problem keeps recurring after fixes
- You're treating symptoms not causes
- Need to understand failure chains
- Post-incident analysis

## Process

### Step 1: State the Problem Clearly
Start with a specific, observable problem.
- Bad: "The system is slow"
- Good: "API response time increased from 200ms to 2s at 3pm yesterday"

### Step 2: Ask Why (First Level)
Why did this happen? State the immediate cause.
- "Why did response time increase?" → "The database queries started timing out"

### Step 3: Ask Why Again (Second Level)
Why did THAT happen?
- "Why did queries start timing out?" → "The connection pool was exhausted"

### Step 4: Continue (Third through Fifth Levels)
Keep asking until you reach something actionable at a systemic level.
- "Why was the pool exhausted?" → "Connections weren't being released"
- "Why weren't they released?" → "Error handling didn't close connections on exception"
- "Why not?" → "No code review checklist item for resource cleanup"

### Step 5: Verify the Chain
Read the chain backward: does fixing the root cause prevent all the downstream effects?

## Key Principle
Stop when you reach something you can:
- Change systemically (process, architecture, policy)
- Prevent from recurring
- Actually control

## Signals You've Gone Too Far
- "Because humans make mistakes" (too generic)
- "Because physics" (can't change)
- "Because requirements changed" (may be valid, but ask if process could handle change better)

## Signals You Haven't Gone Far Enough
- Fix would only address this instance
- Same type of failure could easily recur
- You're fixing what broke, not why it was breakable

## Example Application

**Problem:** "Customer received wrong order"

1. Why? → Warehouse shipped wrong item
2. Why? → Picker grabbed from wrong bin
3. Why? → Bins not clearly labeled
4. Why? → Labels fade and aren't replaced
5. Why? → No scheduled label maintenance

**Root cause fix:** Implement quarterly bin label audit
**Symptom fix (insufficient):** Re-train that one picker

## Common Mistakes
- Stopping at the first satisfying answer
- Following only one branch (problems often have multiple causes)
- Asking "who" instead of "why" (blame vs understanding)
- Not verifying the causal chain backward
`;
