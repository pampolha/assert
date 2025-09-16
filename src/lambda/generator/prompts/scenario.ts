const prompt = `1. MAIN OBJECTIVE:
Generate a remote IT team work simulation scenario. Every element (environment, project, characters [playable and AI NPCs], conflicts, and information) must be woven with rich details, backstories, complex motivations, and vivid personalities, aiming to practice soft skills in a context that captures attention and encourages strategic roleplay.

2. DESIGN PHILOSOPHY FOR THE LLM:
Generated scenarios must be realistic, but keep in mind that it is going to be used in a text-based and short manner; for example, there is no point in demanding deliverables in a specific amount of time, due to the short time in which the generated scenario will be discussed in the real world anyway. 
Give deep reasoning for things to be the way they are: if a project is delayed, why exactly? What promises were made? Who are the stakeholders and what motivates them?

3. OUTPUT FORMAT:
The response shall be a valid JSON object with the following attributes:

    corporate:
        company_name: String, name of the company.

        company_history: String, a brief history of the company, focusing on past events that shape the present and the mindset of employees.

        current_project: String, detailed description of the current stage of the project, the challenges faced, the existing pressure and expectations.

    challenge: String, a narrative of the event that is going to be the main topic of discussion of the scenario. Subtly describe the implications. You can add more details if they are adequate and useful.

    characters: Array of Objects (exactly 4 objects), each being assigned to a potential person in the group. There is always going to be at least 1 participant, and at most 4. Since some of these are possibly not present in the group due to insufficient players, make sure the scenario is coherent and works without their participation. Attributes:

        name: String, name of the fictional character.

        role: String, role of the fictional character in the company.

        background: String, key information about the character that may prove useful in discussions.

        ace: String. A crucial piece of information, a unique perspective, a moral dilemma, or a secret that only this character knows and may (or not) reveal, significantly impacting the discussion.

    npcs: Array of Objects (at least 1 object), each containing:

        name: String, name of the non playable character.

        role: String, role of the non playable character in the company or outside of it.

        background: String. A concise yet rich biography that explains the non playable character motivations, style, values, features, and maybe how they reached their current position. Keep in mind that these NPCs will be conversated with, so make sure to include useful information that helps their response prompts in the generative AI.

    objective: String, the main objective the group needs to achieve to "win" or satisfactorily resolve the presented challenge. The objective must require players to conversate between themselves (if there is more than one) and with the non-playable characters. The players will invoke a command that checks the text messages of the conversation channel to determine if the objective has been reached or not, thus finishing the session or failing it.

4. LLM RESTRICTIONS:

    Depth is Key: Prioritize narrative details, motivations, and backstory over brevity.

    Conflict and Tension: Create situations with genuine, modern tension and moral, ethical or professional dilemmas.

    Internal Consistency: Ensure that backgrounds, personalities, and secrets are consistent and make sense within the larger narrative.

5. FINAL INSTRUCTION FOR THE LLM:
Use your creative capacity to generate a scenario that tests soft skills with a convincing and engaging story. Surprise me with the depth and richness of details.` as const;

export default prompt;
