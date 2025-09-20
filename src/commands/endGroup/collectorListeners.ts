import { Colors, type CommandInteraction } from "discord.js";
import type { ButtonInteraction, TextChannel } from "discord.js";
import {
  SessionChannelModel,
  type SessionEntity,
  SessionModel,
  SessionParticipantModel,
} from "../../table/models.ts";
import { sendFeedbackForms } from "./sendFeedbackForms.ts";
import { sendReview } from "./sendReview.ts";
import { mention, timestamp } from "../../lib/format.ts";
import { oneHourFromNowEpoch, oneHourMs } from "../../lib/constants.ts";
import { client } from "assert-bot";
import { inspectError } from "../../lib/log.ts";

export const collectListener = async (
  commandInteraction: CommandInteraction<"cached">,
  collectorInteraction: ButtonInteraction<"cached">,
  session: SessionEntity,
) => {
  if (!commandInteraction.guild) {
    return;
  }

  if (collectorInteraction.customId === "confirm_end_session") {
    await SessionModel.update({
      sessionId: session.sessionId,
      status: "ENDED",
    });

    if (session.status === "FORMING") {
      await Promise.all(
        [
          collectorInteraction.editReply(
            {
              content: "A sessão em formação foi encerrada.",
              components: [],
            },
          ),
          (await commandInteraction.channel?.messages.fetch())?.find(
            (msg) =>
              msg.author === commandInteraction.client.user &&
              msg.mentions.users.has(collectorInteraction.user.id),
          )?.delete().catch(inspectError),
        ],
      );
    } else if (session.status === "ACTIVE") {
      const allParticipants = await SessionParticipantModel.find({
        sessionId: session.sessionId,
      });

      const tableChannels = await SessionChannelModel.find({
        sessionId: session.sessionId,
      });

      const tableTextChannelId = tableChannels.find((ch) =>
        ch.type === "textChannel"
      )?.channelId || "";

      const textChannel =
        await (client.channels.cache.get(tableTextChannelId) ||
          client.channels.fetch(tableTextChannelId)) as TextChannel | null;

      if (!textChannel) {
        throw new Error(
          "Unexpected error: session text channel was not found.",
        );
      }

      const oneHourFromNow = oneHourFromNowEpoch();
      await Promise.all([
        collectorInteraction.editReply(
          {
            content: "O agendamento da deleção de canais foi feito.",
            components: [],
          },
        ),
        collectorInteraction.followUp({
          content: allParticipants.map((p) => mention(p.participantId)).join(),
          embeds: [
            {
              title: "A sessão foi encerrada.",
              description: `Os canais serão apagados em: ${
                timestamp(oneHourFromNow)
              }`,
              color: Colors.Red,
            },
          ],
        }),
        sendFeedbackForms(
          session,
          allParticipants,
          textChannel,
        ),
        sendReview(session, textChannel),
      ]);

      setTimeout(async () => {
        await Promise.all(
          tableChannels.map(async (channel) => {
            const fetchedChannel =
              collectorInteraction.guild.channels.cache.get(
                channel.channelId,
              ) ||
              await collectorInteraction.guild.channels.fetch(
                channel.channelId,
              );

            if (!fetchedChannel) {
              console.error(
                `Could not get stored channel. ${{ session }}, ${{ channel }}`,
              );
            } else {
              return fetchedChannel.delete("Session ended");
            }
          }),
        ).catch((err) =>
          inspectError(
            err,
            { cleanupScheduledTime: oneHourFromNow },
          )
        );
      }, oneHourMs);
    }
  } else if (collectorInteraction.customId === "cancel_end_session") {
    await collectorInteraction.editReply({
      content: "Operação de encerramento de sessão cancelada.",
      components: [],
    });
  }
};
