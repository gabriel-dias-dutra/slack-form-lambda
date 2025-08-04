import { App } from '@slack/bolt';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const n8nURL = process.env.N8N_WEBHOOK_URL || '';

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
});

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

        const response = await axios.post(n8nURL, formData, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 7000
        });

        logger.info('Dados enviados para n8n com sucesso:');

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

// Inicia o servidor local
(async () => {
    const port = process.env.PORT || 3000;
    await app.start(port);
    console.log(`⚡️ Slack app rodando na porta ${port}`);
    console.log('📝 Use ngrok ou similar para expor esta porta para o Slack');
})();
