import { Item } from "dynamoose/dist/Item.js";
import { Scenario } from "../../shared/schemas.js";
import { Snowflake } from "discord.js";

export class SessionItem extends Item {
  PK: `GUILD#${Snowflake}`;
  SK: `SESSION#${Snowflake}`;
  type: "SESSION";
  scenario: Scenario;
  textChannelId: Snowflake;
  voiceChannelId: Snowflake;
  categoryId: Snowflake;
  ownerId: Snowflake;
}

export class UserItem extends Item {
  PK: `USER#${Snowflake}`;
  SK: "PROFILE";
  type: "USER";
  userId: Snowflake;
  username: string;
}

export class GuildItem extends Item {
  PK: `GUILD#${Snowflake}`;
  SK: "CONFIG";
  type: "GUILD";
  guildId: Snowflake;
  name: string;
}
