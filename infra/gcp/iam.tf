# Runtime service account for the MCP Cloud Run service (mcp-service.tf).
# Historically created for the (since-destroyed) agent-runner job; the
# account_id/description are immutable-in-place, so they keep the old name.
resource "google_service_account" "agent_runner" {
  account_id   = "agent-runner-sa"
  display_name = "Agent Runner Service Account"
  description  = "Identity for the async agent execution. Must not have project-wide editor/owner roles."
}

# Service Account for the build system (CI/CD)
resource "google_service_account" "build_system" {
  account_id   = "build-system-sa"
  display_name = "Build System Service Account"
  description  = "Identity for CI/CD pipeline to push to Artifact Registry."
}

# Note: We bind permissions to these Service Accounts dynamically
# in the resource files (storage.tf, mcp-service.tf) to ensure scope is
# as narrow as possible.
