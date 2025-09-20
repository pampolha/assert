import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { botToken, mainChannelId } from "./env.ts";
import { generateNpcResponse } from "./middleware/generateNpcResponse.ts";
import { ChannelType } from "discord.js";
import type {
  CommandInteraction,
  Message,
  SlashCommandBuilder,
} from "discord.js";
import type { TextChannel } from "discord.js";
import type { ScenarioEntity } from "./table/models.ts";
import { inspectError } from "./lib/log.ts";

export type ValidNpcInteractionMessage = Message<true> & {
  channel: TextChannel;
};

export interface BotCommand {
  data:
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: CommandInteraction) => Promise<void>;
}

export const client: Client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageTyping,
  ],
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.User,
  ],
});

client.scenarioCache = new Collection<string, ScenarioEntity>();

client.commands = new Collection<string, BotCommand>();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsPath = path.join(__dirname, "commands");

async function loadCommands() {
  const commandDirs = fs
    .readdirSync(commandsPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const dir of commandDirs) {
    const indexPath = path.join(commandsPath, dir, "index.ts");

    if (fs.existsSync(indexPath)) {
      const command: BotCommand = (await import(indexPath)).default;

      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(
          `Command at ${indexPath} does not have "data" and/or "execute" properties.`,
        );
      }
    } else {
      console.warn(`Command at ${indexPath} does not have an "index.ts" file`);
    }
  }
}

client.once(Events.ClientReady, async (c) => {
  await loadCommands();
  console.log(`Pronto! Logado como ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`,
      );
      return;
    }

    try {
      await interaction.deferReply({ flags: "Ephemeral" });
      await command.execute(interaction);
    } catch (err) {
      inspectError(err);
    }
  }
});

client.on(Events.MessageCreate, (message) => {
  const isValidMessage = (
    msg: typeof message,
  ): msg is ValidNpcInteractionMessage =>
    msg.inGuild() &&
    msg.channel.type === ChannelType.GuildText &&
    msg.channel.id !== mainChannelId &&
    msg.content.includes("@");

  if (isValidMessage(message)) {
    generateNpcResponse(message).catch(inspectError);
  }
});

client.login(botToken);
