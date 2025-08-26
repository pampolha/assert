import type { CommandInteraction } from "discord.js";
import type { ButtonInteraction } from "discord.js";
import {
  SessionChannelModel,
  type SessionEntity,
  SessionModel,
  SessionParticipantModel,
} from "../../../shared/models.ts";
import { sendFeedbackForms } from "./sendFeedbackForms.ts";

export const collectListener = async (
  commandInteraction: CommandInteraction,
  collectorInteraction: ButtonInteraction,
  session: SessionEntity,
) => {
  if (!commandInteraction.guild) {
    return;
  }

  if (collectorInteraction.customId === "confirm_end_session") {
    await collectorInteraction.update({
      content: "Encerrando sessão...",
      components: [],
    });

    {
      await SessionModel.update({
        sessionId: session.sessionId,
        status: "ENDED",
      });
    }

    const channels = await SessionChannelModel.find({
      sessionId: session.sessionId,
    });

    const guildChannels = commandInteraction.guild.channels;
    for (const channel of channels) {
      const fetchedChannel = guildChannels.cache.get(channel.channelId) ||
        await guildChannels.fetch(channel.channelId);

      if (!fetchedChannel) {
        console.error(
          `Could not get stored channel. ${{ session }}, ${{ channel }}`,
        );
      } else {
        await fetchedChannel.delete("Session ended");
      }
    }

    if (session.status === "ACTIVE") {
      const allParticipants = await SessionParticipantModel.find({
        sessionId: session.sessionId,
      });

      await sendFeedbackForms(
        collectorInteraction.client,
        session,
        allParticipants,
      );
    }

    await collectorInteraction.editReply({
      content: "Sessão encerrada com sucesso!",
    });
  } else if (collectorInteraction.customId === "cancel_end_session") {
    await collectorInteraction.update({
      content: "Operação de encerramento de sessão cancelada.",
      components: [],
    });
  }
};

export const endListener = async (
  commandInteraction: CommandInteraction,
  reason: string,
) => {
  if (reason !== "time") return;
  await commandInteraction.editReply({
    content: "Tempo esgotado para tomar decisão de encerramento de sessão.",
    components: [],
  });
};
