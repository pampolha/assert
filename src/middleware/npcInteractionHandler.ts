import type { ValidNpcInteractionMessage } from "assert-bot";
import {
  type ScenarioEntity,
  ScenarioModel,
  SessionChannelModel,
  SessionInteractionModel,
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
  return `Você é um personagem fictício. Seu nome é: ${npc.name}. Seu cargo é: ${npc.role}. Sua descrição é: ${npc.background}. O cenário no qual você está inserido e deve agir de acordo é: ${scenario}. O usuário irá enviar um histórico de conversação, no qual você está inserido, e pode já haver mensagens suas ou não. Considere mensagens enviadas por "Assert" como sendo suas, exceto as que explicitam o contexto da história fictícia (serão as mensagens no fim do histórico). Neste histórico de conversação, verifique se há menções ao seu nome, por exemplo, @Carlos, se Carlos for o seu nome. Caso o histórico de conversação não demonstre que você já respondeu a menção mais recente (no início do histórico) destinada a você, responda. Tente parecer fiel ao seu personagem, mas também colabore com os jogadores: o objetivo destas interações é fazer com que a situação-problema seja resolvida, e os jogadores desenvolvam suas habilidades sociais.` as const;
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
    model: "google/gemini-2.5-flash",
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

const registerInteraction = (
  sessionId: string,
  message: ValidNpcInteractionMessage,
  generatedResponse: string,
) => {
  const triggerMessage = message.content;
  const triggerMessageId = message.id;
  const participantId = message.author.id;

  return SessionInteractionModel.create({
    sessionId,
    triggerMessage,
    triggerMessageId,
    participantId,
    generatedResponse,
  });
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

    await Promise.all([
      sendViaWebhook(channel, triggeredNpc.name, npcResponse),
      registerInteraction(channel.id, message, npcResponse),
    ]);
  } catch (error) {
    inspectError(error);
    await message.channel.send(
      "Ocorreu um erro ao processar a resposta do NPC.",
    );
  }
};
