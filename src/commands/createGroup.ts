import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { BotCommand } from "../types/discord-slash-commands.js";
import axios from "axios";
import { Scenario } from "../../shared/schemas.js";
import { SessionData } from "../types/session.js";
import { generatorApiGatewayUrl } from "../../shared/env.js";

function formatScenarioData(scenario: Scenario): string {
  let formattedText = `## 📜 Cenário Gerado: ${scenario.titulo_cenario}\n\n`;

  formattedText += `### 🏢 Lore do Mundo Corporativo\n`;
  formattedText +=
    `**Empresa:** ${scenario.lore_do_mundo_corporativo.nome_empresa}\n`;
  formattedText +=
    `**Cultura Organizacional e Valores:** ${scenario.lore_do_mundo_corporativo.cultura_organizacional_e_valores}\n`;
  formattedText +=
    `**Histórico Relevante da Empresa:** ${scenario.lore_do_mundo_corporativo.historico_relevante_empresa}\n`;
  formattedText +=
    `**Projeto Principal:** ${scenario.lore_do_mundo_corporativo.projeto_central_nome_e_visao}\n`;
  formattedText +=
    `**Estado Atual do Projeto e Desafios:** ${scenario.lore_do_mundo_corporativo.estado_atual_do_projeto_e_desafios}\n\n`;

  formattedText += `### 💥 O Incidente Crítico\n`;
  formattedText += `${scenario.o_incidente_critico_narrativa_detalhada}\n\n`;

  formattedText += `### 🎭 Dramatis Personae Jogáveis\n`;
  scenario.dramatis_personae_jogaveis.forEach((personagem, index) => {
    formattedText += `**${
      index + 1
    }. ${personagem.nome_completo_personagem}**\n`;
    formattedText +=
      `   - **Cargo/Função:** ${personagem.cargo_funcao_detalhado}\n`;
    formattedText +=
      `   - **Background e Personalidade:** ${personagem.background_e_personalidade_narrativa}\n`;
    formattedText += `   - **Objetivos Pessoais:** ${
      personagem.objetivos_pessoais_na_situacao.join(", ")
    }\n`;
    formattedText +=
      `   - **Informação Privilegiada/Segredo:** ${personagem.informacao_privilegiada_ou_segredo_narrativo}\n\n`;
  });

  formattedText += `### 🤖 Entidades Interativas Não Jogáveis (IA)\n`;
  scenario.entidades_interativas_nao_jogaveis_ia.forEach((npc, index) => {
    formattedText += `**${index + 1}. ${npc.nome_completo_npc}**\n`;
    formattedText +=
      `   - **Cargo/Função e Relação:** ${npc.cargo_funcao_npc_e_relacao_com_equipe}\n`;
    formattedText +=
      `   - **Perfil Psicológico e Histórico:** ${npc.perfil_psicologico_e_historico_npc_narrativa}\n`;
    formattedText +=
      `   - **Modus Operandi Comunicacional:** ${npc.modus_operandi_comunicacional_npc}\n`;
    formattedText +=
      `   - **Gatilho e Mensagem de Entrada:** ${npc.gatilho_e_mensagem_de_entrada_em_cena_npc}\n`;
    formattedText +=
      `   - **Prompt Diretriz para IA:** ${npc.prompt_diretriz_para_ia_roleplay_npc}\n\n`;
  });

  formattedText += `### 🎯 Missão Principal da Equipe\n`;
  formattedText += `${scenario.missao_principal_da_equipe_na_simulacao}\n\n`;

  formattedText += `### ⚖️ Arcos de Decisão e Consequências Potenciais\n`;
  scenario.arcos_de_decisao_e_consequencias_potenciais.forEach(
    (arco, index) => {
      formattedText += `   - ${index + 1}. ${arco}\n`;
    },
  );
  formattedText += `\n`;

  formattedText += `### 🧠 Soft Skills Centrais em Jogo\n`;
  scenario.soft_skills_centrais_em_jogo.forEach((skill, index) => {
    formattedText += `   - ${index + 1}. ${skill}\n`;
  });
  formattedText += `\n`;

  formattedText += `### 🛠️ Artefatos ou Recursos Disponíveis\n`;
  scenario.artefatos_ou_recursos_disponiveis_no_cenario.forEach(
    (artefato, index) => {
      formattedText += `   - ${index + 1}. ${artefato}\n`;
    },
  );
  formattedText += `\n`;

  return formattedText;
}

