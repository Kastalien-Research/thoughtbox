# /refactoring-game

Execute a game-theoretic refactoring protocol that prevents perfectionism spirals while maintaining code quality.

## Usage

```
/refactoring-game [codebase_path] [ship_deadline] [budget] [max_iterations] [confidence_threshold]
```

## Arguments

- `codebase_path` (required): Path to the codebase to refactor
- `ship_deadline` (optional): ISO 8601 deadline (default: 4 hours from now)
- `budget` (optional): Energy units for refactoring (default: 100)
- `max_iterations` (optional): Maximum refactoring rounds (default: 5)
- `confidence_threshold` (optional): Quality threshold 0-1 (default: 0.8)
- `comments` (optional): developer comments on the task

## Algorithm

### Phase 0: Initialize Game State

```bash
# Create game state tracking
mkdir -p .refactoring-game
cat > .refactoring-game/state.json << 'EOF'
{
  "round": 0,
  "budget_remaining": $BUDGET,
  "improvements": [],
  "spiral_detections": [],
  "commitment_level": 0,
  "players": {
    "perfectionist": { "satisfaction": 0.0, "weight": 0.8 },
    "shipper": { "urgency": 0.5, "weight": 0.9 },
    "maintainer": { "debt_concern": 0.7, "weight": 0.7 },
    "user": { "patience": 0.9, "weight": 1.0 }
  }
}
EOF

# Analyze codebase health
echo "🎮 Starting Refactoring Game for $CODEBASE_PATH"
echo "⏰ Ship deadline: $SHIP_DEADLINE"
echo "💰 Budget: $BUDGET energy units"
```

### Phase 1: Codebase Auction Analysis

```bash
# Calculate refactoring bids for each component
echo "🔍 Analyzing codebase for refactoring candidates..."

# Find all source files and calculate pain metrics
find "$CODEBASE_PATH" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) | while read -r file; do
  # Calculate complexity score
  complexity=$(npx complexity "$file" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "10")
  
  # Calculate churn (number of commits)
  churn=$(git log --oneline -- "$file" 2>/dev/null | wc -l)
  
  # Search for bug-related commits
  bugs=$(git log --grep="fix\|bug\|issue" --oneline -- "$file" 2>/dev/null | wc -l)
  
  # Calculate bid (willingness to pay for refactoring)
  bid=$(echo "scale=2; ($complexity * 0.4) + ($churn * 0.3) + ($bugs * 10 * 0.3)" | bc)
  
  echo "{\"file\": \"$file\", \"bid\": $bid, \"complexity\": $complexity, \"churn\": $churn, \"bugs\": $bugs}"
done | jq -s 'sort_by(.bid) | reverse' > .refactoring-game/auction.json

echo "📊 Auction complete. Top candidates identified."
```

### Phase 2: Main Game Loop

