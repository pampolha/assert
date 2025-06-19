import { SlashCommandBuilder } from "discord.js";
import { BotCommand } from "../types/discord-slash-commands.js";
import axios from "axios";
import dotenv from "dotenv";
import { Scenario } from "../types/scenario.js";

dotenv.config();

const apiGatewayUrl = process.env.API_GATEWAY_URL;

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("gerar-cenario")
    .setDescription("Gera um novo cenário de simulação de soft skills com IA."),

  async execute(interaction) {
    if (!apiGatewayUrl) {
      await interaction.reply({
        content:
          "A URL do API Gateway não está configurada. Por favor, contate um administrador.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const response = await axios.post<Scenario>(apiGatewayUrl);

      if (response.status === 200 && response.data) {
        const scenarioData = response.data;

        // Use the new consistent property names
        const scenarioTitle = scenarioData.titulo_cenario || "Cenário de Simulação";
        const scenarioDescription = scenarioData.lore_do_mundo_corporativo
          ?.estado_atual_do_projeto_e_desafios ||
          "Nenhuma descrição disponível.";

        let replyContent = `## ${scenarioTitle}\n\n`;
        replyContent +=
          `**Empresa:** ${scenarioData.lore_do_mundo_corporativo.nome_empresa}\n`;
        replyContent +=
          `**Projeto Principal:** ${scenarioData.lore_do_mundo_corporativo.projeto_central_nome_e_visao}\n\n`;
        replyContent += `**Desafio Central:**\n${scenarioDescription}\n\n`;
        replyContent +=
          `Para mais detalhes, por favor, consulte o JSON completo gerado.`;

        await interaction.followUp({
          content: replyContent,
          ephemeral: false,
        });

        const fullJson = JSON.stringify(scenarioData, null, 2);
        if (fullJson.length < 1900) {
          await interaction.followUp({
            content: `\`\`\`json\n${fullJson}\n\`\`\``,
            ephemeral: true,
          });
        } else {
          await interaction.user.send(
            `Seu cenário completo é muito grande para enviar no canal. Aqui está o resumo:\n${replyContent}\n\nO JSON completo foi registrado no sistema.`,
          );
        }
      } else {
        await interaction.followUp({
          content: `Erro ao gerar cenário: ${response.status} - ${
            response.statusText || "Resposta inesperada."
          }`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error("Erro ao conectar com API Gateway:", error);
      await interaction.followUp({
        content:
          "Ocorreu um erro ao tentar gerar o cenário. Por favor, tente novamente mais tarde.",
        ephemeral: true,
      });
    }
  },
};

export default command;
