import { SlashCommandBuilder } from "discord.js";
import { BotCommand } from "../types/discord-slash-commands.js";
import { version as discordJsVersion } from "discord.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Fornece informações sobre o bot."),
  async execute(interaction) {
    if (!interaction.client.isReady()) {
      await interaction.reply({
        content: "O bot ainda não está pronto. Por favor, tente novamente em um momento.",
        ephemeral: true,
      });
      return;
    }

    const botName = interaction.client.user.username;
    const botId = interaction.client.user.id;
    const uptimeSeconds = process.uptime();

    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

    await interaction.reply({
      content:
        `**${botName}** (ID: \`${botId}\`)\n` +
        `Executando Discord.js v${discordJsVersion}\n` +
        `Tempo de Atividade: ${uptimeString}`,
      ephemeral: false,
    });
  },
};

export default command;
