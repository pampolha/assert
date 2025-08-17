import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SlashCommandBuilder,
} from "discord.js";
import type { BotCommand } from "../../types/discord-slash-commands.ts";
import {
  SessionModel,
  SessionParticipantModel,
} from "../../../shared/models.ts";
import { collectListener, endListener } from "./collectorListeners.ts";

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
    await interaction.deferReply({ ephemeral: true });

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
      await interaction.followUp({
        content: "Você não é o dono de nenhum grupo ativo ou em formação.",
        ephemeral: true,
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

    const reply = await interaction.followUp({
      content:
        "Tem certeza de que deseja encerrar esta sessão? Todos os canais associados serão excluídos.",
      components: [row],
      ephemeral: true,
    });

    const oneMinuteMs = 60_000;
    const collector = reply.createMessageComponentCollector({
      time: oneMinuteMs,
      componentType: ComponentType.Button,
    });

    collector.on(
      "collect",
      (collectorInteraction) =>
        collectListener(
          interaction,
          collectorInteraction,
          userOwnedSession,
        ),
    );
    collector.on("end", (_collectorInteraction) => endListener(interaction));
  },
};

export default command;
