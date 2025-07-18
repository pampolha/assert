import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "node:url";
import type { BotCommand } from "./types/discord-slash-commands.ts";
import type { SessionData } from "./types/session.ts";
import axios from "axios";
import { botToken, generatorApiGatewayUrl } from "../shared/env.ts";

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
client.activeSessions = new Collection<string, SessionData>();

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
      client.commands.set(command.data.name, command);
    } else {
      console.warn(
        `[AVISO] O comando em ${filePath} está faltando uma propriedade "data" ou "execute" obrigatória.`,
      );
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

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !generatorApiGatewayUrl) return;

  const session = client.activeSessions.get(message.channel.id);
  if (!session) return;

  const triggeredNpc = session.scenario.entidades_interativas_nao_jogaveis_ia
    .find((npc) =>
      message.content
        .toLowerCase()
        .includes("@" + npc.nome_completo_npc.toLowerCase())
    );

  if (triggeredNpc) {
    try {
      await message.channel.sendTyping();

      const messageHistory = await message.channel.messages.fetch({
        limit: 50,
      });

      const conversationHistory = messageHistory
        .reverse()
        .map((msg) => `${msg.author.username}: ${msg.content}`)
        .join("\n");

      const payload = {
        action: "generateNpcResponse",
        conversationHistory,
        npc: {
          nome_completo_npc: triggeredNpc.nome_completo_npc,
          cargo_funcao_npc_e_relacao_com_equipe:
            triggeredNpc.cargo_funcao_npc_e_relacao_com_equipe,
          perfil_psicologico_e_historico_npc_narrativa:
            triggeredNpc.perfil_psicologico_e_historico_npc_narrativa,
          modus_operandi_comunicacional_npc:
            triggeredNpc.modus_operandi_comunicacional_npc,
          gatilho_e_mensagem_de_entrada_em_cena_npc:
            triggeredNpc.gatilho_e_mensagem_de_entrada_em_cena_npc,
          prompt_diretriz_para_ia_roleplay_npc:
            triggeredNpc.prompt_diretriz_para_ia_roleplay_npc,
        },
      };

      const response = await axios.post<{ npcResponse: string }>(
        generatorApiGatewayUrl,
        payload,
      );

      //debug
      console.log({ npcresponse: response.data });

      if (response.data && response.data.npcResponse) {
        await message.channel.send(response.data.npcResponse);
      }
    } catch (error) {
      console.error("Erro ao lidar com a interação do NPC:", error);
      await message.channel.send(
        "Ocorreu um erro ao processar a resposta do NPC.",
      );
    }
  }
});

client.login(botToken);
