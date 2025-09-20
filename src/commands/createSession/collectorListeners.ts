import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type CommandInteraction,
} from "discord.js";
import type { Message } from "discord.js";
import {
  type SessionEntity,
  SessionModel,
  type SessionParticipantEntity,
  SessionParticipantModel,
} from "../../table/models.ts";

const getUpdatedButtonRow = (
  { sessionMembers, sessionMessageActionRow, collectorInteraction }: {
    collectorInteraction: ButtonInteraction;
    sessionMessageActionRow: ActionRowBuilder<ButtonBuilder>;
    sessionMembers: SessionParticipantEntity[];
  },
): ActionRowBuilder<ButtonBuilder> => {
  const updatedButtonRow = new ActionRowBuilder<ButtonBuilder>();
  sessionMessageActionRow.components.forEach((_button, i) => {
    const customId = collectorInteraction.customId.replace(/\d$/, `${i}`);
    const label = sessionMembers.at(i)?.username;
    const style = label ? ButtonStyle.Success : ButtonStyle.Primary;
    const isDisabled = !!label;

    if (i < sessionMessageActionRow.components.length - 1) {
      updatedButtonRow.addComponents(
        new ButtonBuilder()
          .setCustomId(customId)
          .setLabel(label || "Vaga")
          .setStyle(style)
          .setDisabled(isDisabled),
      );
    } else {
      updatedButtonRow.addComponents(
        new ButtonBuilder()
          .setCustomId("session-spot-leave")
          .setLabel("Sair")
          .setStyle(ButtonStyle.Danger),
      );
    }
  });

  return updatedButtonRow;
};

const handleSessionSpotLeaveButtonInteraction = async (
  input: {
    collectorInteraction: ButtonInteraction;
    sessionMessageActionRow: ActionRowBuilder<ButtonBuilder>;
    session: SessionEntity;
  },
) => {
  const {
    collectorInteraction,
    session,
  } = input;

  const sessionParticipants = await SessionParticipantModel.find({
    sessionId: session.sessionId,
  });

  if (
    !sessionParticipants.some((part) =>
      part.participantId === collectorInteraction.user.id
    )
  ) {
    await collectorInteraction.followUp({
      content: "Você não faz parte desta sessão.",
      flags: "Ephemeral",
    });
    return;
  }

  if (
    collectorInteraction.user.id ===
      sessionParticipants.find((part) => part.role === "owner")?.participantId
  ) {
    await collectorInteraction.followUp({
      content:
        "O criador da sessão não pode sair. Por favor, encerre a sessão.",
      flags: "Ephemeral",
    });
    return;
  }

  await SessionParticipantModel.remove({
    sessionId: session.sessionId,
    participantId: collectorInteraction.user.id,
  });

  const sessionMembers = sessionParticipants.filter((part) =>
    part.participantId !== collectorInteraction.user.id &&
    part.role === "member"
  );
  const updatedButtonRow = getUpdatedButtonRow({ ...input, sessionMembers });

  await collectorInteraction.editReply({ components: [updatedButtonRow] });
};

const collectListener = async (input: {
  collectorInteraction: ButtonInteraction;
  commandInteraction: CommandInteraction;
  sessionMessageActionRow: ActionRowBuilder<ButtonBuilder>;
  sessionId: string;
}): Promise<void> => {
  const {
    commandInteraction,
    collectorInteraction,
    sessionMessageActionRow,
  } = input;

  const [formingSessions, ownerSessions] = await Promise.all([
    SessionModel.find({ status: "FORMING" }, {
      index: "gs1",
    }),
    SessionParticipantModel.find({
      participantId: commandInteraction.user.id,
    }, { index: "gs1" }),
  ]);

  const session = formingSessions.find((formingSession) =>
    ownerSessions.some((ownerSession) =>
      ownerSession.sessionId === formingSession.sessionId
    )
  );

  if (!session) {
    await collectorInteraction.followUp({
      content: "Esta sessão não está mais aceitando participantes.",
      flags: "Ephemeral",
    });
    return;
  }

  if (collectorInteraction.customId === "session-spot-leave") {
    return handleSessionSpotLeaveButtonInteraction({
      collectorInteraction,
      session,
      sessionMessageActionRow,
    });
  }

  const sessionParticipants = await SessionParticipantModel.find({
    sessionId: session.sessionId,
  });

  if (
    sessionParticipants.some((part) =>
      part.participantId === collectorInteraction.user.id
    )
  ) {
    await collectorInteraction.followUp({
      content: "Você já faz parte desta sessão.",
      flags: "Ephemeral",
    });
    return;
  }

  if (sessionParticipants.length >= 4) {
    await collectorInteraction.followUp({
      content: "Esta sessão já está cheia",
      flags: "Ephemeral",
    });
    return;
  }

  const newParticipant = await SessionParticipantModel.create({
    sessionId: session.sessionId,
    participantId: collectorInteraction.user.id,
    role: "member",
    username: collectorInteraction.user.username,
  });

  sessionParticipants.push(newParticipant);

  const sessionMembers = sessionParticipants.filter((part) =>
    part.role === "member"
  );

  const updatedButtonRow = getUpdatedButtonRow({
    sessionMembers,
    sessionMessageActionRow: sessionMessageActionRow,
    collectorInteraction,
  });

  await collectorInteraction.editReply({ components: [updatedButtonRow] });
};

const endListener = async (input: {
  commandInteraction: CommandInteraction;
  sessionMessage: Message;
  sessionMessageActionRow: ActionRowBuilder<ButtonBuilder>;
}): Promise<void> => {
  const { commandInteraction, sessionMessage, sessionMessageActionRow } = input;

  const disabledButtons = sessionMessageActionRow.components.map((button) =>
    button.setDisabled(true)
  );

  await commandInteraction.editReply({
    content: sessionMessage.content +
      "\n\n**O período para formação e início de sessão expirou.**",
    components: [
      new ActionRowBuilder<ButtonBuilder>().setComponents(disabledButtons),
    ],
  });
};

export { collectListener, endListener };
