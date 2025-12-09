#!/bin/bash
# Deploy Thoughtbox to Google Cloud Platform with Identity-Aware Proxy
set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-thoughtbox-480620}"
REGION="${GCP_REGION:-us-central1}"
ZONE="${GCP_ZONE:-us-central1-a}"
INSTANCE_NAME="thoughtbox-vm"
MACHINE_TYPE="e2-micro"
IMAGE_NAME="thoughtbox"
REPO_NAME="thoughtbox-repo"
SERVICE_PORT=1729

echo "🚀 Deploying Thoughtbox to GCP"
echo "================================"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Zone: $ZONE"
echo ""

# Step 1: Enable required APIs
echo "📋 Step 1/7: Enabling required GCP APIs..."
gcloud services enable \
  compute.googleapis.com \
  artifactregistry.googleapis.com \
  iap.googleapis.com \
  --project="$PROJECT_ID"

echo "✓ APIs enabled"
echo ""

# Step 2: Create Artifact Registry repository
echo "📦 Step 2/7: Creating Artifact Registry repository..."
if gcloud artifacts repositories describe "$REPO_NAME" \
  --location="$REGION" \
  --project="$PROJECT_ID" &>/dev/null; then
  echo "Repository $REPO_NAME already exists"
else
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Thoughtbox MCP Server images" \
    --project="$PROJECT_ID"
  echo "✓ Repository created"
fi
echo ""

# Step 3: Configure Docker for Artifact Registry
echo "🔧 Step 3/7: Configuring Docker authentication..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
echo "✓ Docker configured"
echo ""

# Step 4: Build and push Docker image
echo "🐋 Step 4/7: Building and pushing Docker image..."
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"
docker build -t "$IMAGE_TAG" .
docker push "$IMAGE_TAG"
echo "✓ Image pushed: $IMAGE_TAG"
echo ""

# Step 5: Create firewall rule for IAP
echo "🔥 Step 5/7: Creating firewall rule for IAP..."
if gcloud compute firewall-rules describe allow-iap-proxy \
  --project="$PROJECT_ID" &>/dev/null; then
  echo "Firewall rule already exists"
else
  gcloud compute firewall-rules create allow-iap-proxy \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:$SERVICE_PORT \
    --source-ranges=130.211.0.0/22,35.191.0.0/16 \
    --target-tags=thoughtbox-iap \
    --project="$PROJECT_ID"
  echo "✓ Firewall rule created"
fi
echo ""

# Generate a strong auth token for the server
AUTH_TOKEN=$(openssl rand -base64 32)
echo "🔐 Generated AUTH_TOKEN (save this securely):"
echo "$AUTH_TOKEN"
echo ""

# Step 6: Create VM instance with Container-Optimized OS
echo "🖥️  Step 6/7: Creating GCE VM instance..."
if gcloud compute instances describe "$INSTANCE_NAME" \
  --zone="$ZONE" \
  --project="$PROJECT_ID" &>/dev/null; then
  echo "Instance $INSTANCE_NAME already exists. Updating..."
  gcloud compute instances delete "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --project="$PROJECT_ID" \
    --quiet
fi

gcloud compute instances create-with-container "$INSTANCE_NAME" \
  --zone="$ZONE" \
  --machine-type="$MACHINE_TYPE" \
  --network-interface=network-tier=PREMIUM,stack-type=IPV4_ONLY,subnet=default \
  --maintenance-policy=MIGRATE \
  --provisioning-model=STANDARD \
  --tags=thoughtbox-iap,http-server \
  --container-image="$IMAGE_TAG" \
  --container-restart-policy=always \
  --container-env=NODE_ENV=production,PORT=$SERVICE_PORT,AUTH_TOKEN="$AUTH_TOKEN",THOUGHTBOX_DATA_DIR=/root/.thoughtbox \
  --container-mount-host-path=mount-path=/root/.thoughtbox,host-path=/mnt/disks/data,mode=rw \
  --create-disk=auto-delete=yes,boot=yes,device-name="$INSTANCE_NAME",image=projects/cos-cloud/global/images/cos-stable-117-18613-75-48,mode=rw,size=10,type=pd-balanced \
  --create-disk=auto-delete=yes,device-name="${INSTANCE_NAME}-data",mode=rw,name="${INSTANCE_NAME}-data",size=10,type=pd-standard \
  --no-shielded-secure-boot \
  --shielded-vtpm \
  --shielded-integrity-monitoring \
  --labels=container-vm=cos-stable-117-18613-75-48,app=thoughtbox \
  --project="$PROJECT_ID"

echo "✓ VM instance created"
echo ""

# Wait for instance to be ready
echo "⏳ Waiting for instance to be ready..."
sleep 30

# Get instance details
INSTANCE_IP=$(gcloud compute instances describe "$INSTANCE_NAME" \
  --zone="$ZONE" \
  --project="$PROJECT_ID" \
  --format="get(networkInterfaces[0].accessConfigs[0].natIP)")

echo "✓ Instance ready"
echo "  External IP: $INSTANCE_IP"
echo ""

# Step 7: Configure IAP
echo "🔒 Step 7/7: Configuring Identity-Aware Proxy..."
echo ""
echo "⚠️  MANUAL STEPS REQUIRED:"
echo "================================"
echo "IAP requires manual configuration in the GCP Console:"
echo ""
echo "1. Go to: https://console.cloud.google.com/security/iap?project=$PROJECT_ID"
echo "2. Click 'ENABLE API' if needed"
echo "3. Configure OAuth consent screen:"
echo "   - User type: External (or Internal if workspace)"
echo "   - App name: Thoughtbox MCP Server"
echo "   - Support email: your email"
echo "4. Add your email to test users"
echo "5. Create a backend service for your VM"
echo "6. Enable IAP for the backend service"
echo "7. Add your Google account to authorized users"
echo ""
echo "Detailed guide: https://cloud.google.com/iap/docs/enabling-compute-howto"
echo ""

# Save configuration
cat > deployment-info.txt <<EOF
Thoughtbox Deployment Information
==================================
Project ID: $PROJECT_ID
Region: $REGION
Zone: $ZONE
Instance: $INSTANCE_NAME
External IP: $INSTANCE_IP
Image: $IMAGE_TAG
Service Port: $SERVICE_PORT

AUTH_TOKEN (keep secure):
$AUTH_TOKEN

Health Check:
curl http://$INSTANCE_IP:$SERVICE_PORT/health

After IAP is configured:
MCP Client Config:
{
  "mcpServers": {
    "thoughtbox": {
      "url": "http://$INSTANCE_IP:$SERVICE_PORT/mcp",
      "transport": "streamable-http",
      "headers": {
        "Authorization": "Bearer $AUTH_TOKEN"
      }
    }
  }
}

Next Steps:
1. Complete IAP configuration (see console output)
2. Test health endpoint
3. Configure MCP client
4. Verify authentication works
EOF

echo "✅ Deployment complete!"
echo ""
echo "📄 Configuration saved to: deployment-info.txt"
echo ""
echo "Next: Complete IAP setup in GCP Console, then test with:"
echo "  curl http://$INSTANCE_IP:$SERVICE_PORT/health"
