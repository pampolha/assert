import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SlashCommandBuilder,
} from "discord.js";
import type { BotCommand } from "assert-bot";
import { SessionModel, SessionParticipantModel } from "../../table/models.ts";
import { collectListener } from "./collectorListeners.ts";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("encerrar-grupo")
    .setDescription(
      "Encerra o cenário atual no qual esse comando foi chamado ou a formação de grupo atual.",
    ),

  async execute(interaction) {
    if (!interaction.inCachedGuild()) {
      await interaction.editReply({
        content: "Este comando só pode ser usado em um servidor (guilda).",
      });
      return;
    }

    const [activeSessions, formingSessions, userParticipantEntities] =
      await Promise.all([
        SessionModel.find({
          status: "ACTIVE",
        }, { index: "gs1" }),
        SessionModel.find({
          status: "FORMING",
        }, { index: "gs1" }),
        SessionParticipantModel.find({
          participantId: interaction.user.id,
        }, { index: "gs1" }),
      ]);

    const userOwnedSession = [...activeSessions, ...formingSessions].find(
      (session) =>
        userParticipantEntities.some((part) =>
          part.role === "owner" && part.sessionId === session.sessionId
        ),
    );

    if (!userOwnedSession) {
      await interaction.editReply({
        content: "Você não é o dono de nenhum grupo ativo ou em formação.",
      });
      return;
    }

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

    const reply = await interaction.editReply({
      content:
        "Tem certeza de que deseja encerrar esta sessão? Todos os canais associados serão excluídos.",
      components: [row],
    });

    const oneMinuteMs = 60_000;

    let buttonInteraction;
    try {
      buttonInteraction = await reply.awaitMessageComponent({
        time: oneMinuteMs,
        componentType: ComponentType.Button,
      });
    } catch {
      await interaction.editReply({
        content: "Tempo esgotado para tomar decisão de encerramento de sessão.",
        components: [],
      });
      return;
    }

    await buttonInteraction.deferUpdate();
    await collectListener(
      interaction,
      buttonInteraction,
      userOwnedSession,
    );
  },
};

export default command;
