import z from "zod";

export const reviewChannelHistoryMessageSchema = z.object({
  isBot: z.boolean(),
  userId: z.string(),
  content: z.string(),
});
export type ReviewChannelHistoryMessage = z.infer<
  typeof reviewChannelHistoryMessageSchema
>;

export const reviewSchema = z.object({
  overallEvaluation: z.string(),
  feedbacks: reviewChannelHistoryMessageSchema.array(),
});
