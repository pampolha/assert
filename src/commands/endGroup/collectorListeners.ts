import type { CommandInteraction } from "discord.js";
import type { ButtonInteraction } from "discord.js";
import { type SessionEntity, SessionModel, SessionChannelModel } from "../../../shared/models.ts";

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

    try {
      const channels = await SessionChannelModel.find({
        sessionId: session.sessionId
      }, { index: 'primary' });

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

      {
        await SessionModel.update({
          sessionId: session.sessionId,
          status: "ENDED",
        }, { index: "primary" });
      }

      await collectorInteraction.editReply({
        content: "Sessão encerrada com sucesso!",
      });
      console.log(
        `Sessão encerrada. Session ID: ${session.sessionId}`,
      );
    } catch (error) {
      console.error("Erro ao encerrar sessão:", error);
      await collectorInteraction.editReply({
        content:
          "Ocorreu um erro ao tentar encerrar a sessão. Por favor, tente novamente.",
      });
    }
  } else if (collectorInteraction.customId === "cancel_end_session") {
    await collectorInteraction.update({
      content: "Operação de encerramento de sessão cancelada.",
      components: [],
    });
  }
};

export const endListener = async (
  commandInteraction: CommandInteraction,
) => {
  await commandInteraction.editReply({
    content: "Tempo esgotado para tomar decisão de encerramento de sessão.",
    components: [],
  });
};
