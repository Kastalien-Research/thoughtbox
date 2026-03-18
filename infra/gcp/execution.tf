# ===============
# Secret Manager
# ===============

resource "google_secret_manager_secret" "github_app_private_key" {
  secret_id = "github-app-private-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "github_app_installation_id" {
  secret_id = "github-app-installation-id"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "github_app_id" {
  secret_id = "github-app-id"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "anthropic_api_key" {
  secret_id = "anthropic-api-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "supabase_url" {
  secret_id = "supabase-url"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "supabase_anon_key" {
  secret_id = "supabase-anon-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "supabase_jwt_secret" {
  secret_id = "supabase-jwt-secret"
  replication {
    auto {}
  }
}

# Grant exactly the agent-runner SA access to read exactly these secrets.
resource "google_secret_manager_secret_iam_member" "agent_runner_access" {
  for_each = toset([
    "github-app-private-key",
    "github-app-installation-id",
    "github-app-id",
    "anthropic-api-key",
    "supabase-url",
    "supabase-anon-key",
    "supabase-jwt-secret"
  ])

  secret_id = each.key
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.agent_runner.email}"
}

# ===============
# Cloud Run Job
# ===============

resource "google_cloud_run_v2_job" "agent_runner" {
  name     = "agent-runner-job"
  location = var.region

  template {
    template {
      max_retries = 0
      timeout     = "1800s" # 30 mins

      # Executes strictly under the isolated identity
      service_account = google_service_account.agent_runner.email

      containers {
        # Using a public placeholder image for IaC bootstrapping. 
        # CI/CD will update this to a SHA256 pinned digest inside the actual Artifact Registry.
        image = "us-docker.pkg.dev/cloudrun/container/hello"

        # Kill switch environment variable
        env {
          name  = "AGENTS_DISABLED"
          value = var.agents_disabled
        }

        # Injected App configuration
        env {
          name = "GITHUB_APP_ID"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.github_app_id.secret_id
              version = "latest"
            }
          }
        }

        env {
          name = "GITHUB_APP_INSTALLATION_ID"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.github_app_installation_id.secret_id
              version = "latest"
            }
          }
        }

        env {
          name = "GITHUB_APP_PRIVATE_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.github_app_private_key.secret_id
              version = "latest"
            }
          }
        }

        env {
          name = "ANTHROPIC_API_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.anthropic_api_key.secret_id
              version = "latest"
            }
          }
        }

        env {
          name = "SUPABASE_URL"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.supabase_url.secret_id
              version = "latest"
            }
          }
        }

        env {
          name = "SUPABASE_ANON_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.supabase_anon_key.secret_id
              version = "latest"
            }
          }
        }

        env {
          name = "SUPABASE_JWT_SECRET"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.supabase_jwt_secret.secret_id
              version = "latest"
            }
          }
        }
      }
    }
  }

  lifecycle {
    # Allows CI/CD pipeline to push and update the Image attribute independent of Terraform apply cycles.
    ignore_changes = [
      template[0].template[0].containers[0].image
    ]
  }
}
