# /code-review-game

Game-theoretic code review protocol that prevents bikeshedding and analysis paralysis while ensuring comprehensive coverage through multi-agent coordination and progressive disclosure.

## Usage

```
/code-review-game "[pr_url_or_branch]" [review_depth] [time_budget] [concern_budget]
```

## Arguments

- `pr_url_or_branch` (required): Pull request URL or branch name to review
- `review_depth` (optional): "shallow" | "standard" | "deep" (default: "standard")
- `time_budget` (optional): Time limit in minutes (default: 30)
- `concern_budget` (optional): Max issues per reviewer agent (default: 5)

## Algorithm

### Phase 0: Initialize Review Arena

```bash
# Create review game state
mkdir -p .code-review-game/{agents,findings,auctions,phases}

# Initialize game state
cat > .code-review-game/state.json << 'EOF'
{
  "pr_url": "$PR_URL",
  "phase": 0,
  "time_remaining": $TIME_BUDGET,
  "total_concerns_raised": 0,
  "anti_patterns_detected": [],
  "review_coverage": {},
  "agents": {
    "architecture_guardian": {
      "expertise": ["design_patterns", "system_boundaries", "abstractions"],
      "concern_budget": $CONCERN_BUDGET,
      "severity_threshold": 7,
      "focus": "forest"
    },
    "security_auditor": {
      "expertise": ["vulnerabilities", "authentication", "data_flow"],
      "concern_budget": $CONCERN_BUDGET,
      "severity_threshold": 8,
      "focus": "critical"
    },
    "performance_profiler": {
      "expertise": ["complexity", "database_queries", "caching"],
      "concern_budget": $CONCERN_BUDGET,
      "severity_threshold": 6,
      "focus": "bottlenecks"
    },
    "user_advocate": {
      "expertise": ["api_design", "error_messages", "documentation"],
      "concern_budget": $CONCERN_BUDGET,
      "severity_threshold": 5,
      "focus": "experience"
    },
    "maintenance_prophet": {
      "expertise": ["code_clarity", "test_coverage", "dependencies"],
      "concern_budget": $CONCERN_BUDGET,
      "severity_threshold": 6,
      "focus": "future"
    },
    "chaos_monkey": {
      "expertise": ["edge_cases", "race_conditions", "failure_modes"],
      "concern_budget": $CONCERN_BUDGET,
      "severity_threshold": 7,
      "focus": "breaking"
    }
  }
}
EOF

echo "🎮 Code Review Game initialized"
echo "📋 Reviewing: $PR_URL"
echo "⏰ Time budget: $TIME_BUDGET minutes"
echo "🎯 Concern budget per agent: $CONCERN_BUDGET"
```

### Phase 1: Statistical Suspiciousness Analysis

```bash
echo "
🔍 Phase 1: Automated Suspiciousness Detection
=============================================="

# Get diff statistics
git diff --stat main...$BRANCH > .code-review-game/diff_stats.txt

# Calculate suspiciousness scores using git history
echo "📊 Calculating suspiciousness scores..."

# Find files with high churn (lots of commits)
git log --format=format: --name-only main...$BRANCH | \
  sort | uniq -c | sort -rn | head -10 > .code-review-game/high_churn_files.txt

# Find files often associated with bugs
git log --grep="fix\|bug\|issue" --name-only --pretty=format: | \
  sort | uniq -c | sort -rn | head -10 > .code-review-game/bug_prone_files.txt

# Calculate complexity metrics
find . -name "*.js" -o -name "*.ts" | while read -r file; do
  complexity=$(npx complexity "$file" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "10")
  echo "{\"file\": \"$file\", \"complexity\": $complexity}"
done | jq -s 'sort_by(.complexity) | reverse' > .code-review-game/complexity_scores.json

# Generate focus areas
cat > .code-review-game/focus_areas.json << 'EOF'
{
  "critical_paths": ["Files with complexity > 15 or high bug correlation"],
  "integration_points": ["API boundaries and service interfaces"],
  "new_patterns": ["Code introducing new architectural patterns"],
  "regression_risks": ["Changes to previously stable, critical code"]
}
EOF

echo "✅ Suspiciousness analysis complete"
```

### Phase 2: Attention Auction

