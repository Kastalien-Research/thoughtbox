terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.18.0"
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
