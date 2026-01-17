#!/bin/bash
# Enable Claude Code telemetry to local OTEL collector
#
# Usage: source ./otel-collector/enable-telemetry.sh
#        claude
#
# Or add these to your shell profile (~/.zshrc, ~/.bashrc)

# Required: Enable telemetry
export CLAUDE_CODE_ENABLE_TELEMETRY=1

# Configure exporters
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp

# Point to local collector (running in Docker)
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Faster export for debugging (default: 60s for metrics, 5s for logs)
export OTEL_METRIC_EXPORT_INTERVAL=10000   # 10 seconds
export OTEL_LOGS_EXPORT_INTERVAL=2000      # 2 seconds

# Include session ID for correlation
export OTEL_METRICS_INCLUDE_SESSION_ID=true

echo "Claude Code telemetry enabled"
echo "  Endpoint: http://localhost:4317 (gRPC)"
echo "  Logs export interval: 2s"
echo "  Metrics export interval: 10s"
echo ""
echo "Make sure the OTEL collector is running:"
echo "  cd $(dirname "$0")/.. && docker compose up -d otel-collector"
echo ""
echo "View logs with:"
echo "  docker compose exec otel-collector tail -f /var/log/otel/claude-code-events.jsonl"
