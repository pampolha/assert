import type { User } from "discord.js";

export const mention = (user: User | string) =>
  `<@${typeof user === "string" ? user : user.id}>`;

export const timestamp = (epoch: number) => `<t:${Math.floor(epoch / 1000)}:F>`;
