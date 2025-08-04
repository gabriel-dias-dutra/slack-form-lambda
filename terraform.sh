#!/bin/bash

# Carrega variáveis do arquivo .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Exporta as variáveis para o Terraform
export TF_VAR_slack_bot_token="${SLACK_BOT_TOKEN}"
export TF_VAR_slack_signing_secret="${SLACK_SIGNING_SECRET}"
export TF_VAR_n8n_webhook_url="${N8N_WEBHOOK_URL}"

# Prepara o layer antes de executar o Terraform plan/apply
if [[ "$1" == "plan" || "$1" == "apply" ]]; then
    echo "Build..."
    yarn build
    echo "🔧 Preparando Lambda Layer..."
    ./prepare-layer.sh
fi

# Executa o comando do Terraform passado como argumento
terraform "$@"
