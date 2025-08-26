import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type {
  SessionEntity,
  SessionParticipantEntity,
} from "../../../shared/models.ts";
import type { Client } from "discord.js";
import { collectListener } from "./feedbackCollectorListeners.ts";
import type { ComponentType } from "discord.js";

export const sendFeedbackForms = async (
  client: Client,
  session: SessionEntity,
  allParticipants: SessionParticipantEntity[],
) => {
  if (allParticipants.length <= 1) return;

  for (const participant of allParticipants) {
    const user = await client.users.fetch(participant.participantId);

    const dmChannel = await user.createDM();

    const feedbackButton = new ButtonBuilder()
      .setCustomId(
        `feedback_trigger_${session.sessionId}_${participant.participantId}`,
      )
      .setLabel("Dar feedback da sessão")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(feedbackButton);

    const message = await dmChannel.send({
      content:
        `Uma sessão em que você participou foi encerrada. Por favor, use o botão abaixo para dar seu feedback anônimo sobre os participantes da sessão.`,
      components: [row],
    });

    const oneHourMs = 1000 * 60 * 60;
    const collector = message.createMessageComponentCollector<
      ComponentType.Button
    >({
      filter: (i) => i.user.id === participant.participantId,
      time: oneHourMs,
    });

    collector.on(
      "collect",
      async (collectorInteraction) => {
        try {
          await collectListener(
            collectorInteraction,
            allParticipants,
            session.sessionId,
            participant.participantId,
          );
          await message.delete();
        } catch (err) {
          console.error("Error or timeout during modal submission: ", err);
          await message.edit({
            content: "O tempo para enviar o feedback esgotou.",
            components: [],
          });
        } finally {
          collector.stop();
        }
      },
    );

    collector.on(
      "end",
      async (_collected, reason) => {
        if (reason === "time") {
          await message.edit({
            content: "O tempo para dar seu feedback expirou.",
            components: [],
          });
        }
      },
    );
  }
};
