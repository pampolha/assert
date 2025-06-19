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
  dramatis_personae_jogaveis: Array<{
    nome_completo_personagem: string;
    cargo_funcao_detalhado: string;
    background_e_personalidade_narrativa: string;
    objetivos_pessoais_na_situacao: string[];
    informacao_privilegiada_ou_segredo_narrativo: string;
  }>;
  entidades_interativas_nao_jogaveis_ia: Array<{
    nome_completo_npc: string;
    cargo_funcao_npc_e_relacao_com_equipe: string;
    perfil_psicologico_e_historico_npc_narrativa: string;
    modus_operandi_comunicacional_npc: string;
    gatilho_e_mensagem_de_entrada_em_cena_npc: string;
    prompt_diretriz_para_ia_roleplay_npc: string;
  }>;
  missao_principal_da_equipe_na_simulacao: string;
  arcos_de_decisao_e_consequencias_potenciais: string[];
  soft_skills_centrais_em_jogo: string[];
  artefatos_ou_recursos_disponiveis_no_cenario: string[];
}

export const scenarioJSONSchema = {
  type: "object",
  properties: {
    titulo_cenario: { type: "string" },
    lore_do_mundo_corporativo: {
      type: "object",
      properties: {
        nome_empresa: { type: "string" },
        cultura_organizacional_e_valores: { type: "string" },
        historico_relevante_empresa: { type: "string" },
        projeto_central_nome_e_visao: { type: "string" },
        estado_atual_do_projeto_e_desafios: { type: "string" },
      },
      required: [
        "nome_empresa",
        "cultura_organizacional_e_valores",
        "historico_relevante_empresa",
        "projeto_central_nome_e_visao",
        "estado_atual_do_projeto_e_desafios",
      ],
    },
    o_incidente_critico_narrativa_detalhada: { type: "string" },
    dramatis_personae_jogaveis: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome_completo_personagem: { type: "string" },
          cargo_funcao_detalhado: { type: "string" },
          background_e_personalidade_narrativa: { type: "string" },
          objetivos_pessoais_na_situacao: {
            type: "array",
            items: { type: "string" },
          },
          informacao_privilegiada_ou_segredo_narrativo: { type: "string" },
        },
        required: [
          "nome_completo_personagem",
          "cargo_funcao_detalhado",
          "background_e_personalidade_narrativa",
          "objetivos_pessoais_na_situacao",
          "informacao_privilegiada_ou_segredo_narrativo",
        ],
      },
    },
    entidades_interativas_nao_jogaveis_ia: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome_completo_npc: { type: "string" },
          cargo_funcao_npc_e_relacao_com_equipe: { type: "string" },
          perfil_psicologico_e_historico_npc_narrativa: { type: "string" },
          modus_operandi_comunicacional_npc: { type: "string" },
          gatilho_e_mensagem_de_entrada_em_cena_npc: { type: "string" },
          prompt_diretriz_para_ia_roleplay_npc: { type: "string" },
        },
        required: [
          "nome_completo_npc",
          "cargo_funcao_npc_e_relacao_com_equipe",
          "perfil_psicologico_e_historico_npc_narrativa",
          "modus_operandi_comunicacional_npc",
          "gatilho_e_mensagem_de_entrada_em_cena_npc",
          "prompt_diretriz_para_ia_roleplay_npc",
        ],
      },
    },
    missao_principal_da_equipe_na_simulacao: { type: "string" },
    arcos_de_decisao_e_consequencias_potenciais: {
      type: "array",
      items: { type: "string" },
    },
    soft_skills_centrais_em_jogo: {
      type: "array",
      items: { type: "string" },
    },
    artefatos_ou_recursos_disponiveis_no_cenario: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "titulo_cenario",
    "lore_do_mundo_corporativo",
    "o_incidente_critico_narrativa_detalhada",
    "dramatis_personae_jogaveis",
    "entidades_interativas_nao_jogaveis_ia",
    "missao_principal_da_equipe_na_simulacao",
    "arcos_de_decisao_e_consequencias_potenciais",
    "soft_skills_centrais_em_jogo",
    "artefatos_ou_recursos_disponiveis_no_cenario",
  ],
} as const;
