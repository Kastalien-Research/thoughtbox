#!/usr/bin/env bash
# Probe: does the dispatcher even get called?
date -u +%Y-%m-%dT%H:%M:%SZ > /tmp/claude-dispatcher-probe.txt
cat >> /tmp/claude-dispatcher-probe.txt
exit 0
