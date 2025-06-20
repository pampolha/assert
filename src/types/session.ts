import { Snowflake } from "discord.js";
import { Scenario } from "../../shared/schemas.js";

export interface SessionData {
  scenario: Scenario;
  textChannelId: Snowflake;
  voiceChannelId: Snowflake;
  categoryId: Snowflake;
  ownerId: Snowflake;
}
