#!/bin/bash
echo "Checking python3..."
which python3
python3 --version

echo "--------------------------------"
echo "Testing post_tool_use.sh with valid input"
echo '{"tool_name": "Bash", "tool_input": {"command": "git status"}}' | ./.claude/hooks/post_tool_use.sh
echo "Exit code: $?"

echo "--------------------------------"
echo "Testing post_tool_use.sh with empty input"
echo '' | ./.claude/hooks/post_tool_use.sh
echo "Exit code: $?"

echo "--------------------------------"
echo "Testing post_tool_use.sh with invalid input"
echo '{invalid' | ./.claude/hooks/post_tool_use.sh
echo "Exit code: $?"

echo "--------------------------------"
echo "Testing pre_tool_use.sh with valid input (safe)"
echo '{"tool_name": "Bash", "tool_input": {"command": "ls"}}' | ./.claude/hooks/pre_tool_use.sh
echo "Exit code: $?"

echo "--------------------------------"
echo "Testing pre_tool_use.sh with empty input"
echo '' | ./.claude/hooks/pre_tool_use.sh
echo "Exit code: $?"