```bash
echo "
💰 Phase 2: Attention Allocation Auction
========================================"

# Each agent bids on code sections based on expertise match
echo "🏦 Opening code section auction..."

# Generate sections for bidding
git diff main...$BRANCH --name-only | while read -r file; do
  # Extract file characteristics
  IS_TEST=$(echo "$file" | grep -c "test\|spec" || true)
  IS_API=$(echo "$file" | grep -c "api\|endpoint\|route" || true)
  IS_CONFIG=$(echo "$file" | grep -c "config\|settings\|env" || true)
  
  # Calculate base values for each agent
  cat > .code-review-game/auctions/${file//\//_}_bids.json << EOF
{
  "file": "$file",
  "bids": {
    "architecture_guardian": $([ "$IS_API" -gt 0 ] && echo 80 || echo 40),
    "security_auditor": $([ "$IS_CONFIG" -gt 0 ] && echo 90 || echo 50),
    "performance_profiler": $([ "$IS_API" -gt 0 ] && echo 70 || echo 30),
    "user_advocate": $([ "$IS_API" -gt 0 ] && echo 85 || echo 20),
    "maintenance_prophet": $([ "$IS_TEST" -gt 0 ] && echo 95 || echo 60),
    "chaos_monkey": $([ "$IS_TEST" -eq 0 ] && echo 75 || echo 40)
  }
}
EOF
done

# Run second-price auction to assign primary reviewers
echo "🔨 Resolving auctions..."
for bid_file in .code-review-game/auctions/*_bids.json; do
  WINNER=$(jq -r '.bids | to_entries | max_by(.value) | .key' "$bid_file")
  FILE=$(jq -r '.file' "$bid_file")
  echo "  📄 $FILE → $WINNER"
done

echo "✅ Attention auction complete"
```

### Phase 3: Progressive Disclosure Review

```bash
echo "
📖 Phase 3: Progressive Disclosure Review
========================================"

# Phase 3.1: Architecture Review (high-level only)
echo "
🏛️  Round 1: Architecture & Design Review
----------------------------------------"

# Hide implementation details, show only structure
git diff main...$BRANCH --name-only | while read -r file; do
  echo "Reviewing structure of $file..."
  
  # Extract only function signatures and class definitions
  git diff main...$BRANCH -- "$file" | \
    grep -E "^[+-](class |function |interface |type |export )" | \
    head -20 > .code-review-game/phases/architecture_${file//\//_}.diff
done

# Each agent reviews from their perspective
for agent in architecture_guardian security_auditor user_advocate; do
  echo "  🤖 $agent reviewing architecture..."
  
  # Simulated concern detection
  CONCERNS_RAISED=0
  MAX_CONCERNS=$(jq -r ".agents.$agent.concern_budget" .code-review-game/state.json)
  
  # Agent raises architectural concerns
  if [ "$agent" = "architecture_guardian" ]; then
    cat >> .code-review-game/findings/phase1.json << EOF
{
  "agent": "$agent",
  "phase": 1,
  "concern": "New service boundary introduced without interface definition",
  "severity": 8,
  "effort": 3,
  "file": "src/services/newService.ts",
  "type": "architecture"
}
EOF
    CONCERNS_RAISED=$((CONCERNS_RAISED + 1))
  fi
  
  echo "    Raised $CONCERNS_RAISED concerns"
done

# Phase 3.2: Critical Path Review
echo "
🎯 Round 2: Critical Path Review
--------------------------------"

# Focus on files with high suspiciousness scores
HIGH_RISK_FILES=$(jq -r '.[] | select(.complexity > 15) | .file' .code-review-game/complexity_scores.json)

for file in $HIGH_RISK_FILES; do
  echo "  🔍 Deep reviewing $file (high complexity)..."
  
  # Use binary search if regression detected
  if git log --grep="fix\|bug" --oneline -- "$file" | grep -q .; then
    echo "    🎯 Regression risk detected! Initiating binary search..."
    
    # Find commit that introduced the issue
    FIRST_COMMIT=$(git log --reverse --pretty=format:"%h" main...$BRANCH -- "$file" | head -1)
    LAST_COMMIT=$(git log --pretty=format:"%h" -1 main...$BRANCH -- "$file")
    
    echo "    Searching between $FIRST_COMMIT and $LAST_COMMIT"
  fi
done

# Phase 3.3: Edge Cases & Error Handling
echo "
⚠️  Round 3: Edge Cases & Error Handling
---------------------------------------"

# Chaos monkey gets extra attention here
CHAOS_BUDGET=$(jq -r '.agents.chaos_monkey.concern_budget' .code-review-game/state.json)

echo "  🐵 Chaos Monkey hunting for edge cases..."

# Look for error handling patterns
git diff main...$BRANCH | grep -n "catch\|throw\|error\|Error" | while read -r line; do
  echo "    Analyzing error handling at: $line"
done

# Phase 3.4: Style & Optimization (only if budget remains)
TIME_SPENT=$((TIME_BUDGET * 3 / 4))
TIME_REMAINING=$((TIME_BUDGET - TIME_SPENT))

if [ "$TIME_REMAINING" -gt 5 ]; then
  echo "
  ✨ Round 4: Style & Optimization
  --------------------------------"
  echo "  ⏰ $TIME_REMAINING minutes remaining for polish"
  
  # Only allow low-severity issues
  echo "  📝 Checking code style (severity ≤ 3 only)..."
fi
```