async function sendLongMessage(channel: TextChannel, content: string) {
  const MAX_LENGTH = 1900;

  if (content.length <= MAX_LENGTH) {
    await channel.send(content);
    return;
  }

  const chunks: string[] = [];
  let currentChunk = "";
  const paragraphs = content.split("\n");

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph + "\n").length > MAX_LENGTH) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }
      currentChunk = "";

      let tempParagraph = paragraph;
      while (tempParagraph.length > MAX_LENGTH) {
        chunks.push(tempParagraph.substring(0, MAX_LENGTH));
        tempParagraph = tempParagraph.substring(MAX_LENGTH);
      }
      currentChunk += tempParagraph + "\n";
    } else {
      currentChunk += paragraph + "\n";
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  for (const chunk of chunks) {
    if (chunk.trim().length > 0) {
      await channel.send(chunk);
    }
  }
}

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("criar-grupo")
    .setDescription("Gera um cenário e inicia uma nova sessão."),

  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "Este comando só pode ser usado em um servidor (guilda).",
        ephemeral: true,
      });
      return;
    }

    if (!generatorApiGatewayUrl) {
      await interaction.reply({
        content:
          "A URL do API Gateway não está configurada. Por favor, contate um administrador.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    let scenarioData: Scenario;
    try {
      const response = await axios.post<Scenario>(generatorApiGatewayUrl, {
        action: "generateScenario",
      });
      if (response.status === 200 && response.data) {
        scenarioData = response.data;
      } else {
        await interaction.followUp({
          content: `Erro ao gerar cenário: ${response.status} - ${
            response.statusText || "Resposta inesperada."
          }`,
          ephemeral: true,
        });
        return;
      }
    } catch (error) {
      console.error(
        "Erro ao conectar com API Gateway para gerar cenário:",
        error,
      );
      await interaction.followUp({
        content:
          "Ocorreu um erro ao tentar gerar o cenário. Por favor, tente novamente mais tarde.",
        ephemeral: true,
      });
      return;
    }

    const scenarioTitle = scenarioData.titulo_cenario || "Cenário de Simulação";

    const baseChannelName = `sessao-${interaction.user.username}`.toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    let category, textChannel, voiceChannel;

    try {
      category = await interaction.guild.channels.create({
        name: `Sessão de Simulação - ${interaction.user.username}`,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.client.user!.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.ManageChannels,
            ],
          },
        ],
        reason: `Nova sessão de simulação para ${interaction.user.username}`,
      });

      textChannel = await interaction.guild.channels.create({
        name: `${baseChannelName}-chat`,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
          {
            id: interaction.client.user!.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
        topic: scenarioTitle,
        reason: `Canal de texto para a sessão de ${interaction.user.username}`,
      });

      voiceChannel = await interaction.guild.channels.create({
        name: `${baseChannelName}-voz`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
            ],
          },
          {
            id: interaction.client.user!.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
            ],
          },
        ],
        reason: `Canal de voz para a sessão de ${interaction.user.username}`,
      });

      await textChannel.send(
        `Bem-vindo(a) à sua sessão de simulação, ${interaction.user}!\n\n` +
          `Este é o canal de texto privado para a sua simulação. O canal de voz é ${voiceChannel}.`,
      );

      const sessionData: SessionData = {
        scenario: scenarioData,
        textChannelId: textChannel.id,
        voiceChannelId: voiceChannel.id,
        categoryId: category.id,
        ownerId: interaction.user.id,
      };

      interaction.client.activeSessions.set(textChannel.id, sessionData);

      const fullScenarioText = formatScenarioData(scenarioData);
      await sendLongMessage(textChannel, fullScenarioText);

      await interaction.followUp({
        content:
          `Sua sessão de simulação foi iniciada! Você pode encontrar seus canais aqui: ${textChannel} (texto) e ${voiceChannel} (voz).`,
        ephemeral: true,
      });

      console.log(
        `Sessão iniciada. Categoria: ${category.id}, Texto: ${textChannel.id}, Voz: ${voiceChannel.id}, Cenário: ${scenarioData.titulo_cenario}`,
      );
    } catch (channelError) {
      console.error("Erro ao criar canais ou enviar mensagem:", channelError);
      await interaction.followUp({
        content:
          "Ocorreu um erro ao tentar criar os canais da simulação. Por favor, verifique as permissões do bot e tente novamente.",
        ephemeral: true,
      });
      if (category) {
        try {
          await category.delete("Erro na criação de canais da sessão");
        } catch (cleanupError) {
          console.error(
            "Erro ao tentar deletar categoria após falha:",
            cleanupError,
          );
        }
      }
    }
  },
};

export default command;
