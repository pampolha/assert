import { OpenAI } from "openai";
import { handleGenerateScenario } from "./handlers/generateScenario.ts";
import { handleGenerateNpcResponse } from "./handlers/generateNpcResponse.ts";
import type z from "zod";
import type { scenarioSchema } from "./schemas/scenario.ts";
import process from "node:process";

export const getOrThrow = (key: string): string => {
  const attemptedValue = process.env[key];
  if (!attemptedValue) {
    throw new Error(`Could not get environment variable ${key}`);
  }
  return attemptedValue;
};

const openrouterKey = getOrThrow("OPENROUTER_API_KEY");

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: openrouterKey,
});

export const handler = (event: Record<string, unknown>) => {
  try {
    console.log("Evento recebido:", JSON.stringify(event));

    let requestBody: {
      action: string;
      conversationHistory: string;
      npc: z.output<
        typeof scenarioSchema
      >["entidades_interativas_nao_jogaveis_ia"][0];
    };
    try {
      requestBody = JSON.parse(event.body as string);
    } catch (parseError) {
      console.error("Erro ao parsear o corpo da requisição:", parseError);
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Corpo da requisição inválido." }),
      };
    }

    const { action } = requestBody;

    switch (action) {
      case "generateScenario":
        return handleGenerateScenario(openrouter);

      case "generateNpcResponse":
        return handleGenerateNpcResponse(requestBody, openrouter);

      default:
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Ação desconhecida." }),
        };
    }
  } catch (error) {
    console.error("Erro na função Lambda:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Ocorreu um erro interno ao processar a requisição.",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
    };
  }
};
