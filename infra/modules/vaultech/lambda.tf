resource "aws_lambda_function" "api" {
  function_name = "${var.name_prefix}-api"

  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  role    = aws_iam_role.lambda_exec.arn
  handler = "src.main.handler"
  runtime = "python3.12"

  memory_size = 256
  timeout     = 10

  environment {
    variables = {
      FILES_BUCKET = aws_s3_bucket.files.bucket
      PYTHONPATH   = "/var/task/src"
    }
  }
}
