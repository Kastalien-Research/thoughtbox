#!/usr/bin/env bash
set -euo pipefail

# 1. Configuration
# Change "thoughtbox-api-key" to the actual name of your secret in GCP Secret Manager
SECRET_NAME="thoughtbox-api-key"
REMOTE_URL="https://thoughtbox-mcp-272720136470.us-central1.run.app/mcp"

# 2. Fetch the latest secret from GCP
# Ensure you have run: gcloud auth application-default login
THOUGHTBOX_API_KEY=$(gcloud secrets versions access latest --secret="$SECRET_NAME" 2>/dev/null)

if [ -z "$THOUGHTBOX_API_KEY" ]; then
    echo "Error: Could not fetch secret '$SECRET_NAME' from GCP." >&2
    echo "Check your gcloud auth and secret permissions." >&2
    exit 1
fi

# 3. Launch the MCP Proxy
# This translates Stdio (stdin/stdout) to HTTP requests with the Auth header.
# Using 'exec' ensures the proxy handles signals correctly.
# Pinning to a specific version for stability.
exec npx -y @modelcontextprotocol/sdk-proxy@1.25.3 \
  --url "$REMOTE_URL" \
  --header "Authorization: Bearer $THOUGHTBOX_API_KEY"
