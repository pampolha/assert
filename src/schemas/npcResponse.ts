import z from "zod";
import { scenarioSchema } from "./scenario.ts";

export const channelHistoryMessageSchema = z.object({
  username: z.string(),
  content: z.string(),
});
export type ChannelHistoryMessage = z.infer<typeof channelHistoryMessageSchema>;

export const npcResponsePayloadSchema = z.object({
  action: z.literal("generateNpcResponse"),
  conversationHistory: channelHistoryMessageSchema.array(),
  scenario: scenarioSchema,
  npc: scenarioSchema.shape.npcs.unwrap(),
  webhookData: z.object({
    id: z.string(),
    url: z.string(),
    token: z.string(),
  }),
});
export type NpcResponsePayload = z.infer<typeof npcResponsePayloadSchema>;
