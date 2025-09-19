import type { ValidNpcInteractionMessage } from "assert-bot";
import {
  ScenarioModel,
  SessionChannelModel,
  SessionModel,
} from "../table/models.ts";
import { OpenAI } from "openai";
import type { Webhook, WebhookType } from "discord.js";
import { openrouterKey } from "../env.ts";

export const generateNpcResponse = async (
  message: ValidNpcInteractionMessage,
) => {
  const { channel } = message;
  const sessionTextChannel = await SessionChannelModel.get({
    channelId: channel.id,
    type: "textChannel",
  }, { index: "gs1" });

  if (!sessionTextChannel) return;

  const session = await SessionModel.get({
    sessionId: sessionTextChannel.sessionId,
    status: "ACTIVE",
  });

  if (!session) {
    throw new Error(
      `Unexpected error: could not find the session entity that the textChannel entity points to: ${{
        sessionTextChannel,
      }}`,
    );
  }

  const scenario = await ScenarioModel.get({ scenarioId: session.scenarioId });

  if (!scenario) {
    throw new Error(
      `Unexpected error: could not find the scenario entity that the session entity points to: ${{
        session,
      }}`,
    );
  }

  const triggeredNpc = scenario.npcs
    .find((npc) =>
      message.content
        .toLowerCase()
        .includes("@" + npc.name.toLowerCase().split(" ")[0])
    );

  if (triggeredNpc) {
    let webhook: Webhook<WebhookType.Incoming> | undefined;
    try {
      channel.sendTyping();
      const router = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: openrouterKey,
      });

      const [webhook, conversationHistory] = await Promise.all([
        channel.createWebhook({
          name: triggeredNpc.name,
        }),
        message.channel.messages.fetch().then((col) => col.map((msg) => msg)),
      ]);

      const formattedHistory = conversationHistory.map((msg) =>
        `${msg.author.username} said: "${msg.content}"`
      ).join("\n");

      const systemPrompt =
        `You are ${triggeredNpc.name}, ${triggeredNpc.role}. ${triggeredNpc.background}. The overall scenario data is ${scenario}. Answer the messages which "mention" you with the '@' symbol (e.g.: "@Mark what is going on?"). Ignore topics that seem unrelated to an objective end, which is problem resolution. Keep your answer concise and meaningful. When you are done writing your answer, translate it to Brazilian Portuguese and send the translated text only. If you think there is no appropriate answer, return empty text.` as const;

      const chatCompletion = await router.chat.completions.create({
        model: "tngtech/deepseek-r1t2-chimera:free",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              `Conversation history:\n${formattedHistory}\n\nYour answer:`,
          },
        ],
      });

      const npcResponse = chatCompletion.choices[0].message?.content;

      if (!npcResponse) {
        throw new Error("NPC response is empty");
      }

      await webhook.send(npcResponse);
    } catch (error) {
      console.error(error);
      await channel.send(
        "Ocorreu um erro ao processar a resposta do NPC.",
      );
    } finally {
      webhook?.delete();
    }
  }
};
