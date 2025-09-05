import type { OpenAI } from "openai";
import generatorPrompt from "../prompts/scenario.ts";
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

  try {
    const parsedData = JSON.parse(generatedContent);
    const parsedContent = scenarioSchema.safeParse(parsedData);

    if (!parsedContent.success) {
      console.error("Cenário gerado não corresponde ao schema definido:", parsedContent.error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Erro: Cenário gerado não corresponde ao schema definido.",
          error: parsedContent.error.format()
        }),
      };
    }

    console.log("Cenário gerado:", parsedContent.data);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsedContent.data),
    };
  } catch (parseError) {
    console.error("Erro ao parsear conteúdo gerado:", parseError);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Erro: Falha ao processar cenário gerado.",
        error: parseError instanceof Error ? parseError.message : "Erro desconhecido"
      }),
    };
  }
};
