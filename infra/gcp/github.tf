# Reference to the existing Thoughtbox Github Repository
data "github_repository" "repo" {
  full_name = "${var.github_owner}/${var.github_repository}"
}

# Enforce Branch Protection on `main`
resource "github_branch_protection" "main" {
  repository_id                   = var.github_repository
  pattern                         = "main"
  enforce_admins                  = false
  require_signed_commits          = false
  require_conversation_resolution = true

  required_pull_request_reviews {
    required_approving_review_count = 1
    dismiss_stale_reviews           = true
  }

  required_status_checks {
    strict   = true
    contexts = ["ci", "workflow-guard"]
  }
}
