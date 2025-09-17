import type { CommandInteraction } from "discord.js";
import type { ButtonInteraction } from "discord.js";
import {
  SessionChannelModel,
  type SessionEntity,
  SessionModel,
  SessionParticipantModel,
} from "../../table/models.ts";
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
    const userGroupMessages = commandInteraction.channel?.messages.cache.filter(
      (msg) =>
        msg.author === commandInteraction.client.user &&
        msg.mentions.users.has(collectorInteraction.user.id),
    );

    await Promise.all([
      collectorInteraction.editReply({
        content: "Encerrando sessão...",
        components: [],
      }),
      userGroupMessages?.map((msg) =>
        msg.edit({ content: "*Sessão encerrada.*", components: [] })
      ),
      SessionModel.update({
        sessionId: session.sessionId,
        status: "ENDED",
      }),
    ]);

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

    collectorInteraction.editReply({
      content: "Sessão encerrada com sucesso!",
    }).catch(() => null);
  } else if (collectorInteraction.customId === "cancel_end_session") {
    await collectorInteraction.editReply({
      content: "Operação de encerramento de sessão cancelada.",
      components: [],
    });
  }
};
