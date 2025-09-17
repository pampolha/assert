import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SlashCommandBuilder,
} from "discord.js";
import type { BotCommand } from "assert-bot";
import { mainChannelId } from "../../env.ts";
import { collectListener, endListener } from "./collectorListeners.ts";
import {
  ScenarioModel,
  type SessionEntity,
  SessionModel,
  type SessionParticipantEntity,
  SessionParticipantModel,
} from "../../table/models.ts";

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
      await interaction.editReply({
        content: "Este comando só pode ser usado no canal principal da guilda.",
      });
      return;
    }

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

    const scenarioCacheKey = new Date().toISOString().slice(0, 10);
    let latestCacheScenario = interaction.client.scenarioCache.get(
      scenarioCacheKey,
    );

    if (!latestCacheScenario) {
      const latestScenario = (await ScenarioModel.find({
        GS1PK: "SCENARIO",
      }, {
        index: "gs1",
        limit: 1,
        reverse: true,
      })).at(0);

      if (!latestScenario) {
        await interaction.editReply({
          content: "Nenhum cenário disponível no momento.",
        });
        return;
      }

      interaction.client.scenarioCache.set(
        scenarioCacheKey,
        latestScenario,
      );

      latestCacheScenario = latestScenario;
    }

    const sessionId = crypto.randomUUID();
    const oneHourMs = 60_000 * 60;
    const oneHourFromNowMs = Date.now() + oneHourMs;

    const sessionEntity: SessionEntity = {
      sessionId,
      scenarioId: latestCacheScenario.scenarioId,
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

    while (Date.now() < oneHourFromNowMs) {
      let collectorInteraction;
      try {
        collectorInteraction = await groupMessage.awaitMessageComponent({
          componentType: ComponentType.Button,
          time: oneHourMs,
        });
      } catch {
        await endListener({
          groupMessage,
          groupMessageActionRow,
          commandInteraction: interaction,
        });
        return;
      }

      await collectorInteraction.deferUpdate();
      await collectListener({
        commandInteraction: interaction,
        collectorInteraction,
        groupMessageActionRow,
        sessionId,
      });
    }
  },
};

export default command;
