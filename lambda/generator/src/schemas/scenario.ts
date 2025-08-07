import { z } from "zod";

export const scenarioSchema = z.object({
  titulo_cenario: z.string(),
  lore_do_mundo_corporativo: z.object({
    nome_empresa: z.string(),
    cultura_organizacional_e_valores: z.string(),
    historico_relevante_empresa: z.string(),
    projeto_central_nome_e_visao: z.string(),
    estado_atual_do_projeto_e_desafios: z.string(),
  }),
  o_incidente_critico_narrativa_detalhada: z.string(),
  dramatis_personae_jogaveis: z.array(
    z.object({
      nome_completo_personagem: z.string(),
      cargo_funcao_detalhado: z.string(),
      background_e_personalidade_narrativa: z.string(),
      objetivos_pessoais_na_situacao: z.array(z.string()),
      informacao_privilegiada_ou_segredo_narrativo: z.string(),
    }),
  ),
  entidades_interativas_nao_jogaveis_ia: z.array(
    z.object({
      nome_completo_npc: z.string(),
      cargo_funcao_npc_e_relacao_com_equipe: z.string(),
      perfil_psicologico_e_historico_npc_narrativa: z.string(),
      modus_operandi_comunicacional_npc: z.string(),
      gatilho_e_mensagem_de_entrada_em_cena_npc: z.string(),
      prompt_diretriz_para_ia_roleplay_npc: z.string(),
    }),
  ),
  missao_principal_da_equipe_na_simulacao: z.string(),
  arcos_de_decisao_e_consequencias_potenciais: z.array(z.string()),
  soft_skills_centrais_em_jogo: z.array(z.string()),
  artefatos_ou_recursos_disponiveis_no_cenario: z.array(z.string()),
});