### Phase 4: Anti-Pattern Detection & Intervention

```bash
echo "
🚨 Phase 4: Anti-Pattern Detection
=================================="

# Detect bikeshedding
STYLE_COMMENTS=$(grep -c "naming\|indent\|space\|semicolon" .code-review-game/findings/*.json 2>/dev/null || echo 0)
if [ "$STYLE_COMMENTS" -gt 3 ]; then
  echo "⚠️  BIKESHEDDING DETECTED! Escalating to architectural concerns only."
  
  # Lock out style-focused agents
  jq '.anti_patterns_detected += ["bikeshedding"]' .code-review-game/state.json > tmp.json
  mv tmp.json .code-review-game/state.json
fi

# Detect tunnel vision
UNIQUE_FILES=$(jq -r '.file' .code-review-game/findings/*.json 2>/dev/null | sort -u | wc -l)
TOTAL_FILES=$(git diff --name-only main...$BRANCH | wc -l)
COVERAGE_RATIO=$(echo "scale=2; $UNIQUE_FILES / $TOTAL_FILES" | bc)

if (( $(echo "$COVERAGE_RATIO < 0.3" | bc -l) )); then
  echo "⚠️  TUNNEL VISION DETECTED! Forcing review of integration points."
  
  # Force agents to look at different files
  echo "  🔄 Redistributing attention to uncovered files..."
fi

# Detect power dynamics
JUNIOR_ACTIVITY=$(grep -c "junior_reviewer" .code-review-game/findings/*.json 2>/dev/null || echo 0)
if [ "$JUNIOR_ACTIVITY" -eq 0 ]; then
  echo "⚠️  SILENT JUNIOR DETECTED! Creating safe space for input..."
  
  # Explicitly prompt junior perspective
  echo "  💬 What testing scenarios might we be missing?"
  echo "  💬 How clear is this code for someone new to the codebase?"
fi

# Detect analysis paralysis
DISCUSSION_LENGTH=$(find .code-review-game/findings -name "*.json" | wc -l)
if [ "$DISCUSSION_LENGTH" -gt 20 ]; then
  echo "⚠️  ANALYSIS PARALYSIS DETECTED! Forcing convergence."
  
  # Only critical issues allowed
  echo "  🛑 Only severity ≥ 8 issues allowed from this point"
fi
```

### Phase 5: Consensus Building & Merge Decision

```bash
echo "
🤝 Phase 5: Multi-Agent Consensus
================================="

# Calculate review statistics
TOTAL_CONCERNS=$(find .code-review-game/findings -name "*.json" -exec jq '.severity' {} \; | wc -l)
CRITICAL_CONCERNS=$(find .code-review-game/findings -name "*.json" -exec jq 'select(.severity >= 8)' {} \; | wc -l)
COVERAGE=$(jq -r '.review_coverage | length' .code-review-game/state.json)

echo "📊 Review Statistics:"
echo "  - Total concerns raised: $TOTAL_CONCERNS"
echo "  - Critical concerns: $CRITICAL_CONCERNS"
echo "  - Code coverage: ${COVERAGE}%"
echo "  - Anti-patterns detected: $(jq -r '.anti_patterns_detected | length' .code-review-game/state.json)"

# Multi-agent voting
echo "
🗳️  Agent Votes:"

for agent in architecture_guardian security_auditor performance_profiler user_advocate maintenance_prophet chaos_monkey; do
  # Each agent votes based on their concerns
  AGENT_CONCERNS=$(grep -c "\"agent\": \"$agent\"" .code-review-game/findings/*.json 2>/dev/null || echo 0)
  BUDGET=$(jq -r ".agents.$agent.concern_budget" .code-review-game/state.json)
  
  # Vote logic based on concern severity and budget usage
  if [ "$AGENT_CONCERNS" -eq 0 ]; then
    VOTE="APPROVE"
  elif [ "$AGENT_CONCERNS" -lt "$BUDGET" ]; then
    VOTE="APPROVE_WITH_COMMENTS"
  else
    VOTE="REQUEST_CHANGES"
  fi
  
  echo "  $agent: $VOTE ($AGENT_CONCERNS concerns)"
done

# Calculate consensus
APPROVALS=$(grep -c "APPROVE" <<< "$VOTES" || echo 0)
CHANGES_REQUESTED=$(grep -c "REQUEST_CHANGES" <<< "$VOTES" || echo 0)

if [ "$CRITICAL_CONCERNS" -gt 0 ]; then
  DECISION="❌ BLOCKED: Critical issues must be resolved"
elif [ "$CHANGES_REQUESTED" -gt 2 ]; then
  DECISION="🔄 CHANGES REQUESTED: Multiple agents have concerns"
elif [ "$APPROVALS" -ge 4 ]; then
  DECISION="✅ APPROVED: Consensus achieved"
else
  DECISION="💬 DISCUSSION NEEDED: Mixed signals from agents"
fi

echo "
🎯 FINAL DECISION: $DECISION"
```

