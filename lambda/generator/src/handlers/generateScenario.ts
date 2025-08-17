import type { OpenAI } from "openai";
import generatorPrompt from "../prompts/generator.ts";
import { scenarioSchema } from "../schemas/scenario.ts";
import z from "zod";

export const handleGenerateScenario = async (
  router: OpenAI,
) => {
  const response = await router.chat.completions.create({
    model: "deepseek/deepseek-r1-0528",
    messages: [
      { role: "system", content: `${crypto.randomUUID()}\n${generatorPrompt}` },
      {
        role: "user",
        content:
          `${crypto.randomUUID()}\nPor favor, gere um novo cenário de simulação agora.`,
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
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Erro: Cenário gerado vazio." }),
    };
  }

  const parsedContent = z.safeParse(
    scenarioSchema,
    JSON.parse(generatedContent),
  );

  if (!parsedContent.success) {
    console.error("Cenário gerado não corresponde ao schema definido.");
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Erro: Cenário gerado não corresponde ao schema definido.",
      }),
    };
  }

  console.log("Cenário gerado:", parsedContent.data);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(generatedContent),
  };
};
