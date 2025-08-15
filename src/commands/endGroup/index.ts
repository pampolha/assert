import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SlashCommandBuilder,
} from "discord.js";
import type { BotCommand } from "../../types/discord-slash-commands.ts";
import { type SessionEntity, SessionModel } from "../../../shared/models.ts";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("encerrar-grupo")
    .setDescription(
      "Encerra o cenário atual no qual esse comando foi chamado ou a formação de grupo atual.",
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "Este comando só pode ser usado em um servidor (guilda).",
        ephemeral: true,
      });
      return;
    }

    const activeSessions = await SessionModel.find({
      status: "ACTIVE",
    }, { index: "gs1" });

    const formingSessions = await SessionModel.find({
      status: "FORMING",
    }, { index: "gs1" });

    const getOwnedGroup = (sessions: SessionEntity[]) =>
      sessions.find((sess) =>
        sess.participants.some(
          (part) => part.id === interaction.user.id && part.role === "owner",
        )
      );

    const session = getOwnedGroup([...formingSessions, ...activeSessions]);
    if (!session) {
      await interaction.reply({
        content: "Você não é o dono de nenhum grupo ativo ou em formação.",
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
      content:
        "Tem certeza de que deseja encerrar esta sessão? Todos os canais associados serão excluídos.",
      components: [row],
      ephemeral: true,
    });

    const collectorFilter = (i: { user: { id: string } }) =>
      i.user.id === interaction.user.id;

    try {
      const confirmation = await reply.awaitMessageComponent({
        filter: collectorFilter,
        time: 60_000,
        componentType: ComponentType.Button,
      });

      if (confirmation.customId === "confirm_end_session") {
        await confirmation.update({
          content: "Encerrando sessão...",
          components: [],
        });

        try {
          await SessionModel.update({
            sessionId: session.sessionId,
            status: "ENDED",
          }, { index: "primary" });

          await interaction.followUp({
            content: "Sessão encerrada com sucesso!",
            ephemeral: true,
          });
          console.log(
            `Sessão encerrada. Session ID: ${session.sessionId}`,
          );
        } catch (error) {
          console.error("Erro ao encerrar sessão:", error);
          await interaction.followUp({
            content:
              "Ocorreu um erro ao tentar encerrar a sessão. Por favor, tente novamente.",
            ephemeral: true,
          });
        }
      } else if (confirmation.customId === "cancel_end_session") {
        await confirmation.update({
          content: "Operação de encerramento de sessão cancelada.",
          components: [],
        });
      }
    } catch (e) {
      if (
        e instanceof Error &&
        e.message.includes(
          "Collector received no interactions before the time limit",
        )
      ) {
        await interaction.editReply({
          content: "Tempo esgotado para confirmar o encerramento da sessão.",
          components: [],
        });
      } else {
        console.error("Erro ao aguardar interação do botão:", e);
        await interaction.editReply({
          content: "Ocorreu um erro inesperado ao processar sua solicitação.",
          components: [],
        });
      }
    }
  },
};

export default command;
