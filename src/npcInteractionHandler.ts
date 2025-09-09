import type { Message } from "discord.js";
import axios from "axios";
import { generatorApiGatewayUrl } from "./env.ts";
import {
  type ScenarioEntity,
  ScenarioModel,
  SessionChannelModel,
  SessionModel,
} from "../shared/models.ts";
import type { OmitPartialGroupDMChannel } from "discord.js";

export const handleNpcMention = async (
  message: OmitPartialGroupDMChannel<Message>,
) => {
  const sessionTextChannel = await SessionChannelModel.get({
    channelId: message.channel.id,
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
      await message.channel.sendTyping();

      const messageHistory = await message.channel.messages.fetch();

      const conversationHistory = messageHistory
        .reverse()
        .map((msg) => `${msg.author.username}: ${msg.content}`)
        .join("\n");

      const payload: {
        action: string;
        conversationHistory: string;
        npc: ScenarioEntity["npcs"][0];
      } = {
        action: "generateNpcResponse",
        conversationHistory,
        npc: {
          name: triggeredNpc.name,
          role: triggeredNpc.role,
          background: triggeredNpc.background,
        },
      };

      const response = await axios.post<{ npcResponse: string }>(
        generatorApiGatewayUrl,
        payload,
      );

      if (response.data && response.data.npcResponse) {
        await message.channel.send(response.data.npcResponse);
      }
    } catch (error) {
      console.error("Erro ao lidar com a interação do NPC:", error);
      await message.channel.send(
        "Ocorreu um erro ao processar a resposta do NPC.",
      );
    }
  }
};
