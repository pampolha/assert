import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type CommandInteraction,
} from "discord.js";
import type { Message } from "discord.js";
import { type SessionEntity, SessionModel } from "../../../shared/models.ts";

const getUpdatedButtonRow = (
  { session, groupMessageActionRow, collectorInteraction }: {
    collectorInteraction: ButtonInteraction;
    groupMessageActionRow: ActionRowBuilder<ButtonBuilder>;
    session: SessionEntity;
  },
): ActionRowBuilder<ButtonBuilder> => {
  const sessionMembers = session.participants.filter((part) =>
    part.role === "member"
  );

  const updatedButtonRow = new ActionRowBuilder<ButtonBuilder>();
  groupMessageActionRow.components.forEach((_button, i) => {
    const label = sessionMembers.at(i)?.tag;
    const style = label ? ButtonStyle.Success : ButtonStyle.Primary;
    const isDisabled = !!label;

    if (i < groupMessageActionRow.components.length - 1) {
      updatedButtonRow.addComponents(
        new ButtonBuilder()
          .setCustomId(collectorInteraction.customId + i)
          .setLabel(label || "Vaga")
          .setStyle(style)
          .setDisabled(isDisabled),
      );
    } else {
      updatedButtonRow.addComponents(
        new ButtonBuilder()
          .setCustomId("group-spot-leave")
          .setLabel("Sair")
          .setStyle(ButtonStyle.Danger),
      );
    }
  });

  return updatedButtonRow;
};

const handleGroupSpotLeaveButtonInteraction = async (
  input: {
    collectorInteraction: ButtonInteraction;
    groupMessageActionRow: ActionRowBuilder<ButtonBuilder>;
    session: SessionEntity;
  },
) => {
  const {
    collectorInteraction,
    session,
  } = input;

  if (
    !session.participants.some((part) =>
      part.id === collectorInteraction.user.id
    )
  ) {
    await collectorInteraction.reply({
      content: "Você não faz parte deste grupo.",
      ephemeral: true,
    });
    return;
  }

  if (
    collectorInteraction.user.id ===
      session.participants.find((part) => part.role === "owner")?.id
  ) {
    await collectorInteraction.reply({
      content:
        "O criador da sessão não pode sair. Por favor, encerre a sessão.",
      ephemeral: true,
    });
    return;
  }

  session.participants = session.participants.filter((part) =>
    part.id !== collectorInteraction.user.id
  );

  try {
    await SessionModel.update({
      sessionId: session.sessionId,
      participants: session.participants,
    }, { index: "primary" });
  } catch (error) {
    console.error("Failed to update session in DynamoDB:", error);
  }

  const updatedButtonRow = getUpdatedButtonRow(input);

  await collectorInteraction.update({ components: [updatedButtonRow] });
};

const collectListener = async (input: {
  collectorInteraction: ButtonInteraction;
  commandInteraction: CommandInteraction;
  groupMessageActionRow: ActionRowBuilder<ButtonBuilder>;
  sessionId: string;
}): Promise<void> => {
  const {
    commandInteraction,
    collectorInteraction,
    groupMessageActionRow,
  } = input;

  const formingSessions = await SessionModel.find({ status: "FORMING" }, {
    index: "gs1",
  });
  const session = formingSessions.find((session) =>
    session.participants.some((p) => p.id === commandInteraction.user.id)
  );

  if (!session) {
    await collectorInteraction.reply({
      content: "Este grupo não está mais aceitando participantes.",
      ephemeral: true,
    });
    return;
  }

  if (collectorInteraction.customId === "group-spot-leave") {
    return handleGroupSpotLeaveButtonInteraction({
      collectorInteraction,
      session,
      groupMessageActionRow,
    });
  }

  if (
    session.participants.some((part) =>
      part.id === collectorInteraction.user.id
    )
  ) {
    await collectorInteraction.reply({
      content: "Você já faz parte deste grupo.",
      ephemeral: true,
    });
    return;
  }

  if (session.participants.length >= 4) {
    await collectorInteraction.reply({
      content: "Este grupo já está cheio",
      ephemeral: true,
    });
    return;
  }

  session.participants.push({
    id: collectorInteraction.user.id,
    tag: collectorInteraction.user.tag,
    role: "member",
  });

  try {
    await SessionModel.update({
      sessionId: session.sessionId,
      participants: session.participants,
    }, { index: "primary" });
  } catch (error) {
    console.error("Failed to update session in DynamoDB:", error);
  }

  const updatedButtonRow = getUpdatedButtonRow({
    session,
    groupMessageActionRow,
    collectorInteraction,
  });

  await collectorInteraction.update({ components: [updatedButtonRow] });
};

const endListener = async (input: {
  commandInteraction: CommandInteraction;
  groupMessage: Message;
  groupMessageActionRow: ActionRowBuilder<ButtonBuilder>;
}): Promise<void> => {
  const { commandInteraction, groupMessage, groupMessageActionRow } = input;

  const disabledButtons = groupMessageActionRow.components.map((button) =>
    button.setDisabled(true)
  );

  await commandInteraction.editReply({
    content: groupMessage.content +
      "\n\n**O período para formação e início de sessão expirou.**",
    components: [
      new ActionRowBuilder<ButtonBuilder>().setComponents(disabledButtons),
    ],
  });
};

export { collectListener, endListener };
