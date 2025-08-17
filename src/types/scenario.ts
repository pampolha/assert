export interface Scenario {
  titulo_cenario: string;
  lore_do_mundo_corporativo: {
    nome_empresa: string;
    cultura_organizacional_e_valores: string;
    historico_relevante_empresa: string;
    projeto_central_nome_e_visao: string;
    estado_atual_do_projeto_e_desafios: string;
  };
  o_incidente_critico_narrativa_detalhada: string;
  dramatis_personae_jogaveis: {
    nome_completo_personagem: string;
    cargo_funcao_detalhado: string;
    background_e_personalidade_narrativa: string;
    objetivos_pessoais_na_situacao: string[];
    informacao_privilegiada_ou_segredo_narrativo: string;
  }[];
  entidades_interativas_nao_jogaveis_ia: {
    nome_completo_npc: string;
    cargo_funcao_npc_e_relacao_com_equipe: string;
    perfil_psicologico_e_historico_npc_narrativa: string;
    modus_operandi_comunicacional_npc: string;
    gatilho_e_mensagem_de_entrada_em_cena_npc: string;
    prompt_diretriz_para_ia_roleplay_npc: string;
  }[];
  missao_principal_da_equipe_na_simulacao: string;
  arcos_de_decisao_e_consequencias_potenciais: string[];
  soft_skills_centrais_em_jogo: string[];
  artefatos_ou_recursos_disponiveis_no_cenario: string[];
}
