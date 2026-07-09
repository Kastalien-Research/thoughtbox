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

