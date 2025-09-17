import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import type { ButtonInteraction } from "discord.js";
import {
  SessionFeedbackModel,
  type SessionParticipantEntity,
} from "../../table/models.ts";
import { EmbedBuilder } from "discord.js";
import { Colors } from "discord.js";

export const collectListener = async (
  collectorInteraction: ButtonInteraction,
  allParticipants: SessionParticipantEntity[],
  sessionId: string,
  feedbackGiverId: string,
) => {
  const feedbackReceivers = allParticipants.filter(
    (p) => p.participantId !== feedbackGiverId,
  );

  const modal = new ModalBuilder()
    .setCustomId(`feedback_modal_submit_${sessionId}_${feedbackGiverId}`)
    .setTitle("Feedback da sessão");

  feedbackReceivers.forEach((receiver) => {
    const textInput = new TextInputBuilder()
      .setCustomId(`feedback_input_${receiver.participantId}`)
      .setLabel(`Feedback para ${receiver.username}`)
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder("Escreva seu feedback aqui.");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(textInput),
    );
  });

  const tenMinutesMs = 1000 * 60 * 10;
  await collectorInteraction.showModal(modal);

  const modalInteraction = await collectorInteraction.awaitModalSubmit({
    time: tenMinutesMs,
  });
  await modalInteraction.deferReply({ flags: "Ephemeral" });

  for (const actionRow of modalInteraction.components) {
    for (const component of actionRow.components) {
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
          const receiverDmChannel = await receiverUser.createDM();

          await Promise.all(
            [
              SessionFeedbackModel.create({
                sessionId,
                feedbackGiverId,
                feedbackReceiverId,
                feedbackText,
              }),
              receiverDmChannel.send({
                content:
                  "Você recebeu um feedback de uma sessão na qual você participou recentemente!",
                embeds: [
                  new EmbedBuilder()
                    .setColor(Colors.Aqua)
                    .setDescription(feedbackText)
                    .toJSON(),
                ],
              }),
            ],
          );
        }
      }
    }
  }

  await modalInteraction.editReply({
    content: "Obrigado! Seu feedback foi registrado.",
  });
};
