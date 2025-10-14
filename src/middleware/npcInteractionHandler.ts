import type { ValidNpcInteractionMessage } from "assert-bot";
import {
  type ScenarioEntity,
  ScenarioModel,
  SessionChannelModel,
  SessionModel,
} from "../table/models.ts";
import { OpenAI } from "openai";
import type { TextChannel, Webhook, WebhookType } from "discord.js";
import { openrouterKey } from "../env.ts";
import { inspectError } from "../lib/log.ts";

const getSessionContext = async (channelId: string) => {
  const sessionTextChannel = await SessionChannelModel.get({
    channelId: channelId,
    type: "textChannel",
  }, { index: "gs1" });

  if (!sessionTextChannel) return null;

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

  return { session, scenario };
};

const findTriggeredNpc = (
  messageContent: string,
  npcs: ScenarioEntity["npcs"],
) => {
  return npcs.find((npc) =>
    messageContent
      .toLowerCase()
      .includes("@" + npc.name.toLowerCase().split(" ")[0])
  );
};

const getFormattedHistory = async (message: ValidNpcInteractionMessage) => {
  const conversationHistory = await message.channel.messages.fetch().then((
    col,
  ) => col.map((msg) => msg));
  return conversationHistory.map((msg) =>
    `${msg.author.username} said: "${msg.content}"`
  ).join("\n");
};

const createSystemPrompt = (
  npc: NonNullable<ReturnType<typeof findTriggeredNpc>>,
  scenario: ScenarioEntity,
) => {
  return `You are ${npc.name}, ${npc.role}. ${npc.background}. The overall scenario data is ${scenario}. Answer the messages which "mention" you with the '@' symbol (e.g.: "@Mark what is going on?"). Ignore topics that seem unrelated to an objective end, which is problem resolution. Keep your answer concise and meaningful. When you are done writing your answer, translate it to Brazilian Portuguese and send the translated text only. If you think there is no appropriate answer, return empty text.` as const;
};

const generateNpcResponse = async (
  systemPrompt: string,
  formattedHistory: string,
) => {
  const router = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: openrouterKey,
  });

  const chatCompletion = await router.chat.completions.create({
    model: "tngtech/deepseek-r1t2-chimera:free",
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
    throw new Error("NPC response is empty");
  }
  return npcResponse;
};

const sendViaWebhook = async (
  channel: TextChannel,
  npcName: string,
  response: string,
) => {
  let webhook: Webhook<WebhookType.Incoming> | undefined;
  try {
    webhook = await channel.createWebhook({
      name: npcName,
    });
    await webhook.send(response);
  } finally {
    await webhook?.delete();
  }
};

export const npcInteractionHandler = async (
  message: ValidNpcInteractionMessage,
) => {
  try {
    const { channel } = message;
    const context = await getSessionContext(channel.id);
    if (!context) return;

    const { scenario } = context;
    const triggeredNpc = findTriggeredNpc(message.content, scenario.npcs);
    if (!triggeredNpc) return;

    channel.sendTyping();

    const formattedHistory = await getFormattedHistory(message);
    const systemPrompt = createSystemPrompt(triggeredNpc, scenario);
    const npcResponse = await generateNpcResponse(
      systemPrompt,
      formattedHistory,
    );

    await sendViaWebhook(channel, triggeredNpc.name, npcResponse);
  } catch (error) {
    inspectError(error);
    await message.channel.send(
      "Ocorreu um erro ao processar a resposta do NPC.",
    );
  }
};
