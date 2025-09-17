import { OpenAI } from "openai";
import { handleGenerateScenario } from "./handlers/generateScenario.ts";
import { handleGenerateNpcResponse } from "./handlers/generateNpcResponse.ts";
import { openrouterKey } from "../../env.ts";
import { npcResponsePayloadSchema } from "../../schemas/npcResponse.ts";
import z from "zod";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: openrouterKey,
});

export type ScenarioPayload = {
  action: "generateScenario";
};

export const handler = async (event: Record<string, unknown>) => {
  try {
    console.log(event);
    let payload;
    try {
      const requestBody = JSON.parse(event.body as string);
      payload = z.parse(
        npcResponsePayloadSchema.or(
          z.object({ action: z.enum(["generateScenario"]) }),
        ),
        requestBody,
      );
    } catch (parseError) {
      console.error("error on event body parse :", parseError);
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Corpo da requisição inválido." }),
      };
    }

    switch (payload.action) {
      case "generateScenario":
        return await handleGenerateScenario(openrouter);

      case "generateNpcResponse":
        return await handleGenerateNpcResponse({
          ...payload,
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