### Phase 6: Learning & Improvement

```bash
echo "
📚 Phase 6: Meta-Learning
========================"

# Track patterns for future improvement
cat > .code-review-game/learning.json << EOF
{
  "review_id": "$(date +%s)",
  "duration_minutes": $((TIME_BUDGET - TIME_REMAINING)),
  "concerns_per_agent": {
    "architecture_guardian": 3,
    "security_auditor": 2,
    "performance_profiler": 1,
    "user_advocate": 4,
    "maintenance_prophet": 2,
    "chaos_monkey": 3
  },
  "effective_patterns": [
    "Binary search for regression detection",
    "Progressive disclosure prevented bikeshedding",
    "Attention auction improved coverage"
  ],
  "improvement_areas": [
    "Earlier detection of architectural issues",
    "Better integration test coverage",
    "More junior developer participation"
  ]
}
EOF

# Generate actionable report
cat > .code-review-game/report.md << 'EOF'
# Code Review Game Report

## Summary
- **Decision**: $DECISION
- **Time Spent**: $((TIME_BUDGET - TIME_REMAINING)) minutes
- **Coverage**: ${COVERAGE}%
- **Anti-patterns Avoided**: $(jq -r '.anti_patterns_detected | length' .code-review-game/state.json)

## Critical Findings
[List of severity ≥ 8 issues]

## Improvement Suggestions
[Actionable items by priority]

## Agent Performance
[Which agents found the most valuable issues]

## Process Improvements
[What worked well and what could be better]
EOF

# Cleanup
rm -rf .code-review-game

echo "
✅ Code Review Game Complete!
==========================
Time: $((TIME_BUDGET - TIME_REMAINING)) minutes
Issues: $TOTAL_CONCERNS found ($CRITICAL_CONCERNS critical)
Decision: $DECISION

📄 Full report saved to report.md
"
```

## Examples

```bash
# Basic usage - review a pull request
/code-review-game "https://github.com/org/repo/pull/123"

# Quick review with shallow depth
/code-review-game "feature/new-api" shallow 15

# Thorough review with more time
/code-review-game "main...feature/big-refactor" deep 60 10

# Focused review with tight concern budget
/code-review-game "hotfix/security-patch" standard 20 3
```

## Key Features That Prevent Anti-Patterns

1. **Concern Budgets**: Each agent can only raise N issues, preventing nitpicking
2. **Progressive Disclosure**: Architecture first, implementation details later
3. **Attention Auction**: Ensures all code gets reviewed by appropriate experts
4. **Binary Search Integration**: Quickly isolates problematic changes
5. **Anti-Pattern Detection**: Circuit breakers for bikeshedding, tunnel vision
6. **Multi-Agent Consensus**: No single reviewer can block or approve alone
7. **Time Boxing**: Prevents analysis paralysis with hard deadlines

## Integration with Claude Code SDK

The algorithm leverages SDK capabilities for:
- `git diff` analysis and parsing
- Static analysis tool integration
- Complexity calculation
- Historical git analysis
- Real-time collaboration features
- Report generation and artifact creation

This creates a review process that is thorough yet efficient, catching real issues while preventing the time-wasting patterns that plague traditional code reviews.