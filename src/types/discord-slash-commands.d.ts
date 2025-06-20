import {
  SlashCommandBuilder,
  CommandInteraction,
  Collection,
  Snowflake,
} from "discord.js";
import { SessionData } from "./session.js";

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
