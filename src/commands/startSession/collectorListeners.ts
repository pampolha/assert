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
import { tryDm } from "../../lib/sendDm.ts";
import { inspectError } from "../../lib/log.ts";

export const collectListener = async (
  commandInteraction: CommandInteraction<"cached">,
  collectorInteraction: ButtonInteraction,
  session: SessionEntity,
  participants: SessionParticipantEntity[],
) => {
  if (collectorInteraction.customId === "confirm_start_session") {
    const userSessionMessage =
      (await commandInteraction.channel?.messages.fetch())?.find(
        (msg) =>
          msg.author === commandInteraction.client.user &&
          msg.mentions.users.has(collectorInteraction.user.id),
      );

    await Promise.all([
      collectorInteraction.editReply({
        content: "Preparando a sessão...",
        components: [],
      }),
      userSessionMessage?.delete().catch(inspectError),
    ]);

    const scenario = await ScenarioModel.get({
      scenarioId: session.scenarioId,
    });

    if (!scenario) {
      throw new Error("No scenario was found!");
    }

    const scenarioTitle = scenario.corporate.company_name;
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
        const user = await commandInteraction.client.users.fetch(
          participant.participantId,
        );
        const dmInstructions = makeDmInstructions(
          sessionOwner,
          character,
        );

        return tryDm(user, dmInstructions, textChannel);
      },
    );

    await Promise.all([
      ...dmPromises,
      ...welcomeMessageArray.map((msg) => textChannel.send(msg)),
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
          `Sua sessão foi iniciada! Você pode encontrar seus canais aqui: ${textChannel} (texto) e ${voiceChannel} (voz).`,
      }),
    ]);
  } else if (collectorInteraction.customId === "cancel_start_session") {
    await collectorInteraction.editReply({
      content: "Início de sessão cancelado.",
      components: [],
    });
  }
};