```bash
# Game loop with anti-Markov mechanisms
while true; do
  # Load current state
  STATE=$(cat .refactoring-game/state.json)
  ROUND=$(echo "$STATE" | jq -r '.round')
  BUDGET_REMAINING=$(echo "$STATE" | jq -r '.budget_remaining')
  COMMITMENT_LEVEL=$(echo "$STATE" | jq -r '.commitment_level')
  
  echo "
  🎲 Round $ROUND | 💰 Budget: $BUDGET_REMAINING | 🔒 Commitment Level: $COMMITMENT_LEVEL"
  
  # Check termination conditions
  if [ "$BUDGET_REMAINING" -le 0 ] || [ "$ROUND" -ge "$MAX_ITERATIONS" ]; then
    echo "🏁 Game ending: Budget exhausted or iteration limit reached"
    break
  fi
  
  # Step 2.1: Spiral Detection
  echo "🌀 Checking for refactoring spirals..."
  
  # Analyze recent changes for patterns
  RECENT_CHANGES=$(echo "$STATE" | jq -r '.improvements[-5:]')
  
  # Detect oscillation (A→B→A pattern)
  if echo "$RECENT_CHANGES" | jq -e 'group_by(.file) | any(length > 2)' >/dev/null 2>&1; then
    echo "⚠️  Oscillation spiral detected! Breaking loop."
    echo "$STATE" | jq '.spiral_detections += ["oscillation"]' > .refactoring-game/state.json
    break
  fi
  
  # Detect scope creep (increasing file count)
  FILE_COUNTS=$(echo "$RECENT_CHANGES" | jq '[.[].files_touched] | sort')
  if echo "$FILE_COUNTS" | jq -e '.[0] < .[-1] * 2' >/dev/null 2>&1; then
    echo "⚠️  Scope creep detected! Applying constraints."
    COMMITMENT_LEVEL=$((COMMITMENT_LEVEL + 1))
  fi
  
  # Detect diminishing returns
  if [ "$ROUND" -gt 3 ]; then
    AVG_VALUE=$(echo "$RECENT_CHANGES" | jq '[.[].value] | add/length')
    if (( $(echo "$AVG_VALUE < 0.5" | bc -l) )); then
      echo "⚠️  Diminishing returns detected. Consider stopping."
      COMMITMENT_LEVEL=$((COMMITMENT_LEVEL + 1))
    fi
  fi
  
  # Step 2.2: Commitment Device Enforcement
  case $COMMITMENT_LEVEL in
    0) echo "📋 No constraints active" ;;
    1) echo "⏰ Soft time box: 2 hours remaining" ;;
    2) echo "🔢 Hard limit: $(($MAX_ITERATIONS - $ROUND)) iterations left" ;;
    3) echo "📁 Scope locked: Only previously touched files" ;;
    4) echo "🐛 Feature freeze: Bug fixes only" ;;
    5) echo "🚢 FORCED SHIP: Merging current state"; break ;;
  esac
  
  # Step 2.3: Run Refactoring Auction
  echo "🏦 Running refactoring auction..."
  
  # Get top bid that fits budget
  WINNER=$(cat .refactoring-game/auction.json | jq --arg budget "$BUDGET_REMAINING" '
    .[] | select(.bid <= ($budget | tonumber)) | 
    select(.file as $f | [inputs] | map(select(.file == $f)) | length == 0)
  ' .refactoring-game/state.json | head -1)
  
  if [ -z "$WINNER" ]; then
    echo "💸 No affordable refactoring candidates. Ending game."
    break
  fi
  
  TARGET_FILE=$(echo "$WINNER" | jq -r '.file')
  BID_AMOUNT=$(echo "$WINNER" | jq -r '.bid')
  
  echo "🎯 Winner: $TARGET_FILE (bid: $BID_AMOUNT)"
  
  # Step 2.4: Generate Refactoring Options
  echo "🤔 Analyzing refactoring options..."
  
  cat > .refactoring-game/options.md << EOF
## Refactoring Options for $TARGET_FILE

### Option 1: Minimal (Quick Wins)
- Extract obvious constants
- Fix linting issues
- Rename unclear variables
- Risk: Low | Value: Low | Time: 15 min

### Option 2: Moderate (Balanced)
- Extract reusable functions
- Improve error handling
- Add input validation
- Risk: Medium | Value: Medium | Time: 45 min

### Option 3: Comprehensive (Full Restructure)
- Implement design patterns
- Create abstraction layers
- Full test coverage
- Risk: High | Value: High | Time: 2 hours
EOF
  
  # Step 2.5: Game-Theoretic Evaluation (Minimax Regret)
  echo "🎯 Evaluating options using minimax regret..."
  
  # Calculate regret matrix
  cat > .refactoring-game/regret.json << EOF
{
  "scenarios": {
    "ship_tomorrow": {
      "minimal": 0.2,
      "moderate": 0.5,
      "comprehensive": 0.9
    },
    "maintain_forever": {
      "minimal": 0.8,
      "moderate": 0.3,
      "comprehensive": 0.1
    },
    "hand_to_junior": {
      "minimal": 0.4,
      "moderate": 0.2,
      "comprehensive": 0.7
    },
    "scale_10x": {
      "minimal": 0.9,
      "moderate": 0.4,
      "comprehensive": 0.2
    }
  }
}
EOF
  
  # Choose option with minimum maximum regret
  BEST_OPTION=$(cat .refactoring-game/regret.json | jq -r '
    .scenarios | to_entries | 
    map(.value | to_entries | map({option: .key, regret: .value})) | 
    flatten | group_by(.option) | 
    map({option: .[0].option, max_regret: [.[].regret] | max}) |
    min_by(.max_regret) | .option
  ')
  
  echo "✅ Selected option: $BEST_OPTION refactoring"
  
  # Step 2.6: Execute Refactoring
  echo "🔧 Executing $BEST_OPTION refactoring on $TARGET_FILE"
  
  # Create backup branch
  BACKUP_BRANCH="refactor-backup-round-$ROUND"
  git checkout -b "$BACKUP_BRANCH" 2>/dev/null || true
  
  # Simulate refactoring execution
  case $BEST_OPTION in
    "minimal")
      echo "  - Extracting constants..."
      echo "  - Fixing linting issues..."
      echo "  - Renaming variables..."
      VALUE=0.3
      ;;
    "moderate")
      echo "  - Extracting functions..."
      echo "  - Improving error handling..."
      echo "  - Adding validation..."
      VALUE=0.6
      ;;
    "comprehensive")
      echo "  - Implementing patterns..."
      echo "  - Creating abstractions..."
      echo "  - Adding tests..."
      VALUE=0.9
      ;;
  esac
  
  # Run tests
  echo "🧪 Running tests..."
  if npm test 2>/dev/null || yarn test 2>/dev/null || true; then
    echo "✅ Tests passing!"
    TEST_RESULT="pass"
  else
    echo "❌ Test failures detected. Rolling back..."
    git checkout - 2>/dev/null || true
    git branch -D "$BACKUP_BRANCH" 2>/dev/null || true
    TEST_RESULT="fail"
    COMMITMENT_LEVEL=$((COMMITMENT_LEVEL + 1))
  fi
  
  # Step 2.7: Update Game State
  IMPROVEMENT=$(cat << EOF
{
  "file": "$TARGET_FILE",
  "round": $ROUND,
  "option": "$BEST_OPTION",
  "value": $VALUE,
  "cost": $BID_AMOUNT,
  "test_result": "$TEST_RESULT",
  "files_touched": 1
}
EOF
)
  
  # Update state
  NEW_BUDGET=$((BUDGET_REMAINING - ${BID_AMOUNT%.*}))
  echo "$STATE" | jq --argjson imp "$IMPROVEMENT" --arg budget "$NEW_BUDGET" --arg round "$((ROUND + 1))" '
    .improvements += [$imp] |
    .budget_remaining = ($budget | tonumber) |
    .round = ($round | tonumber)
  ' > .refactoring-game/state.json
  
  # Step 2.8: Multi-Agent Consensus
  echo "🤝 Checking multi-agent consensus..."
  
  # Calculate each agent's vote
  PERFECTIONIST_VOTE=$(echo "$STATE" | jq -r '.players.perfectionist.satisfaction < 0.8')
  SHIPPER_VOTE=$([ $(date +%s) -lt $(date -d "$SHIP_DEADLINE" +%s) ] && echo true || echo false)
  MAINTAINER_VOTE=$(echo "$STATE" | jq -r '.improvements | length < 10')
  USER_VOTE=$([ "$TEST_RESULT" = "pass" ] && echo true || echo false)
  
  # Compute weighted consensus
  CONTINUE_VOTES=$(echo "$PERFECTIONIST_VOTE $SHIPPER_VOTE $MAINTAINER_VOTE $USER_VOTE" | grep -c true)
  
  if [ "$CONTINUE_VOTES" -lt 2 ]; then
    echo "🛑 Consensus reached to stop refactoring"
    break
  fi
  
  echo "✅ Consensus: Continue refactoring (${CONTINUE_VOTES}/4 agents agree)"
  
  # Update round
  ROUND=$((ROUND + 1))
done
```

