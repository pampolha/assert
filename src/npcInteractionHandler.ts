import type { Message } from "discord.js";
import axios from "axios";
import { generatorApiGatewayUrl } from "../shared/env.ts";
import {
  type ScenarioEntity,
  ScenarioModel,
  SessionChannelModel,
  SessionModel,
} from "../shared/models.ts";
import type { OmitPartialGroupDMChannel } from "discord.js";

export const handleNpcMention = async (
  message: OmitPartialGroupDMChannel<Message>,
) => {
  const sessionTextChannel = await SessionChannelModel.get({
    channelId: message.channel.id,
    type: "textChannel",
  }, { index: "gs1" });

  if (!sessionTextChannel) return;

  const session = await SessionModel.get({
    sessionId: sessionTextChannel.sessionId,
    status: "ACTIVE",
  }, { index: "primary" });

  if (!session) {
    throw new Error(
      `Unexpected error: could not find the session entity that the textChannel entity points to: ${{
        sessionTextChannel,
      }}`,
    );
  }

  const scenario = await ScenarioModel.get({ scenarioId: session.scenarioId }, {
    index: "primary",
  });

  if (!scenario) {
    throw new Error(
      `Unexpected error: could not find the scenario entity that the session entity points to: ${{
        session,
      }}`,
    );
  }

  const triggeredNpc = scenario.entidades_interativas_nao_jogaveis_ia
    .find((npc) =>
      message.content
        .toLowerCase()
        .includes("@" + npc.nome_completo_npc.toLowerCase().split(" ")[0])
    );

  if (triggeredNpc) {
    try {
      await message.channel.sendTyping();

      const messageHistory = await message.channel.messages.fetch();

      const conversationHistory = messageHistory
        .reverse()
        .map((msg) => `${msg.author.username}: ${msg.content}`)
        .join("\n");

      const payload: {
        action: string;
        conversationHistory: string;
        npc: ScenarioEntity["entidades_interativas_nao_jogaveis_ia"][0];
      } = {
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
};
