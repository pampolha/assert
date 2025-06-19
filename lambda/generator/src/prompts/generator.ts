const prompt = `1. OBJETIVO PRINCIPAL:
Gerar um cenário de simulação de trabalho em equipe de TI remoto que seja uma experiência narrativa profundamente imersiva e memorável, quase como um capítulo de um romance corporativo interativo. Cada elemento – ambiente, projeto, personagens (jogáveis e NPCs IA), conflitos e informações – deve ser tecido com detalhes ricos, histórias de fundo, motivações complexas e personalidades vívidas, visando a prática de soft skills em um contexto que prenda a atenção e estimule o roleplay estratégico.

2. FILOSOFIA DE DESIGN PARA O LLM:
Não se contente com descrições superficiais. Dê vida a cada detalhe. Se um projeto está atrasado, por que exatamente? Quais foram as promessas feitas? Quem são os stakeholders e o que os motiva? Se um personagem tem uma certa personalidade, qual evento em seu passado (profissional ou mesmo um vislumbre pessoal) a moldou? O objetivo é que os participantes sintam que estão entrando em um mundo com história e consequências reais.

3. FORMATO DA SAÍDA (JSON EXTENSO E DETALHADO):
    titulo_cenario: String, um título representando a situação e seu maior problema-questão.

    lore_do_mundo_corporativo:

        nome_empresa: String, nome da empresa (ex: "Nexus Dynamics", "Innovatech Horizons").

        cultura_organizacional_e_valores: String, descrição detalhada da cultura da empresa – é inovadora e caótica? Tradicional e hierárquica? Quais são seus valores declarados e os não declarados?.

        historico_relevante_empresa: String, breve histórico da empresa, focando em eventos passados que moldam o presente e a mentalidade dos funcionários (ex: uma fusão recente, um produto de grande sucesso anterior, uma crise superada).

        projeto_central_nome_e_visao: String, nome do projeto principal em que a equipe está trabalhando (ex: "Projeto Fênix", "Plataforma Quantum Leap") e sua visão ambiciosa.

        estado_atual_do_projeto_e_desafios: String, descrição detalhada do estágio atual do projeto, os desafios enfrentados, a pressão existente e as expectativas (stakeholders, mercado).

    o_incidente_critico_narrativa_detalhada: String, uma narrativa vívida e detalhada do evento específico que desencadeia a simulação. Descreva a cena, as emoções, as primeiras reações, as implicações imediatas. Use nomes, horários, e detalhes sensoriais se possível (ex: "O alerta vermelho piscou na tela de monitoramento às 17:53, exatamente sete minutos antes da demo crucial para o investidor anjo, Sr. Valdemar Siqueira...").

    dramatis_personae_jogaveis (Personagens dos Participantes): Array de Objetos (4 objetos exatamente), cada um contendo:

        nome_completo_personagem: String.

        cargo_funcao_detalhado: String (ex: "Arquiteta de Soluções Cloud Sênior, responsável pela infraestrutura do Projeto Fênix").

        background_e_personalidade_narrativa: String. Detalhe sua história na empresa, suas principais conquistas, seus medos, suas ambições, seu estilo de comunicação, seus relacionamentos chave com outros personagens (jogáveis ou NPCs), e um "traço marcante" (ex: "conhecida por sua calma analítica sob pressão, mas secretamente preocupada com a estabilidade da nova arquitetura que propôs").

        objetivos_pessoais_na_situacao: Array de Strings (objetivos que o personagem busca alcançar, alguns podem ser públicos, outros mais velados).

        informacao_privilegiada_ou_segredo_narrativo: String. Uma peça crucial de informação, uma perspectiva única, um dilema moral ou um segredo que apenas este personagem conhece e que pode (ou não) revelar, impactando significativamente a simulação. Deve ser uma "bomba" em potencial ou uma chave para a solução.

    entidades_interativas_nao_jogaveis_ia (NPCs): Array de Objetos (pelo menos 1 objeto), cada um contendo:

        nome_completo_npc: String.

        cargo_funcao_npc_e_relacao_com_equipe: String.

        perfil_psicologico_e_historico_npc_narrativa: String. Uma biografia concisa, mas rica, que explique suas motivações, seu estilo de liderança ou interação, seus sucessos e fracassos passados, seus gatilhos emocionais, seus valores, e como ele(a) chegou à posição atual. Por que ele é "mal-humorado"? Houve uma traição no passado? Uma pressão familiar?

        modus_operandi_comunicacional_npc: String (como ele(a) tipicamente se comunica – direto, passivo-agressivo, manipulador, inspirador etc.).

        gatilho_e_mensagem_de_entrada_em_cena_npc: String (mensagem textual exata que este NPC enviará em um momento específico, preferencialmente no início, para definir o tom. Ex: "A mensagem do CEO, Sr. Ricardo 'O Carrasco' Bastos, pingou no canal geral às 09:02 da manhã: 'Equipe, acabei de receber o relatório de performance do trimestre. Decepcionante é um eufemismo. Quero uma reunião com os líderes de projeto às 10:00. E venham preparados para justificar cada centavo e cada hora gasta.'").

        prompt_diretriz_para_ia_roleplay_npc: String (Instrução detalhada para o LLM que irá simular este NPC. Deve incluir: tom de voz, objetivos principais na interação, frases típicas, como reage a diferentes abordagens – ex: "Você é o CEO Ricardo Bastos. Mantenha um tom cético e impaciente. Questione duramente qualquer justificativa vaga. Exija dados e soluções concretas. Se a equipe demonstrar proatividade e apresentar um plano sólido e convincente, você pode suavizar um pouco o tom, mas nunca perca a postura de autoridade máxima. Seu principal medo é parecer fraco perante o conselho.").

    missao_principal_da_equipe_na_simulacao: String, o grande objetivo que a equipe precisa alcançar para "vencer" ou resolver satisfatoriamente a crise apresentada.

    arcos_de_decisao_e_consequencias_potenciais: Array de Strings, sugerindo pontos de decisão chave e possíveis ramificações narrativas (ex: "Se a equipe decidir confrontar diretamente o CEO sobre sua gestão, o risco é alto, mas a recompensa pode ser uma mudança cultural. Se optarem por uma solução paliativa, o problema pode retornar pior.").

    soft_skills_centrais_em_jogo: Array de Strings (as principais soft skills que serão testadas e praticadas).

    artefatos_ou_recursos_disponiveis_no_cenario: Array de Strings (ex: "Relatório de performance do último trimestre", "E-mail do cliente insatisfeito", "Documentação técnica desatualizada do Módulo X"). Esses podem ser "entregues" pelo bot durante a simulação.

4. RESTRIÇÕES PARA O LLM:

    Profundidade é a Chave: Priorize detalhes narrativos, motivações e história de fundo em detrimento da brevidade.

    Nomes Significativos: Use nomes completos e, se apropriado, apelidos ou traços que adicionem cor aos personagens.

    Conflito e Tensão: Crie situações com tensão dramática genuína e dilemas morais ou profissionais.

    Consistência Interna: Garanta que os backgrounds, personalidades e segredos sejam consistentes e façam sentido dentro da narrativa maior.

    Linguagem Imersiva: Use uma linguagem que transporte o leitor/participante para dentro da situação.

    Não Forneça Soluções Explícitas: A equipe deve descobrir o caminho.

    Idioma: Português do Brasil.

5. INSTRUÇÃO FINAL PARA O LLM:
Sua missão é criar um microcosmo corporativo vibrante e desafiador. Use sua capacidade criativa ao máximo para gerar um cenário que teste soft skills com uma história convincente e envolvente. Surpreenda-me com a profundidade e a riqueza dos detalhes.` as const;

export default prompt;
