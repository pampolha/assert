import { OpenAI } from "openai";
import { handleGenerateScenario } from "../handlers/generateScenario.ts";
import { getOrThrow } from "../index.ts";

const openrouterKey = getOrThrow("OPENROUTER_API_KEY");

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: openrouterKey,
});

const main = async () => {
  const response = await handleGenerateScenario(openrouter);
  console.log(response);
};

main();
