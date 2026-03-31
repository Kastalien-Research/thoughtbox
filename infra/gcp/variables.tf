variable "project_id" {
  type        = string
  description = "The GCP project ID"
  default     = "thoughtbox-prod"
}

variable "region" {
  type        = string
  description = "The GCP region for resources"
  default     = "us-central1"
}

variable "github_owner" {
  type        = string
  description = "The GitHub organization or user owning the repository"
  default     = "kastalien-research"
}

variable "github_repository" {
  type        = string
  description = "The GitHub repository name"
  default     = "thoughtbox"
}

variable "agents_disabled" {
  type        = string
  description = "Global Kill Switch. When set to 'true', agent executions fail fast."
  default     = "false"
}

variable "github_app_installation_id" {
  type        = string
  description = "The GitHub App Installation ID"
}
