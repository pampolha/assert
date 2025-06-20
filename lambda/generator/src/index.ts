import { OpenAI } from "openai";
import generatorPrompt from "./prompts/generator.js";
import { Scenario, scenarioJSONSchema } from "../../../shared/schemas.js";
import { openAiKey } from "../../../shared/env.js";

const openai = new OpenAI({
  apiKey: openAiKey,
});

export const handler = async (event: any) => {
  try {
    console.log("Evento recebido:", JSON.stringify(event));

    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      console.error("Erro ao parsear o corpo da requisição:", parseError);
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Corpo da requisição inválido." }),
      };
    }

    const { action } = requestBody;
    const seed = `\nSeed: ${Date.now()}`;

    switch (action) {
      case "generateScenario": {
        const chatCompletion = await openai.chat.completions.create({
          model: "gpt-4.1-nano",
          messages: [
            { role: "system", content: generatorPrompt + seed },
            {
              role: "user",
              content: "Por favor, gere um novo cenário de simulação agora." +
                seed,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "ScenarioSchema",
              description: "JSON Schema for soft skills simulation scenario",
              schema: scenarioJSONSchema,
            },
          },
          temperature: 1,
          max_completion_tokens: 32768,
          top_p: 1,
        });

        const generatedContent = chatCompletion.choices[0].message?.content;

        if (!generatedContent) {
          console.error("Conteúdo gerado pela OpenAI é nulo ou vazio.");
          return {
            statusCode: 500,
            body: JSON.stringify({ message: "Erro: Conteúdo gerado vazio." }),
          };
        }

        console.log("Cenário gerado:", generatedContent);

        const scenarioData: Scenario = JSON.parse(generatedContent);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scenarioData),
        };
      }

      case "generateNpcResponse": {
        const { conversationHistory, npc } = requestBody;

        if (!conversationHistory || !npc) {
          return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message:
                "Parâmetros 'conversationHistory' ou 'npc' ausentes para a ação 'generateNpcResponse'.",
            }),
          };
        }

        const systemPrompt =
          `Você é ${npc.nome_completo_npc}, ${npc.cargo_funcao_npc_e_relacao_com_equipe}. ${npc.prompt_diretriz_para_ia_roleplay_npc}. Responda como se estivesse no meio da conversa. Seja conciso e responda em português (Brasil). Mantenha a resposta em uma ou duas frases, a menos que a situação exija mais detalhes.`;

        const chatCompletion = await openai.chat.completions.create({
          model: "gpt-4.1-nano",
          messages: [
            { role: "system", content: systemPrompt + seed },
            {
              role: "user",
              content:
                `Histórico da conversa:\n${conversationHistory}\n\nSua resposta:`,
            },
          ],
          max_tokens: 200,
          temperature: 0.8,
        });

        const npcResponse = chatCompletion.choices[0].message?.content;

        if (!npcResponse) {
          console.error("Resposta do NPC gerada pela OpenAI é nula ou vazia.");
          return {
            statusCode: 500,
            body: JSON.stringify({ message: "Erro: Resposta do NPC vazia." }),
          };
        }

        console.log("Resposta do NPC gerada:", npcResponse);

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ npcResponse }),
        };
      }

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
