import type { ButtonInteraction, CommandInteraction } from "discord.js";
import { ChannelType, PermissionFlagsBits } from "discord.js";
import {
  ScenarioModel,
  SessionChannelModel,
  type SessionEntity,
  SessionModel,
  type SessionParticipantEntity,
} from "../../../shared/models.ts";

export const collectListener = async (
  commandInteraction: CommandInteraction,
  collectorInteraction: ButtonInteraction,
  session: SessionEntity,
  participants: SessionParticipantEntity[],
) => {
  if (!commandInteraction.guild) {
    return;
  }

  if (collectorInteraction.customId === "confirm_start_session") {
    await collectorInteraction.update({
      content: "Gerando cenário e criando canais...",
      components: [],
    });

    try {
      const scenario = await ScenarioModel.get({
        scenarioId: session.scenarioId,
      });

      if (!scenario) {
        await commandInteraction.followUp({
          content: "Cenário não encontrado.",
          ephemeral: true,
        });
        return;
      }

      const scenarioTitle = scenario.titulo_cenario ||
        "Cenário de Simulação";

      const baseChannelName = `sessao-${commandInteraction.user.username}`
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const participantIds = participants.map((part) => part.participantId);

      const category = await commandInteraction.guild.channels.create({
        name: `Sessão de Simulação - ${commandInteraction.user.username}`,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: commandInteraction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          ...participantIds.map((id) => ({
            id,
            allow: [PermissionFlagsBits.ViewChannel],
          })),
          {
            id: commandInteraction.client.user!.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.ManageChannels,
            ],
          },
        ],
        reason:
          `Nova sessão de simulação para ${commandInteraction.user.username}`,
      });

      const [textChannel, voiceChannel] = await Promise.all([
        commandInteraction.guild.channels.create({
          name: `${baseChannelName}-chat`,
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            {
              id: commandInteraction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            ...participantIds.map((id) => ({
              id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
              ],
            })),
            {
              id: commandInteraction.client.user!.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
              ],
            },
          ],
          topic: scenarioTitle,
          reason:
            `Canal de texto para a sessão de ${commandInteraction.user.username}`,
        }),
        commandInteraction.guild.channels.create({
          name: `${baseChannelName}-voz`,
          type: ChannelType.GuildVoice,
          parent: category.id,
          permissionOverwrites: [
            {
              id: commandInteraction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            ...participantIds.map((id) => ({
              id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
              ],
            })),
            {
              id: commandInteraction.client.user!.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
              ],
            },
          ],
          reason:
            `Canal de voz para a sessão de ${commandInteraction.user.username}`,
        }),
      ]);

      await Promise.all([
        textChannel.send(
          `Bem-vindo(a) à sua sessão de simulação!\n\n` +
            `Este é o canal de texto privado para a sua simulação. O canal de voz é ${voiceChannel}.\n\n` +
            `**Cenário:** ${scenarioTitle}\n` +
            `**Participantes:** ${
              participants.map((p) => `<@${p.participantId}>`).join(", ")
            }`,
        ),
        SessionModel.update({
          sessionId: session.sessionId,
          status: "ACTIVE",
        }, { index: "primary" }),
        SessionChannelModel.create({
          sessionId: session.sessionId,
          channelId: category.id,
          type: "category",
        }),
        SessionChannelModel.create({
          sessionId: session.sessionId,
          channelId: textChannel.id,
          type: "textChannel",
        }),
        SessionChannelModel.create({
          sessionId: session.sessionId,
          channelId: voiceChannel.id,
          type: "voiceChannel",
        }),
        commandInteraction.followUp({
          content:
            `Sua sessão de simulação foi iniciada! Você pode encontrar seus canais aqui: ${textChannel} (texto) e ${voiceChannel} (voz).`,
          ephemeral: true,
        }),
      ]);

      console.log(
        `Sessão iniciada. Categoria: ${category.id}, Texto: ${textChannel.id}, Voz: ${voiceChannel.id}, Cenário: ${scenario.titulo_cenario}`,
      );
    } catch (error) {
      console.error("Erro ao iniciar sessão:", error);
      await commandInteraction.followUp({
        content:
          "Ocorreu um erro ao tentar iniciar a sessão. Por favor, tente novamente.",
        ephemeral: true,
      });
    }
  } else if (collectorInteraction.customId === "cancel_start_session") {
    await collectorInteraction.update({
      content: "Operação de início de sessão cancelada.",
      components: [],
    });
  }
};

export const endListener = (
  commandInteraction: CommandInteraction,
) =>
  commandInteraction.editReply({
    content: "Tempo esgotado para confirmar o início da sessão.",
    components: [],
  });
