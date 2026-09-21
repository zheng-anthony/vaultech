output "api_url" {
  description = "Base URL of the deployed API."
  value       = module.vaultech.api_url
}

output "files_bucket_name" {
  description = "Bucket name to use in the local SAM environment file."
  value       = module.vaultech.files_bucket_name
}
