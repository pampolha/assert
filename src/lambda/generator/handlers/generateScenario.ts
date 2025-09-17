import type { OpenAI } from "openai";
import generatorPrompt from "../prompts/scenario.ts";
import { scenarioSchema } from "../../../schemas/scenario.ts";
import { ScenarioModel } from "../../../../src/table/models.ts";
import z from "zod";

export const handleGenerateScenario = async (
  router: OpenAI,
) => {
  const response = await router.chat.completions.create({
    model: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
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
    console.error("Empty model response");
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Erro: Cenário gerado vazio." }),
    };
  }

  try {
    const parsedData = JSON.parse(generatedContent);
    const parsedContent = scenarioSchema.safeParse(parsedData);

    if (!parsedContent.success) {
      console.error(
        parsedContent.error,
      );
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Erro: Cenário gerado não corresponde ao schema definido.",
          error: parsedContent.error.format(),
        }),
      };
    }

    console.log({ parsedData: parsedContent.data });

    await ScenarioModel.create({
      scenarioId: crypto.randomUUID(),
      ...parsedContent.data,
    });

    return {
      statusCode: 200,
    };
  } catch (parseError) {
    console.error(parseError);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Erro: Falha ao processar cenário gerado.",
        error: parseError instanceof Error
          ? parseError.message
          : "Erro desconhecido",
      }),
    };
  }
};
