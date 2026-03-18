#!/usr/bin/env bash
set -euo pipefail

# Configuration: Secrets to push
SECRETS_TO_PUSH=(
  "ANTHROPIC_API_KEY"
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
  "SUPABASE_JWT_SECRET"
  "THOUGHTBOX_API_KEY"
  "GITHUB_APP_ID"
  "GITHUB_APP_INSTALLATION_ID"
  "GITHUB_APP_PRIVATE_KEY"
)

# 1. Generate THOUGHTBOX_API_KEY if it doesn't exist
if ! grep -q "^THOUGHTBOX_API_KEY=" .env; then
    echo "Generating new THOUGHTBOX_API_KEY..."
    NEW_KEY=$(openssl rand -hex 32)
    echo "THOUGHTBOX_API_KEY=$NEW_KEY" >> .env
    echo "Added new key to .env."
fi

# 2. Function to push to Secret Manager
push_secret() {
    local key=$1
    local value=$(grep "^$key=" .env | cut -d= -f2-)
    local secret_name=$(echo "$key" | tr '[:upper:]' '[:lower:]' | tr '_' '-')

    if [ -z "$value" ]; then
        echo "Skipping $key: Not found in .env"
        return
    fi

    echo "Pushing $key to GCP secret '$secret_name'..."

    # Push new version directly (Terraform creates the secret root structure)
    echo -n "$value" | gcloud secrets versions add "$secret_name" --data-file=-
    echo "Successfully pushed $key."
}

# 3. Process all secrets
for secret in "${SECRETS_TO_PUSH[@]}"; do
    push_secret "$secret"
done

echo "All secrets processed successfully."
