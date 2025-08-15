import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { BotCommand } from "./types/discord-slash-commands.ts";
import axios from "axios";
import { botToken, generatorApiGatewayUrl } from "../shared/env.ts";
import {
  type ScenarioEntity,
  ScenarioModel,
  SessionModel,
} from "../shared/models.ts";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageTyping,
  ],
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.User,
  ],
});

client.commands = new Collection<string, BotCommand>();

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
        client.commands.set(command.data.name, command);
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

client.once(Events.ClientReady, async (c) => {
  await loadCommands();
  console.log(`Pronto! Logado como ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(
      `Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`,
    );
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "Ocorreu um erro ao executar este comando!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "Ocorreu um erro ao executar este comando!",
        ephemeral: true,
      });
    }
  }
});

// todo: refactor
// client.on(Events.MessageCreate, async (message) => {
//   if (message.author.bot || !generatorApiGatewayUrl) return;

//   const formingSessions = await SessionModel.find({
//     status: "ACTIVE",
//   }, { index: "gs1" });

//   let sessionData = null;
//   let scenarioData = null;

//   for (const session of formingSessions) {
//     if (session.participants.some((part) => part.id === message.author.id)) {
//       sessionData = session;
//       break;
//     }
//   }

//   if (sessionData) {
//     try {
//       scenarioData = await ScenarioModel.get({
//         scenarioId: sessionData.scenarioId,
//       });
//     } catch (error) {
//       console.error("Failed to get scenario data:", error);
//     }
//   }

//   if (!scenarioData) return;

//   const triggeredNpc = scenarioData.entidades_interativas_nao_jogaveis_ia
//     .find((npc) =>
//       message.content
//         .toLowerCase()
//         .includes("@" + npc.nome_completo_npc.toLowerCase())
//     );

//   if (triggeredNpc) {
//     try {
//       await message.channel.sendTyping();

//       const messageHistory = await message.channel.messages.fetch({
//         limit: 50,
//       });

//       const conversationHistory = messageHistory
//         .reverse()
//         .map((msg) => `${msg.author.username}: ${msg.content}`)
//         .join("\n");

//       const payload = {
//         action: "generateNpcResponse",
//         conversationHistory,
//         npc: {
//           nome_completo_npc: triggeredNpc.nome_completo_npc,
//           cargo_funcao_npc_e_relacao_com_equipe:
//             triggeredNpc.cargo_funcao_npc_e_relacao_com_equipe,
//           perfil_psicologico_e_historico_npc_narrativa:
//             triggeredNpc.perfil_psicologico_e_historico_npc_narrativa,
//           modus_operandi_comunicacional_npc:
//             triggeredNpc.modus_operandi_comunicacional_npc,
//           gatilho_e_mensagem_de_entrada_em_cena_npc:
//             triggeredNpc.gatilho_e_mensagem_de_entrada_em_cena_npc,
//           prompt_diretriz_para_ia_roleplay_npc:
//             triggeredNpc.prompt_diretriz_para_ia_roleplay_npc,
//         } as ScenarioEntity["entidades_interativas_nao_jogaveis_ia"][0],
//       };

//       const response = await axios.post<{ npcResponse: string }>(
//         generatorApiGatewayUrl,
//         payload,
//       );

//       if (response.data && response.data.npcResponse) {
//         await message.channel.send(response.data.npcResponse);
//       }
//     } catch (error) {
//       console.error("Erro ao lidar com a interação do NPC:", error);
//       await message.channel.send(
//         "Ocorreu um erro ao processar a resposta do NPC.",
//       );
//     }
//   }
// });

client.login(botToken);
