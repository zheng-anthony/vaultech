variable "name_prefix" {
  description = "Prefix for the API, Lambda, and IAM resource names."
  type        = string
}

variable "files_bucket_name" {
  description = "Globally unique S3 bucket name for this environment."
  type        = string
}

variable "lambda_zip_path" {
  description = "Path to the packaged Lambda code and dependencies."
  type        = string
}

variable "upload_allowed_origins" {
  description = "Exact frontend origins permitted to upload directly to S3."
  type        = list(string)
  default     = []
}
