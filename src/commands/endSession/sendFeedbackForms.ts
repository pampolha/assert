import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type {
  SessionEntity,
  SessionParticipantEntity,
} from "../../table/models.ts";
import type { TextChannel } from "discord.js";
import { feedbackCollectListener } from "./feedbackCollectorListeners.ts";
import { ComponentType } from "discord.js";
import { oneHourMs } from "../../lib/constants.ts";
import { tryDm } from "../../lib/sendDm.ts";
import { client } from "assert-bot";
import { inspectError } from "../../lib/log.ts";

export const sendFeedbackForms = async (
  session: SessionEntity,
  allParticipants: SessionParticipantEntity[],
  textChannel: TextChannel,
) => {
  if (allParticipants.length <= 1) return;

  await Promise.allSettled(allParticipants.map(async (participant) => {
    const user = await client.users.fetch(participant.participantId);

    const feedbackButton = new ButtonBuilder()
      .setCustomId(
        `feedback_trigger_${session.sessionId}_${participant.participantId}`,
      )
      .setLabel("Dar feedback da sessão")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(feedbackButton);

    const [sentToDm, message] = await tryDm(user, {
      content:
        `A sessão no canal "${textChannel.name}" foi encerrada. Por favor, use o botão abaixo para dar seu feedback anônimo sobre os participantes da sessão.`,
      components: [row],
    }, textChannel);

    if (!sentToDm) return;
    try {
      const collectorInteraction = await message.awaitMessageComponent({
        time: oneHourMs,
        componentType: ComponentType.Button,
      });

      await feedbackCollectListener(
        collectorInteraction,
        allParticipants,
        session.sessionId,
        participant.participantId,
        textChannel,
      );
    } catch (err) {
      inspectError(err);
    } finally {
      await message.delete();
    }
  }));
};
