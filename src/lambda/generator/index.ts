import { OpenAI } from "openai";
import { handleGenerateScenario } from "./handlers/generateScenario.ts";
import { handleGenerateNpcResponse } from "./handlers/generateNpcResponse.ts";
import type z from "zod";
import type { scenarioSchema } from "./schemas/scenario.ts";
import { openrouterKey } from "../../env.ts";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: openrouterKey,
});

export const handler = async (event: Record<string, unknown>) => {
  try {
    console.log("event:", JSON.stringify(event));

    let requestBody: {
      action: string;
      conversationHistory?: string;
      npc?: z.output<typeof scenarioSchema>["npcs"][0];
    };
    try {
      requestBody = JSON.parse(event.body as string);
    } catch (parseError) {
      console.error("error on event body parse :", parseError);
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Corpo da requisição inválido." }),
      };
    }

    const { action } = requestBody;

    switch (action) {
      case "generateScenario":
        return await handleGenerateScenario(openrouter);

      case "generateNpcResponse":
        if (!requestBody.conversationHistory || !requestBody.npc) {
          return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message:
                "Parâmetros 'conversationHistory' ou 'npc' ausentes para a ação 'generateNpcResponse'.",
            }),
          };
        }
        return await handleGenerateNpcResponse({
          action,
          conversationHistory: requestBody.conversationHistory,
          npc: requestBody.npc,
        }, openrouter);

      default:
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Ação desconhecida." }),
        };
    }
  } catch (error) {
    console.error("lambda error:", error);
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

if (import.meta.main) {
  const stdinContent = await new Promise<Uint8Array>((resolve) => {
    const chunks: Uint8Array[] = [];
    Deno.stdin.readable.pipeTo(
      new WritableStream({
        write(chunk) {
          chunks.push(chunk);
        },
        close() {
          resolve(
            new Uint8Array(chunks.reduce<number[]>((acc, val) => {
              acc.push(...val);
              return acc;
            }, [])),
          );
        },
      }),
    );
  });
  const event = JSON.parse(new TextDecoder().decode(stdinContent));
  const response = await handler(event);
  console.log(JSON.stringify(response));
}
