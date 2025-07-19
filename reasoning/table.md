# Raciocínio: Design de Tabela Única para DynamoDB

## Por que Design de Tabela Única?

Escolhemos o design de tabela única para otimizar:

1. **Eficiência de consultas** - Todos os dados relacionados (sessões, usuários,
   NPCs) podem ser buscados em uma única consulta
2. **Redução de custos** - Menos tabelas significam menor custo operacional
3. **Operações atômicas** - Todos os dados da sessão podem ser atualizados em
   uma única transação
4. **Escalabilidade** - Atende às necessidades de alta demanda de sessões do bot
   do Discord

## Explicação das Principais Decisões de Design

### 1. Particionamento Centrado em Sessões

**Por quê?**

- Sessões são a entidade central do nosso bot do Discord
- PK = `SESSION#<id>` permite acesso direto a todos os dados da sessão
- Evita buscas caras usando pesquisas eficientes por chave

### 2. Sessões de Usuário via GSI

**Por quê?**

- Usuários frequentemente precisam acessar suas sessões ativas
- GSI1 (`USER#<user_id>`) permite listagem eficiente de sessões
- Chave de ordenação `TIMESTAMP#<data>` fornece ordenação cronológica
- Resolve eficientemente o padrão de consulta "sessões por usuário"

### 3. NPCs como Filhos de Sessões

**Por quê?**

- NPCs só existem no contexto das sessões
- PK = `SESSION#<id>`, SK = `NPC#<npc_id>` cria relação 1:N
- Permite buscar todos NPCs de uma sessão em uma única consulta
- Mantém localidade dos dados para melhor desempenho

### 4. Indexação Baseada em Tempo

**Por quê?**

- Sessões têm padrões de acesso naturais baseados em tempo
- Chave de ordenação `TIMESTAMP#<data>` permite consultas por intervalo
- Suporta recursos de "sessões recentes" e "histórico de sessões"
- Funciona com TTL para limpeza automática de sessões

### 5. Filtragem por Status

**Por quê?**

- O bot precisa encontrar rapidamente sessões ativas/inativas
- GSI2 no atributo `Status` fornece filtragem eficiente
- Permite monitorar e gerenciar o ciclo de vida das sessões
- Complementa o TTL para expiração de sessões

### 6. Melhorias Recentes

**Por que adicionamos UserID?**

- Consultas diretas de sessões de usuário sem precisar de GSI
- Simplifica o padrão "obter sessão ativa do usuário"
- Reduz latência para operações críticas do usuário

**Por que adicionamos SessionID aos NPCs?**

- Fornece contexto de sessão para interações com NPCs
- Permite consultas eficientes de "NPCs por sessão"
- Suporta o tratamento de respostas de NPCs no bot do Discord

**Por que GSIs adicionais?**

- GSI3 permite consultas eficientes de sessões de usuário
- GSI2PK/SK fornece opções flexíveis de indexação
- Equilibra custos de leitura/escrita para vários padrões de acesso

## Compensações Consideradas

1. **Desnormalização vs Normalização**
   - Escolhemos desnormalização para desempenho de leitura
   - Aceitamos sobrecarga de escrita para melhor eficiência de consulta

2. **Sobrecarga de Índices**
   - Adicionamos GSIs para padrões de consulta críticos
   - Limitamos a índices essenciais para controlar custos

3. **Nomenclatura de Atributos**
   - Usamos nomes descritivos em vez de códigos curtos
   - Priorizamos legibilidade apesar do custo de armazenamento
