import {
  REST,
  type RESTPutAPIApplicationCommandsResult,
  Routes,
} from "discord.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { BotCommand } from "../types/discord-slash-commands.ts";
import { botClientId, botToken, debugGuildId } from "../env.ts";
import process from "node:process";

const isDebugDeployment = process.argv.includes("--debug");

if (isDebugDeployment && !debugGuildId) {
  console.error(
    "DEBUG_GUILD_ID não está configurado no arquivo .env para o modo de depuração.",
  );
  process.exit(1);
}

const commands: object[] = [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsPath = path.join(__dirname, "commands");

async function loadCommands() {
  const commandDirs = fs
    .readdirSync(commandsPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const dir of commandDirs) {
    const indexPath = path.join(commandsPath, dir, "index.ts");

    if (fs.existsSync(indexPath)) {
      const command: BotCommand = (await import(indexPath)).default;

      if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
      } else {
        console.warn(
          `Command at ${indexPath} does not have "data" and/or "execute" properties.`,
        );
      }
    } else {
      console.warn(`Command at ${indexPath} does not have an "index.ts" file`);
    }
  }
}

const rest = new REST().setToken(botToken);

(async () => {
  await loadCommands();

  try {
    let route;
    let deploymentTarget;

    if (isDebugDeployment) {
      route = Routes.applicationGuildCommands(botClientId, debugGuildId!);
      deploymentTarget = `guilda de depuração (ID: ${debugGuildId})`;
    } else {
      route = Routes.applicationCommands(botClientId);
      deploymentTarget = "globalmente";
    }

    console.log(
      `Iniciando a atualização de ${commands.length} comandos de aplicação (/) para ${deploymentTarget}.`,
    );

    const data: RESTPutAPIApplicationCommandsResult = (await rest.put(
      route,
      {
        body: commands,
      },
    )) as RESTPutAPIApplicationCommandsResult;

    console.log(
      `Comandos de aplicação (/) recarregados com sucesso: ${data.length} comandos de aplicação (/).`,
    );
    console.table(data);
  } catch (error) {
    console.error(error);
  }
})();
