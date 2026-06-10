# Thoughtbox MCP server — Cloud Run service surface (SPEC-V1-INITIATIVE:c3).
#
# Terraform owns the service configuration: env vars, secrets, scaling,
# probes, ingress, IAM, domain mapping, and the Cloud Build deploy trigger.
# The trigger owns the image: it builds on push to main and runs
# `gcloud run services update --image`, so `image` (and the labels/annotations
# the trigger stamps) are ignored below. Everything else changing outside
# Terraform is drift.
#
# maxScale is pinned to 1 until MCP transport-session state is externalized
# (SPEC-V1-INITIATIVE:c4 / c16): transport sessions live in an in-process Map
# and session affinity is only best-effort.

data "google_project" "current" {
  project_id = var.project_id
}

resource "google_cloud_run_v2_service" "thoughtbox_mcp" {
  name     = "thoughtbox-mcp"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account                  = google_service_account.agent_runner.email
    timeout                          = "300s"
    max_instance_request_concurrency = 10
    session_affinity                 = true
    execution_environment            = "EXECUTION_ENVIRONMENT_GEN2"

    scaling {
      min_instance_count = 1
      max_instance_count = 1 # see c4/c16 note above
    }

    containers {
      # Deployed by the Cloud Build trigger; ignored via lifecycle below.
      image = "us-central1-docker.pkg.dev/${var.project_id}/cloud-run-source-deploy/thoughtbox/thoughtbox-mcp:latest"

      ports {
        name           = "http1"
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        timeout_seconds       = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        period_seconds    = 30
        timeout_seconds   = 3
        failure_threshold = 3
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "THOUGHTBOX_STORAGE"
        value = "supabase"
      }
      env {
        name  = "BASE_URL"
        value = "https://mcp.kastalienresearch.ai"
      }
      env {
        name  = "DISABLE_THOUGHT_LOGGING"
        value = "true"
      }

      dynamic "env" {
        # Stable keys (env var name -> secret name); iterated in sorted-key order.
        for_each = {
          LANGSMITH_API_KEY         = "langsmith-api-key"
          OAUTH_JWT_SECRET          = "oauth-jwt-secret"
          SUPABASE_ANON_KEY         = "supabase-anon-key"
          SUPABASE_JWT_SECRET       = "supabase-jwt-secret"
          SUPABASE_SERVICE_ROLE_KEY = "supabase-service-role-key"
          SUPABASE_URL              = "supabase-url"
          TB_BRANCH_SIGNING_SECRET  = "tb-branch-signing-secret"
        }
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      labels,
      template[0].labels,
      template[0].annotations,
      client,
      client_version,
    ]
  }
}

# Public ingress; authentication happens at the application layer
# (OAuth JWT or tbx_ API keys on /mcp).
resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  project  = var.project_id
  location = google_cloud_run_v2_service.thoughtbox_mcp.location
  name     = google_cloud_run_v2_service.thoughtbox_mcp.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_domain_mapping" "mcp" {
  name     = "mcp.kastalienresearch.ai"
  location = var.region

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.thoughtbox_mcp.name
  }
}

# Build-and-deploy trigger: push to main → docker build → push to Artifact
# Registry → `gcloud run services update --image`. Image only; service config
# is owned by the google_cloud_run_v2_service resource above.
resource "google_cloudbuild_trigger" "mcp_deploy" {
  name        = "rmgpgab-thoughtbox-mcp-us-central1-Kastalien-Research-thoughwsf"
  description = "Build and deploy to Cloud Run service thoughtbox-mcp on push to \"^main$\""

  github {
    owner = "Kastalien-Research"
    name  = "thoughtbox"
    push {
      branch = "^main$"
    }
  }

  # Default compute SA, as configured by the console-created trigger. Moving to
  # the purpose-built build_system SA (iam.tf) is tracked as a separate
  # least-privilege unit — it needs AR/run.developer/SA-user bindings and a
  # tested rollout of the deploy pipeline.
  service_account    = "projects/${var.project_id}/serviceAccounts/${data.google_project.current.number}-compute@developer.gserviceaccount.com"
  include_build_logs = "INCLUDE_BUILD_LOGS_WITH_STATUS"

  substitutions = {
    _AR_HOSTNAME   = "${var.region}-docker.pkg.dev"
    _AR_PROJECT_ID = var.project_id
    _AR_REPOSITORY = "cloud-run-source-deploy"
    _DEPLOY_REGION = var.region
    _PLATFORM      = "managed"
    _SERVICE_NAME  = "thoughtbox-mcp"
    # Self-referential (the trigger's own ID); cannot reference the resource's
    # computed trigger_id without a cycle.
    _TRIGGER_ID = "cc2a7995-6738-4865-a7df-4fc8bdc366e1"
  }

  tags = [
    "gcp-cloud-build-deploy-cloud-run",
    "gcp-cloud-build-deploy-cloud-run-managed",
    "thoughtbox-mcp",
  ]

  build {
    images = ["$_AR_HOSTNAME/$_AR_PROJECT_ID/$_AR_REPOSITORY/$REPO_NAME/$_SERVICE_NAME:$COMMIT_SHA"]

    options {
      logging             = "CLOUD_LOGGING_ONLY"
      substitution_option = "ALLOW_LOOSE"
    }

    step {
      id   = "Build"
      name = "gcr.io/cloud-builders/docker"
      args = [
        "build", "--no-cache",
        "-t", "$_AR_HOSTNAME/$_AR_PROJECT_ID/$_AR_REPOSITORY/$REPO_NAME/$_SERVICE_NAME:$COMMIT_SHA",
        ".", "-f", "Dockerfile",
      ]
    }

    step {
      id   = "Push"
      name = "gcr.io/cloud-builders/docker"
      args = [
        "push",
        "$_AR_HOSTNAME/$_AR_PROJECT_ID/$_AR_REPOSITORY/$REPO_NAME/$_SERVICE_NAME:$COMMIT_SHA",
      ]
    }

    step {
      id         = "Deploy"
      name       = "gcr.io/google.com/cloudsdktool/cloud-sdk:slim"
      entrypoint = "gcloud"
      args = [
        "run", "services", "update", "$_SERVICE_NAME",
        "--platform=managed",
        "--image=$_AR_HOSTNAME/$_AR_PROJECT_ID/$_AR_REPOSITORY/$REPO_NAME/$_SERVICE_NAME:$COMMIT_SHA",
        "--labels=managed-by=gcp-cloud-build-deploy-cloud-run,commit-sha=$COMMIT_SHA,gcb-build-id=$BUILD_ID,gcb-trigger-id=$_TRIGGER_ID",
        "--region=$_DEPLOY_REGION",
        "--quiet",
      ]
    }
  }
}
