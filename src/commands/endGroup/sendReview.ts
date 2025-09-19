import type { Client, TextChannel } from "discord.js";
import type { ReviewChannelHistoryMessage } from "../../schemas/review.ts";
import { generateReview } from "./generateReview.ts";
import {
  ScenarioModel,
  type SessionChannelEntity,
  type SessionEntity,
} from "../../table/models.ts";

export const sendReview = async (
  client: Client,
  session: SessionEntity,
  sessionChannels: SessionChannelEntity[],
) => {
  const tableTextChannelId =
    sessionChannels.find((ch) => ch.type === "textChannel")?.channelId || "";

  const [textChannel, scenario] = await Promise.all([
    (client.channels.cache.get(tableTextChannelId) ||
      client.channels.fetch(tableTextChannelId)) as
        | TextChannel
        | Promise<TextChannel | null>,
    ScenarioModel.get({ scenarioId: session.scenarioId }),
  ]);

  if (!textChannel) {
    throw new Error("Unexpected error: session text channel was not found.");
  }
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
    textChannel.send(reviewContent.overallEvaluation),
    ...reviewContent.feedbacks.map(async (f) =>
      (await client.users.createDM(f.userId)).send(f.content)
    ),
  ]);
};
