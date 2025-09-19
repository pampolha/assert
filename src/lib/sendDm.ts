import {
  DiscordAPIError,
  type Message,
  type MessageCreateOptions,
  type TextChannel,
  type User,
} from "discord.js";
import { mention } from "./format.ts";
import { client } from "assert-bot";

export const tryDm = async (
  user: User | string,
  content: string | MessageCreateOptions,
  fallbackChannel: TextChannel,
): Promise<[boolean, Message]> => {
  try {
    const resolvedUser = typeof user === "string"
      ? await client.users.fetch(user)
      : user;
    const dm = await resolvedUser.createDM();
    const msg = await dm.send(content);
    return [true, msg];
  } catch (error) {
    if (error instanceof DiscordAPIError) {
      const msg = await fallbackChannel.send(
        `${
          mention(user)
        }, não foi possível enviar uma mensagem privada a você. Verifique se você permite mensagens de membros do servidor nas configurações de privacidade.`,
      );
      return [false, msg];
    } else {
      throw error;
    }
  }
};
