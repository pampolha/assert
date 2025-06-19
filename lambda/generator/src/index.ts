import { OpenAI } from "openai";
import dotenv from "dotenv";
import generatorPrompt from "./prompts/generator.js";
import {Scenario, scenarioJSONSchema} from "../../../shared/schemas.js"

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const handler = async (event: any) => {
  try {
    console.log("Evento recebido:", JSON.stringify(event));
    const seed = `\nSeed: ${Date.now()}`

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: generatorPrompt + seed },
        {
          role: "user",
          content:
            'Por favor, gere um novo cenário de simulação agora.' + seed,
        },
      ],
      response_format: { 
        type: "json_schema", 
        json_schema: {
          name: "ScenarioSchema",
          description: "JSON Schema for soft skills simulation scenario",
          schema: scenarioJSONSchema,
        } 
      },
      temperature: 1,
      max_completion_tokens: 32768,
      top_p: 1,
    });

    const generatedContent = chatCompletion.choices[0].message?.content;

    if (!generatedContent) {
      console.error("Conteúdo gerado pela OpenAI é nulo ou vazio.");
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Erro: Conteúdo gerado vazio." }),
      };
    }

    console.log("Conteúdo gerado:", generatedContent);

    const scenarioData: Scenario = JSON.parse(generatedContent);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(scenarioData),
    };
  } catch (error) {
    console.error("Erro ao gerar cenário:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Ocorreu um erro ao gerar o cenário de simulação.",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
    };
  }
};
