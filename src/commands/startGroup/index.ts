import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SlashCommandBuilder,
} from "discord.js";
import { SessionModel, SessionParticipantModel } from "../../table/models.ts";
import { mainChannelId } from "../../env.ts";
import { collectListener } from "./collectorListeners.ts";
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
      await interaction.editReply({
        content: "Este comando só pode ser usado no canal principal da guilda.",
      });
      return;
    }

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
      await interaction.editReply({
        content: "Você não é o dono de nenhum grupo em formação.",
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

    const reply = await interaction.editReply({
      content:
        `Tem certeza de que deseja iniciar a sessão com ${participants.length} participantes?`,
      components: [row],
    });

    let collectorInteraction;
    try {
      collectorInteraction = await reply.awaitMessageComponent({
        filter: (i) => i.user.id === interaction.user.id,
        time: 60_000,
        componentType: ComponentType.Button,
      });
    } catch {
      await interaction.editReply({
        content: "Tempo esgotado para confirmar o início da sessão.",
        components: [],
      });
      return;
    }

    await collectorInteraction.deferUpdate();
    await collectListener(
      interaction,
      collectorInteraction,
      session,
      participants,
    );
  },
};

export default command;
