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
import type { BotCommand } from "./types/discord-slash-commands.ts";
import { botToken, mainChannelId } from "../shared/env.ts";
import { handleNpcMention } from "./npcInteractionHandler.ts";

const client = new Client({
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
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(
      `Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`,
    );
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "Ocorreu um erro ao executar este comando!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "Ocorreu um erro ao executar este comando!",
        ephemeral: true,
      });
    }
  }
});

client.on(Events.MessageCreate, (message) => {
  if (
    !(
      message.guild &&
      message.channel.isTextBased() &&
      message.channel.id !== mainChannelId &&
      message.content.includes("@")
    )
  ) return;

  handleNpcMention(message);
});

client.login(botToken);
