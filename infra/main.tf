terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.7.0"
    }
  }

  backend "s3" {
    bucket = "my-cafesao-terraform-state"
    key    = "slack-form-lambda/terraform.tfstate"
    region = "us-east-1"
    profile = "personal"
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  region  = "us-east-1"
  profile = "personal"
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../dist"
  output_path = "${path.module}/../lambda_function.zip"
}

# Archive para o Layer com node_modules
data "archive_file" "layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../layer"
  output_path = "${path.module}/../nodejs_layer.zip"
}

resource "aws_iam_role" "lambda_role" {
  name = "slack-form-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# Lambda Layer para node_modules
resource "aws_lambda_layer_version" "nodejs_layer" {
  filename            = data.archive_file.layer_zip.output_path
  layer_name          = "slack-form-nodejs-dependencies"
  compatible_runtimes = ["nodejs22.x"]
  source_code_hash    = data.archive_file.layer_zip.output_base64sha256
}

resource "aws_lambda_function" "slack_form" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "slack-form-lambda"
  role            = aws_iam_role.lambda_role.arn
  handler         = "main.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime           = "nodejs22.x"
  timeout         = 5
  memory_size     = 128
  layers          = [aws_lambda_layer_version.nodejs_layer.arn]

  environment {
    variables = {
      SLACK_BOT_TOKEN     = var.slack_bot_token
      SLACK_SIGNING_SECRET = var.slack_signing_secret
      N8N_WEBHOOK_URL      = var.n8n_webhook_url
      SLACK_WEBHOOK_URL    = var.slack_webhook_url
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_cloudwatch_log_group.lambda_logs
  ]
}

resource "aws_lambda_function_url" "slack_form_url" {
  function_name      = aws_lambda_function.slack_form.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["https://slack.com"]
    allow_methods     = ["POST"]
    allow_headers     = ["date", "keep-alive"]
    expose_headers    = ["keep-alive", "date"]
    max_age           = 86400
  }
}

# CloudWatch Log Group com retenção mínima
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/slack-form-lambda"
  retention_in_days = 1
}
