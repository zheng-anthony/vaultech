variable "aws_account_id" {
  description = "Expected AWS account ID. Terraform refuses credentials for another account."
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.aws_account_id))
    error_message = "Use your 12-digit AWS account ID."
  }
}

variable "aws_region" {
  description = "AWS region for this environment."
  type        = string
  default     = "us-east-1"
}
