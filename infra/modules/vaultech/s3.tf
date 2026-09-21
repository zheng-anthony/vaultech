resource "aws_s3_bucket" "files" {
  bucket = var.files_bucket_name
}
