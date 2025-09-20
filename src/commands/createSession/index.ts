import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SlashCommandBuilder,
} from "discord.js";
import { type BotCommand, client } from "assert-bot";
import { mainChannelId } from "../../env.ts";
import { collectListener, endListener } from "./collectorListeners.ts";
import {
  ScenarioModel,
  type SessionEntity,
  SessionModel,
  type SessionParticipantEntity,
  SessionParticipantModel,
} from "../../table/models.ts";
import { oneHourFromNowEpoch, oneHourMs } from "../../lib/constants.ts";
import { mention } from "../../lib/format.ts";
import { inspectError } from "../../lib/log.ts";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("criar-sessao")
    .setDescription("Inicia a formação de uma sessão."),

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
        content: "Você já possui uma sessão em formação ou ativa.",
      });
      return;
    }

    const scenarioCacheKey = new Date().toISOString().slice(0, 10);
    let latestCacheScenario = client.scenarioCache.get(
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

      client.scenarioCache.set(
        scenarioCacheKey,
        latestScenario,
      );

      latestCacheScenario = latestScenario;
    }

    const sessionId = crypto.randomUUID();

    const oneHourFromNow = oneHourFromNowEpoch();
    const sessionEntity: SessionEntity = {
      sessionId,
      scenarioId: latestCacheScenario.scenarioId,
      status: "FORMING",
      expiryDate: oneHourFromNow,
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

    const sessionSize = 4;
    const buttons = Array.from({ length: sessionSize }, (_, index) => {
      if (index < sessionSize - 1) {
        return new ButtonBuilder()
          .setCustomId(`spot-${index}`)
          .setLabel("Vaga")
          .setStyle(ButtonStyle.Primary);
      } else {
        return new ButtonBuilder()
          .setCustomId("session-spot-leave")
          .setLabel("Sair")
          .setStyle(ButtonStyle.Danger);
      }
    });

    const sessionMessageActionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(...buttons);

    const sessionMessage = await interaction.channel?.send({
      content: `**Sessão em formação**\nDono: ${
        mention(interaction.user)
      }\nClique em uma vaga abaixo para entrar:`,
      components: [sessionMessageActionRow],
    });
    interaction.deleteReply();

    const interactionCollector = sessionMessage.createMessageComponentCollector(
      {
        componentType: ComponentType.Button,
        time: oneHourMs,
      },
    );

    interactionCollector.on("collect", async (collectorInteraction) => {
      try {
        await collectorInteraction.deferUpdate();
        await collectListener({
          commandInteraction: interaction,
          collectorInteraction,
          sessionMessageActionRow,
          sessionId,
        });
      } catch (err) {
        if (err instanceof Error && err.message.includes("messageDelete")) {
          return;
        }

        inspectError(err);
      }
    });

    interactionCollector.on("end", () =>
      endListener({
        sessionMessage,
        sessionMessageActionRow,
        commandInteraction: interaction,
      }).catch(inspectError));
  },
};

export default command;
