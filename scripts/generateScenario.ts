import { OpenAI } from "jsr:@openai/openai@^5.12.1";
import generatorPrompt from "../lambda/generator/src/prompts/scenario.ts";
import { scenarioSchema } from "../lambda/generator/src/schemas/scenario.ts";
import { ScenarioModel } from "../shared/models.ts";
import { openrouterKey } from "../shared/env.ts";
import { z } from "npm:zod@^4.0.15";
import process from "node:process";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: openrouterKey,
});

const main = async () => {
  console.log("Generating scenario...");
  const response = await openrouter.chat.completions.create({
    model: "deepseek/deepseek-chat-v3.1",
    messages: [
      {
        role: "system",
        content: `${crypto.randomUUID()}\n${generatorPrompt}`,
      },
      {
        role: "user",
        content:
          `${crypto.randomUUID()}\nPor favor, gere um novo cenário de simulação em PT-BR agora.`,
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
    console.error("Cenário gerado é nulo ou vazio.");
    process.exit(1);
  }

  const parsedContent = z.safeParse(
    scenarioSchema,
    JSON.parse(generatedContent),
  );

  if (!parsedContent.success) {
    console.error("Cenário gerado não corresponde ao schema definido.");
    console.error(parsedContent.error);
    process.exit(1);
  }

  const scenarioData = parsedContent.data;
  const scenarioId = crypto.randomUUID();

  await ScenarioModel.create({
    scenarioId,
    ...scenarioData,
  });

  console.log(
    `Cenário gerado e salvo com sucesso! ID: ${scenarioId}`,
  );
};

main();
