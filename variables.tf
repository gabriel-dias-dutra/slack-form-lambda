variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "slack_bot_token" {
  description = "Slack Bot Token (pode ser definido via TF_VAR_slack_bot_token)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "slack_signing_secret" {
  description = "Slack Signing Secret (pode ser definido via TF_VAR_slack_signing_secret)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "n8n_webhook_url" {
  description = "N8N Webhook URL (pode ser definido via TF_VAR_n8n_webhook_url)"
  type        = string
  sensitive   = false
  default     = ""
}
