# Artifact Registry for the agent-runner image
resource "google_artifact_registry_repository" "agent_runner_repo" {
  location      = var.region
  repository_id = "agent-runner"
  description   = "Docker repository for Thoughtbox agent runner images"
  format        = "DOCKER"
}

# Grant the build system permission to write images to the repository
resource "google_artifact_registry_repository_iam_member" "build_system_repo_writer" {
  project    = google_artifact_registry_repository.agent_runner_repo.project
  location   = google_artifact_registry_repository.agent_runner_repo.location
  repository = google_artifact_registry_repository.agent_runner_repo.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.build_system.email}"
}

# Grant the agent-runner permission to read images from the repository
resource "google_artifact_registry_repository_iam_member" "agent_runner_repo_reader" {
  project    = google_artifact_registry_repository.agent_runner_repo.project
  location   = google_artifact_registry_repository.agent_runner_repo.location
  repository = google_artifact_registry_repository.agent_runner_repo.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.agent_runner.email}"
}

# Run artifacts bucket
resource "google_storage_bucket" "run_artifacts" {
  name          = "thoughtbox-run-artifacts-${var.project_id}"
  location      = "US" # US multi-region
  force_destroy = false

  uniform_bucket_level_access = true
}

# Grant agent-runner object administration for its artifacts bucket
resource "google_storage_bucket_iam_member" "agent_runner_bucket_admin" {
  bucket = google_storage_bucket.run_artifacts.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.agent_runner.email}"
}
