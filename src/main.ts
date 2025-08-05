import { App, AwsLambdaReceiver } from "@slack/bolt";
import axios, { isAxiosError } from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const n8nURL = process.env.N8N_WEBHOOK_URL || "";
const slackWebhookURL = process.env.SLACK_WEBHOOK_URL || "";
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

        await complete();

        await axios.post(n8nURL, formData, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        logger.info("Dados enviados para n8n com sucesso");

        await axios.post(slackWebhookURL, {
            success: true,
        });
    } catch (error) {
        if (isAxiosError(error)) {
            logger.error("Erro Axios:", error.response?.data);
            await fail({
                error: `Erro Axios: ${error.response?.data}`,
            });
        } else {
            logger.error("Erro ao processar função - Internal:", error);
            await fail({
                error: `Erro ao processar função - Internal: ${error.message}`,
            });
        }
    }
});

// Handler da Lambda
export const handler = async (event, context, callback) => {
    const handler = await awsLambdaReceiver.start();
    return handler(event, context, callback);
};
