import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../types/discord-slash-commands.ts";
import axios from "axios";
import { generatorApiGatewayUrl, myUserId } from "../../../shared/env.ts";
import { ScenarioModel } from "../../../shared/models.ts";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("gerar-cenario")
    .setDescription(
      "Gera um novo cenário de simulação e o salva no banco de dados.",
    ),

  async execute(interaction) {
    if (interaction.user.id !== myUserId) {
      await interaction.reply({
        content:
          'Este comando só pode ser usado por um administrador. Talvez você queira usar "criar-grupo"?',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const response = await axios.post(
        generatorApiGatewayUrl,
        { action: "generateScenario" },
        { timeout: 60000 },
      );

      if (response.status !== 200 || !response.data) {
        throw new Error("Falha na resposta da API de geração");
      }

      const scenarioData = typeof response.data === "string"
        ? JSON.parse(response.data)
        : response.data;

      const scenarioId = crypto.randomUUID();

      await ScenarioModel.create({
        scenarioId,
        ...scenarioData,
      });

      await interaction.followUp({
        content:
          `Cenário "${scenarioData.titulo_cenario}" gerado e salvo com sucesso! ID: ${scenarioId}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Erro ao gerar cenário:", error);
      await interaction.followUp({
        content:
          "Ocorreu um erro ao gerar o cenário. Por favor, tente novamente.",
        ephemeral: true,
      });
    }
  },
};

export default command;
