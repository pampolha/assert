import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SlashCommandBuilder,
} from "discord.js";
import { SessionModel, SessionParticipantModel } from "../../table/models.ts";
import { mainChannelId } from "../../env.ts";
import { collectListener, endListener } from "./collectorListeners.ts";
import type { BotCommand } from "assert-bot";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("iniciar-grupo")
    .setDescription(
      "Inicia a sessão com os participantes atuais do grupo em formação.",
    ),

  async execute(interaction) {
    if (
      !interaction.guild ||
      interaction.channel?.id !== mainChannelId
    ) {
      await interaction.reply({
        content: "Este comando só pode ser usado no canal principal da guilda.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const [formingSessions, userParticipantEntities] = await Promise.all([
      SessionModel.find({
        status: "FORMING",
      }, { index: "gs1" }),
      SessionParticipantModel.find({
        participantId: interaction.user.id,
      }, { index: "gs1" }),
    ]);

    const session = formingSessions.find((session) =>
      userParticipantEntities.some(
        (part) =>
          part.sessionId === session.sessionId &&
          part.participantId === interaction.user.id &&
          part.role === "owner",
      )
    );

    if (!session) {
      await interaction.reply({
        content: "Você não é o dono de nenhum grupo em formação.",
        ephemeral: true,
      });
      return;
    }

    const participants = await SessionParticipantModel.find({
      sessionId: session.sessionId,
    });

    const confirmButton = new ButtonBuilder()
      .setCustomId("confirm_start_session")
      .setLabel("Confirmar")
      .setStyle(ButtonStyle.Success);

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel_start_session")
      .setLabel("Cancelar")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(cancelButton, confirmButton);

    const reply = await interaction.followUp({
      content:
        `Tem certeza de que deseja iniciar a sessão com ${participants.length} participantes?`,
      components: [row],
      ephemeral: true,
    });

    const collector = reply.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 60_000,
      componentType: ComponentType.Button,
    });

    collector.on(
      "collect",
      (collectorInteraction) =>
        collectListener(
          interaction,
          collectorInteraction,
          session,
          participants,
        ).catch((err) =>
          console.error("Error while collecting startGroup interaction", err)
        ),
    );

    collector.on(
      "end",
      (_collected, reason) =>
        endListener(interaction, reason)?.catch((err) =>
          console.error("Error while finishing startGroup collector", err)
        ),
    );
  },
};

export default command;
