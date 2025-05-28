import { SlashCommandBuilder } from "discord.js";
import { BotCommand } from "../types/discord-slash-commands.js";
import os from "os";
import { version as discordJsVersion } from "discord.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("debug")
    .setDescription("Fornece metadados úteis para depuração."),
  async execute(interaction) {
    if (!interaction.client.isReady()) {
      await interaction.reply({
        content: "O bot ainda não está pronto. Por favor, tente novamente em um momento.",
        ephemeral: true,
      });
      return;
    }

    let debugInfo = `**Informações de Depuração:**\n`;
    debugInfo += `• Versão do Node.js: \`${process.version}\`\n`;
    debugInfo += `• Plataforma do SO: \`${os.platform()} (${os.arch()})\`\n`;
    debugInfo += `• Versão do Discord.js: \`v${discordJsVersion}\`\n`;
    debugInfo += `• Horário Atual (UTC): \`${new Date().toISOString()}\`\n`;
    debugInfo += `• Tempo de Atividade do Bot: \`${process.uptime().toFixed(2)} segundos\`\n`;
    debugInfo += `• ID do Usuário do Bot: \`${interaction.client.user.id}\`\n`;
    debugInfo += `• Tag do Usuário do Bot: \`${interaction.client.user.tag}\`\n`;

    if (interaction.inGuild()) {
      debugInfo += `• ID do Servidor: \`${interaction?.guild?.id}\`\n`;
      debugInfo += `• Nome do Servidor: \`${interaction?.guild?.name}\`\n`;
    }
    if (interaction.channel) {
      debugInfo += `• ID do Canal: \`${interaction.channel.id}\`\n`;
      debugInfo += `• Tipo de Canal: \`${interaction.channel.type}\`\n`;
    }

    debugInfo += `• ID do Usuário Invocador: \`${interaction.user.id}\`\n`;
    debugInfo += `• Tag do Usuário Invocador: \`${interaction.user.tag}\`\n`;
    debugInfo += `• ID da Interação: \`${interaction.id}\`\n`;
    debugInfo += `• Comando Usado: \`/${interaction.commandName}\`\n`;

    await interaction.reply({
      content: debugInfo,
      ephemeral: true,
    });
  },
};

export default command;
