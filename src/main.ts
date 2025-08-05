import { App, AwsLambdaReceiver } from "@slack/bolt";
import type { AwsCallback, AwsEvent } from "@slack/bolt/dist/receivers/AwsLambdaReceiver";
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

app.function("createUser", async ({ inputs, complete, fail, logger }) => {
    logger.info("Função createUser chamada com inputs:", inputs);

    try {
        // Prepara os dados do formulário
        const formData = {
            timestamp: new Date().toISOString(),
            submittedBy: inputs.user_id || "workflow",
            formFields: {
                firstName: inputs.firstName,
                lastName: inputs.lastName,
            },
        };

        await complete();

        const n8nResponse = await axios.post(n8nURL, formData, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        logger.info("Dados enviados para n8n com sucesso");
        logger.info("Dados recebidos do n8n:", n8nResponse.data);

        await axios.post(slackWebhookURL, {
            success: true,
            error: null,
            firstName: n8nResponse.data.firstName,
            lastName: n8nResponse.data.lastName,
            email: n8nResponse.data.email,
            password: n8nResponse.data.password,
        });
    } catch (error) {
        if (isAxiosError(error)) {
            logger.error("Erro Axios:", error.response?.data);
            await axios.post(slackWebhookURL, {
                success: false,
                error: error.response?.data.message || "Erro ao processar função",
                firstName: inputs.firstName,
                lastName: inputs.lastName,
            });
        } else {
            logger.error("Erro ao processar função - Internal:", error);
        }
    }
});

// Handler da Lambda
export const handler = async (event: AwsEvent, context: any, callback: AwsCallback) => {
    const handler = await awsLambdaReceiver.start();
    return handler(event, context, callback);
};
