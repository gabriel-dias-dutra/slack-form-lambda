# slack-form-lambda

Lambda-based Slack app que recebe formulários do Slack Workflow Builder e os envia para um webhook n8n, com resposta assíncrona via outro Slack Workflow.

## O que é?

Este projeto integra Slack Workflows com n8n através de uma AWS Lambda. Permite que formulários criados no Slack sejam processados pelo n8n e a resposta seja enviada de volta para o Slack de forma assíncrona.

## Como funciona?

### Fluxo Principal

1. **Slack Workflow → Lambda**: Um Slack Workflow chama a Lambda com dados do formulário
2. **Lambda → n8n**: A Lambda (código em `src/main.ts`) formata os dados e envia para o webhook n8n
3. **Lambda → Slack**: Responde imediatamente com HTTP 200 para o Slack Workflow
4. **n8n → Slack Webhook**: Após processar, o n8n envia o resultado via webhook para outro Slack Workflow
5. **Slack Notificação**: O segundo workflow notifica o usuário/canal sobre sucesso ou erro

## Setup

1. Crie um Slack app em <https://api.slack.com/apps>
2. Use o `slack-manifest.json` para configurar o app
3. Instale o app no seu workspace
4. Configure o `.env`:

   ```bash
   SLACK_BOT_TOKEN=xoxb-...
   SLACK_SIGNING_SECRET=...
   N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/...
   SLACK_WEBHOOK_URL=https://hooks.slack.com/triggers/...
   ```

## Scripts Importantes

### `infra/terraform.sh`

Script para gerenciar a infraestrutura com Terraform:

- Carrega automaticamente as variáveis do `.env`
- Executa build e prepara o layer antes de `plan` ou `apply`
- Uso: `./terraform.sh plan` ou `./terraform.sh apply`

### `prepare-layer.sh`

Cria a Lambda Layer com as dependências de produção:

- Gera a pasta `layer/nodejs/node_modules`
- Remove arquivos desnecessários para reduzir tamanho
- Executado automaticamente pelo `terraform.sh`

## Deploy

```bash
# Instalar dependências e buildar
yarn install

# Deploy da infraestrutura (Lambda + Layer)
cd infra
./terraform.sh plan
./terraform.sh apply
```

## Desenvolvimento Local

```bash
yarn install
```

## Formato dos Dados

### Enviado para n8n

```json
{
  "formFields": {
    "firstName": "João",
    "lastName": "Silva"
  }
}
```

### Resposta do n8n para Slack

```json
{
  "success": true,
  "error": null,
  "firstName": "João",
  "lastName": "Silva"
}
```
