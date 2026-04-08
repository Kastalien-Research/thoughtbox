#!/bin/bash
# Simulate MCP tool input
INPUT='{
  "tool_name": "mcp__thoughtbox__thoughtbox_gateway",
  "tool_input": {
    "operation": "thought",
    "args": {
      "thought": "Test thought",
      "thoughtNumber": 1
    }
  },
  "tool_output": {
    "content": [
      {
        "type": "text",
        "text": "Thought recorded"
      }
    ]
  }
}'

echo "Testing post_tool_use.sh with MCP input..."
echo "$INPUT" | ./.claude/hooks/post_tool_use.sh
echo "Exit code: $?"
