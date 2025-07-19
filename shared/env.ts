import dotenv from "dotenv";
import process from "node:process";
dotenv.config();

const getOrThrow = (key: string): string => {
  const attemptedValue = process.env[key];
  if (!attemptedValue) {
    throw new Error(`Could not get environment variable ${key}`);
  }
  return attemptedValue;
};

const botToken = getOrThrow("BOT_TOKEN");
const botClientId = getOrThrow("BOT_CLIENT_ID");
const generatorApiGatewayUrl = getOrThrow("API_GATEWAY_URL");
const openAiKey = getOrThrow("OPENAI_API_KEY");
const debugGuildId = getOrThrow("DEBUG_GUILD_ID");

export { openAiKey, botClientId, botToken, debugGuildId, generatorApiGatewayUrl };
