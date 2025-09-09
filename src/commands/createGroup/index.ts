import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SlashCommandBuilder,
} from "discord.js";
import type { BotCommand } from "../../types/discord-slash-commands.ts";
import { mainChannelId } from "../../env.ts";
import { collectListener, endListener } from "./collectorListeners.ts";
import {
  ScenarioModel,
  type SessionEntity,
  SessionModel,
  type SessionParticipantEntity,
  SessionParticipantModel,
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

    await interaction.deferReply({ ephemeral: true });

    const [formingSessions, activeSessions, userParticipantEntities] =
      await Promise.all([
        SessionModel.find({ status: "FORMING" }, {
          index: "gs1",
        }),
        SessionModel.find({ status: "ACTIVE" }, {
          index: "gs1",
        }),
        SessionParticipantModel.find({
          participantId: interaction.user.id,
        }, { index: "gs1" }),
      ]);

    const allFormingAndActiveSessions = [...formingSessions, ...activeSessions];

    const userAlreadyHasActiveOrFormingSession = allFormingAndActiveSessions
      .some((session) =>
        userParticipantEntities.some((participantEntity) =>
          participantEntity.sessionId === session.sessionId &&
          participantEntity.role === "owner"
        )
      );

    if (userAlreadyHasActiveOrFormingSession) {
      await interaction.editReply({
        content: "Você já possui um grupo em formação ou ativo.",
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
      await interaction.editReply({
        content: "Nenhum cenário disponível no momento.",
      });
      return;
    }

    const sessionId = crypto.randomUUID();
    const oneHourFromNowMs = Date.now() + (60_000 * 60);

    const sessionEntity: SessionEntity = {
      sessionId,
      scenarioId: latestScenario.scenarioId,
      status: "FORMING",
      expiryDate: oneHourFromNowMs,
    };

    const participantEntity: SessionParticipantEntity = {
      sessionId,
      participantId: interaction.user.id,
      username: interaction.user.username,
      role: "owner",
    };

    await Promise.all([
      SessionModel.create(
        sessionEntity,
      ),
      SessionParticipantModel.create(participantEntity),
    ]);

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

    const groupMessage = await interaction.channel?.send({
      content:
        `**Grupo de Sessão em Formação**\nDono: <@${interaction.user.id}>\nClique em uma vaga abaixo para entrar:`,
      components: [groupMessageActionRow],
    });
    interaction.deleteReply();

    const oneHourMs = 60_000 * 60;
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
        }).catch((err) =>
          console.error(
            "Error while collecting createGroup interaction",
            err,
          )
        ),
    );

    collector.on(
      "end",
      (_collected, reason) =>
        endListener({
          groupMessage,
          groupMessageActionRow,
          commandInteraction: interaction,
        }, reason).catch((err) =>
          console.error("Error while finishing createGroup collector", err)
        ),
    );
  },
};

export default command;
