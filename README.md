# slack-form-lambda

Lambda-based Slack app that receives form submissions from Workflow Builder and forwards them to an n8n webhook.

## Setup

1. Create a Slack app at https://api.slack.com/apps
2. Use the provided `slack-manifest.json` to configure your app
3. Install the app to your workspace
4. Copy `.env.example` to `.env` and fill in:
   - `SLACK_BOT_TOKEN`: Bot User OAuth Token (xoxb-...)
   - `SLACK_SIGNING_SECRET`: App signing secret
   - `N8N_WEBHOOK_URL`: Your n8n webhook URL

## Lambda Deployment

Deploy the `dist/main.js` file to AWS Lambda with:
- Runtime: Node.js 18.x or higher
- Handler: `main.handler`
- Environment variables from `.env`

## Local Development

```bash
yarn install
yarn build
```

## Workflow Builder Integration

1. In Workflow Builder, add the "Process Form Submission" function
2. Map form fields to the function inputs
3. The function will send all inputs to your n8n webhook

## How it Works

1. User submits a form in Slack Workflow Builder
2. Workflow Builder calls the `process_form_submission` function
3. The function receives all form inputs
4. Data is formatted and sent to your n8n webhook
5. n8n processes the data according to your workflow

## Data Format

The app sends the following JSON to n8n:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "submittedBy": "U123456789",
  "formFields": {
    // All form fields from Workflow Builder
  }
}
```