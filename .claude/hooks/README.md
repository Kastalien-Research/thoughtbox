# Claude Hooks

Shell-based hooks for Claude Code IDE integration.

## Overview

This directory contains event hooks that execute at various points during Claude sessions. All hooks are implemented as shell scripts for simplicity and zero dependencies (except `jq` for JSON processing).

## Available Hooks

### Core Hooks

- **`notification.sh`** - Logs notification events when Claude needs user input
- **`post_tool_use.sh`** - Logs tool usage after execution
- **`pre_tool_use.sh`** - Validates and blocks dangerous tool calls (rm -rf, .env access)
- **`pre_compact.sh`** - Logs compaction events, optionally backs up transcripts
- **`session_start.sh`** - Logs session start, optionally loads git context
- **`stop.sh`** - Logs session stop, optionally converts transcript to JSON
- **`subagent_stop.sh`** - Logs subagent completion
- **`user_prompt_submit.sh`** - Logs and validates user prompts

### Safety Features

**`pre_tool_use.sh` blocks:**
- Dangerous `rm -rf` commands
- Access to `.env` files (use `.env.sample` instead)

## Usage

Hooks receive JSON input via stdin and write logs to `logs/` directory.

### Common Flags

- `--notify` - Enable notifications (logging only, TTS removed)
- `--backup` - Create transcript backups (pre_compact)
- `--verbose` - Print detailed output
- `--chat` - Convert transcript to JSON array (stop hooks)
- `--load-context` - Load git/project context (session_start)

### Examples

```bash
# Basic usage (stdin)
echo '{"session_id": "abc123"}' | ./notification.sh

# With flags
echo '{"session_id": "abc123"}' | ./pre_compact.sh --backup --verbose

# Test safety validation
echo '{"tool_name": "Bash", "tool_input": {"command": "rm -rf /"}}' | ./pre_tool_use.sh
# Returns exit code 2 (blocked)
```

## Requirements

- **bash/zsh** - Standard on macOS
- **jq** - JSON processor (`brew install jq`)
- **git** - Optional, for context loading
- **gh** - Optional, for GitHub issues

## Utilities

### LLM (utils/llm/)

- **`anth.py`** - Anthropic API integration (optional, for advanced features)

## Logs

All hooks write to `logs/[hook_name].json`:

```
logs/
├── notification.json
├── post_tool_use.json
├── pre_tool_use.json
├── pre_compact.json
├── session_start.json
├── stop.json
├── subagent_stop.json
├── user_prompt_submit.json
├── chat.json (if --chat used)
└── transcript_backups/ (if --backup used)
```

## Changes from Original

### ✅ Kept
- All core hook functionality
- Safety validations (dangerous commands, .env protection)
- Session logging
- Anthropic LLM utility

### ❌ Removed
- TTS functionality (ElevenLabs, OpenAI TTS, pyttsx3)
- OpenAI LLM integration
- Ollama LLM integration
- LLM-generated completion messages
- Agent naming features

### 🔄 Converted
- Python → Shell scripts
- External service dependencies → Native tools
- Complex LLM logic → Simple static messages

## Development

To add a new hook:

1. Create `[hook_name].sh` in this directory
2. Make it executable: `chmod +x [hook_name].sh`
3. Read JSON from stdin: `input_json=$(cat)`
4. Process with `jq`
5. Log to `logs/[hook_name].json`
6. Exit with appropriate code (0=success, 2=block)

## Exit Codes

- `0` - Success, allow operation
- `2` - Block operation, show error to Claude
- `1` - Error (hook failure, operation proceeds)
