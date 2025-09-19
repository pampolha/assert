import type { TextChannel } from "discord.js";
import type { ReviewChannelHistoryMessage } from "../../schemas/review.ts";
import { generateReview } from "./generateReview.ts";
import {
  ScenarioModel,
  type SessionEntity,
} from "../../table/models.ts";
import { tryDm } from "../../lib/sendDm.ts";

export const sendReview = async (
  session: SessionEntity,
  textChannel: TextChannel,
) => {
  const scenario = await ScenarioModel.get({ scenarioId: session.scenarioId });
  if (!scenario) {
    throw new Error("Unexpected error: session scenario was not found.");
  }

  const channelMessages = await textChannel.messages.fetch();

  const conversationHistory: ReviewChannelHistoryMessage[] = channelMessages
    .map(
      (
        msg,
      ) => ({
        isBot: !!msg.webhookId || msg.author.bot,
        userId: msg.author.id,
        content: msg.cleanContent,
      }),
    );

  const reviewContent = await generateReview(
    conversationHistory,
    scenario,
    session.sessionId,
  );

  await Promise.allSettled([
    textChannel.send(
      `# Avaliação da sessão:\n` +
        `${reviewContent.overallEvaluation}\n\n` +
        `*Obrigado por participar!*`,
    ),
    ...reviewContent.feedbacks.map((f) => {
      const userMessage =
        `# Avaliação individual da sessão "${textChannel.name}"\n` +
        `${f.content}\n\n` +
        `*Obrigado pela participação!*`;
      return tryDm(f.userId, userMessage, textChannel);
    }),
  ]);
};
