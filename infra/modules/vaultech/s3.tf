resource "aws_s3_bucket" "files" {
  bucket = var.files_bucket_name
}

resource "aws_s3_bucket_public_access_block" "files" {
  bucket                  = aws_s3_bucket.files.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "files" {
  bucket = aws_s3_bucket.files.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "files" {
  count  = length(var.upload_allowed_origins) > 0 ? 1 : 0
  bucket = aws_s3_bucket.files.id
  cors_rule {
    allowed_origins = var.upload_allowed_origins
    allowed_methods = ["PUT"]
    allowed_headers = ["Content-Type", "Content-Length"]
    max_age_seconds = 300
  }
}
