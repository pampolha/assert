import { existsSync } from "node:fs";
import path from "node:path";
import { type BotCommand, client } from "assert-bot";
import {
  REST,
  type RESTPutAPIApplicationCommandsResult,
  Routes,
} from "discord.js";
import { botClientId, botToken } from "../env.ts";

export const loadCommands = async (commandsPath: string) => {
  const commandDirs = Deno
    .readDirSync(commandsPath)
    .filter((dirent) => dirent.isDirectory)
    .map((dirent) => dirent.name);

  await Promise.all(commandDirs.map(async (dir) => {
    const indexPath = path.join(commandsPath, dir, "index.ts");

    if (existsSync(indexPath)) {
      const command: BotCommand = (await import(indexPath)).default;

      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(
          `Command at ${indexPath} does not have "data" and/or "execute" properties.`,
        );
      }
    } else {
      console.warn(
        `Command at ${indexPath} does not have an "index.ts" file`,
      );
    }
  }));

  const rest = new REST().setToken(botToken);

  const route = Routes.applicationCommands(botClientId);

  const data: RESTPutAPIApplicationCommandsResult = (await rest.put(
    route,
    {
      body: client.commands.map((c) => c.data.toJSON()),
    },
  )) as RESTPutAPIApplicationCommandsResult;

  console.table(data);
};
