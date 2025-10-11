# Assert

Um bot de Discord para simulações de equipes de TI em cenários corporativos
intensos, focado em desenvolver habilidades de comunicação assertiva.

## Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Comandos Disponíveis](#comandos-disponíveis)
- [Configuração](#configuração)
  - [Variáveis de Ambiente](#variáveis-de-ambiente)
  - [Infraestrutura](#infraestrutura)
- [Instalação e Uso](#instalação-e-uso)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação Local](#instalação-local)
  - [Deploy em Produção](#deploy-em-produção)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Desenvolvimento](#desenvolvimento)
- [Diagramas](#diagramas)
- [Licença](#licença)

## Visão Geral

O Assert é um bot de Discord projetado para criar experiências de roleplay
corporativo realistas para equipes de TI. Através de cenários intensos que
envolvem dilemas éticos e pressões corporativas, os participantes desenvolvem
habilidades de comunicação assertiva e tomada de decisão sob pressão.

## Funcionalidades

- **Criação de Sessões**: Forme grupos de até 4 participantes para sessões de
  roleplay
- **Geração de Cenários**: Cenários realistas com dilemas éticos e pressões
  corporativas usando IA
- **Canais Privados**: Criação automática de canais de texto e voz para as
  sessões
- **Respostas de NPCs**: NPCs que respondem a menções nos canais de sessão
- **Sistema de Feedback**: Coleta de feedback anônimo após o término das sessões
- **Avaliações Automáticas**: Análise automática do desempenho dos participantes
  usando IA

## Comandos Disponíveis

### /criar-sessao

Inicia a formação de uma nova sessão. O comando cria uma mensagem com botões
onde outros usuários podem se juntar.

### /iniciar-sessao

Inicia a sessão com os participantes atuais, criando canais privados e
distribuindo personagens.

### /encerrar-sessao

Encerra uma sessão ativa ou em formação da qual você é dono.

## Configuração

### Variáveis de Ambiente

| Variável                | Descrição                                             |
| ----------------------- | ----------------------------------------------------- |
| `BOT_TOKEN`             | Token do bot do Discord                               |
| `BOT_CLIENT_ID`         | ID do cliente do bot                                  |
| `OPENROUTER_API_KEY`    | Chave API do OpenRouter para geração de cenários      |
| `MAIN_CHANNEL_ID`       | ID do canal principal onde os comandos são executados |
| `AWS_ACCESS_KEY_ID`     | Chave de acesso AWS para DynamoDB                     |
| `AWS_SECRET_ACCESS_KEY` | Chave secreta AWS para DynamoDB                       |
| `AWS_REGION`            | Região AWS (ex: us-east-2)                            |

### Infraestrutura

O projeto utiliza:

- **DynamoDB**: Para armazenamento de dados de sessões, participantes e cenários
- **Terraform**: Para provisionamento da infraestrutura AWS
- **OpenRouter**: Para geração de cenários via IA
- **EC2**: Para hospedagem do bot em produção
- **CloudWatch**: Para monitoramento e logging

## Instalação e Uso

### Pré-requisitos

- Deno >= 2.0
- Conta AWS com permissões para DynamoDB e EC2
- Conta OpenRouter para geração de cenários com IA
- Bot de Discord configurado no Developer Portal

### Instalação Local

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd assert-bot
```

2. Configure as variáveis de ambiente no arquivo `.env`:

```bash
touch .env
# Edite o arquivo .env com suas configurações
```

3. Instale as dependências:

```bash
deno cache src/index.ts
```

4. Execute o bot:

```bash
deno task start
```

### Deploy em Produção

1. Configure as chaves SSH e variáveis de ambiente necessárias
2. Execute o script de deploy:

```bash
chmod +x deploy.sh
./deploy.sh
```

O script irá:

- Validar e compilar o código
- Aplicar a configuração Terraform
- Implantar o binário na instância EC2
- Configurar o CloudWatch Agent

## Estrutura do Projeto

```
src/
├── commands/          # comandos do bot
├─────────── */
├────────────── index.ts    # definição principal do comando
├── lib/              # utilitários e funções auxiliares
├── middleware/       # middlewares do bot
├── schemas/         # esquemas de validação Zod
├── table/           # modelos de dados do DynamoDB
└── index.ts         # ponto de entrada principal
```

## Desenvolvimento

### Adicionando Novos Comandos

1. Crie uma nova pasta em `src/commands/` com o nome do comando
2. Implemente o comando seguindo a interface `BotCommand`
3. Exporte o comando como default no `index.ts`
4. O middleware `loadCommands` irá registrar automaticamente o comando quando o
   bot iniciar

### Geração de Cenários

Os cenários são gerados automaticamente a cada 24 horas usando a API do
OpenRouter. A lógica de geração está em `src/lib/generateScenario.ts`.

### Banco de Dados

Os modelos de dados são definidos usando DynamoDB OneTable em
`src/table/models.ts`. A configuração do Terraform para a tabela está em
`infra.tf`.

## Diagramas

Os diagramas são definidos como código utilizando
[mermaid](https://mermaid.js.org/).

### Diagrama de Caso de Uso

```mermaid
---
config:
  look: handDrawn
  layout: elk
  elk:
    nodePlacementStrategy: LINEAR_SEGMENTS
---
flowchart LR
    user["fa:fa-user Usuário"]
    owner["fa:fa-user-tie Dono da sessão"]
    bot["fa:fa-robot Bot Assert"]
    aiModel["fa:fa-brain Modelo de IA"]

    owner --> user

    subgraph "Assert"
        direction TB
        
        createSession(["`Criar sessão<br><small>Sessões em formação expiram em 1 hora</small>`"])
        help(["`Ajuda<br><small>O comando de ajuda disponibiliza instruções para o uso do bot</small>`"])
        joinSession(["Juntar-se a sessão em formação"])
        leaveSession(["`Deixar a sessão em formação<br><small>O dono da sessão não pode sair</small>`"])
        endSessionFormation(["`Encerrar sessão em formação<br><small>Comando: /encerrar-sessao</small>`"])
        startSession(["Iniciar sessão"])
        mentionNpc(["Interagir com personagens do cenário"])
        endSession(["`Encerrar sessão ativa<br><small>Comando: /encerrar-sessao</small>`"])
        writeFeedback(["`Enviar feedback aos participantes<br><small>Usuário preenche formulário recebido por DM</small>`"])

        generateScenario(["`Gerar cenário<br><small>A cada 24 horas, um novo cenário é gerado</small>`"])
        generateReview(["Gerar revisão geral da sessão"])
        generateResponse(["Gerar resposta do personagem"])
        createChannels(["Criação dos canais de comunicação da sessão"])
        sendInfo(["Enviar informações do cenário para os participantes"])
        sendForms(["Recebimento de formulário para feedback de participantes da sessão"])
        deleteChannels(["`Deleção dos canais de comunicação da sessão<br><small>Os canais são deletados em uma hora após o encerramento da sessão</small>`"])

        persistDb(["Registrar no banco de dados"])
        table[("Tabela DynamoDB")]
    end

    user --> createSession
    user --> help
    user --> joinSession
    user --> leaveSession
    user --> mentionNpc
    user --> writeFeedback

    owner --> endSessionFormation
    owner --> startSession
    owner --> endSession

    bot --> generateScenario

    generateScenario --> aiModel
    generateReview --> aiModel
    generateResponse --> aiModel

    persistDb --> table
    
    createSession       -.->|include| persistDb
    joinSession         -.->|include| persistDb
    leaveSession        -.->|include| persistDb
    endSessionFormation -.->|include| persistDb
    startSession        -.->|include| persistDb
    writeFeedback       -.->|include| persistDb
    generateScenario    -.->|include| persistDb
    generateReview      -.->|include| persistDb
    createChannels      -.->|include| persistDb
    endSession          -.->|include| persistDb

    startSession -.->|include| createChannels
    startSession -.->|include| sendInfo
    
    mentionNpc -.->|include| generateResponse
    
    endSession -.->|include| sendForms
    endSession -.->|include| generateReview
    endSession -.->|include| deleteChannels
```

### Diagrama de Classes

```mermaid
---
config:
  class:
    hideEmptyMembersBox: true
---
classDiagram

class DiscordClient {
    +Collection~BotCommand~ commands
    +Collection~string,ScenarioEntity~ scenarioCache
    +login(token)
    +on(event, listener)
    +once(event, listener)
}

class BotCommand {
    <<Interface>>
    +data: SlashCommandBuilder
    +execute(interaction) void
}

class CreateSessionCommand {
    +data
    +execute(interaction)
}

class StartSessionCommand {
    +data
    +execute(interaction)
}

class EndSessionCommand {
    +data
    +execute(interaction)
}

class HelpCommand {
    +data
    +execute(interaction)
}

BotCommand <|.. CreateSessionCommand
BotCommand <|.. StartSessionCommand
BotCommand <|.. EndSessionCommand
BotCommand <|.. HelpCommand

DiscordClient "1" *-- "0..*" BotCommand : contains

namespace Models {
    class SessionModel {
        +create(entity)
        +find(query)
        +get(query)
        +update(entity)
        +remove(query)
    }
    class SessionParticipantModel {
        +create(entity)
        +find(query)
        +get(query)
        +remove(query)
    }
    class SessionChannelModel {
        +create(entity)
        +find(query)
        +get(query)
    }
    class SessionFeedbackModel {
        +create(entity)
        +find(query)
    }
    class SessionReviewModel {
        +create(entity)
    }
    class ScenarioModel {
        +create(entity)
        +find(query)
        +get(query)
    }
}

namespace Entities {
    class SessionEntity {
        +sessionId: string
        +scenarioId: string
        +status: string
        +expiryDate: number
    }
    class SessionParticipantEntity {
        +sessionId: string
        +participantId: string
        +username: string
        +role: string
    }
    class SessionChannelEntity {
        +sessionId: string
        +channelId: string
        +type: string
    }
    class SessionFeedbackEntity {
        +sessionId: string
        +feedbackGiverId: string
        +feedbackReceiverId: string
        +feedbackText: string
    }
    class SessionReviewEntity {
        +sessionId: string
        +overallEvaluation: string
    }
    class ScenarioEntity {
        +scenarioId: string
        +corporate: object
        +challenge: string
        +characters: object[]
        +npcs: object[]
        +objective: string
    }
}

namespace Schemas {
    class scenarioSchema {
        <<Zod Schema>>
    }
    class reviewSchema {
        <<Zod Schema>>
    }
}

Models.SessionModel ..> Entities.SessionEntity : manages
Models.SessionParticipantModel ..> Entities.SessionParticipantEntity : manages
Models.SessionChannelModel ..> Entities.SessionChannelEntity : manages
Models.SessionFeedbackModel ..> Entities.SessionFeedbackEntity : manages
Models.SessionReviewModel ..> Entities.SessionReviewEntity : manages
Models.ScenarioModel ..> Entities.ScenarioEntity : manages

Entities.SessionEntity "1" -- "1..*" Entities.SessionParticipantEntity : contains
Entities.SessionEntity "1" -- "1..*" Entities.SessionChannelEntity : contains
Entities.SessionEntity "1" -- "0..*" Entities.SessionFeedbackEntity : can contain
Entities.SessionEntity "1" -- "0..1" Entities.SessionReviewEntity : can contain
Entities.SessionEntity "1" -- "1" Entities.ScenarioEntity : references

CreateSessionCommand ..> Models.SessionModel
CreateSessionCommand ..> Models.SessionParticipantModel
CreateSessionCommand ..> Models.ScenarioModel

StartSessionCommand ..> Models.SessionModel
StartSessionCommand ..> Models.SessionParticipantModel
StartSessionCommand ..> Models.ScenarioModel
StartSessionCommand ..> Models.SessionChannelModel
StartSessionCommand ..> Utils.ChannelCreation
StartSessionCommand ..> Utils.OnboardingTemplates
StartSessionCommand ..> Utils.SendDm

EndSessionCommand ..> Models.SessionModel
EndSessionCommand ..> Models.SessionParticipantModel
EndSessionCommand ..> Models.SessionChannelModel
EndSessionCommand ..> Utils.SendFeedbackForms
EndSessionCommand ..> Utils.SendReview

namespace Services {
    class OpenAI {
        +chat.completions.create()
    }
    class GenerateNpcResponse {
        <<Service>>
        +generateNpcResponse(message)
    }
    class GenerateScenario {
        <<Service>>
        +generateScenario()
    }
    class GenerateReview {
        <<Service>>
        +generateReview(history, scenario, sessionId)
    }
    class LoadCommands {
        <<Service>>
        +loadCommands(path)
    }
}

namespace Utils {
    class ChannelCreation {
        <<Utility>>
        +createCategory(interaction, participantIds)
        +createTextChannel(input)
        +createVoiceChannel(input)
    }
    class OnboardingTemplates {
        <<Utility>>
        +makeWelcomeMessageArray(scenario, participants)
        +makeDmInstructions(owner, character)
    }
    class SendFeedbackForms {
        <<Utility>>
        +sendFeedbackForms(session, participants, channel)
    }
    class SendReview {
        <<Utility>>
        +sendReview(session, channel)
    }
    class SendDm {
        <<Utility>>
        +tryDm(user, content, fallbackChannel)
    }
}

DiscordClient ..> Services.LoadCommands : uses
DiscordClient ..> Services.GenerateScenario : uses
DiscordClient ..> Services.GenerateNpcResponse : uses

Services.GenerateNpcResponse ..> Models.SessionChannelModel
Services.GenerateNpcResponse ..> Models.SessionModel
Services.GenerateNpcResponse ..> Models.ScenarioModel
Services.GenerateNpcResponse ..> Services.OpenAI

Services.GenerateScenario ..> Models.ScenarioModel
Services.GenerateScenario ..> Services.OpenAI
Services.GenerateScenario ..> Schemas.scenarioSchema

Services.GenerateReview ..> Models.SessionReviewModel
Services.GenerateReview ..> Models.SessionFeedbackModel
Services.GenerateReview ..> Services.OpenAI
Services.GenerateReview ..> Schemas.reviewSchema

Utils.SendFeedbackForms ..> Utils.SendDm
Utils.SendFeedbackForms ..> Models.SessionFeedbackModel

Utils.SendReview ..> Services.GenerateReview
Utils.SendReview ..> Utils.SendDm
Utils.SendReview ..> Models.ScenarioModel
```

## Licença

Este projeto está sob a licença CC-BY-NC-ND-4.0. Veja o arquivo LICENSE.md para
detalhes.
