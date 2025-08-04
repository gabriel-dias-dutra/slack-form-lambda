import { App, AwsLambdaReceiver } from "@slack/bolt";
import axios, { isAxiosError } from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const n8nURL = process.env.N8N_WEBHOOK_URL || "";

const awsLambdaReceiver = new AwsLambdaReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET || "",
});

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver: awsLambdaReceiver,
});

app.function("create_user", async ({ inputs, complete, fail, logger }) => {
    logger.info("Função create_user chamada com inputs:", inputs);

    try {
        // Prepara os dados do formulário
        const formData = {
            timestamp: new Date().toISOString(),
            submittedBy: inputs.user_id || "workflow",
            formFields: {
                ...inputs, // Todos os campos do workflow
            },
        };

        await axios.post(n8nURL, formData, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        logger.info("Dados enviados para n8n com sucesso:");

        // Retorna sucesso para o Workflow Builder
        await complete({
            outputs: {
                success: true,
                message: "Usuário criado com sucesso",
                data: JSON.stringify(formData),
            },
        });
    } catch (error) {
        if (isAxiosError(error)) {
            logger.error("Erro Axios:", error.response?.data.message);
            await fail({
                error: `Erro ao enviar dados para n8n: ${error.response?.data.message}`,
            });
        } else {
            logger.error("Erro ao processar função - Internal:", error);
            await fail({
                error: `Erro ao enviar dados para n8n - Internal: ${error.message}`,
            });
        }
    }
});

// Handler da Lambda
export const handler = async (event, context, callback) => {
    const handler = await awsLambdaReceiver.start();
    return handler(event, context, callback);
};
