import type { Snowflake } from "discord.js";
import type { Scenario } from "../../shared/schemas.ts";

export interface SessionData {
  scenario: Scenario;
  textChannelId: Snowflake;
  voiceChannelId: Snowflake;
  categoryId: Snowflake;
  ownerId: Snowflake;
}
