import { SlashCommandBuilder } from "discord.js";
import { CommandInteraction, Collection } from "discord.js";

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, BotCommand>;
  }
}

export interface BotCommand {
  data:
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: CommandInteraction) => Promise<void>;
}
