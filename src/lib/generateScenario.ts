import { OpenAI } from "openai";
import { scenarioSchema } from "../schemas/scenario.ts";
import { ScenarioModel } from "../table/models.ts";
import z from "zod";
import { openrouterKey } from "../env.ts";

const generatorPrompt = `1. MAIN OBJECTIVE:
Generate an intense remote IT team work simulation scenario that exposes the harsh realities of modern capitalism while presenting challenging professional situations. Participants must practice maintaining composure and using assertive communication to navigate ruthless corporate pressures, complex ethical dilemmas, and interpersonal conflicts. The focus should be on developing skills to defend one's position professionally while respecting others, while facing difficult choices between profit, ethics, and personal integrity.

2. DESIGN PHILOSOPHY FOR THE LLM:
Scenarios must be brutally realistic and professionally challenging, featuring situations that require diplomatic yet firm responses. Include elements like: aggressive deadlines, resource constraints, conflicting stakeholder interests, moral compromises, and references to real-world corporate scandals. The dilemmas should force players to make tough decisions with no perfect solutions while practicing clear, confident, and respectful communication under extreme pressure.

3. OUTPUT FORMAT:
The response shall be a valid JSON object with the following attributes:

    corporate:
        company_name: String, name of the company that reflects its industry and ruthless nature.

        company_history: String, a detailed history including past controversies, mergers, layoffs, ethical compromises, values, and recent challenges that shaped its current culture.

        current_project: String, description of the high-stakes project including tight deadlines, budget overruns, technical debt, pressure from executives/shareholders, and stakeholder expectations.

    challenge: String, a narrative of a critical professional incident that requires assertive communication and composure. This must involve severe ethical dilemmas, legal gray areas, potential public scandals, and situations like: defending a timeline, negotiating resources, addressing quality concerns, or managing conflicting instructions. Describe the immediate threat and long-term consequences.

    characters: Array of Objects (exactly 4 objects), each representing a playable role. Attributes:

        role: String, specific professional role (e.g., "Senior Developer facing layoffs", "Project Manager with knowledge of security flaws", "Quality Assurance Lead")

        background: String, detailed professional background including expertise, current responsibilities, career ambitions, personal financial pressures, and past ethical compromises. Avoid pronouns and names - use role-based descriptions.

        ace: String, a damaging secret or key piece of information that this character can use to support their position in discussions. Must involve serious moral trade-offs and encourage assertive yet professional communication.

    npcs: Array of Objects (at least 2 objects), each containing:

        name: String, professional name suggesting their role and personality

        role: String, corporate role or stakeholder position

        background: String, detailed professional background including their objectives, communication style (e.g., "aggressive", "passive-aggressive", "impatient"), motivations tied to profit, power, or survival, and willingness to compromise ethics for results.

    objective: String, the primary goal that requires navigating ethical dilemmas while managing corporate pressures and using assertive communication techniques. The objective must involve making difficult choices between:
        - Truth vs Profit
        - Personal ethics vs Company loyalty
        - Short-term gains vs Long-term consequences
        - Individual survival vs Team welfare
        And must also involve:
        - Clearly stating needs and boundaries
        - Respectfully challenging unreasonable demands
        - Negotiating compromises
        - Maintaining professional relationships
        - Reaching a workable solution for all parties

4. LLM RESTRICTIONS:

    Uncompromising Realism: Portray the grim realities of corporate life without sugarcoating while maintaining professional focus. Include elements like: burnout, inequality, ethical compromises, career-threatening pressures, and opportunities for assertive communication.

    Complex Dilemmas: Create situations where every option has significant negative consequences and there are no easy solutions. The focus should be on communication skills development under extreme pressure.

    Corporate Savagery: Reflect ruthless business practices including: manipulating metrics, hiding failures, sacrificing team members, and prioritizing stock price over everything, while ensuring opportunities for players to practice being firm yet respectful.

    Character Depth: Each character must have conflicting motivations, something to lose, and professional information that can be used to build persuasive arguments.

5. FINAL INSTRUCTION FOR THE LLM:
Draw inspiration from real corporate scandals and tech industry controversies. Create scenarios that genuinely test players' moral compasses under extreme pressure while helping them develop crucial professional communication skills. Focus on situations that require maintaining composure under pressure while clearly and respectfully asserting one's position. When complete, translate the entire response to Brazilian Portuguese maintaining all technical and corporate terminology.` as const;

export const generateScenario = async () => {
  const router = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: openrouterKey,
  });
  const response = await router.chat.completions.create({
    model: "tngtech/deepseek-r1t2-chimera:free",
    temperature: 1,
    messages: [
      { role: "system", content: `${crypto.randomUUID()}\n${generatorPrompt}` },
      {
        role: "user",
        content: `${crypto.randomUUID()}\nYour answer:`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        schema: z.toJSONSchema(scenarioSchema),
        name: "scenario",
      },
    },
  });

  const generatedContent = response.choices[0].message.content;

  if (!generatedContent) {
    throw new Error("Empty model response");
  }

  const parsedData = JSON.parse(generatedContent);
  const parsedContent = scenarioSchema.parse(parsedData);

  console.log(parsedContent);

  await ScenarioModel.create({
    scenarioId: crypto.randomUUID(),
    ...parsedContent,
  });
};
