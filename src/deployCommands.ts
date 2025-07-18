import {
  REST,
  type RESTPutAPIApplicationCommandsResult,
  Routes,
} from "discord.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import type { BotCommand } from "./types/discord-slash-commands.ts";
import { botClientId, botToken, debugGuildId } from "../shared/env.ts";
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
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    const command: BotCommand = (await import(filePath)).default;

    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
    } else {
      console.warn(
        `[AVISO] O comando em ${filePath} está faltando uma propriedade "data" ou "execute" obrigatória.`,
      );
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
