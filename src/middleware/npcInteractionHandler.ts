import type { ValidNpcInteractionMessage } from "assert-bot";
import { generatorApiGatewayUrl } from "../env.ts";
import {
  ScenarioModel,
  SessionChannelModel,
  SessionModel,
} from "../table/models.ts";
import type {
  ChannelHistoryMessage,
  NpcResponsePayload,
} from "../schemas/npcResponse.ts";

export const handleNpcMention = async (
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
    try {
      channel.sendTyping();

      const conversationHistory: ChannelHistoryMessage[] =
        (await message.channel.messages.fetch({ limit: 50 })).map(
          (msg) => ({
            username: msg.author.username,
            content: msg.cleanContent,
          }),
        );

      const webhook = await channel.createWebhook({
        name: triggeredNpc.name,
      });

      const payload: NpcResponsePayload = {
        action: "generateNpcResponse",
        conversationHistory,
        scenario,
        npc: triggeredNpc,
        webhookData: {
          id: webhook.id,
          token: webhook.token,
          url: webhook.url,
        },
      };

      fetch(generatorApiGatewayUrl, {
        method: "POST",
        body: JSON.stringify(payload),
      }).catch(console.error);
    } catch (error) {
      console.error(error);
      await channel.send(
        "Ocorreu um erro ao processar a resposta do NPC.",
      );
    }
  }
};
