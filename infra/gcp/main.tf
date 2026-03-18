terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.18.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }

  backend "gcs" {
    bucket = "thoughtbox-terraform-state"
    prefix = "gcp-stabilization"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# The GitHub provider authentication will be handled via the GITHUB_TOKEN
# environment variable (a fine-grained PAT with repo admin permissions)
provider "github" {
  owner = var.github_owner
}
