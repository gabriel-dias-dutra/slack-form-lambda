import { App, AwsLambdaReceiver } from '@slack/bolt';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const n8nURL = process.env.N8N_WEBHOOK_URL || 'https://n8n.suaorg.com/webhook/slack-form';

// Configuração customizada do receiver para Lambda
const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  // Customiza o processamento de eventos para lidar com url_verification
  customPropertiesExtractor: async (request) => {
    const body = JSON.parse(request.body || '{}');

    // Se for url_verification, retorna imediatamente
    if (body.type === 'url_verification') {
      return {
        // Este será o response retornado ao Slack
        response: {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/plain'
          },
          body: body.challenge
        }
      };
    }

    // Para outros eventos, retorna vazio e deixa o Bolt processar
    return {};
  }
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: awsLambdaReceiver,
});

// Atalho global para abrir o formulário
app.shortcut('abrir_form', async ({ ack, body, client }) => {
  await ack();

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'form_modal',
      title: { type: 'plain_text', text: 'Cadastro' },
      blocks: [
        {
          type: 'input',
          block_id: 'nome',
          element: { type: 'plain_text_input', action_id: 'nome' },
          label: { type: 'plain_text', text: 'Nome' },
        },
        {
          type: 'input',
          block_id: 'sobrenome',
          element: { type: 'plain_text_input', action_id: 'sobrenome' },
          label: { type: 'plain_text', text: 'Sobrenome' },
        },
      ],
      submit: { type: 'plain_text', text: 'Enviar' },
    },
  });
});

// Recebe o submit do modal
app.view('form_modal', async ({ ack, body, view }) => {
  const nome = view.state.values.nome.nome.value;
  const sobrenome = view.state.values.sobrenome.sobrenome.value;
  const user = body.user.id;

  // Confirma o modal
  await ack();

  // Envia para o n8n
  try {
    const formData = {
      timestamp: new Date().toISOString(),
      submittedBy: user,
      formFields: {
        nome,
        sobrenome,
      }
    };

    await axios.post(n8nURL, formData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 7000
    });

    // Feedback ao usuário
    await app.client.chat.postMessage({
      channel: user,
      text: '✅ Sucesso! Seus dados foram salvos.',
    });
  } catch (err) {
    console.error('Erro ao enviar para n8n:', err);
    await app.client.chat.postMessage({
      channel: user,
      text: '❌ Erro ao salvar. Tente novamente mais tarde.',
    });
  }
});

// Função do Workflow Builder
app.function('create_user', async ({ inputs, complete, fail, logger }) => {
  logger.info('Função create_user chamada com inputs:', inputs);

  try {
    // Prepara os dados do formulário
    const formData = {
      timestamp: new Date().toISOString(),
      submittedBy: inputs.user_id || 'workflow',
      formFields: {
        ...inputs // Todos os campos do workflow
      }
    };

    // Envia para o n8n
    const response = await axios.post(n8nURL, formData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 7000
    });

    logger.info('Dados enviados para n8n com sucesso:', response.status);

    // Retorna sucesso para o Workflow Builder
    await complete({
      outputs: {
        success: true,
        message: 'Usuário criado com sucesso',
        data: JSON.stringify(formData)
      },
    });
  } catch (error) {
    logger.error('Erro ao processar função:', error);
    await fail({
      error: `Falha ao criar usuário: ${error.message}`,
    });
  }
});

// Handler da Lambda
export const handler = async (event: any, context: any, callback: any) => {
  const body = JSON.parse(event.body || '{}');

  // Verifica se é url_verification
  if (body.type === 'url_verification') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain'
      },
      body: body.challenge
    };
  }

  // Para outros eventos, usa o receiver do Bolt
  const lambdaHandler = awsLambdaReceiver.toHandler();
  return lambdaHandler(event, context, callback);
};
