#!/usr/bin/env bash
# Probe: what does each PreToolUse hook receive on stdin?
echo "PROBE $(date -u +%H:%M:%S): $(cat | wc -c) bytes" >> /tmp/claude-pretool-probe.txt
exit 0
