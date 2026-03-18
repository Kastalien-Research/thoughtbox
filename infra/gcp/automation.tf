resource "google_cloud_scheduler_job" "sil_runner" {
  name        = "sil-runner"
  description = "Trigger Agent Runner weekly"
  schedule    = "0 2 * * 0" # Sunday 2am UTC
  time_zone   = "UTC"

  # We strictly pause this by default until the agent runner architecture 
  # is stable and tested.
  paused = true

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${google_cloud_run_v2_job.agent_runner.name}:run"

    # Need to trigger using the SA, assuming that SA has roles/run.invoker 
    # Or typically a dedicated trigger-SA is used, but for brevity we allow the agent-runner
    # identity to invoke itself via Scheduler. We must ensure it has run.invoker.
    oauth_token {
      service_account_email = google_service_account.agent_runner.email
      scope                 = "https://www.googleapis.com/auth/cloud-platform"
    }
  }
}

# Optional: Add roles/run.invoker to the agent runner so the scheduler can run it
resource "google_project_iam_member" "agent_runner_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.agent_runner.email}"
}
