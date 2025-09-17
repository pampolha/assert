import type { ButtonInteraction, CommandInteraction } from "discord.js";
import {
  ScenarioModel,
  SessionChannelModel,
  type SessionEntity,
  SessionModel,
  type SessionParticipantEntity,
} from "../../table/models.ts";
import {
  makeDmInstructions,
  makeWelcomeMessageArray,
} from "./onboardingTemplates.ts";
import {
  createCategory,
  createTextChannel,
  createVoiceChannel,
} from "./channelCreation.ts";

export const collectListener = async (
  commandInteraction: CommandInteraction<"cached">,
  collectorInteraction: ButtonInteraction,
  session: SessionEntity,
  participants: SessionParticipantEntity[],
) => {
  if (collectorInteraction.customId === "confirm_start_session") {
    const userGroupMessages = commandInteraction.channel?.messages.cache.filter(
      (msg) =>
        msg.author === commandInteraction.client.user &&
        msg.mentions.users.has(collectorInteraction.user.id),
    );

    await Promise.all([
      collectorInteraction.editReply({
        content: "Gerando cenário e criando canais...",
        components: [],
      }),
      userGroupMessages?.map((msg) =>
        msg.edit({ content: `*Grupo iniciado*`, components: [] })
      ),
    ]);

    const scenario = await ScenarioModel.get({
      scenarioId: session.scenarioId,
    });

    if (!scenario) {
      await commandInteraction.editReply({
        content: "Cenário não encontrado.",
      });
      return;
    }

    const scenarioTitle = scenario.corporate.company_name ??
      "Cenário de Simulação";

    const baseChannelName = `sessao-${commandInteraction.user.username}`
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const participantIds = participants.map((part) => part.participantId);

    const category = await createCategory(commandInteraction, participantIds);

    const channelCreationInput = {
      commandInteraction,
      participantIds,
      category,
      baseChannelName,
      scenarioTitle,
    };
    const [textChannel, voiceChannel] = await Promise.all([
      createTextChannel(channelCreationInput),
      createVoiceChannel(channelCreationInput),
    ]);

    const welcomeMessageArray = makeWelcomeMessageArray(scenario, participants);

    const characterAssignments = participants.map((participant, index) => {
      const character = scenario.characters[index % scenario.characters.length];
      return { participant, character };
    });

    const sessionOwner = participants.find((p) => p.role === "owner");
    const dmPromises = characterAssignments.map(
      async ({ participant, character }) => {
        try {
          const user = await commandInteraction.client.users.fetch(
            participant.participantId,
          );
          const dmInstructions = makeDmInstructions(
            sessionOwner,
            character,
          );

          await user.send(dmInstructions);
        } catch (error) {
          console.error(
            `Failed to send DM to user ${participant.participantId}:`,
            error,
          );
          await textChannel.send(
            `<@${participant.participantId}> Não foi possível enviar mensagem privada. Verifique se você permite mensagens de membros do servidor nas configurações de privacidade.`,
          );
        }
      },
    );

    await Promise.all([
      dmPromises,
      Promise.all(
        welcomeMessageArray.map((msg) => textChannel.send(msg)),
      ),
      SessionModel.update({
        sessionId: session.sessionId,
        status: "ACTIVE",
      }),
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
      commandInteraction.editReply({
        content:
          `Sua sessão de simulação foi iniciada! Você pode encontrar seus canais aqui: ${textChannel} (texto) e ${voiceChannel} (voz).`,
      }),
    ]);
  } else if (collectorInteraction.customId === "cancel_start_session") {
    await collectorInteraction.editReply({
      content: "Operação de início de sessão cancelada.",
      components: [],
    });
  }
};