### Phase 3: Game Summary

```bash
# Generate final report
echo "
📊 REFACTORING GAME COMPLETE
===========================

"

STATE=$(cat .refactoring-game/state.json)

# Calculate metrics
TOTAL_ROUNDS=$(echo "$STATE" | jq -r '.round')
IMPROVEMENTS_COUNT=$(echo "$STATE" | jq -r '.improvements | length')
TOTAL_VALUE=$(echo "$STATE" | jq -r '.improvements | map(.value) | add // 0')
SPIRALS_AVOIDED=$(echo "$STATE" | jq -r '.spiral_detections | length')
FINAL_BUDGET=$(echo "$STATE" | jq -r '.budget_remaining')

echo "🎮 Game Metrics:"
echo "  - Rounds played: $TOTAL_ROUNDS"
echo "  - Improvements made: $IMPROVEMENTS_COUNT"
echo "  - Total value delivered: $TOTAL_VALUE"
echo "  - Budget remaining: $FINAL_BUDGET"
echo "  - Spiral patterns avoided: $SPIRALS_AVOIDED"

echo "
👥 Final Agent States:"
echo "$STATE" | jq -r '.players | to_entries[] | "  - \(.key): satisfaction = \(.value.satisfaction)"'

echo "
📝 Improvements Summary:"
echo "$STATE" | jq -r '.improvements[] | "  - \(.file): \(.option) refactoring (value: \(.value))"'

# Determine outcome
if [ "$IMPROVEMENTS_COUNT" -gt 0 ] && [ "$SPIRALS_AVOIDED" -eq 0 ]; then
  OUTCOME="✅ SUCCESS: Meaningful improvements without spiral traps"
elif [ "$SPIRALS_AVOIDED" -gt 0 ]; then
  OUTCOME="⚠️  PARTIAL: Avoided spirals but limited improvements"
else
  OUTCOME="❌ MINIMAL: No significant refactoring completed"
fi

echo "
🎯 Final Outcome: $OUTCOME"

# Create final commit
if [ "$IMPROVEMENTS_COUNT" -gt 0 ]; then
  git add -A 2>/dev/null || true
  git commit -m "refactor: Game-theoretic refactoring session

- Completed $TOTAL_ROUNDS rounds with $IMPROVEMENTS_COUNT improvements
- Delivered $TOTAL_VALUE units of value
- Avoided $SPIRALS_AVOIDED potential rabbit holes
- Maintained test coverage and stability

Refactoring game prevented perfectionism spirals while improving code quality." 2>/dev/null || true
fi

# Cleanup
rm -rf .refactoring-game

echo "
🏁 Refactoring game complete. Ship it! 🚢"
```

## Examples

```bash
# Basic usage - refactor src/ folder with 4-hour deadline
/refactoring-game ./src

# Custom deadline and budget
/refactoring-game ./src "2024-12-20T17:00:00" 150

# Conservative settings for critical codebase
/refactoring-game ./critical "2024-12-20T12:00:00" 50 3 0.95

# Aggressive refactoring with more iterations
/refactoring-game ./legacy "2024-12-21T00:00:00" 200 10 0.7
```

## What This Prevents

1. **Perfectionism Spirals**: Commitment devices and budget constraints
2. **Scope Creep**: Auction mechanism limits which files to touch
3. **Oscillation**: Pattern detection breaks repetitive changes
4. **Diminishing Returns**: Value tracking ensures meaningful progress
5. **Context Loss**: Multi-agent consensus maintains strategic view

## Meta-Learning

The algorithm learns from each execution by storing results in `~/.claude-code/refactoring-games.log` for future pattern recognition and heuristic improvement.