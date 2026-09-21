output "api_url" {
  value = aws_apigatewayv2_stage.default.invoke_url
}

output "files_bucket_name" {
  value = aws_s3_bucket.files.bucket
}
