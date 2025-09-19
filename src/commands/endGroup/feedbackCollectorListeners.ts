import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import type { ButtonInteraction, TextChannel } from "discord.js";
import {
  SessionFeedbackModel,
  type SessionParticipantEntity,
} from "../../table/models.ts";
import { EmbedBuilder } from "discord.js";
import { Colors } from "discord.js";
import { oneHourMs } from "../../lib/constants.ts";
import { tryDm } from "../../lib/sendDm.ts";

export const collectListener = async (
  collectorInteraction: ButtonInteraction,
  allParticipants: SessionParticipantEntity[],
  sessionId: string,
  feedbackGiverId: string,
  fallbackChannel: TextChannel,
) => {
  const feedbackReceivers = allParticipants.filter(
    (p) => p.participantId !== feedbackGiverId,
  );

  const modal = new ModalBuilder()
    .setCustomId(`feedback_modal_submit_${sessionId}_${feedbackGiverId}`)
    .setTitle("Feedback da sessão")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        feedbackReceivers.map((receiver) =>
          new TextInputBuilder()
            .setCustomId(`feedback_input_${receiver.participantId}`)
            .setLabel(`Feedback para ${receiver.username}`)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setPlaceholder("Escreva seu feedback aqui.")
        ),
      ),
    ).toJSON();

  await collectorInteraction.showModal(modal);

  const modalInteraction = await collectorInteraction.awaitModalSubmit({
    time: oneHourMs,
  });
  await modalInteraction.deferReply({ flags: "Ephemeral" });

  await Promise.all(
    modalInteraction.components.flatMap((actionRow) =>
      actionRow.components.map(async (component) => {
        if (component.customId.startsWith("feedback_input_")) {
          const feedbackReceiverId = component.customId.replace(
            "feedback_input_",
            "",
          );
          const feedbackText = component.value.trim();

          if (feedbackText) {
            const receiverUser = await collectorInteraction.client.users.fetch(
              feedbackReceiverId,
            );

            await Promise.all(
              [
                SessionFeedbackModel.create({
                  sessionId,
                  feedbackGiverId,
                  feedbackReceiverId,
                  feedbackText,
                }),
                tryDm(receiverUser, {
                  content:
                    `Você recebeu um feedback da sessão no canal ${fallbackChannel.name}!`,
                  embeds: [
                    new EmbedBuilder()
                      .setColor(Colors.Aqua)
                      .setDescription(feedbackText)
                      .toJSON(),
                  ],
                }, fallbackChannel),
              ],
            );
          }
        }
      })
    ),
  );

  await modalInteraction.editReply({
    content: "Obrigado! Seu feedback foi registrado.",
  });
};
