import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SlashCommandBuilder,
} from "discord.js";
import type { BotCommand } from "../../types/discord-slash-commands.ts";
import { mainChannelId } from "../../../shared/env.ts";
import { collectListener, endListener } from "./collectorListeners.ts";
import {
  ScenarioModel,
  type SessionEntity,
  SessionModel,
} from "../../../shared/models.ts";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("criar-grupo")
    .setDescription("Inicia a formação de um grupo."),

  async execute(interaction) {
    if (
      !interaction.inGuild() ||
      !interaction.guild ||
      interaction.channel?.id !== mainChannelId
    ) {
      await interaction.reply({
        content: "Este comando só pode ser usado no canal principal da guilda.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    const activeSessions = await SessionModel.find({
      status: "ACTIVE",
    }, { index: "gs1" });
    const formingSessions = await SessionModel.find({
      status: "FORMING",
    }, { index: "gs1" });

    const inRunningSession = activeSessions.some((session) =>
      session.participants.some((p) => p.id === interaction.user.id)
    );

    const inFormingSession = formingSessions.some((session) =>
      session.participants.some((p) => p.id === interaction.user.id)
    );

    if (inFormingSession || inRunningSession) {
      await interaction.reply({
        content: "Você já está em um grupo em formação ou andamento.",
        ephemeral: true,
      });
      return;
    }

    const latestScenario = await ScenarioModel.get({
      GS1PK: "SCENARIO",
    }, {
      index: "gs1",
      limit: 1,
      reverse: true,
    });

    if (!latestScenario) {
      await interaction.reply({
        content: "Nenhum cenário disponível no momento.",
        ephemeral: true,
      });
      return;
    }

    const sessionId = crypto.randomUUID();
    const oneWeekFromNowMs = Date.now() + (1000 * 60 * 60 * 24 * 7);

    const sessionEntity: SessionEntity = {
      sessionId: sessionId,
      scenarioId: latestScenario.scenarioId,
      status: "FORMING",
      participants: [{
        id: interaction.user.id,
        tag: interaction.user.tag,
        role: "owner",
      }],
      expiryDate: oneWeekFromNowMs,
    };

    SessionModel.create(
      sessionEntity,
    );

    const groupMessageActionRow = new ActionRowBuilder<ButtonBuilder>();
    const groupSize = 4;
    for (let index = 0; index < groupSize; index++) {
      if (index < groupSize - 1) {
        groupMessageActionRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`spot-${index}`)
            .setLabel("Vaga")
            .setStyle(ButtonStyle.Primary),
        );
      } else {
        groupMessageActionRow.addComponents(
          new ButtonBuilder()
            .setCustomId("group-spot-leave")
            .setLabel("Sair")
            .setStyle(ButtonStyle.Danger),
        );
      }
    }

    const groupMessage = await interaction.editReply({
      content:
        `**Grupo de Sessão em Formação**\nDono: <@${interaction.user.id}>\nClique em uma vaga abaixo para entrar:`,
      components: [groupMessageActionRow],
    });

    const oneHourMs = 1000 * 60 * 60;
    const collector = groupMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: oneHourMs,
    });

    collector.on(
      "collect",
      (i) =>
        collectListener({
          collectorInteraction: i,
          commandInteraction: interaction,
          groupMessageActionRow,
          sessionId,
        }),
    );

    collector.on(
      "end",
      () =>
        endListener({
          groupMessage,
          groupMessageActionRow,
          commandInteraction: interaction,
        }),
    );
  },
};

export default command;
