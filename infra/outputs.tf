output "lambda_function_url" {
  description = "URL da Lambda Function"
  value       = aws_lambda_function_url.slack_form_url.function_url
}

output "lambda_function_name" {
  description = "Nome da Lambda Function"
  value       = aws_lambda_function.slack_form.function_name
}

output "lambda_function_arn" {
  description = "ARN da Lambda Function"
  value       = aws_lambda_function.slack_form.arn
}