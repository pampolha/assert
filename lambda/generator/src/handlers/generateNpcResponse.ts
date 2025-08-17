import type { OpenAI } from "openai";
import type { scenarioSchema } from "../schemas/scenario.ts";
import type { z } from "zod";

export const handleGenerateNpcResponse = async (
  requestBody: {
    action: string;
    conversationHistory: string;
    npc: z.output<
      typeof scenarioSchema
    >["entidades_interativas_nao_jogaveis_ia"][0];
  },
  router: OpenAI,
) => {
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

  const chatCompletion = await router.chat.completions.create({
    model: "inception/mercury",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content:
          `Histórico da conversa:\n${conversationHistory}\n\nSua resposta:`,
      },
    ],
  });

  const npcResponse = chatCompletion.choices[0].message?.content;

  if (!npcResponse) {
    console.error("Resposta do NPC gerada é nula ou vazia.");
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
};
