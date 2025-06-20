import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  ComponentType,
} from "discord.js";
import { BotCommand } from "../types/discord-slash-commands.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("encerrar-grupo")
    .setDescription(
      "Encerra o cenário atual no qual esse comando foi chamado.",
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "Este comando só pode ser usado em um servidor (guilda).",
        ephemeral: true,
      });
      return;
    }

    const sessionData = interaction.client.activeSessions.get(interaction.channelId);

    if (!sessionData) {
      await interaction.reply({
        content: "Este canal não está associado a uma sessão ativa.",
        ephemeral: true,
      });
      return;
    }

    if (interaction.user.id !== sessionData.ownerId) {
      await interaction.reply({
        content: "Apenas o criador da sessão pode encerrá-la.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const confirmButton = new ButtonBuilder()
      .setCustomId("confirm_end_session")
      .setLabel("Confirmar")
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel_end_session")
      .setLabel("Cancelar")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(cancelButton, confirmButton);

    const reply = await interaction.followUp({
      content: "Tem certeza de que deseja encerrar esta sessão? Todos os canais associados serão excluídos.",
      components: [row],
      ephemeral: true,
    });

    const collectorFilter = (i: { user: { id: string; }; }) => i.user.id === interaction.user.id;

    try {
      const confirmation = await reply.awaitMessageComponent({
        filter: collectorFilter,
        time: 60_000,
        componentType: ComponentType.Button,
      });

      if (confirmation.customId === "confirm_end_session") {
        await confirmation.update({ content: "Encerrando sessão...", components: [] });

        try {
          const textChannel = await interaction.guild.channels.fetch(sessionData.textChannelId);
          const voiceChannel = await interaction.guild.channels.fetch(sessionData.voiceChannelId);
          const category = await interaction.guild.channels.fetch(sessionData.categoryId);

          if (textChannel) await textChannel.delete(`Sessão encerrada por ${interaction.user.tag}`);
          if (voiceChannel) await voiceChannel.delete(`Sessão encerrada por ${interaction.user.tag}`);
          if (category) await category.delete(`Sessão encerrada por ${interaction.user.tag}`);

          interaction.client.activeSessions.delete(interaction.channelId);

          await interaction.followUp({
            content: "Sessão encerrada com sucesso! Os canais foram excluídos.",
            ephemeral: true,
          });
          console.log(`Sessão encerrada. Categoria: ${sessionData.categoryId}, Texto: ${sessionData.textChannelId}, Voz: ${sessionData.voiceChannelId}`);

        } catch (deleteError) {
          console.error("Erro ao excluir canais:", deleteError);
          await interaction.followUp({
            content: "Ocorreu um erro ao tentar excluir os canais da sessão. Por favor, tente novamente manualmente.",
            ephemeral: true,
          });
        }
      } else if (confirmation.customId === "cancel_end_session") {
        await confirmation.update({ content: "Operação de encerramento de sessão cancelada.", components: [] });
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("Collector received no interactions before the time limit")) {
        await interaction.editReply({ content: "Tempo esgotado para confirmar o encerramento da sessão.", components: [] });
      } else {
        console.error("Erro ao aguardar interação do botão:", e);
        await interaction.editReply({ content: "Ocorreu um erro inesperado ao processar sua solicitação.", components: [] });
      }
    }
  },
};

export default command;
