#!/usr/bin/env bash
set -euo pipefail

# 1. Configuration
# Change these if your GCP secret name is different
SECRET_NAME="thoughtbox-api-key"
ENV_VAR_NAME="THOUGHTBOX_API_KEY"
ENV_FILE=".env"

echo "Checking gcloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "Error: No active gcloud account found." >&2
    echo "Please run: gcloud auth application-default login" >&2
    exit 1
fi

echo "Fetching $SECRET_NAME from GCP Secret Manager..."
SECRET_VALUE=$(gcloud secrets versions access latest --secret="$SECRET_NAME" 2>/dev/null)

if [ -z "$SECRET_VALUE" ]; then
    echo "Error: Could not fetch secret '$SECRET_NAME' from GCP." >&2
    echo "Ensure the secret exists and you have 'Secret Manager Secret Accessor' permissions." >&2
    exit 1
fi

# 2. Update or create the .env file
# This file is automatically read by docker-compose and can be used in your shell
if [ ! -f "$ENV_FILE" ]; then
    echo "$ENV_VAR_NAME=$SECRET_VALUE" > "$ENV_FILE"
    echo "Created $ENV_FILE with $ENV_VAR_NAME."
elif grep -q "^$ENV_VAR_NAME=" "$ENV_FILE"; then
    # Update existing value (using a temporary file for cross-platform sed compatibility)
    sed "s|^$ENV_VAR_NAME=.*|$ENV_VAR_NAME=$SECRET_VALUE|" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    echo "Updated $ENV_VAR_NAME in $ENV_FILE."
else
    # Append new value
    echo "$ENV_VAR_NAME=$SECRET_VALUE" >> "$ENV_FILE"
    echo "Added $ENV_VAR_NAME to $ENV_FILE."
fi

echo "Done! You can now run your Docker server using: docker-compose up"
