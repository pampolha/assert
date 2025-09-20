import {
  type CategoryChannel,
  ChannelType,
  type CommandInteraction,
  PermissionFlagsBits,
} from "discord.js";

type ChannelCreationInput = {
  commandInteraction: CommandInteraction<"cached">;
  participantIds: string[];
  category: CategoryChannel;
  baseChannelName: string;
  scenarioTitle: string;
};

export const createCategory = (
  commandInteraction: CommandInteraction<"cached">,
  participantIds: string[],
) =>
  commandInteraction.guild.channels.create({
    name: `Sessão de ${commandInteraction.user.username}`,
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
    reason: `Nova sessão de ${commandInteraction.user.username}`,
  });

export const createTextChannel = (
  {
    commandInteraction,
    baseChannelName,
    category,
    participantIds,
    scenarioTitle,
  }: ChannelCreationInput,
) =>
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
  });

export const createVoiceChannel = (
  { commandInteraction, participantIds, category, baseChannelName }:
    ChannelCreationInput,
) =>
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
    reason: `Canal de voz para a sessão de ${commandInteraction.user.username}`,
  });
