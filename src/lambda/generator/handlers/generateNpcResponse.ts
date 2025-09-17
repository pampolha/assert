import type { OpenAI } from "openai";
import type { NpcResponsePayload } from "../../../schemas/npcResponse.ts";
import { WebhookClient } from "discord.js";

export const handleGenerateNpcResponse = async (
  requestBody: NpcResponsePayload,
  router: OpenAI,
) => {
  const { conversationHistory, scenario, npc, webhookData } = requestBody;
  let webhook: WebhookClient | undefined;

  try {
    webhook = new WebhookClient(webhookData);
    const formattedHistory = conversationHistory.map((msg) =>
      `${msg.username} said: "${msg.content}"`
    ).join("\n");

    const systemPrompt =
      `You are ${npc.name}, ${npc.role}. ${npc.background}. The overall scenario data is ${scenario}. Answer the messages which "mention" you with the '@' symbol (e.g.: "@Mark what is going on?"). Ignore topics that seem unrelated to an objective end, which is problem resolution. Keep your answer concise and meaningful. When you are done writing your answer, translate it to Brazilian Portuguese and send the translated text only. If you think there is no appropriate answer, return empty text.`;

    const chatCompletion = await router.chat.completions.create({
      model: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Conversation history:\n${formattedHistory}\n\nYour answer:`,
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

    await webhook.send(npcResponse);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ npcResponse }),
    };
  } finally {
    await webhook?.delete();
  }
};
