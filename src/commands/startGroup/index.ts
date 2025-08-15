import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ComponentType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { BotCommand } from "../../types/discord-slash-commands.ts";
import { ScenarioModel, SessionModel } from "../../../shared/models.ts";
import { mainChannelId } from "../../../shared/env.ts";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("iniciar-grupo")
    .setDescription(
      "Inicia a sessão com os participantes atuais do grupo em formação.",
    ),

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

    if (!interaction.member) {
      await interaction.reply({
        content: "Não foi possível identificar o membro.",
        ephemeral: true,
      });
      return;
    }

    const formingSessions = await SessionModel.find({
      status: "FORMING",
    }, { index: "gs1" });

    const session = formingSessions.find((sess) =>
      sess.participants.some(
        (part) => part.id === interaction.user.id && part.role === "owner",
      )
    );

    if (!session) {
      await interaction.reply({
        content: "Você não é o dono de nenhum grupo em formação.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

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
        `Tem certeza de que deseja iniciar a sessão com ${session.participants.length} participantes?`,
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

      if (confirmation.customId === "confirm_start_session") {
        await confirmation.update({
          content: "Gerando cenário e criando canais...",
          components: [],
        });

        try {
          const scenario = await ScenarioModel.get({
            scenarioId: session.scenarioId,
          });

          if (!scenario) {
            await interaction.followUp({
              content: "Cenário não encontrado.",
              ephemeral: true,
            });
            return;
          }

          const scenarioTitle = scenario.titulo_cenario ||
            "Cenário de Simulação";

          const baseChannelName = `sessao-${interaction.user.username}`
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

          const participantIds = session.participants.map((part) => part.id);

          let category, textChannel, voiceChannel;

          try {
            category = await interaction.guild.channels.create({
              name: `Sessão de Simulação - ${interaction.user.username}`,
              type: ChannelType.GuildCategory,
              permissionOverwrites: [
                {
                  id: interaction.guild.id,
                  deny: [PermissionFlagsBits.ViewChannel],
                },
                ...participantIds.map((id) => ({
                  id,
                  allow: [PermissionFlagsBits.ViewChannel],
                })),
                {
                  id: interaction.client.user!.id,
                  allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.ManageChannels,
                  ],
                },
              ],
              reason:
                `Nova sessão de simulação para ${interaction.user.username}`,
            });

            textChannel = await interaction.guild.channels.create({
              name: `${baseChannelName}-chat`,
              type: ChannelType.GuildText,
              parent: category.id,
              permissionOverwrites: [
                {
                  id: interaction.guild.id,
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
                  id: interaction.client.user!.id,
                  allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                  ],
                },
              ],
              topic: scenarioTitle,
              reason:
                `Canal de texto para a sessão de ${interaction.user.username}`,
            });

            voiceChannel = await interaction.guild.channels.create({
              name: `${baseChannelName}-voz`,
              type: ChannelType.GuildVoice,
              parent: category.id,
              permissionOverwrites: [
                {
                  id: interaction.guild.id,
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
                  id: interaction.client.user!.id,
                  allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.Connect,
                    PermissionFlagsBits.Speak,
                  ],
                },
              ],
              reason:
                `Canal de voz para a sessão de ${interaction.user.username}`,
            });

            await textChannel.send(
              `Bem-vindo(a) à sua sessão de simulação!\n\n` +
                `Este é o canal de texto privado para a sua simulação. O canal de voz é ${voiceChannel}.\n\n` +
                `**Cenário:** ${scenarioTitle}\n` +
                `**Participantes:** ${
                  session.participants.map((p) => `<@${p.id}>`).join(", ")
                }`,
            );

            await SessionModel.update({
              sessionId: session.sessionId,
              status: "ACTIVE",
            }, { index: "primary" });

            await interaction.followUp({
              content:
                `Sua sessão de simulação foi iniciada! Você pode encontrar seus canais aqui: ${textChannel} (texto) e ${voiceChannel} (voz).`,
              ephemeral: true,
            });

            console.log(
              `Sessão iniciada. Categoria: ${category.id}, Texto: ${textChannel.id}, Voz: ${voiceChannel.id}, Cenário: ${scenario.titulo_cenario}`,
            );
          } catch (channelError) {
            console.error(
              "Erro ao criar canais ou enviar mensagem:",
              channelError,
            );
            await interaction.followUp({
              content:
                "Ocorreu um erro ao tentar criar os canais da simulação. Por favor, verifique as permissões do bot e tente novamente.",
              ephemeral: true,
            });
            if (category) {
              try {
                await category.delete("Erro na criação de canais da sessão");
              } catch (cleanupError) {
                console.error(
                  "Erro ao tentar deletar categoria após falha:",
                  cleanupError,
                );
              }
            }
          }
        } catch (error) {
          console.error("Erro ao iniciar sessão:", error);
          await interaction.followUp({
            content:
              "Ocorreu um erro ao tentar iniciar a sessão. Por favor, tente novamente.",
            ephemeral: true,
          });
        }
      } else if (confirmation.customId === "cancel_start_session") {
        await confirmation.update({
          content: "Operação de início de sessão cancelada.",
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
          content: "Tempo esgotado para confirmar o início da sessão.",
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
