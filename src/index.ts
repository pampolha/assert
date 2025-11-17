import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { botToken, mainChannelId } from "./env.ts";
import { npcInteractionHandler } from "./middleware/npcInteractionHandler.ts";
import { ChannelType } from "discord.js";
import type {
  ClientOptions,
  CommandInteraction,
  Message,
  SlashCommandBuilder,
} from "discord.js";
import type { TextChannel } from "discord.js";
import type { ScenarioEntity } from "./table/models.ts";
import { inspectError } from "./lib/log.ts";
import { loadCommands } from "./middleware/loadCommands.ts";
import { oneDayMs } from "./lib/constants.ts";
import { generateScenario } from "./lib/generateScenario.ts";

export type ValidNpcInteractionMessage = Message<true> & {
  channel: TextChannel;
};

export interface BotCommand {
  data:
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: CommandInteraction) => Promise<void>;
}

export class AssertClient extends Client {
  scenarioCache: Collection<string, ScenarioEntity>;
  commands: Collection<string, BotCommand>;

  constructor(options: ClientOptions) {
    super(options);
    this.scenarioCache = new Collection<string, ScenarioEntity>();
    this.commands = new Collection<string, BotCommand>();
  }
}

export const client: AssertClient = new AssertClient({
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsPath = path.join(__dirname, "commands");

client.once(Events.ClientReady, async () => {
  try {
    await loadCommands(commandsPath);
    setTimeout(() => {
      generateScenario().catch(inspectError);
    }, oneDayMs);
    console.log("Client is ready");
  } catch (err) {
    inspectError(err);
  }
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
    msg.content.includes("@") &&
    !(msg.author.bot || msg.webhookId);

  if (isValidMessage(message)) {
    npcInteractionHandler(message).catch(inspectError);
  }
});

client.login(botToken);
