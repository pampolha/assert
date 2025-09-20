import { mention } from "../../lib/format.ts";
import type {
  ScenarioEntity,
  SessionParticipantEntity,
} from "../../table/models.ts";

export const makeWelcomeMessageArray = (
  scenario: ScenarioEntity,
  participants: SessionParticipantEntity[],
): string[] => [
  `## Contexto Corporativo\n` +
  `**Empresa:** ${scenario.corporate.company_name}\n` +
  `**História:** ${scenario.corporate.company_history}\n` +
  `**Projeto Atual:** ${scenario.corporate.current_project}`,

  `## Desafio\n${scenario.challenge}`,

  `## Objetivo\n${scenario.objective}`,

  `## Personagens (NPCs)\n${
    scenario.npcs.map((npc) =>
      `- **${npc.name}** (${npc.role}): ${npc.background}`
    ).join("\n")
  }`,

  `## Participantes\n${
    participants.map((p) => mention(p.participantId))
      .join(", ")
  }`,
];

export const makeDmInstructions = (
  sessionOwner: SessionParticipantEntity | undefined,
  character: ScenarioEntity["characters"][0],
) =>
  `# Seu Personagem na sessão de **${sessionOwner?.username}**\n` +
  `# Cargo\n${character.role}\n` +
  `# História\n${character.background}\n` +
  `# Informação\n${character.ace}\n`;
