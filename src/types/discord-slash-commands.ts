import type {
  Collection,
  CommandInteraction,
  SlashCommandBuilder,
  Snowflake,
} from "discord.js";
import type { SessionData } from "./session.ts";

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, BotCommand>;
    activeSessions: Collection<Snowflake, SessionData>;
  }
}

export interface BotCommand {
  data:
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: CommandInteraction) => Promise<void>;
}
