terraform {
  required_version = ">= 1.1.0"

  backend "local" {
    path = "terraform.tfstate"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region              = var.aws_region
  allowed_account_ids = [var.aws_account_id]
}

module "vaultech" {
  source = "../modules/vaultech"

  name_prefix       = "vaultech-prod"
  files_bucket_name = "vaultech-prod-files-${var.aws_account_id}-${var.aws_region}"
  lambda_zip_path   = abspath("${path.module}/../../services/api/function.zip")
}
