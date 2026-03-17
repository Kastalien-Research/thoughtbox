#!/usr/bin/env bash

# Configuration: Secrets to push
SECRETS_TO_PUSH=(
  "ANTHROPIC_API_KEY"
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
  "SUPABASE_JWT_SECRET"
  "THOUGHTBOX_API_KEY_LOCAL"
)

# 1. Generate THOUGHTBOX_API_KEY_LOCAL if it doesn't exist
if ! grep -q "^THOUGHTBOX_API_KEY_LOCAL=" .env; then
    echo "Generating new THOUGHTBOX_API_KEY_LOCAL..."
    NEW_KEY=$(openssl rand -hex 32)
    echo "THOUGHTBOX_API_KEY_LOCAL=$NEW_KEY" >> .env
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

    # Check if secret exists, create if not
    if ! gcloud secrets describe "$secret_name" &>/dev/null; then
        echo "Secret '$secret_name' does not exist. Creating..."
        gcloud secrets create "$secret_name" --replication-policy="automatic"
    fi

    # Push new version
    echo -n "$value" | gcloud secrets versions add "$secret_name" --data-file=-
    echo "Successfully pushed $key."
}

# 3. Process all secrets
for secret in "${SECRETS_TO_PUSH[@]}"; do
    push_secret "$secret"
done

echo "All secrets processed successfully."
